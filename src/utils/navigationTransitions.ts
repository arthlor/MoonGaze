/**
 * Navigation Transition Utilities
 * Provides consistent and smooth navigation transitions throughout the app
 */

import { CardStyleInterpolators, StackNavigationOptions, TransitionSpecs } from '@react-navigation/stack';

import type { ThemeType } from '../types/theme';
// DURATIONS and EASING imports removed as they're not used

/**
 * Standard transition configurations for consistent navigation
 */
export const TRANSITION_CONFIGS = {
  // Standard slide transition (iOS-like)
  slide: {
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    transitionSpec: {
      open: TransitionSpecs.TransitionIOSSpec,
      close: TransitionSpecs.TransitionIOSSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  },

  // Fade transition for modals
  fade: {
    gestureEnabled: false,
    transitionSpec: {
      open: TransitionSpecs.FadeInFromBottomAndroidSpec,
      close: TransitionSpecs.FadeOutToBottomAndroidSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
  },

  // Scale transition for modals
  modal: {
    gestureEnabled: true,
    gestureDirection: 'vertical',
    transitionSpec: {
      open: TransitionSpecs.TransitionIOSSpec,
      close: TransitionSpecs.TransitionIOSSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
  },

  // No animation for instant transitions
  none: {
    gestureEnabled: false,
    transitionSpec: {
      open: { animation: 'timing', config: { duration: 0 } },
      close: { animation: 'timing', config: { duration: 0 } },
    },
    cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
  },
} as const;

/**
 * Gets navigation options for different screen types
 */
export const getNavigationOptions = (
  type: 'screen' | 'modal' | 'fade' | 'none' = 'screen',
): StackNavigationOptions => {
  switch (type) {
    case 'modal':
      return {
        presentation: 'modal',
        ...TRANSITION_CONFIGS.modal,
      };
    case 'fade':
      return {
        presentation: 'transparentModal',
        ...TRANSITION_CONFIGS.fade,
      };
    case 'none':
      return TRANSITION_CONFIGS.none;
    default:
      return TRANSITION_CONFIGS.slide;
  }
};

/**
 * Enhanced navigation options for specific screen types
 */
export const SCREEN_TRANSITIONS = {
  // Auth screens - slide transition
  auth: getNavigationOptions('screen'),
  
  // Main app screens - slide transition
  main: getNavigationOptions('screen'),
  
  // Modal screens - modal transition
  taskForm: getNavigationOptions('modal'),
  celebration: getNavigationOptions('fade'),
  confirmation: getNavigationOptions('fade'),
  
  // Onboarding - slide transition
  onboarding: getNavigationOptions('screen'),
  
  // Partner linking - slide transition
  linking: getNavigationOptions('screen'),
  
  // Settings and other overlays - modal transition
  settings: getNavigationOptions('modal'),
} as const;

/**
 * Utility to create consistent header styles
 */
export const createHeaderStyle = (theme: ThemeType) => ({
  headerStyle: {
    backgroundColor: theme.colors.surface,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  headerTitleStyle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.onSurface,
  },
  headerTintColor: theme.colors.primary,
  headerBackTitleVisible: false,
});

/**
 * Utility to create consistent tab bar styles
 */
export const createTabBarStyle = (theme: ThemeType) => ({
  tabBarStyle: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    elevation: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarActiveTintColor: theme.colors.primary,
  tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
  tabBarLabelStyle: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
  },
});

/**
 * Performance-optimized navigation configuration
 */
export const NAVIGATION_CONFIG = {
  // Reduce motion for accessibility
  animation: 'default' as const,
  
  // Optimize for performance
  freezeOnBlur: true,
  lazy: true,
} as const;