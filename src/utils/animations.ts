/**
 * Simplified Animation System
 * Minimal animation utilities for MoonGaze app
 * All animations use native driver for 60fps performance
 */

import { Easing, withTiming } from 'react-native-reanimated';

// Simplified Animation Durations (150-200ms maximum)
export const DURATIONS = {
  fast: 150,    // Press interactions
  normal: 200,  // Transitions
} as const;

// Single easing function
export const EASING = Easing.out(Easing.quad);

// Simple scale values
export const SCALES = {
  press: 0.97,  // Button press feedback
} as const;

// Essential animation utilities - press, fade, and scale only
export const pressAnimation = (scale: { value: number }) => {
  'worklet';
  scale.value = withTiming(SCALES.press, { 
    duration: DURATIONS.fast, 
    easing: EASING, 
  });
};

export const releaseAnimation = (scale: { value: number }) => {
  'worklet';
  scale.value = withTiming(1, { 
    duration: DURATIONS.fast, 
    easing: EASING, 
  });
};

export const fadeIn = (opacity: { value: number }) => {
  'worklet';
  opacity.value = withTiming(1, { 
    duration: DURATIONS.normal, 
    easing: EASING, 
  });
};

export const fadeOut = (opacity: { value: number }) => {
  'worklet';
  opacity.value = withTiming(0, { 
    duration: DURATIONS.normal, 
    easing: EASING, 
  });
};

export const scaleIn = (scale: { value: number }) => {
  'worklet';
  scale.value = withTiming(1, { 
    duration: DURATIONS.normal, 
    easing: EASING, 
  });
};

export const scaleOut = (scale: { value: number }) => {
  'worklet';
  scale.value = withTiming(0, { 
    duration: DURATIONS.normal, 
    easing: EASING, 
  });
};

