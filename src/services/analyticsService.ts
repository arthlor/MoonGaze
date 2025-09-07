import analytics from '@react-native-firebase/analytics';
import { logger } from '../utils/logger';

// interface AnalyticsEvent {
//   name: string;
//   parameters?: Record<string, unknown>;
// }

class AnalyticsService {
  private isEnabled: boolean = true;

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, parameters?: Record<string, unknown>): void {
    if (!this.isEnabled) {
      return;
    }

    try {
      analytics().logEvent(eventName, parameters);
      logger.info('Analytics event tracked', { eventName, parameters });
    } catch (error) {
      logger.warn('Failed to track analytics event', { error });
    }
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName: string): void {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenName,
    });
  }

  /**
   * Track task completion
   */
  trackTaskCompletion(taskId: string, category?: string): void {
    this.trackEvent('task_completed', {
      task_id: taskId,
      task_category: category,
    });
  }

  /**
   * Track task creation
   */
  trackTaskCreation(category?: string): void {
    this.trackEvent('task_created', {
      task_category: category,
    });
  }

  /**
   * Track partnership creation
   */
  trackPartnershipCreation(): void {
    this.trackEvent('partnership_created');
  }

  /**
   * Track partnership joining
   */
  trackPartnershipJoined(): void {
    this.trackEvent('partnership_joined');
  }

  /**
   * Track user login
   */
  trackUserLogin(method: string): void {
    this.trackEvent('login', {
      method,
    });
  }

  /**
   * Track user signup
   */
  trackUserSignup(method: string): void {
    this.trackEvent('sign_up', {
      method,
    });
  }

  /**
   * Set user ID for analytics
   */
  setUserId(userId: string): void {
    if (!this.isEnabled) {
      return;
    }

    try {
      analytics().setUserId(userId);
      logger.info('Analytics user ID set', { userId });
    } catch (error) {
      logger.warn('Failed to set analytics user ID', { error });
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, string | null>): void {
    if (!this.isEnabled) {
      return;
    }

    try {
      analytics().setUserProperties(properties);
      logger.info('Analytics user properties set', { properties });
    } catch (error) {
      logger.warn('Failed to set analytics user properties', { error });
    }
  }

  /**
   * Enable or disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logger.info('Analytics status changed', { enabled });
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;