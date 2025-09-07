/**
 * Consistent Status Indicator Patterns
 * Provides standardized status indicators across the app
 */

import { useTheme } from 'react-native-paper';

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'syncing';

export interface StatusIndicatorConfig {
  color: string;
  backgroundColor: string;
  textColor: string;
  icon: string;
  iconSymbol: string;
}

/**
 * Hook to get consistent status indicator configurations
 */
export const useStatusIndicator = () => {
  const theme = useTheme();

  const getStatusConfig = (status: StatusType): StatusIndicatorConfig => {
    switch (status) {
      case 'success':
        return {
          color: theme.colors.tertiary,
          backgroundColor: theme.colors.tertiaryContainer,
          textColor: theme.colors.onTertiaryContainer,
          icon: 'check-circle',
          iconSymbol: '✓',
        };
      case 'error':
        return {
          color: theme.colors.error,
          backgroundColor: theme.colors.errorContainer,
          textColor: theme.colors.onErrorContainer,
          icon: 'alert-circle',
          iconSymbol: '⚠',
        };
      case 'warning':
        return {
          color: theme.colors.secondary,
          backgroundColor: theme.colors.secondaryContainer,
          textColor: theme.colors.onSecondaryContainer,
          icon: 'alert',
          iconSymbol: '⚠',
        };
      case 'info':
        return {
          color: theme.colors.primary,
          backgroundColor: theme.colors.primaryContainer,
          textColor: theme.colors.onPrimaryContainer,
          icon: 'information',
          iconSymbol: 'ℹ',
        };
      case 'syncing':
        return {
          color: theme.colors.primary,
          backgroundColor: theme.colors.primaryContainer,
          textColor: theme.colors.onPrimaryContainer,
          icon: 'sync',
          iconSymbol: '⟳',
        };
      case 'neutral':
      default:
        return {
          color: theme.colors.outline,
          backgroundColor: theme.colors.surfaceVariant,
          textColor: theme.colors.onSurfaceVariant,
          icon: 'circle-outline',
          iconSymbol: '○',
        };
    }
  };

  return { getStatusConfig };
};

/**
 * Standard status indicator sizes
 */
export const STATUS_INDICATOR_SIZES = {
  small: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  medium: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  large: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
} as const;

/**
 * Standard animation timings for status changes
 */
export const STATUS_ANIMATION_TIMINGS = {
  statusChange: 250,
  pulse: 1000,
  bounce: 150,
} as const;

/**
 * Utility function to map common status strings to StatusType
 */
export const mapToStatusType = (status: string): StatusType => {
  switch (status.toLowerCase()) {
    case 'done':
    case 'completed':
    case 'success':
    case 'online':
    case 'connected':
      return 'success';
    
    case 'error':
    case 'failed':
    case 'offline':
    case 'disconnected':
      return 'error';
    
    case 'warning':
    case 'pending':
    case 'partial':
      return 'warning';
    
    case 'info':
    case 'information':
    case 'loading':
      return 'info';
    
    case 'syncing':
    case 'synchronizing':
      return 'syncing';
    
    default:
      return 'neutral';
  }
};

/**
 * Get status message variants for different contexts
 */
export const getStatusMessages = (status: StatusType) => {
  switch (status) {
    case 'success':
      return {
        sync: 'All changes synced',
        network: 'Connected',
        task: 'Task completed',
        general: 'Success',
      };
    case 'error':
      return {
        sync: 'Sync failed',
        network: 'No connection',
        task: 'Task failed',
        general: 'Error occurred',
      };
    case 'warning':
      return {
        sync: 'Sync issues detected',
        network: 'Limited connection',
        task: 'Task needs attention',
        general: 'Warning',
      };
    case 'info':
      return {
        sync: 'Checking for changes',
        network: 'Connecting...',
        task: 'Task in progress',
        general: 'Information',
      };
    case 'syncing':
      return {
        sync: 'Syncing changes...',
        network: 'Synchronizing...',
        task: 'Updating task...',
        general: 'Processing...',
      };
    case 'neutral':
    default:
      return {
        sync: 'Ready to sync',
        network: 'Network status unknown',
        task: 'Task status unknown',
        general: 'Status unknown',
      };
  }
};