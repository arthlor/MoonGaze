/**
 * Clean Shadow System
 * Simplified shadow utilities with 4 levels maximum and subtle values
 */

import { ViewStyle } from 'react-native';
import { shadows } from './theme';

// Shadow level type - 4 levels maximum
export type ShadowLevel = 'none' | 'subtle' | 'medium' | 'high';

/**
 * Get shadow styles safely - returns a new object to prevent React Native prop issues
 * Uses the simplified shadow system from theme with subtle, low-opacity values
 * Marked as worklet for Reanimated compatibility
 */
export const getShadow = (level: ShadowLevel): ViewStyle => {
  'worklet';
  
  const shadow = shadows[level];
  
  // Return a new object to prevent prop issues
  return {
    shadowColor: shadow.shadowColor || 'transparent',
    shadowOffset: shadow.shadowOffset || { width: 0, height: 0 },
    shadowOpacity: shadow.shadowOpacity || 0,
    shadowRadius: shadow.shadowRadius || 0,
    elevation: shadow.elevation || 0,
  };
};