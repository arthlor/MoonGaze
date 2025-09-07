import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NotificationData, notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

export interface UseNotificationsReturn {
  sendTestNotification: () => Promise<void>;
}

/**
 * Custom hook for managing push notifications
 */
export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!user) return;

    // Initialize notifications when user is available
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
      } catch (error) {
        logger.error('Failed to initialize notifications', error, { 
          function: 'useNotifications.initializeNotifications', 
        });
      }
    };

    initializeNotifications();

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        logger.info('App has come to the foreground', { 
          function: 'useNotifications.handleAppStateChange', 
        });
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      notificationService.cleanup();
    };
  }, [user]);

  /**
   * Send a test notification (for debugging purposes)
   */
  const sendTestNotification = async (): Promise<void> => {
    try {
      // Use the new client-side test notification method (Requirement 7.1, 7.2, 7.3, 7.4, 7.5)
      await notificationService.sendTestNotification();
    } catch (error) {
      logger.error('Failed to send test notification', error, { 
        function: 'sendTestNotification', 
      });
    }
  };

  return {
    sendTestNotification,
  };
};

/**
 * Hook for handling notification navigation
 */
export const useNotificationNavigation = () => {
  useEffect(() => {
    // Handle notification received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as unknown as NotificationData;
        logger.info('Notification received in foreground', { 
          function: 'useNotifications.foregroundListener',
          notificationType: data.type,
          taskId: data.taskId, 
        });
        
        // You can add custom UI feedback here
        // For example, show a toast or update a badge
      },
    );

    // Handle notification tap
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as unknown as NotificationData;
        logger.info('Notification tapped', { 
          function: 'useNotifications.responseListener',
          notificationType: data.type,
          taskId: data.taskId, 
        });
        
        // Handle navigation based on notification type
        if (data?.type) {
          handleNotificationNavigation(data);
        }
      },
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);
};

/**
 * Handle navigation based on notification data
 */
const handleNotificationNavigation = (data: NotificationData) => {
  if (!data?.type) return;
  
  switch (data.type) {
    case 'task_completed':
    case 'task_assigned':
      // Navigate to task dashboard
      // This would typically use React Navigation
      logger.info('Navigate to task dashboard', { 
        function: 'handleNotificationNavigation',
        taskId: data.taskId, 
      });
      break;
    case 'partner_linked':
      // Navigate to dashboard
      logger.info('Navigate to dashboard after partner linking', { 
        function: 'handleNotificationNavigation', 
      });
      break;
    default:
      logger.warn('Unknown notification type', { 
        function: 'handleNotificationNavigation',
        notificationType: data.type, 
      });
  }
};