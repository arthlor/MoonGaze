import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PartnerLinkingStackParamList } from '../types';
import { LinkSuccessScreen, LinkingScreen } from '../screens/linking';

const Stack = createStackNavigator<PartnerLinkingStackParamList>();

const PartnerLinkingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="LinkingScreen" 
        component={LinkingScreen} 
      />
      <Stack.Screen 
        name="LinkSuccessScreen" 
        component={LinkSuccessScreen} 
      />
    </Stack.Navigator>
  );
};

export default PartnerLinkingNavigator;