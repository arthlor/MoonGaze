import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Task, User } from '../types';
import { logger } from '../utils/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

export const STORAGE_KEYS = {
  TASKS: '@moongaze_tasks',
  UNASSIGNED_TASKS: '@moongaze_unassigned_tasks',
  USER_DATA: '@moongaze_user_data',
  PARTNERSHIP_DATA: '@moongaze_partnership_data',
  PENDING_ACTIONS: '@moongaze_pending_actions',
  LAST_SYNC: '@moongaze_last_sync',
  NETWORK_STATUS: '@moongaze_network_status',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'claim' | 'complete' | 'assign';
  taskId?: string;
  data: Record<string, unknown>;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface CacheMetadata {
  lastUpdated: Date;
  expiresAt?: Date;
  version: string;
}

export interface CachedData<T> {
  data: T;
  metadata: CacheMetadata;
}

export interface NetworkStatus {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
}

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Generic function to save data to AsyncStorage with metadata
 */
export const saveToCache = async <T>(
  key: string, 
  data: T, 
  expirationMinutes?: number,
): Promise<void> => {
  try {
    const metadata: CacheMetadata = {
      lastUpdated: new Date(),
      version: '1.0.0',
    };

    if (expirationMinutes) {
      metadata.expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
    }

    const cachedData: CachedData<T> = {
      data,
      metadata,
    };

    await AsyncStorage.setItem(key, JSON.stringify(cachedData));
  } catch (error) {
    logger.error('Error saving to cache', error, { 
      function: 'saveToCache',
      key, 
    });
    throw new Error(`Failed to save data to cache: ${key}`);
  }
};

/**
 * Generic function to load data from AsyncStorage with expiration check
 */
export const loadFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cachedString = await AsyncStorage.getItem(key);
    if (!cachedString) {
      return null;
    }

    const cachedData: CachedData<T> = JSON.parse(cachedString);
    
    // Check if data has expired
    if (cachedData.metadata.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(cachedData.metadata.expiresAt);
      
      if (now > expiresAt) {
        // Data has expired, remove it
        await AsyncStorage.removeItem(key);
        return null;
      }
    }

    return cachedData.data;
  } catch (error) {
    logger.error('Error loading from cache', error, { 
      function: 'loadFromCache',
      key, 
    });
    return null;
  }
};

/**
 * Remove specific item from cache
 */
export const removeFromCache = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    logger.error('Error removing from cache', error, { 
      function: 'removeFromCache',
      key, 
    });
  }
};

/**
 * Clear all app cache
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    logger.error('Error clearing all cache', error, { 
      function: 'clearAllCache', 
    });
  }
};

/**
 * Get cache size and metadata
 */
export const getCacheInfo = async (): Promise<{
  totalKeys: number;
  keys: string[];
  estimatedSize: number;
}> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter(key => key.startsWith('@moongaze_'));
    
    // Estimate size by getting all values
    let estimatedSize = 0;
    for (const key of appKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        estimatedSize += value.length;
      }
    }

    return {
      totalKeys: appKeys.length,
      keys: appKeys,
      estimatedSize,
    };
  } catch (error) {
    logger.error('Error getting cache info', error, { 
      function: 'getCacheInfo', 
    });
    return { totalKeys: 0, keys: [], estimatedSize: 0 };
  }
};

// ============================================================================
// TASK-SPECIFIC CACHE OPERATIONS
// ============================================================================

/**
 * Cache tasks data
 */
export const cacheTasksData = async (
  tasks: Task[],
  unassignedTasks: Task[],
): Promise<void> => {
  try {
    await Promise.all([
      saveToCache(STORAGE_KEYS.TASKS, tasks, 60), // Cache for 1 hour
      saveToCache(STORAGE_KEYS.UNASSIGNED_TASKS, unassignedTasks, 60),
      saveToCache(STORAGE_KEYS.LAST_SYNC, new Date().toISOString()),
    ]);
  } catch (error) {
    logger.error('Error caching tasks data', error, { 
      function: 'cacheTasksData', 
    });
  }
};

/**
 * Load cached tasks data
 */
export const loadCachedTasksData = async (): Promise<{
  tasks: Task[] | null;
  unassignedTasks: Task[] | null;
  lastSync: Date | null;
}> => {
  try {
    const [tasks, unassignedTasks, lastSyncString] = await Promise.all([
      loadFromCache<Task[]>(STORAGE_KEYS.TASKS),
      loadFromCache<Task[]>(STORAGE_KEYS.UNASSIGNED_TASKS),
      loadFromCache<string>(STORAGE_KEYS.LAST_SYNC),
    ]);

    return {
      tasks,
      unassignedTasks,
      lastSync: lastSyncString ? new Date(lastSyncString) : null,
    };
  } catch (error) {
    logger.error('Error loading cached tasks data', error, { 
      function: 'loadCachedTasksData',
    });
    return { tasks: null, unassignedTasks: null, lastSync: null };
  }
};

/**
 * Cache user data
 */
export const cacheUserData = async (user: User): Promise<void> => {
  try {
    await saveToCache(STORAGE_KEYS.USER_DATA, user, 120); // Cache for 2 hours
  } catch (error) {
    logger.error('Error caching user data', error, { 
      function: 'cacheUserData',
      userId: user.id,
    });
  }
};

/**
 * Load cached user data
 */
export const loadCachedUserData = async (): Promise<User | null> => {
  try {
    return await loadFromCache<User>(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    logger.error('Error loading cached user data', error, { 
      function: 'loadCachedUserData',
    });
    return null;
  }
};

// ============================================================================
// PENDING ACTIONS MANAGEMENT
// ============================================================================

/**
 * Add a pending action to the queue
 */
export const addPendingAction = async (action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> => {
  try {
    const pendingAction: PendingAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: action.maxRetries || 3,
    };

    const existingActions = await loadFromCache<PendingAction[]>(STORAGE_KEYS.PENDING_ACTIONS) || [];
    const updatedActions = [...existingActions, pendingAction];
    
    await saveToCache(STORAGE_KEYS.PENDING_ACTIONS, updatedActions);
    return pendingAction.id;
  } catch (error) {
    logger.error('Error adding pending action', error, { 
      function: 'addPendingAction',
      actionType: action.type,
    });
    throw new Error('Failed to add pending action');
  }
};

/**
 * Remove a pending action from the queue
 */
export const removePendingAction = async (actionId: string): Promise<void> => {
  try {
    const existingActions = await loadFromCache<PendingAction[]>(STORAGE_KEYS.PENDING_ACTIONS) || [];
    const updatedActions = existingActions.filter(action => action.id !== actionId);
    
    await saveToCache(STORAGE_KEYS.PENDING_ACTIONS, updatedActions);
  } catch (error) {
    logger.error('Error removing pending action', error, { 
      function: 'removePendingAction',
      actionId,
    });
  }
};

/**
 * Get all pending actions
 */
export const getPendingActions = async (): Promise<PendingAction[]> => {
  try {
    return await loadFromCache<PendingAction[]>(STORAGE_KEYS.PENDING_ACTIONS) || [];
  } catch (error) {
    logger.error('Error getting pending actions', error, { 
      function: 'getPendingActions',
    });
}   return [];
  };

/**
 * Update retry count for a pending action
 */
export const updatePendingActionRetryCount = async (actionId: string): Promise<void> => {
  try {
    const existingActions = await loadFromCache<PendingAction[]>(STORAGE_KEYS.PENDING_ACTIONS) || [];
    const updatedActions = existingActions.map(action => 
      action.id === actionId 
        ? { ...action, retryCount: action.retryCount + 1 }
        : action,
    );
    
    await saveToCache(STORAGE_KEYS.PENDING_ACTIONS, updatedActions);
  } catch (error) {
    logger.error('Error updating pending action retry count', error, { 
      function: 'updatePendingActionRetryCount',
      actionId, 
    });
  }
};

/**
 * Clear all pending actions (use with caution)
 */
export const clearPendingActions = async (): Promise<void> => {
  try {
    await removeFromCache(STORAGE_KEYS.PENDING_ACTIONS);
  } catch (error) {
    logger.error('Error clearing pending actions', error, { 
      function: 'clearPendingActions', 
    });
  }
};

// ============================================================================
// NETWORK STATUS MANAGEMENT
// ============================================================================

/**
 * Get current network status
 */
export const getNetworkStatus = async (): Promise<NetworkStatus> => {
  try {
    const netInfoState = await NetInfo.fetch();
    
    const networkStatus: NetworkStatus = {
      isConnected: netInfoState.isConnected ?? false,
      type: netInfoState.type,
      isInternetReachable: netInfoState.isInternetReachable,
    };

    // Cache the network status
    await saveToCache(STORAGE_KEYS.NETWORK_STATUS, networkStatus, 5); // Cache for 5 minutes
    
    return networkStatus;
  } catch (error) {
    logger.error('Error getting network status', error, { 
      function: 'getNetworkStatus',
    });
    
    // Return cached status if available, otherwise assume offline
    const cachedStatus = await loadFromCache<NetworkStatus>(STORAGE_KEYS.NETWORK_STATUS);
    return cachedStatus || {
      isConnected: false,
      type: null,
      isInternetReachable: false,
    };
  }
};

/**
 * Subscribe to network status changes
 */
export const subscribeToNetworkStatus = (
  callback: (status: NetworkStatus) => void,
): (() => void) => {
  const unsubscribe = NetInfo.addEventListener(state => {
    const networkStatus: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    };
    
    // Cache the updated status
    saveToCache(STORAGE_KEYS.NETWORK_STATUS, networkStatus, 5);
    
    callback(networkStatus);
  });

  return unsubscribe;
};

/**
 * Check if device is online
 */
export const isOnline = async (): Promise<boolean> => {
  try {
    const status = await getNetworkStatus();
    return status.isConnected && (status.isInternetReachable !== false);
  } catch (error) {
    logger.error('Error checking online status', error, { 
      function: 'isOnline',
    });
    return false;
  }
};

/**
 * Wait for network connection
 */
export const waitForConnection = (timeoutMs: number = 30000): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      resolve(false);
    }, timeoutMs);
    
    const checkConnection = async () => {
      const online = await isOnline();
      if (online) {
        clearTimeout(timeoutId);
        resolve(true);
        
      }
    };

    // Timeout is already set up above

    // Check immediately
    checkConnection();

    // Set up listener for network changes
    const unsubscribe = subscribeToNetworkStatus(async (status) => {
      if (status.isConnected && status.isInternetReachable !== false) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(true);
      }
    });
  });
};

// ============================================================================
// CACHE MAINTENANCE
// ============================================================================

/**
 * Clean up expired cache entries
 */
export const cleanupExpiredCache = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter(key => key.startsWith('@moongaze_'));
    
    for (const key of appKeys) {
      try {
        const cachedString = await AsyncStorage.getItem(key);
        if (cachedString) {
          const cachedData: CachedData<unknown> = JSON.parse(cachedString);
          
          if (cachedData.metadata?.expiresAt) {
            const now = new Date();
            const expiresAt = new Date(cachedData.metadata.expiresAt);
            
            if (now > expiresAt) {
              await AsyncStorage.removeItem(key);
            }
          }
        }
      } catch (error) {
        // If we can't parse the data, remove it
        await AsyncStorage.removeItem(key);
      }
    }
  } catch (error) {
    logger.error('Error cleaning up expired cache', error, { 
      function: 'cleanupExpiredCache',
    });
  }
};

/**
 * Optimize cache by removing old entries when storage is full
 */
export const optimizeCache = async (maxSizeBytes: number = 5 * 1024 * 1024): Promise<void> => {
  try {
    const cacheInfo = await getCacheInfo();
    
    if (cacheInfo.estimatedSize > maxSizeBytes) {
      // Remove oldest entries first
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(key => key.startsWith('@moongaze_'));
      
      const keyMetadata: Array<{ key: string; lastUpdated: Date }> = [];
      
      for (const key of appKeys) {
        try {
          const cachedString = await AsyncStorage.getItem(key);
          if (cachedString) {
            const cachedData: CachedData<unknown> = JSON.parse(cachedString);
            keyMetadata.push({
              key,
              lastUpdated: new Date(cachedData.metadata.lastUpdated),
            });
          }
        } catch (error) {
          // Remove corrupted entries
          await AsyncStorage.removeItem(key);
        }
      }
      
      // Sort by oldest first
      keyMetadata.sort((a, b) => a.lastUpdated.getTime() - b.lastUpdated.getTime());
      
      // Remove oldest entries until we're under the size limit
      let currentSize = cacheInfo.estimatedSize;
      for (const { key } of keyMetadata) {
        if (currentSize <= maxSizeBytes * 0.8) break; // Leave some buffer
        
        const value = await AsyncStorage.getItem(key);
        if (value) {
          currentSize -= value.length;
          await AsyncStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    logger.error('Error optimizing cache', error, { 
      function: 'optimizeCache',
    });
  }
};