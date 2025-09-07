import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingCarousel } from '../screens/onboarding';
import { useAuth } from '../contexts/AuthContext';

export type OnboardingStackParamList = {
  OnboardingCarousel: undefined;
};

const Stack = createStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator: React.FC = () => {
  const { user, updateUserOnboardingStatus } = useAuth();

  const handleOnboardingComplete = async () => {
    if (user) {
      await updateUserOnboardingStatus(user.id, true);
    }
  };

  const handleOnboardingSkip = async () => {
    if (user) {
      await updateUserOnboardingStatus(user.id, true);
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingCarousel">
        {() => (
          <OnboardingCarousel
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;