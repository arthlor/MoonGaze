import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { Unsubscribe } from 'firebase/firestore';
import { Task, TaskCategory, TaskStatus } from '../types';
import {
  assignTask as assignTaskService,
  canClaimTask,
  canCompleteTask,
  canDeleteTask,
  canEditTask,
  claimTask as claimTaskService,
  completeTask as completeTaskService,
  createTask as createTaskService,
  deleteTask as deleteTaskService,
  getTaskStats,
  getTasksByPartnership,
  getUnassignedTasks,
  reopenTask as reopenTaskService,
  subscribeToPartnershipTasks,
  subscribeToUnassignedTasks,
  updateTask as updateTaskService,
} from '../services/taskService';
import {
  PendingAction as OfflinePendingAction,
  addPendingAction as addPendingActionToCache,
  cacheTasksData,
  getPendingActions,
  isOnline,
  loadCachedTasksData,
  removePendingAction,
  updatePendingActionRetryCount,
} from '../services/offlineService';
import {
  removeOptimisticUpdate,
  rollbackOptimisticUpdate,
  storeOptimisticUpdate,
} from '../services/syncService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { notificationService } from '../services/notificationService';
import {
  ErrorDisplayConfig,
  ErrorInfo,
  analyzeError,
  getErrorDisplayConfig,
} from '../utils/errorHandling';
import { analyticsService } from '../services/analyticsService';
import { logger } from '../utils/logger';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface TaskState {
  tasks: Task[];
  unassignedTasks: Task[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: ErrorInfo | null;
  errorDisplayConfig: ErrorDisplayConfig | null;
  lastSyncTime: Date | null;
  isOffline: boolean;
  pendingActions: PendingAction[];
  stats: TaskStats;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  unassigned: number;
}

export interface PendingAction extends OfflinePendingAction {}

export interface CreateTaskData {
  title: string;
  category: TaskCategory;
  description?: string;
  assignedTo?: string;
  dueDate?: Date;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  category?: TaskCategory;
  dueDate?: Date;
  [key: string]: unknown;
}

// Task Actions
type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_UNASSIGNED_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; updates: Partial<Task> } }
  | { type: 'REMOVE_TASK'; payload: string }
  | {
      type: 'SET_ERROR';
      payload: { error: ErrorInfo; config: ErrorDisplayConfig };
    }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'SET_LAST_SYNC'; payload: Date }
  | { type: 'ADD_PENDING_ACTION'; payload: PendingAction }
  | { type: 'REMOVE_PENDING_ACTION'; payload: string }
  | { type: 'SET_STATS'; payload: TaskStats }
  | {
      type: 'OPTIMISTIC_UPDATE';
      payload: { taskId: string; updates: Partial<Task> };
    }
  | {
      type: 'REVERT_OPTIMISTIC_UPDATE';
      payload: { taskId: string; originalTask: Task };
    };

// Task Context Interface
export interface TaskContextType extends TaskState {
  // Task CRUD operations
  createTask: (
    data: CreateTaskData,
    createdBy: string,
    partnershipId: string
  ) => Promise<Task | null>;
  updateTask: (
    taskId: string,
    updates: UpdateTaskData,
    userId: string
  ) => Promise<boolean>;
  deleteTask: (taskId: string, userId: string) => Promise<boolean>;

  // Task status management
  claimTask: (taskId: string, userId: string) => Promise<boolean>;
  assignTask: (
    taskId: string,
    assignedTo: string,
    assignedBy: string
  ) => Promise<boolean>;
  completeTask: (taskId: string, completedBy: string) => Promise<boolean>;
  reopenTask: (taskId: string, userId: string) => Promise<boolean>;

  // Data management
  refreshTasks: () => Promise<void>;
  syncPendingActions: () => Promise<void>;
  clearError: () => void;

  // Utility functions
  getTaskById: (taskId: string) => Task | null;
  canUserEditTask: (taskId: string, userId: string) => boolean;
  canUserDeleteTask: (taskId: string, userId: string) => boolean;
  canUserCompleteTask: (taskId: string, userId: string) => boolean;
  canUserClaimTask: (taskId: string, userId: string) => boolean;

  // Filtering and sorting
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByCategory: (category: TaskCategory) => Task[];
  getTasksAssignedToUser: (userId: string) => Task[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_RETRY_COUNT = 3;
const SYNC_RETRY_DELAY = 2000; // 2 seconds

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: TaskState = {
  tasks: [],
  unassignedTasks: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  errorDisplayConfig: null,
  lastSyncTime: null,
  isOffline: false,
  pendingActions: [],
  stats: {
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    unassigned: 0,
  },
};

// ============================================================================
// REDUCER
// ============================================================================

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };

    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
        isLoading: false,
        error: null,
      };

    case 'SET_UNASSIGNED_TASKS':
      return {
        ...state,
        unassignedTasks: action.payload,
      };

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, ...action.payload.updates }
            : task,
        ),
        unassignedTasks: state.unassignedTasks.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, ...action.payload.updates }
            : task,
        ),
      };

    case 'REMOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
        unassignedTasks: state.unassignedTasks.filter(
          (task) => task.id !== action.payload,
        ),
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        errorDisplayConfig: action.payload.config,
        isLoading: false,
        isRefreshing: false,
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null, errorDisplayConfig: null };

    case 'SET_OFFLINE':
      return { ...state, isOffline: action.payload };

    case 'SET_LAST_SYNC':
      return { ...state, lastSyncTime: action.payload };

    case 'ADD_PENDING_ACTION':
      return {
        ...state,
        pendingActions: [...state.pendingActions, action.payload],
      };

    case 'REMOVE_PENDING_ACTION':
      return {
        ...state,
        pendingActions: state.pendingActions.filter(
          (pendingAction) => pendingAction.id !== action.payload,
        ),
      };

    case 'SET_STATS':
      return { ...state, stats: action.payload };

    case 'OPTIMISTIC_UPDATE':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, ...action.payload.updates }
            : task,
        ),
      };

    case 'REVERT_OPTIMISTIC_UPDATE':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId ? action.payload.originalTask : task,
        ),
      };

    default:
      return state;
  }
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface TaskProviderProps {
  children: ReactNode;
  partnershipId?: string;
  userId?: string;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({
  children,
  partnershipId,
  userId,
}) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { isOnline: networkIsOnline } = useNetworkStatus();

  // Store unsubscribe functions
  const unsubscribeRefs = React.useRef<{
    tasks?: Unsubscribe;
    unassigned?: Unsubscribe;
  }>({});

  // Update offline status based on network status
  React.useEffect(() => {
    dispatch({ type: 'SET_OFFLINE', payload: !networkIsOnline });
  }, [networkIsOnline]);

  // Enhanced error handling helper
  const handleError = useCallback((error: unknown, context?: string) => {
    const errorInfo = analyzeError(error);
    const displayConfig = getErrorDisplayConfig(error);

    logger.error('TaskContext error', error, {
      function: 'handleError',
      context: context || 'TaskContext',
    });

    dispatch({
      type: 'SET_ERROR',
      payload: { error: errorInfo, config: displayConfig },
    });
  }, []);

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  // Cache management is now handled by the offlineService

  // ============================================================================
  // OFFLINE SUPPORT
  // ============================================================================

  const addPendingAction = useCallback(
    async (
      action: Omit<
        PendingAction,
        'id' | 'timestamp' | 'retryCount' | 'maxRetries'
      >,
    ) => {
      try {
        const actionId = await addPendingActionToCache({
          ...action,
          maxRetries: MAX_RETRY_COUNT,
        });

        const pendingAction: PendingAction = {
          ...action,
          id: actionId,
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: MAX_RETRY_COUNT,
        };

        dispatch({ type: 'ADD_PENDING_ACTION', payload: pendingAction });
      } catch (error) {
        logger.error('Error adding pending action', error, {
          function: 'addPendingAction',
          actionType: action.type,
        });
      }
    },
    [],
  );

  const syncPendingActions = useCallback(async () => {
    if (state.pendingActions.length === 0) return;

    // Check if we're online before attempting sync
    const online = await isOnline();
    if (!online) {
      logger.info('Cannot sync pending actions: device is offline', {
        function: 'syncPendingActions',
      });
      return;
    }

    for (const action of state.pendingActions) {
      try {
        switch (action.type) {
          case 'create':
            await createTaskService(
              action.data.title as string,
              action.data.category as TaskCategory,
              action.data.createdBy as string,
              action.data.partnershipId as string,
              action.data.description as string,
              action.data.assignedTo as string,
              action.data.dueDate ? new Date(action.data.dueDate as string) : undefined,
            );
            break;
          case 'update':
            if (!action.taskId) {
              logger.error('Task ID is required for update action', null, {
                function: 'syncPendingActions',
                actionId: action.id,
              });
              continue;
            }
            await updateTaskService(action.taskId, action.data);
            break;
          case 'delete':
            if (!action.taskId) {
              logger.error('Task ID is required for delete action', null, {
                function: 'syncPendingActions',
                actionId: action.id,
              });
              continue;
            }
            await deleteTaskService(
              action.taskId,
              action.data.userId as string,
            );
            break;
          case 'claim':
            if (!action.taskId) {
              logger.error('Task ID is required for claim action', null, {
                function: 'syncPendingActions',
                actionId: action.id,
              });
              continue;
            }
            await claimTaskService(action.taskId, action.data.userId as string);
            break;
          case 'complete':
            if (!action.taskId) {
              logger.error('Task ID is required for complete action', null, {
                function: 'syncPendingActions',
                actionId: action.id,
              });
              continue;
            }
            await completeTaskService(
              action.taskId,
              action.data.userId as string,
            );
            break;
          case 'assign':
            if (!action.taskId) {
              logger.error('Task ID is required for assign action', null, {
                function: 'syncPendingActions',
                actionId: action.id,
              });
              continue;
            }
            await assignTaskService(
              action.taskId,
              action.data.assignedTo as string,
              action.data.assignedBy as string,
            );
            break;
        }

        // Remove from both local state and cache
        dispatch({ type: 'REMOVE_PENDING_ACTION', payload: action.id });
        await removePendingAction(action.id);
      } catch (error) {
        logger.error('Error syncing pending action', error, {
          function: 'syncPendingActions',
          actionId: action.id,
          actionType: action.type,
        });

        if (action.retryCount < action.maxRetries) {
          // Increment retry count in cache
          await updatePendingActionRetryCount(action.id);

          // Update local state
          const updatedAction = {
            ...action,
            retryCount: action.retryCount + 1,
          };
          dispatch({ type: 'REMOVE_PENDING_ACTION', payload: action.id });
          dispatch({ type: 'ADD_PENDING_ACTION', payload: updatedAction });
        } else {
          // Remove action after max retries
          dispatch({ type: 'REMOVE_PENDING_ACTION', payload: action.id });
          await removePendingAction(action.id);
        }
      }
    }
  }, [state.pendingActions]);

  // ============================================================================
  // TASK OPERATIONS
  // ============================================================================

  const createTask = useCallback(
    async (
      data: CreateTaskData,
      createdBy: string,
      partnershipId: string,
    ): Promise<Task | null> => {
      try {
        logger.info('TaskContext.createTask called', {
          function: 'createTask',
          title: data.title,
          category: data.category,
          createdBy,
          partnershipId,
          isOffline: state.isOffline,
        });
        dispatch({ type: 'CLEAR_ERROR' });

        if (state.isOffline) {
          logger.info('Creating task offline', { function: 'createTask' });
          // Add to pending actions for offline support
          await addPendingAction({
            type: 'create',
            data: { ...data, createdBy, partnershipId },
          });

          // Create optimistic task
          const optimisticTask: Task = {
            id: `temp_${Date.now()}`,
            title: data.title,
            description: data.description,
            category: data.category,
            assignedTo: data.assignedTo,
            createdBy,
            status: 'todo',
            dueDate: data.dueDate,
            createdAt: new Date(),
            updatedAt: new Date(),
            partnershipId,
          };

          dispatch({ type: 'ADD_TASK', payload: optimisticTask });
          return optimisticTask;
        }

        logger.info('Creating task online', { function: 'createTask' });
        const task = await createTaskService(
          data.title,
          data.category,
          createdBy,
          partnershipId,
          data.description,
          data.assignedTo,
          data.dueDate,
        );

        logger.info('Task created successfully', {
          function: 'createTask',
          taskId: task.id,
          title: task.title,
        });
        dispatch({ type: 'ADD_TASK', payload: task });

        // Track task creation
        analyticsService.trackTaskCreation(data.category);

        return task;
      } catch (error) {
        logger.error('Error in TaskContext.createTask', error, {
          function: 'createTask',
          title: data.title,
          createdBy,
          partnershipId,
        });
        handleError(error, 'createTask');
        return null;
      }
    },
    [addPendingAction, handleError, state.isOffline],
  );

  const updateTask = useCallback(
    async (
      taskId: string,
      updates: UpdateTaskData,
      userId: string,
    ): Promise<boolean> => {
      try {
        dispatch({ type: 'CLEAR_ERROR' });

        const task = state.tasks.find((t) => t.id === taskId);
        if (!task || !canEditTask(task, userId)) {
          handleError(
            new Error('You do not have permission to edit this task'),
            'updateTask',
          );
          return false;
        }

        const originalTask = state.tasks.find((t) => t.id === taskId);
        if (!originalTask) {
          handleError(new Error('Task not found'), 'updateTask');
          return false;
        }

        // Store optimistic update for potential rollback
        const optimisticTask = { ...originalTask, ...updates };
        const updateId = await storeOptimisticUpdate(
          taskId,
          originalTask,
          optimisticTask,
          'update',
        );

        // Optimistic update
        dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { taskId, updates } });

        if (state.isOffline) {
          await addPendingAction({
            type: 'update',
            taskId,
            data: updates,
          });
          return true;
        }

        try {
          await updateTaskService(taskId, updates);
          // Remove optimistic update on success
          await removeOptimisticUpdate(updateId);
          return true;
        } catch (error) {
          // Rollback optimistic update on failure
          const rolledBackTask = await rollbackOptimisticUpdate(updateId);
          if (rolledBackTask) {
            dispatch({
              type: 'REVERT_OPTIMISTIC_UPDATE',
              payload: { taskId, originalTask: rolledBackTask },
            });
          }
          throw error;
        }
      } catch (error) {
        handleError(error, 'updateTask');
        return false;
      }
    },
    [addPendingAction, handleError, state.isOffline, state.tasks],
  );

  const deleteTask = useCallback(
    async (taskId: string, userId: string): Promise<boolean> => {
      try {
        dispatch({ type: 'CLEAR_ERROR' });

        const task = state.tasks.find((t) => t.id === taskId);
        if (!task || !canDeleteTask(task, userId)) {
          handleError(
            new Error('You do not have permission to delete this task'),
            'deleteTask',
          );
          return false;
        }

        // Optimistic removal
        dispatch({ type: 'REMOVE_TASK', payload: taskId });

        if (state.isOffline) {
          await addPendingAction({
            type: 'delete',
            taskId,
            data: { userId },
          });
          return true;
        }

        await deleteTaskService(taskId, userId);
        return true;
      } catch (error) {
        handleError(error, 'deleteTask');

        // Revert optimistic removal
        const originalTask = state.tasks.find((t) => t.id === taskId);
        if (originalTask) {
          dispatch({ type: 'ADD_TASK', payload: originalTask });
        }

        return false;
      }
    },
    [addPendingAction, handleError, state.isOffline, state.tasks],
  );

  const claimTask = useCallback(
    async (taskId: string, userId: string): Promise<boolean> => {
      try {
        dispatch({ type: 'CLEAR_ERROR' });

        const task = state.tasks.find((t) => t.id === taskId);
        if (!task || !canClaimTask(task, userId)) {
          handleError(new Error('This task cannot be claimed'), 'claimTask');
          return false;
        }

        const originalTask = state.tasks.find((t) => t.id === taskId);
        if (!originalTask) {
          handleError(new Error('Task not found'), 'claimTask');
          return false;
        }

        const updates = {
          assignedTo: userId,
          status: 'in_progress' as TaskStatus,
        };
        const optimisticTask = { ...originalTask, ...updates };
        const updateId = await storeOptimisticUpdate(
          taskId,
          originalTask,
          optimisticTask,
          'claim',
        );

        // Optimistic update
        dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { taskId, updates } });

        if (state.isOffline) {
          await addPendingAction({
            type: 'claim',
            taskId,
            data: { userId },
          });
          return true;
        }

        try {
          await claimTaskService(taskId, userId);
          await removeOptimisticUpdate(updateId);
          return true;
        } catch (error) {
          const rolledBackTask = await rollbackOptimisticUpdate(updateId);
          if (rolledBackTask) {
            dispatch({
              type: 'REVERT_OPTIMISTIC_UPDATE',
              payload: { taskId, originalTask: rolledBackTask },
            });
          }
          throw error;
        }
      } catch (error) {
        handleError(error, 'claimTask');
        return false;
      }
    },
    [addPendingAction, handleError, state.isOffline, state.tasks],
  );

  const assignTask = useCallback(
    async (
      taskId: string,
      assignedTo: string,
      assignedBy: string,
    ): Promise<boolean> => {
      try {
        dispatch({ type: 'CLEAR_ERROR' });

        const originalTask = state.tasks.find((t) => t.id === taskId);
        if (!originalTask) {
          handleError(new Error('Task not found'), 'assignTask');
          return false;
        }

        const updates = {
          assignedTo,
          status: assignedTo
            ? ('in_progress' as TaskStatus)
            : ('todo' as TaskStatus),
        };
        const optimisticTask = { ...originalTask, ...updates };
        const updateId = await storeOptimisticUpdate(
          taskId,
          originalTask,
          optimisticTask,
          'assign',
        );

        // Optimistic update
        dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { taskId, updates } });

        if (state.isOffline) {
          await addPendingAction({
            type: 'assign',
            taskId,
            data: { assignedTo, assignedBy },
          });
          return true;
        }

        try {
          await assignTaskService(taskId, assignedTo, assignedBy);
          await removeOptimisticUpdate(updateId);
          return true;
        } catch (error) {
          const rolledBackTask = await rollbackOptimisticUpdate(updateId);
          if (rolledBackTask) {
            dispatch({
              type: 'REVERT_OPTIMISTIC_UPDATE',
              payload: { taskId, originalTask: rolledBackTask },
            });
          }
          throw error;
        }
      } catch (error) {
        handleError(error, 'assignTask');
        return false;
      }
    },
    [addPendingAction, handleError, state.isOffline, state.tasks],
  );

  const completeTask = useCallback(
    async (taskId: string, completedBy: string): Promise<boolean> => {
      try {
        dispatch({ type: 'CLEAR_ERROR' });

        const task = state.tasks.find((t) => t.id === taskId);
        if (!task || !canCompleteTask(task, completedBy)) {
          handleError(
            new Error('You cannot complete this task'),
            'completeTask',
          );
          return false;
        }

        const originalTask = state.tasks.find((t) => t.id === taskId);
        if (!originalTask) {
          handleError(new Error('Task not found'), 'completeTask');
          return false;
        }

        const updates = {
          status: 'done' as TaskStatus,
          assignedTo: completedBy,
          completedAt: new Date(),
        };
        const optimisticTask = { ...originalTask, ...updates };
        const updateId = await storeOptimisticUpdate(
          taskId,
          originalTask,
          optimisticTask,
          'complete',
        );

        // Optimistic update
        dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { taskId, updates } });

        if (state.isOffline) {
          await addPendingAction({
            type: 'complete',
            taskId,
            data: { userId: completedBy },
          });
          return true;
        }

        try {
          await completeTaskService(taskId, completedBy);
          await removeOptimisticUpdate(updateId);

          // Track task completion
          analyticsService.trackTaskCompletion(taskId, originalTask.category);

          return true;
        } catch (error) {
          const rolledBackTask = await rollbackOptimisticUpdate(updateId);
          if (rolledBackTask) {
            dispatch({
              type: 'REVERT_OPTIMISTIC_UPDATE',
              payload: { taskId, originalTask: rolledBackTask },
            });
          }
          throw error;
        }
      } catch (error) {
        handleError(error, 'completeTask');
        return false;
      }
    },
    [addPendingAction, handleError, state.isOffline, state.tasks],
  );

  const reopenTask = useCallback(
    async (taskId: string, userId: string): Promise<boolean> => {
      try {
        dispatch({ type: 'CLEAR_ERROR' });

        // Optimistic update
        dispatch({
          type: 'OPTIMISTIC_UPDATE',
          payload: {
            taskId,
            updates: {
              status: 'in_progress' as TaskStatus,
              completedAt: undefined,
            },
          },
        });

        if (state.isOffline) {
          await addPendingAction({
            type: 'update',
            taskId,
            data: { status: 'in_progress', completedAt: null },
          });
          return true;
        }

        await reopenTaskService(taskId, userId);
        return true;
      } catch (error) {
        handleError(error, 'reopenTask');

        // Revert optimistic update
        const originalTask = state.tasks.find((t) => t.id === taskId);
        if (originalTask) {
          dispatch({
            type: 'REVERT_OPTIMISTIC_UPDATE',
            payload: { taskId, originalTask },
          });
        }

        return false;
      }
    },
    [state.isOffline, state.tasks, addPendingAction, handleError],
  );

  // ============================================================================
  // DATA MANAGEMENT
  // ============================================================================

  const refreshTasks = useCallback(async () => {
    if (!partnershipId) return;

    try {
      dispatch({ type: 'SET_REFRESHING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const [tasks, unassignedTasks, stats] = await Promise.all([
        getTasksByPartnership(partnershipId, { includeCompleted: true }),
        getUnassignedTasks(partnershipId),
        getTaskStats(partnershipId),
      ]);

      dispatch({ type: 'SET_TASKS', payload: tasks });
      dispatch({ type: 'SET_UNASSIGNED_TASKS', payload: unassignedTasks });
      dispatch({ type: 'SET_STATS', payload: stats });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });

      // Cache the data
      await cacheTasksData(tasks, unassignedTasks);

      // Try to sync pending actions
      await syncPendingActions();
    } catch (error) {
      handleError(error, 'refreshTasks');
      dispatch({ type: 'SET_OFFLINE', payload: true });
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [handleError, partnershipId, syncPendingActions]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getTaskById = useCallback(
    (taskId: string): Task | null => {
      return state.tasks.find((task) => task.id === taskId) || null;
    },
    [state.tasks],
  );

  const canUserEditTask = useCallback(
    (taskId: string, userId: string): boolean => {
      const task = getTaskById(taskId);
      return task ? canEditTask(task, userId) : false;
    },
    [getTaskById],
  );

  const canUserDeleteTask = useCallback(
    (taskId: string, userId: string): boolean => {
      const task = getTaskById(taskId);
      return task ? canDeleteTask(task, userId) : false;
    },
    [getTaskById],
  );

  const canUserCompleteTask = useCallback(
    (taskId: string, userId: string): boolean => {
      const task = getTaskById(taskId);
      return task ? canCompleteTask(task, userId) : false;
    },
    [getTaskById],
  );

  const canUserClaimTask = useCallback(
    (taskId: string, userId: string): boolean => {
      const task = getTaskById(taskId);
      return task ? canClaimTask(task, userId) : false;
    },
    [getTaskById],
  );

  const getTasksByStatus = useCallback(
    (status: TaskStatus): Task[] => {
      return state.tasks.filter((task) => task.status === status);
    },
    [state.tasks],
  );

  const getTasksByCategory = useCallback(
    (category: TaskCategory): Task[] => {
      return state.tasks.filter((task) => task.category === category);
    },
    [state.tasks],
  );

  const getTasksAssignedToUser = useCallback(
    (userId: string): Task[] => {
      return state.tasks.filter((task) => task.assignedTo === userId);
    },
    [state.tasks],
  );

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const [tasksData, cachedPendingActions] = await Promise.all([
          loadCachedTasksData(),
          getPendingActions(),
        ]);

        if (tasksData.tasks) {
          dispatch({ type: 'SET_TASKS', payload: tasksData.tasks });
        }
        if (tasksData.unassignedTasks) {
          dispatch({
            type: 'SET_UNASSIGNED_TASKS',
            payload: tasksData.unassignedTasks,
          });
        }
        if (tasksData.lastSync) {
          dispatch({ type: 'SET_LAST_SYNC', payload: tasksData.lastSync });
        }
        if (cachedPendingActions.length > 0) {
          cachedPendingActions.forEach((action: PendingAction) => {
            dispatch({ type: 'ADD_PENDING_ACTION', payload: action });
          });
        }
      } catch (error) {
        logger.error('Error loading cached data', error, {
          function: 'loadCachedData',
        });
      }
    };

    loadCachedData();
  }, []);

  // Set up real-time listeners when partnershipId is available
  useEffect(() => {
    if (!partnershipId) return;

    // Clean up existing listeners
    const currentRefs = unsubscribeRefs.current;
    if (currentRefs.tasks) {
      currentRefs.tasks();
    }
    if (currentRefs.unassigned) {
      currentRefs.unassigned();
    }

    // Set up new listeners
    const tasksUnsubscribe = subscribeToPartnershipTasks(
      partnershipId,
      (tasks) => {
        dispatch({ type: 'SET_TASKS', payload: tasks });
        dispatch({ type: 'SET_OFFLINE', payload: false });
        // Cache will be updated by cacheTasksData in refreshTasks
      },
      { includeCompleted: true },
    );

    const unassignedUnsubscribe = subscribeToUnassignedTasks(
      partnershipId,
      (unassignedTasks) => {
        dispatch({ type: 'SET_UNASSIGNED_TASKS', payload: unassignedTasks });
        // Cache will be updated by cacheTasksData in refreshTasks
      },
    );

    // Store unsubscribe functions in ref for access outside this effect
    unsubscribeRefs.current = {
      tasks: tasksUnsubscribe,
      unassigned: unassignedUnsubscribe,
    };

    return () => {
      // Clean up subscriptions using captured values
      tasksUnsubscribe();
      unassignedUnsubscribe();
    };
  }, [partnershipId]);

  // Set up notification listeners for task changes (Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6)
  useEffect(() => {
    if (!partnershipId || !userId) return;

    const setupNotificationListeners = async () => {
      try {
        await notificationService.setupTaskListeners(partnershipId, userId);
        logger.info('Notification listeners setup for partnership', {
          function: 'setupNotificationListeners',
          partnershipId,
          userId,
        });
      } catch (error) {
        logger.error('Failed to setup notification listeners', error, {
          function: 'setupNotificationListeners',
          partnershipId,
          userId,
        });
      }
    };

    setupNotificationListeners();

    // Cleanup notification listeners when component unmounts or dependencies change
    return () => {
      notificationService.cleanup();
    };
  }, [partnershipId, userId]);

  // Periodic sync of pending actions
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (state.pendingActions.length > 0 && !state.isOffline) {
        syncPendingActions();
      }
    }, SYNC_RETRY_DELAY);

    return () => clearInterval(syncInterval);
  }, [state.pendingActions, state.isOffline, syncPendingActions]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: TaskContextType = {
    ...state,
    createTask,
    updateTask,
    deleteTask,
    claimTask,
    assignTask,
    completeTask,
    reopenTask,
    refreshTasks,
    syncPendingActions,
    clearError,
    getTaskById,
    canUserEditTask,
    canUserDeleteTask,
    canUserCompleteTask,
    canUserClaimTask,
    getTasksByStatus,
    getTasksByCategory,
    getTasksAssignedToUser,
  };

  return (
    <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
