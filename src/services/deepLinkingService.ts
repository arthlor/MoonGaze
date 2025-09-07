import * as Linking from 'expo-linking';
import { Alert, Share } from 'react-native';
import { logError } from '../utils/errorHandling';

export interface DeepLinkData {
  type: 'partner-invite' | 'task-share';
  code?: string;
  taskId?: string;
  partnershipId?: string;
}

class DeepLinkingService {
  private listeners: Array<(data: DeepLinkData) => void> = [];

  /**
   * Initialize deep linking service
   */
  initialize() {
    // Handle app opened from deep link when app was closed
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink(url);
      }
    });

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      this.handleDeepLink(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }

  /**
   * Parse and handle deep link URL
   */
  private handleDeepLink(url: string) {
    try {
      const parsed = Linking.parse(url);
      const { hostname, path, queryParams } = parsed;

      // Handle different deep link types
      if (hostname === 'invite' || path === '/invite') {
        const code = queryParams?.code as string;
        if (code) {
          this.notifyListeners({
            type: 'partner-invite',
            code,
          });
        }
      } else if (hostname === 'task' || path?.startsWith('/task/')) {
        const taskId = queryParams?.id as string || path?.split('/')[2];
        const partnershipId = queryParams?.partnership as string;
        if (taskId) {
          this.notifyListeners({
            type: 'task-share',
            taskId,
            partnershipId,
          });
        }
      }
    } catch (error) {
      logError(error as Error, 'DeepLinkingService.handleDeepLink');
    }
  }

  /**
   * Generate partner invitation link
   */
  generatePartnerInviteLink(code: string): string {
    return Linking.createURL('/invite', {
      queryParams: { code },
    });
  }

  /**
   * Generate task sharing link
   */
  generateTaskShareLink(taskId: string, partnershipId: string): string {
    return Linking.createURL('/task', {
      queryParams: { 
        id: taskId,
        partnership: partnershipId,
      },
    });
  }

  /**
   * Share partner invitation
   */
  async sharePartnerInvite(code: string, partnerName?: string): Promise<boolean> {
    try {
      const link = this.generatePartnerInviteLink(code);
      const message = partnerName 
        ? `${partnerName} invited you to join MoonGaze! Use code ${code} or tap this link: ${link}`
        : `Join me on MoonGaze to manage our shared tasks! Use code ${code} or tap this link: ${link}`;

      const result = await Share.share({
        message,
        url: link,
        title: 'Join me on MoonGaze!',
      });

      return result.action === Share.sharedAction;
    } catch (error) {
      logError(error as Error, 'DeepLinkingService.sharePartnerInvite');
      Alert.alert('Error', 'Failed to share invitation. Please try again.');
      return false;
    }
  }

  /**
   * Share task with partner
   */
  async shareTask(taskId: string, taskTitle: string, partnershipId: string): Promise<boolean> {
    try {
      const link = this.generateTaskShareLink(taskId, partnershipId);
      const message = `Check out this task on MoonGaze: "${taskTitle}" ${link}`;

      const result = await Share.share({
        message,
        url: link,
        title: `Task: ${taskTitle}`,
      });

      return result.action === Share.sharedAction;
    } catch (error) {
      logError(error as Error, 'DeepLinkingService.shareTask');
      Alert.alert('Error', 'Failed to share task. Please try again.');
      return false;
    }
  }

  /**
   * Add listener for deep link events
   */
  addListener(callback: (data: DeepLinkData) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of deep link data
   */
  private notifyListeners(data: DeepLinkData) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        logError(error as Error, 'DeepLinkingService.notifyListeners');
      }
    });
  }

  /**
   * Check if URL can be opened
   */
  async canOpenURL(url: string): Promise<boolean> {
    try {
      return await Linking.canOpenURL(url);
    } catch (error) {
      logError(error as Error, 'DeepLinkingService.canOpenURL');
      return false;
    }
  }

  /**
   * Open external URL
   */
  async openURL(url: string): Promise<boolean> {
    try {
      const canOpen = await this.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      logError(error as Error, 'DeepLinkingService.openURL');
      return false;
    }
  }
}

export const deepLinkingService = new DeepLinkingService();