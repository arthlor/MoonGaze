import React, { useState } from 'react';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { TaskProvider } from '../contexts/TaskContext';
import { ErrorBoundary, SplashScreen } from '../components';
import { useDeepLinking } from '../hooks/useDeepLinking';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import PartnerLinkingNavigator from './PartnerLinkingNavigator';
import { logError } from '../utils/errorHandling';
import { analyticsService } from '../services/analyticsService';
import { getNavigationOptions } from '../utils/navigationTransitions';

// Wrapper component to initialize deep linking inside NavigationContainer
const DeepLinkingWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useDeepLinking();
  return <>{children}</>;
};

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const hasCompletedOnboarding = user?.hasCompletedOnboarding ?? false;
  const hasPartner = user?.partnerId || user?.partnershipId;

  const handleError = (error: Error) => {
    logError(error, 'RootNavigator');
    // Here you could also send error reports to a crash reporting service
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show enhanced splash screen during initial app load
  if (showSplash || isLoading) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  const handleNavigationStateChange = (state: NavigationState | undefined) => {
    // Track screen navigation
    if (state) {
      const route = state.routes[state.index];
      if (route?.name) {
        analyticsService.trackScreenView(route.name);
      }
    }
  };

  return (
    <ErrorBoundary onError={handleError}>
      <NavigationContainer onStateChange={handleNavigationStateChange}>
        <DeepLinkingWrapper>
          <Stack.Navigator 
            screenOptions={{ 
              headerShown: false,
              ...getNavigationOptions('screen'),
            }}
          >
            {!isAuthenticated ? (
              <Stack.Screen 
                name="Auth" 
                component={AuthNavigator}
                options={getNavigationOptions('screen')}
              />
            ) : !hasCompletedOnboarding ? (
              <Stack.Screen 
                name="Onboarding" 
                component={OnboardingNavigator}
                options={getNavigationOptions('screen')}
              />
            ) : !hasPartner ? (
              <Stack.Screen
                name="PartnerLinking"
                component={PartnerLinkingNavigator}
                options={getNavigationOptions('screen')}
              />
            ) : (
              <Stack.Screen 
                name="Main"
                options={getNavigationOptions('screen')}
              >
                {() => (
                  <TaskProvider
                    partnershipId={user?.partnershipId}
                    userId={user?.id}
                  >
                    <MainNavigator />
                  </TaskProvider>
                )}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </DeepLinkingWrapper>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default RootNavigator;
