import type { Task, TaskCategory } from '../types';

import {
  PendingAction,
  STORAGE_KEYS,
  getPendingActions,
  isOnline,
  loadFromCache,
  removePendingAction,
  saveToCache,
  updatePendingActionRetryCount,
} from './offlineService';
import { logger } from '../utils/logger';
import {
  assignTask as assignTaskService,
  claimTask as claimTaskService,
  completeTask as completeTaskService,
  createTask as createTaskService,
  deleteTask as deleteTaskService,
  getTaskById,
  updateTask as updateTaskService,
} from './taskService';

// ============================================================================
// TYPES
// ============================================================================

export interface SyncResult {
  success: boolean;
  syncedActions: number;
  failedActions: number;
  conflicts: ConflictResolution[];
  errors: string[];
}

export interface ConflictResolution {
  actionId: string;
  taskId: string;
  conflictType: 'version' | 'deleted' | 'permission' | 'state';
  resolution: 'server_wins' | 'client_wins' | 'merge' | 'skip';
  details: string;
}

export interface OptimisticUpdate {
  id: string;
  taskId: string;
  originalTask: Task;
  optimisticTask: Task;
  timestamp: Date;
  action: string;
}

// Type definitions for action data
export interface CreateActionData {
  title: string;
  category: TaskCategory;
  createdBy: string;
  partnershipId: string;
  description?: string;
  assignedTo?: string;
  dueDate?: Date;
}

export interface UpdateActionData {
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  dueDate?: Date;
  completedAt?: Date | null;
}

export interface DeleteActionData {
  userId: string;
}

export interface ClaimActionData {
  userId: string;
}

export interface CompleteActionData {
  userId: string;
}

export interface AssignActionData {
  assignedTo: string;
  assignedBy: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

const isCreateActionData = (data: unknown): data is CreateActionData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as CreateActionData).title === 'string' &&
    typeof (data as CreateActionData).category === 'string' &&
    typeof (data as CreateActionData).createdBy === 'string' &&
    typeof (data as CreateActionData).partnershipId === 'string'
  );
};

const isUpdateActionData = (data: unknown): data is UpdateActionData => {
  return typeof data === 'object' && data !== null;
};

const isDeleteActionData = (data: unknown): data is DeleteActionData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as DeleteActionData).userId === 'string'
  );
};

const isClaimActionData = (data: unknown): data is ClaimActionData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as ClaimActionData).userId === 'string'
  );
};

const isCompleteActionData = (data: unknown): data is CompleteActionData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as CompleteActionData).userId === 'string'
  );
};

const isAssignActionData = (data: unknown): data is AssignActionData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as AssignActionData).assignedTo === 'string' &&
    typeof (data as AssignActionData).assignedBy === 'string'
  );
};

// ============================================================================
// CONSTANTS
// ============================================================================

const SYNC_BATCH_SIZE = 10;

// ============================================================================
// SYNC QUEUE MANAGEMENT
// ============================================================================

/**
 * Process all pending actions in the sync queue
 */
export const processSyncQueue = async (): Promise<SyncResult> => {
  const result: SyncResult = {
    success: true,
    syncedActions: 0,
    failedActions: 0,
    conflicts: [],
    errors: [],
  };

  try {
    // Check if we're online
    const online = await isOnline();
    if (!online) {
      result.success = false;
      result.errors.push('Device is offline');
      return result;
    }

    const pendingActions = await getPendingActions();
    if (pendingActions.length === 0) {
      return result;
    }

    // Process actions in batches to avoid overwhelming the server
    const batches = chunkArray(pendingActions, SYNC_BATCH_SIZE);

    for (const batch of batches) {
      const batchResult = await processBatch(batch);

      result.syncedActions += batchResult.syncedActions;
      result.failedActions += batchResult.failedActions;
      result.conflicts.push(...batchResult.conflicts);
      result.errors.push(...batchResult.errors);

      if (!batchResult.success) {
        result.success = false;
      }
    }

    return result;
  } catch (error) {
    logger.error('Error processing sync queue', error, { 
      function: 'processSyncQueue', 
    });
    result.success = false;
    result.errors.push(`Sync queue processing failed: ${error}`);
    return result;
  }
};

/**
 * Process a batch of pending actions
 */
const processBatch = async (actions: PendingAction[]): Promise<SyncResult> => {
  const result: SyncResult = {
    success: true,
    syncedActions: 0,
    failedActions: 0,
    conflicts: [],
    errors: [],
  };

  for (const action of actions) {
    try {
      const actionResult = await processAction(action);

      if (actionResult.success) {
        result.syncedActions++;
        await removePendingAction(action.id);
      } else {
        result.failedActions++;

        if (actionResult.conflict) {
          result.conflicts.push(actionResult.conflict);
        }

        if (actionResult.error) {
          result.errors.push(actionResult.error);
        }

        // Handle retry logic
        if (action.retryCount < action.maxRetries) {
          await updatePendingActionRetryCount(action.id);
        } else {
          // Remove action after max retries
          await removePendingAction(action.id);
          result.errors.push(
            `Action ${action.id} removed after ${action.maxRetries} retries`,
          );
        }
      }
    } catch (error) {
      logger.error('Error processing action', error, { 
        function: 'processSyncQueue',
        actionId: action.id,
        actionType: action.type, 
      });
      result.failedActions++;
      result.errors.push(`Action ${action.id} failed: ${error}`);
      result.success = false;
    }
  }

  return result;
};

/**
 * Process a single pending action with conflict detection
 */
const processAction = async (
  action: PendingAction,
): Promise<{
  success: boolean;
  conflict?: ConflictResolution;
  error?: string;
}> => {
  try {
    // Check for conflicts before executing the action
    const conflictCheck = await detectConflicts(action);

    if (conflictCheck.hasConflict && conflictCheck.conflictType) {
      const resolution = await resolveConflict(action, {
        conflictType: conflictCheck.conflictType,
        serverTask: conflictCheck.serverTask,
        details: conflictCheck.details,
      });

      if (resolution.resolution === 'skip') {
        return { success: true }; // Skip this action
      }

      if (resolution.resolution === 'server_wins') {
        return { success: true }; // Server version is already correct
      }

      // For client_wins and merge, proceed with the action
    }

    // Execute the action
    switch (action.type) {
      case 'create':
        if (!isCreateActionData(action.data)) {
          throw new Error('Invalid create action data');
        }
        await createTaskService(
          action.data.title,
          action.data.category,
          action.data.createdBy,
          action.data.partnershipId,
          action.data.description,
          action.data.assignedTo,
          action.data.dueDate,
        );
        break;

      case 'update':
        if (!action.taskId) {
          throw new Error('Task ID is required for update action');
        }
        if (!isUpdateActionData(action.data)) {
          throw new Error('Invalid update action data');
        }
        await updateTaskService(action.taskId, action.data);
        break;

      case 'delete':
        if (!action.taskId) {
          throw new Error('Task ID is required for delete action');
        }
        if (!isDeleteActionData(action.data)) {
          throw new Error('Invalid delete action data');
        }
        await deleteTaskService(action.taskId, action.data.userId);
        break;

      case 'claim':
        if (!action.taskId) {
          throw new Error('Task ID is required for claim action');
        }
        if (!isClaimActionData(action.data)) {
          throw new Error('Invalid claim action data');
        }
        await claimTaskService(action.taskId, action.data.userId);
        break;

      case 'complete':
        if (!action.taskId) {
          throw new Error('Task ID is required for complete action');
        }
        if (!isCompleteActionData(action.data)) {
          throw new Error('Invalid complete action data');
        }
        await completeTaskService(action.taskId, action.data.userId);
        break;

      case 'assign':
        if (!action.taskId) {
          throw new Error('Task ID is required for assign action');
        }
        if (!isAssignActionData(action.data)) {
          throw new Error('Invalid assign action data');
        }
        await assignTaskService(
          action.taskId,
          action.data.assignedTo,
          action.data.assignedBy,
        );
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    return { success: true };
  } catch (error) {
    logger.error('Error executing action', error, { 
      function: 'executeAction',
      actionId: action.id,
      actionType: action.type, 
    });
    return {
      success: false,
      error: `Failed to execute ${action.type} action: ${error}`,
    };
  }
};

// ============================================================================
// CONFLICT DETECTION AND RESOLUTION
// ============================================================================

/**
 * Detect conflicts for a pending action
 */
const detectConflicts = async (
  action: PendingAction,
): Promise<{
  hasConflict: boolean;
  conflictType?: 'version' | 'deleted' | 'permission' | 'state';
  serverTask?: Task | null;
  details?: string;
}> => {
  if (!action.taskId) {
    // Create actions don't have conflicts
    return { hasConflict: false };
  }

  try {
    // Get the current server state of the task
    const serverTask = await getTaskById(action.taskId);

    if (!serverTask && action.type !== 'delete') {
      // Task was deleted on server but we're trying to modify it
      return {
        hasConflict: true,
        conflictType: 'deleted',
        serverTask: null,
        details: 'Task was deleted on server',
      };
    }

    if (serverTask) {
      // Check for version conflicts (task was modified after our action timestamp)
      if (serverTask.updatedAt > action.timestamp) {
        return {
          hasConflict: true,
          conflictType: 'version',
          serverTask,
          details: 'Task was modified on server after local change',
        };
      }

      // Check for state conflicts (e.g., trying to complete an already completed task)
      if (action.type === 'complete' && serverTask.status === 'done') {
        return {
          hasConflict: true,
          conflictType: 'state',
          serverTask,
          details: 'Task is already completed',
        };
      }

      if (action.type === 'claim' && serverTask.assignedTo) {
        return {
          hasConflict: true,
          conflictType: 'state',
          serverTask,
          details: 'Task is already assigned',
        };
      }
    }

    return { hasConflict: false, serverTask };
  } catch (error) {
    logger.error('Error detecting conflicts', error, { 
      function: 'detectConflicts',
      actionId: action.id,
      taskId: action.taskId, 
    });
    // If we can't detect conflicts, assume no conflict and let the server handle it
    return { hasConflict: false };
  }
};

/**
 * Resolve conflicts using predefined strategies
 */
const resolveConflict = async (
  action: PendingAction,
  conflictInfo: {
    conflictType: 'version' | 'deleted' | 'permission' | 'state';
    serverTask?: Task | null;
    details?: string;
  },
): Promise<ConflictResolution> => {
  const resolution: ConflictResolution = {
    actionId: action.id,
    taskId: action.taskId || 'unknown',
    conflictType: conflictInfo.conflictType,
    resolution: 'server_wins', // Default to server wins
    details: conflictInfo.details || 'Conflict detected',
  };

  switch (conflictInfo.conflictType) {
    case 'deleted':
      // If task was deleted on server, skip our action
      resolution.resolution = 'skip';
      resolution.details = 'Task deleted on server, skipping local action';
      break;

    case 'state':
      // For state conflicts, usually server wins (e.g., task already completed)
      resolution.resolution = 'server_wins';
      break;

    case 'version':
      // For version conflicts, use merge strategy for compatible changes
      if (conflictInfo.serverTask && canMergeChanges(action, conflictInfo.serverTask)) {
        resolution.resolution = 'merge';
        resolution.details = 'Merging compatible changes';
      } else {
        // For incompatible changes, server wins
        resolution.resolution = 'server_wins';
        resolution.details = 'Incompatible changes, server version preserved';
      }
      break;

    case 'permission':
      // Permission conflicts always result in server wins
      resolution.resolution = 'server_wins';
      break;
  }

  return resolution;
};

/**
 * Check if changes can be merged without conflicts
 */
const canMergeChanges = (action: PendingAction, _serverTask: Task): boolean => {
  // Simple merge logic - only allow merging for non-conflicting field updates
  if (action.type === 'update') {
    const updateData = action.data;

    // Check if we're updating different fields
    const updatingStatus = 'status' in updateData;
    const updatingAssignment = 'assignedTo' in updateData;
    const updatingContent =
      'title' in updateData ||
      'description' in updateData ||
      'category' in updateData;

    // Only allow merging content updates if status/assignment hasn't changed
    if (updatingContent && !updatingStatus && !updatingAssignment) {
      return true;
    }
  }

  return false;
};

// ============================================================================
// OPTIMISTIC UPDATES MANAGEMENT
// ============================================================================

/**
 * Store an optimistic update for potential rollback
 */
export const storeOptimisticUpdate = async (
  taskId: string,
  originalTask: Task,
  optimisticTask: Task,
  action: string,
): Promise<string> => {
  const update: OptimisticUpdate = {
    id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    taskId,
    originalTask,
    optimisticTask,
    timestamp: new Date(),
    action,
  };

  const existingUpdates =
    (await loadFromCache<OptimisticUpdate[]>('optimistic_updates')) || [];
  const updatedList = [...existingUpdates, update];

  await saveToCache('optimistic_updates', updatedList, 60); // Cache for 1 hour

  return update.id;
};

/**
 * Remove an optimistic update (successful sync)
 */
export const removeOptimisticUpdate = async (
  updateId: string,
): Promise<void> => {
  const existingUpdates =
    (await loadFromCache<OptimisticUpdate[]>('optimistic_updates')) || [];
  const filteredUpdates = existingUpdates.filter(
    (update) => update.id !== updateId,
  );

  await saveToCache('optimistic_updates', filteredUpdates, 60);
};

/**
 * Rollback an optimistic update (failed sync)
 */
export const rollbackOptimisticUpdate = async (
  updateId: string,
): Promise<Task | null> => {
  const existingUpdates =
    (await loadFromCache<OptimisticUpdate[]>('optimistic_updates')) || [];
  const update = existingUpdates.find((u) => u.id === updateId);

  if (update) {
    // Remove the update from cache
    await removeOptimisticUpdate(updateId);
    // Return the original task for rollback
    return update.originalTask;
  }

  return null;
};

/**
 * Get all pending optimistic updates for a task
 */
export const getOptimisticUpdatesForTask = async (
  taskId: string,
): Promise<OptimisticUpdate[]> => {
  const existingUpdates =
    (await loadFromCache<OptimisticUpdate[]>('optimistic_updates')) || [];
  return existingUpdates.filter((update) => update.taskId === taskId);
};

/**
 * Clean up old optimistic updates
 */
export const cleanupOptimisticUpdates = async (): Promise<void> => {
  const existingUpdates =
    (await loadFromCache<OptimisticUpdate[]>('optimistic_updates')) || [];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentUpdates = existingUpdates.filter(
    (update) => new Date(update.timestamp) > oneHourAgo,
  );

  await saveToCache('optimistic_updates', recentUpdates, 60);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Split array into chunks of specified size
 */
const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Check if sync is needed (has pending actions)
 */
export const isSyncNeeded = async (): Promise<boolean> => {
  const pendingActions = await getPendingActions();
  return pendingActions.length > 0;
};

/**
 * Get sync status information
 */
export const getSyncStatus = async (): Promise<{
  pendingActions: number;
  lastSyncTime: Date | null;
  isOnline: boolean;
  optimisticUpdates: number;
}> => {
  const [pendingActions, lastSyncString, online, optimisticUpdates] =
    await Promise.all([
      getPendingActions(),
      loadFromCache<string>(STORAGE_KEYS.LAST_SYNC),
      isOnline(),
      loadFromCache<OptimisticUpdate[]>('optimistic_updates'),
    ]);

  return {
    pendingActions: pendingActions.length,
    lastSyncTime: lastSyncString ? new Date(lastSyncString) : null,
    isOnline: online,
    optimisticUpdates: optimisticUpdates?.length || 0,
  };
};

/**
 * Force sync all pending actions
 */
export const forceSyncAll = async (): Promise<SyncResult> => {
  logger.info('Force syncing all pending actions', { function: 'forceSyncAll' });
  return await processSyncQueue();
};

/**
 * Retry failed sync actions
 */
export const retryFailedSync = async (): Promise<SyncResult> => {
  const pendingActions = await getPendingActions();
  const failedActions = pendingActions.filter(
    (action) => action.retryCount > 0,
  );

  if (failedActions.length === 0) {
    return {
      success: true,
      syncedActions: 0,
      failedActions: 0,
      conflicts: [],
      errors: [],
    };
  }

  
  return await processBatch(failedActions);
};
