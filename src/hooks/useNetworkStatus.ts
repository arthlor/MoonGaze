import { useCallback, useEffect, useState } from 'react';
import { 
  NetworkStatus, 
  getNetworkStatus, 
  isOnline, 
  subscribeToNetworkStatus,
  waitForConnection, 
} from '../services/offlineService';
import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface UseNetworkStatusReturn {
  networkStatus: NetworkStatus;
  isConnected: boolean;
  isOnline: boolean;
  connectionType: string | null;
  isLoading: boolean;
  error: string | null;
  refreshNetworkStatus: () => Promise<void>;
  waitForConnection: (timeoutMs?: number) => Promise<boolean>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing network status and connectivity
 */
export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    type: null,
    isInternetReachable: null,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived states
  const isConnected = networkStatus.isConnected;
  const isOnlineStatus = isConnected && networkStatus.isInternetReachable !== false;
  const connectionType = networkStatus.type;

  /**
   * Refresh network status manually
   */
  const refreshNetworkStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const status = await getNetworkStatus();
      setNetworkStatus(status);
    } catch (err) {
      logger.error('Error refreshing network status', err, { 
        function: 'refreshNetworkStatus', 
      });
      setError('Failed to get network status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Wait for network connection with timeout
   */
  const waitForConnectionWrapper = useCallback(async (timeoutMs: number = 30000): Promise<boolean> => {
    try {
      setError(null);
      return await waitForConnection(timeoutMs);
    } catch (err) {
      logger.error('Error waiting for connection', err, { 
        function: 'waitForConnectionWrapper', 
      });
      setError('Failed to establish connection');
      return false;
    }
  }, []);

  // Initialize network status and set up listener
  useEffect(() => {
    let mounted = true;

    // Initial network status check
    const initializeNetworkStatus = async () => {
      try {
        const status = await getNetworkStatus();
        if (mounted) {
          setNetworkStatus(status);
          setIsLoading(false);
        }
      } catch (err) {
        logger.error('Error initializing network status', err, { 
          function: 'initializeNetworkStatus', 
        });
        if (mounted) {
          setError('Failed to initialize network status');
          setIsLoading(false);
        }
      }
    };

    initializeNetworkStatus();

    // Set up network status listener
    const unsubscribe = subscribeToNetworkStatus((status) => {
      if (mounted) {
        setNetworkStatus(status);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return {
    networkStatus,
    isConnected,
    isOnline: isOnlineStatus,
    connectionType,
    isLoading,
    error,
    refreshNetworkStatus,
    waitForConnection: waitForConnectionWrapper,
  };
};

// ============================================================================
// ADDITIONAL HOOKS
// ============================================================================

/**
 * Simple hook that just returns online/offline status
 */
export const useIsOnline = (): boolean => {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Initial check
    const checkOnlineStatus = async () => {
      try {
        const status = await isOnline();
        if (mounted) {
          setOnline(status);
        }
      } catch (error) {
        logger.error('Error checking online status', error, { 
          function: 'checkOnlineStatus', 
        });
        if (mounted) {
          setOnline(false);
        }
      }
    };

    checkOnlineStatus();

    // Set up listener
    const unsubscribe = subscribeToNetworkStatus((status) => {
      if (mounted) {
        const isOnlineStatus = status.isConnected && status.isInternetReachable !== false;
        setOnline(isOnlineStatus);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return online;
};

/**
 * Hook for detecting network status changes
 */
export const useNetworkStatusChange = (
  onOnline?: () => void,
  onOffline?: () => void,
): void => {
  const [previousStatus, setPreviousStatus] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToNetworkStatus((status) => {
      const currentOnlineStatus = status.isConnected && status.isInternetReachable !== false;
      
      if (previousStatus !== null) {
        // Status changed
        if (previousStatus === false && currentOnlineStatus === true) {
          // Went from offline to online
          onOnline?.();
        } else if (previousStatus === true && currentOnlineStatus === false) {
          // Went from online to offline
          onOffline?.();
        }
      }
      
      setPreviousStatus(currentOnlineStatus);
    });

    return unsubscribe;
  }, [previousStatus, onOnline, onOffline]);
};

/**
 * Hook for retrying operations when network comes back online
 */
export const useRetryOnReconnect = (
  retryFunction: () => Promise<void> | void,
  _dependencies: React.DependencyList = [],
): void => {
  useNetworkStatusChange(
    async () => {
      try {
        await retryFunction();
      } catch (error) {
        logger.error('Error in retry function', error, { 
          function: 'useRetryOnReconnect', 
        });
      }
    },
    undefined,
  );
};