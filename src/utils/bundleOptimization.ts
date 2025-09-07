/**
 * Bundle optimization utilities for MoonGaze app
 * Helps reduce bundle size and improve loading performance
 */

import { InteractionManager } from 'react-native';

/**
 * Preload heavy components after initial render
 */
export const preloadHeavyComponents = () => {
  InteractionManager.runAfterInteractions(() => {
    // Preload TaskForm
    import('../components/TaskForm').catch(() => {
      // Silently fail if preload fails
    });

    // Preload CelebrationModal
    import('../components/CelebrationModal').catch(() => {
      // Silently fail if preload fails
    });

    // Preload other heavy components as needed
    import('../components/ConfettiAnimation').catch(() => {
      // Silently fail if preload fails
    });
  });
};

/**
 * Memory cleanup utility
 */
export const cleanupMemory = () => {
  // Force garbage collection if available (development only)
  if (__DEV__ && global.gc) {
    global.gc();
  }
};

/**
 * Check if device has sufficient memory for heavy operations
 */
export const hasEnoughMemory = (): boolean => {
  // Simple heuristic - in a real app, you might use a native module
  // to check actual memory usage
  return true;
};

/**
 * Optimize image loading
 */
export const optimizeImageProps = {
  // Optimize image loading for better performance
  resizeMode: 'cover' as const,
  fadeDuration: 200,
  // Add other optimization props as needed
};

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  startTiming: (label: string) => {
    if (__DEV__) {
      // Use performance API instead of console
      performance.mark(`${label}-start`);
    }
  },

  endTiming: (label: string) => {
    if (__DEV__) {
      // Use performance API instead of console
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
    }
  },

  markInteraction: (name: string) => {
    if (__DEV__) {
      // Use performance API instead of console
      performance.mark(`interaction-${name}`);
    }
  },
};
