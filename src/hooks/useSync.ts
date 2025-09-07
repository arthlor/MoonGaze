import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ConflictResolution,
  SyncResult,
  forceSyncAll,
  getSyncStatus,
  isSyncNeeded,
  processSyncQueue,
  retryFailedSync,
} from '../services/syncService';
import { useNetworkStatus } from './useNetworkStatus';
import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface UseSyncReturn {
  // Sync status
  isSyncing: boolean;
  syncProgress: number;
  lastSyncTime: Date | null;
  pendingActions: number;
  optimisticUpdates: number;
  syncErrors: string[];
  conflicts: ConflictResolution[];
  
  // Sync operations
  sync: () => Promise<SyncResult>;
  forceSync: () => Promise<SyncResult>;
  retryFailed: () => Promise<SyncResult>;
  clearErrors: () => void;
  clearConflicts: () => void;
  
  // Auto-sync settings
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTO_SYNC_INTERVAL = 30000; // 30 seconds
const SYNC_ON_RECONNECT_DELAY = 2000; // 2 seconds after reconnection

// ============================================================================
// HOOK
// ============================================================================

export const useSync = (): UseSyncReturn => {
  const { isOnline } = useNetworkStatus();
  
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingActions, setPendingActions] = useState(0);
  const [optimisticUpdates, setOptimisticUpdates] = useState(0);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  
  // Refs for intervals and timeouts
  const autoSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousOnlineStatus = useRef<boolean>(isOnline);



  /**
   * Perform sync operation
   */
  const performSync = useCallback(async (
    syncFunction: () => Promise<SyncResult>,
  ): Promise<SyncResult> => {
    if (isSyncing) {
      logger.info('Sync already in progress, skipping', { 
        function: 'performSync', 
      });
      return {
        success: false,
        syncedActions: 0,
        failedActions: 0,
        conflicts: [],
        errors: ['Sync already in progress'],
      };
    }

    setIsSyncing(true);
    setSyncProgress(0);
    
    try {
      const result = await syncFunction();
      
      // Update state based on result
      if (result.errors.length > 0) {
        setSyncErrors(prev => [...prev, ...result.errors]);
      }
      
      if (result.conflicts.length > 0) {
        setConflicts(prev => [...prev, ...result.conflicts]);
      }
      
      setSyncProgress(100);
      
      // Update sync status
      try {
        const status = await getSyncStatus();
        setLastSyncTime(status.lastSyncTime);
        setPendingActions(status.pendingActions);
        setOptimisticUpdates(status.optimisticUpdates);
      } catch (statusError) {
        logger.error('Error updating sync status', statusError, { 
          function: 'performSync', 
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Sync operation failed', error, { 
        function: 'performSync', 
      });
      setSyncErrors(prev => [...prev, `Sync failed: ${error}`]);
      
      return {
        success: false,
        syncedActions: 0,
        failedActions: 0,
        conflicts: [],
        errors: [`Sync failed: ${error}`],
      };
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [isSyncing]);

  /**
   * Regular sync operation
   */
  const sync = useCallback(async (): Promise<SyncResult> => {
    return await performSync(processSyncQueue);
  }, [performSync]);

  /**
   * Force sync all pending actions
   */
  const forceSync = useCallback(async (): Promise<SyncResult> => {
    return await performSync(forceSyncAll);
  }, [performSync]);

  /**
   * Retry failed sync actions
   */
  const retryFailed = useCallback(async (): Promise<SyncResult> => {
    return await performSync(retryFailedSync);
  }, [performSync]);

  /**
   * Clear sync errors
   */
  const clearErrors = useCallback(() => {
    setSyncErrors([]);
  }, []);

  /**
   * Clear conflicts
   */
  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  /**
   * Auto-sync when conditions are met
   */
  const autoSync = useCallback(async () => {
    if (!autoSyncEnabled || !isOnline || isSyncing) {
      return;
    }

    try {
      const needsSync = await isSyncNeeded();
      if (needsSync) {
        logger.info('Auto-sync: syncing pending actions', { 
          function: 'autoSync', 
        });
        await performSync(processSyncQueue);
      }
    } catch (error) {
      logger.error('Auto-sync failed', error, { 
        function: 'autoSync', 
      });
    }
  }, [autoSyncEnabled, isOnline, isSyncing, performSync]);

  // Set up auto-sync interval
  useEffect(() => {
    if (autoSyncEnabled && isOnline) {
      autoSyncIntervalRef.current = setInterval(autoSync, AUTO_SYNC_INTERVAL);
    } else {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
        autoSyncIntervalRef.current = null;
      }
    }

    return () => {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
      }
    };
  }, [autoSyncEnabled, isOnline, autoSync]);

  // Sync when coming back online
  useEffect(() => {
    const wasOffline = !previousOnlineStatus.current;
    const isNowOnline = isOnline;
    
    if (wasOffline && isNowOnline && autoSyncEnabled) {
      logger.info('Device came back online, scheduling sync', { 
        function: 'useSync.reconnectEffect', 
      });
      
      // Clear any existing timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Schedule sync after a short delay
      reconnectTimeoutRef.current = setTimeout(async () => {
        try {
          const needsSync = await isSyncNeeded();
          if (needsSync) {
            logger.info('Syncing after reconnection', { 
              function: 'useSync.reconnectTimeout', 
            });
            await performSync(processSyncQueue);
          }
        } catch (error) {
          logger.error('Reconnection sync failed', error, { 
            function: 'useSync.reconnectTimeout', 
          });
        }
      }, SYNC_ON_RECONNECT_DELAY);
    }
    
    previousOnlineStatus.current = isOnline;

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isOnline, autoSyncEnabled, performSync]);

  // Initial sync status update
  useEffect(() => {
    const updateStatus = async () => {
      try {
        const status = await getSyncStatus();
        setLastSyncTime(status.lastSyncTime);
        setPendingActions(status.pendingActions);
        setOptimisticUpdates(status.optimisticUpdates);
      } catch (error) {
        logger.error('Error updating sync status', error, { 
          function: 'useSync.initialStatusUpdate', 
        });
      }
    };
    
    updateStatus();
  }, []);

  // Periodic sync status updates
  useEffect(() => {
    const updateStatus = async () => {
      try {
        const status = await getSyncStatus();
        setLastSyncTime(status.lastSyncTime);
        setPendingActions(status.pendingActions);
        setOptimisticUpdates(status.optimisticUpdates);
      } catch (error) {
        logger.error('Error updating sync status', error, { 
          function: 'useSync.periodicStatusUpdate', 
        });
      }
    };
    
    const statusInterval = setInterval(updateStatus, 10000); // Update every 10 seconds
    
    return () => clearInterval(statusInterval);
  }, []);

  return {
    // Sync status
    isSyncing,
    syncProgress,
    lastSyncTime,
    pendingActions,
    optimisticUpdates,
    syncErrors,
    conflicts,
    
    // Sync operations
    sync,
    forceSync,
    retryFailed,
    clearErrors,
    clearConflicts,
    
    // Auto-sync settings
    autoSyncEnabled,
    setAutoSyncEnabled,
  };
};

// ============================================================================
// ADDITIONAL HOOKS
// ============================================================================

/**
 * Hook for sync status display
 */
export const useSyncStatus = (): {
  statusText: string;
  statusColor: 'success' | 'warning' | 'error' | 'info';
  showProgress: boolean;
} => {
  const { 
    isSyncing, 
    pendingActions, 
    syncErrors, 
    conflicts,
    lastSyncTime, 
  } = useSync();
  const { isOnline } = useNetworkStatus();

  if (isSyncing) {
    return {
      statusText: 'Syncing...',
      statusColor: 'info',
      showProgress: true,
    };
  }

  if (!isOnline) {
    return {
      statusText: pendingActions > 0 
        ? `Offline (${pendingActions} pending)` 
        : 'Offline',
      statusColor: 'warning',
      showProgress: false,
    };
  }

  if (syncErrors.length > 0) {
    return {
      statusText: `Sync errors (${syncErrors.length})`,
      statusColor: 'error',
      showProgress: false,
    };
  }

  if (conflicts.length > 0) {
    return {
      statusText: `Conflicts (${conflicts.length})`,
      statusColor: 'warning',
      showProgress: false,
    };
  }

  if (pendingActions > 0) {
    return {
      statusText: `${pendingActions} pending`,
      statusColor: 'warning',
      showProgress: false,
    };
  }

  if (lastSyncTime) {
    const timeDiff = Date.now() - lastSyncTime.getTime();
    const minutes = Math.floor(timeDiff / 60000);
    
    if (minutes < 1) {
      return {
        statusText: 'Synced',
        statusColor: 'success',
        showProgress: false,
      };
    } else if (minutes < 60) {
      return {
        statusText: `Synced ${minutes}m ago`,
        statusColor: 'success',
        showProgress: false,
      };
    } else {
      const hours = Math.floor(minutes / 60);
      return {
        statusText: `Synced ${hours}h ago`,
        statusColor: 'info',
        showProgress: false,
      };
    }
  }

  return {
    statusText: 'Ready',
    statusColor: 'success',
    showProgress: false,
  };
};

/**
 * Hook for conflict resolution UI
 */
export const useConflictResolution = (): {
  hasConflicts: boolean;
  conflictCount: number;
  conflicts: ConflictResolution[];
  resolveConflict: (conflictId: string, resolution: 'accept' | 'reject') => void;
  resolveAllConflicts: (resolution: 'accept' | 'reject') => void;
} => {
  const { conflicts, clearConflicts } = useSync();

  const resolveConflict = useCallback((conflictId: string, resolution: 'accept' | 'reject') => {
    // In a real implementation, this would handle the specific conflict resolution
    logger.info('Resolving conflict', { 
      function: 'resolveConflict',
      conflictId,
      resolution, 
    });
    
    // For now, just remove the conflict from the list
    // In practice, you'd want to apply the resolution and update the data accordingly
    clearConflicts();
  }, [clearConflicts]);

  const resolveAllConflicts = useCallback((_resolution: 'accept' | 'reject') => {
    
    clearConflicts();
  }, [clearConflicts]);

  return {
    hasConflicts: conflicts.length > 0,
    conflictCount: conflicts.length,
    conflicts,
    resolveConflict,
    resolveAllConflicts,
  };
};