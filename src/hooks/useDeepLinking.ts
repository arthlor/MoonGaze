import { useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { DeepLinkData, deepLinkingService } from '../services/deepLinkingService';
import { useAuth } from '../contexts/AuthContext';
import { logError } from '../utils/errorHandling';
import { logger } from '../utils/logger';

export const useDeepLinking = () => {
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();

  const handleDeepLink = useCallback((data: DeepLinkData) => {
    try {
      // Only handle deep links if user is authenticated
      if (!isAuthenticated || !user) {
        return;
      }

      switch (data.type) {
        case 'partner-invite':
          if (data.code && !user.partnerId && !user.partnershipId) {
            // Navigate to code input screen with pre-filled code
            (navigation as { navigate: (screen: string, params?: unknown) => void }).navigate('PartnerLinking', {
              screen: 'CodeInput',
              params: { prefillCode: data.code },
            });
          }
          break;

        case 'task-share':
          if (data.taskId && data.partnershipId === user.partnershipId) {
            // Navigate to task dashboard and highlight the specific task
            (navigation as { navigate: (screen: string, params?: unknown) => void }).navigate('Main', {
              screen: 'TaskDashboard',
              params: { highlightTaskId: data.taskId },
            });
          }
          break;

        default:
          logger.warn('Unknown deep link type', { 
            function: 'handleDeepLink',
            deepLinkType: data.type, 
          });
      }
    } catch (error) {
      logError(error as Error, 'useDeepLinking.handleDeepLink');
    }
  }, [navigation, isAuthenticated, user]);

  useEffect(() => {
    // Initialize deep linking service
    const cleanup = deepLinkingService.initialize();

    // Add listener for deep link events
    const unsubscribe = deepLinkingService.addListener(handleDeepLink);

    return () => {
      cleanup?.();
      unsubscribe();
    };
  }, [handleDeepLink]);

  const sharePartnerInvite = useCallback(async (code: string) => {
    return await deepLinkingService.sharePartnerInvite(code, user?.displayName);
  }, [user?.displayName]);

  const shareTask = useCallback(async (taskId: string, taskTitle: string) => {
    if (!user?.partnershipId) {
      return false;
    }
    return await deepLinkingService.shareTask(taskId, taskTitle, user.partnershipId);
  }, [user?.partnershipId]);

  return {
    sharePartnerInvite,
    shareTask,
  };
};