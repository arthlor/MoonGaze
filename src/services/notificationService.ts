import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { auth, db } from './firebase';
import { Timestamp, Unsubscribe, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { getPartnership, getUser, tasksCollection } from './firestoreService';
import { Task, documentToTask } from '../types';
import { theme } from '../utils/theme';
import { logger } from '../utils/logger';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData extends Record<string, unknown> {
  type: 'task_completed' | 'task_assigned' | 'partner_linked' | 'test';
  taskId?: string;
  taskTitle?: string;
  partnerName?: string;
  message?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private taskListeners: Map<string, Unsubscribe> = new Map();
  private previousTaskStates: Map<string, { status: string; assignedTo?: string }> = new Map();

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    try {
      // Request permissions and get push token
      await this.requestPermissions();
      await this.registerForPushNotifications();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      // Save token to user document if user is authenticated
      if (auth.currentUser && this.expoPushToken) {
        await this.saveTokenToUser(this.expoPushToken);
      }
    } catch (error) {
      logger.error('Failed to initialize notification service', error);
    }
  }

  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      logger.warn('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('Failed to get push token for push notification!');
      return false;
    }

    return true;
  }

  /**
   * Register for push notifications and get Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;
      
      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: theme.colors.notificationLight,
        });
      }

      return this.expoPushToken;
    } catch (error) {
      logger.error('Failed to register for push notifications', error);
      return null;
    }
  }

  /**
   * Set up notification event listeners
   */
  private setupNotificationListeners(): void {
    // Listener for notifications received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        logger.info('Notification received', { notification });
        this.handleNotificationReceived(notification);
      },
    );

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        logger.info('Notification response', { response });
        this.handleNotificationResponse(response);
      },
    );
  }

  /**
   * Handle notification received while app is in foreground
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const data = notification.request.content.data as unknown as NotificationData;
    
    // You can add custom logic here for different notification types
    if (data?.type) {
      switch (data.type) {
        case 'task_completed':
          // Could show in-app celebration or update UI
          logger.info('Task completed notification received', { taskTitle: data.taskTitle });
          break;
        case 'task_assigned':
          // Could highlight new task or show badge
          logger.info('Task assigned notification received', { taskTitle: data.taskTitle });
          break;
        case 'partner_linked':
          // Could show welcome message
          logger.info('Partner linked notification received');
          break;
        case 'test':
          // Test notification received
          logger.info('Test notification received', { message: data.message });
          break;
      }
    }
  }

  /**
   * Handle notification tap/response
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as unknown as NotificationData;
    
    // Navigate to appropriate screen based on notification type
    if (data?.type) {
      switch (data.type) {
        case 'task_completed':
        case 'task_assigned':
          // Navigate to task dashboard or specific task
          // This would typically use navigation service
          logger.info('Navigating to task', { taskId: data.taskId });
          break;
        case 'partner_linked':
          // Navigate to dashboard
          logger.info('Navigating to dashboard after partner link');
          break;
        case 'test':
          // Test notification tapped
          logger.info('Test notification tapped');
          break;
      }
    }
  }

  /**
   * Save push token to user document in Firestore
   */
  async saveTokenToUser(token: string): Promise<void> {
    try {
      if (!token?.trim()) {
        throw new Error('Valid push token is required');
      }

      if (!auth.currentUser?.uid) {
        throw new Error('No authenticated user');
      }

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        expoPushToken: token,
        lastTokenUpdate: Timestamp.fromDate(new Date()),
      });

      logger.info('Push token saved to user document');
    } catch (error) {
      logger.error('Failed to save push token', error);
    }
  }

  /**
   * Send a local notification (for testing or immediate feedback)
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data as Record<string, unknown> || {},
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      logger.error('Failed to send local notification', error);
    }
  }

  /**
   * Get the current Expo push token
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Setup task change listeners for push notifications
   * This replaces the cloud function triggers for task completion and assignment
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
   */
  async setupTaskListeners(partnershipId: string, userId: string): Promise<void> {
    try {
      if (!partnershipId?.trim()) {
        throw new Error('Partnership ID is required');
      }

      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      // Clean up existing listeners first
      this.cleanupTaskListeners();
      
      // Clear previous task states for new partnership
      this.previousTaskStates.clear();

      // Listen to all tasks in the partnership
      const taskQuery = query(
        tasksCollection,
        where('partnershipId', '==', partnershipId),
        orderBy('updatedAt', 'desc'),
      );

      const unsubscribe = onSnapshot(
        taskQuery,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const taskData = { ...change.doc.data(), id: change.doc.id };
            const task = documentToTask(taskData);
            
            if (change.type === 'modified') {
              // Handle task changes for notifications (Requirements 4.1, 4.2, 4.3)
              this.handleTaskChange(task, userId);
            } else if (change.type === 'added') {
              // Store initial state for new tasks
              this.previousTaskStates.set(task.id, {
                status: task.status,
                assignedTo: task.assignedTo,
              });
            }
          });
        },
        (error) => {
          logger.error('Error in task listener', error);
        },
      );

      this.taskListeners.set(partnershipId, unsubscribe);
      logger.info('Task listeners setup for partnership', { partnershipId });
    } catch (error) {
      logger.error('Failed to setup task listeners', error);
    }
  }

  /**
   * Handle task changes and send appropriate notifications
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
   */
  private async handleTaskChange(task: Task, currentUserId: string): Promise<void> {
    try {
      if (!task?.id) {
        logger.error('Invalid task provided to handleTaskChange');
        return;
      }

      if (!currentUserId?.trim()) {
        logger.error('Invalid user ID provided to handleTaskChange');
        return;
      }

      // Get previous state of this task
      const previousState = this.previousTaskStates.get(task.id);
      
      // Update the stored state
      this.previousTaskStates.set(task.id, {
        status: task.status,
        assignedTo: task.assignedTo,
      });

      // If no previous state, this is likely the initial load - don't send notifications
      if (!previousState) {
        return;
      }

      // Get partner information
      if (!task.partnershipId) {
        logger.error('Task has no partnership ID');
        return;
      }

      const partnership = await getPartnership(task.partnershipId);
      if (!partnership) return;

      const partnerId = partnership.user1Id === currentUserId ? partnership.user2Id : partnership.user1Id;
      if (!partnerId) {
        logger.error('Could not determine partner ID');
        return;
      }

      const partner = await getUser(partnerId);
      if (!partner || !partner.expoPushToken) return;

      // Requirement 4.2: Detect task completion and notify partner who didn't complete it
      if (task.status === 'done' && previousState.status !== 'done') {
        // Task was just completed - notify the partner (not the person who completed it)
        // The person who completed it is the current assignedTo, so notify the other person
        if (task.assignedTo !== currentUserId) {
          // Partner completed the task, notify current user
          if (this.expoPushToken) {
            await this.sendTaskCompletionNotification(task, partner.displayName || 'Your partner', this.expoPushToken);
          }
        }
        // If current user completed it, don't notify them (they know they completed it)
      }

      // Requirement 4.3: Detect task assignment and notify the assigned user
      if (task.assignedTo && task.assignedTo !== previousState.assignedTo) {
        // Task was just assigned to someone
        if (task.assignedTo === currentUserId) {
          // Current user was assigned the task, notify them
          if (this.expoPushToken) {
            await this.sendTaskAssignmentNotification(task, partner.displayName || 'Your partner', this.expoPushToken);
          }
        }
        // If partner was assigned, they will get notified by their own listener
      }
    } catch (error) {
      logger.error('Error handling task change', error);
    }
  }

  /**
   * Send push notification for task completion
   * Requirement 4.4: Use Expo push notification service directly from client
   * Requirement 4.5: Handle errors gracefully and log them for debugging
   */
  async sendTaskCompletionNotification(task: Task, partnerName: string, pushToken: string): Promise<void> {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title: '🎉 Task Completed!',
        body: `${partnerName} completed "${task.title}"`,
        data: {
          type: 'task_completed' as const,
          taskId: task.id,
          taskTitle: task.title,
          partnerName,
        },
      };

      const pushUrl = process.env.EXPO_PUBLIC_PUSH_NOTIFICATION_URL || 'https://exp.host/--/api/v2/push/send';
      const response = await fetch(pushUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data?.status === 'error') {
        await this.handleNotificationError(new Error(result.data.message), pushToken);
      } else {
        logger.info('Task completion notification sent successfully');
      }
    } catch (error) {
      logger.error('Failed to send task completion notification', error);
      await this.handleNotificationError(error as Error, pushToken);
    }
  }

  /**
   * Send push notification for task assignment
   * Requirement 4.4: Use Expo push notification service directly from client
   * Requirement 4.5: Handle errors gracefully and log them for debugging
   */
  async sendTaskAssignmentNotification(task: Task, partnerName: string, pushToken: string): Promise<void> {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title: '📋 New Task Assigned',
        body: `${partnerName} assigned you "${task.title}"`,
        data: {
          type: 'task_assigned' as const,
          taskId: task.id,
          taskTitle: task.title,
          partnerName,
        },
      };

      const pushUrl = process.env.EXPO_PUBLIC_PUSH_NOTIFICATION_URL || 'https://exp.host/--/api/v2/push/send';
      const response = await fetch(pushUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data?.status === 'error') {
        await this.handleNotificationError(new Error(result.data.message), pushToken);
      } else {
        logger.info('Task assignment notification sent successfully');
      }
    } catch (error) {
      logger.error('Failed to send task assignment notification', error);
      await this.handleNotificationError(error as Error, pushToken);
    }
  }

  /**
   * Send a test notification directly from client
   */
  async sendTestNotification(): Promise<void> {
    try {
      if (!this.expoPushToken) {
        throw new Error('No push token available. Please register for notifications first.');
      }

      // Validate push token format
      if (!this.expoPushToken.startsWith('ExponentPushToken[') || !this.expoPushToken.endsWith(']')) {
        throw new Error('Invalid push token format');
      }

      const message = {
        to: this.expoPushToken,
        sound: 'default',
        title: '🧪 Test Notification',
        body: 'This is a test notification from MoonGaze!',
        data: {
          type: 'test' as const,
          message: 'Test notification sent successfully',
        },
      };

      const pushUrl = process.env.EXPO_PUBLIC_PUSH_NOTIFICATION_URL || 'https://exp.host/--/api/v2/push/send';
      const response = await fetch(pushUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data?.status === 'error') {
        throw new Error(result.data.message || 'Failed to send test notification');
      }

      logger.info('Test notification sent successfully');
      
      // Also send a local notification for immediate feedback
      await this.sendLocalNotification(
        '✅ Test Successful',
        'Push notification system is working correctly!',
      );
    } catch (error) {
      logger.error('Failed to send test notification', error);
      
      // Send local notification with error
      await this.sendLocalNotification(
        '❌ Test Failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      
      throw error;
    }
  }

  /**
   * Handle notification errors (invalid tokens, etc.)
   * Requirement 4.5: Handle errors gracefully and log them for debugging
   * Requirement 4.6: Handle invalid push tokens without crashing
   */
  async handleNotificationError(error: Error, pushToken: string): Promise<void> {
    logger.error('Notification error', error);
    
    // Check if it's an invalid token error (Requirement 4.6)
    if (error.message.includes('DeviceNotRegistered') || 
        error.message.includes('InvalidCredentials') ||
        error.message.includes('MessageTooBig') ||
        error.message.includes('InvalidToken')) {
      
      // Remove invalid token from user document
      try {
        if (auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
            expoPushToken: null,
            lastTokenUpdate: Timestamp.fromDate(new Date()),
          });
          
          
          
          // Clear local token if it matches the invalid one
          if (this.expoPushToken === pushToken) {
            this.expoPushToken = null;
          }
        }
      } catch (updateError) {
        // Silently handle update errors to prevent notification failures
      }
    }
  }

  /**
   * Clean up task listeners
   */
  private cleanupTaskListeners(): void {
    this.taskListeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.taskListeners.clear();
    this.previousTaskStates.clear();
  }

  /**
   * Clean up all notification listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    this.cleanupTaskListeners();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;