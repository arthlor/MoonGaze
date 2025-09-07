import { MD3LightTheme as DefaultTheme } from 'react-native-paper';
import type {
  BorderRadius,
  ColorPalette,
  Shadows,
  Spacing,
  TaskCategoryColors,
  ThemeShadow,
  Typography,
} from '../types/theme';

// Clean Color Palette - Essential colors only
export const colors: ColorPalette = {
  // Brand colors
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primaryLight: '#6366F1', // Darker for better contrast with white text
  secondary: '#6366F1', // Darker for better contrast with white text

  // Semantic colors
  error: '#DC2626', // Darker red for better contrast with white text
  success: '#10B981',
  warning: '#F59E0B',

  // Neutral colors
  background: '#FFFFFF',
  border: '#E5E7EB',
  gray100: '#F3F4F6',
  gray400: '#9CA3AF',
  gray50: '#F9FAFB',
  gray600: '#4B5563',
  gray900: '#111827',
  shimmer: 'rgba(255, 255, 255, 0.3)',
  surface: '#F9FAFB',
  textShadowSubtle: 'rgba(0, 0, 0, 0.1)',
  textShadowTransparent: 'rgba(0, 0, 0, 0.05)',
  white: '#FFFFFF',
};

// Clean Typography System
export const typography: Typography = {
  fontFamilies: {
    body: 'System',
    heading: 'System',
    mono: 'Courier',
    monospace: 'Courier',
    primary: 'System',
  },
  fontSizes: {
    '2xl': 32,
    '3xl': 48,
    base: 16,
    lg: 18,
    sm: 14,
    xl: 24,
    xs: 12,
  },
  fontWeights: {
    bold: '700' as const,
    medium: '500' as const,
    normal: '400' as const,
    semibold: '600' as const,
  },
  lineHeights: {
    normal: 1.5,
    relaxed: 1.75,
    tight: 1.25,
  },
  sizes: {
    '2xl': 32,
    '3xl': 48,
    base: 16,
    lg: 18,
    sm: 14,
    xl: 24,
    xs: 12,
  },
  weights: {
    medium: '500',
  },
};

// Clean Spacing System - 8-point grid
export const spacing: Spacing = {
  '2xl': 64,
  '3xl': 96,
  base: 16,
  lg: 24,
  md: 16,
  sm: 8,
  xl: 32,
  xs: 4,
  xxl: 48,
};

// Clean Shadow System
export const shadows: Shadows = {
  high: {
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  lg: {
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  md: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  medium: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  none: {
    elevation: 0,
    shadowColor: '#000000',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  sm: {
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  subtle: {
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  xl: {
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
};

// Clean Border Radius System
export const borderRadius: BorderRadius = {
  full: 999,
  lg: 12,
  md: 8,
  none: 0,
  sm: 4,
  xl: 16,
};

// Color Palette for semantic color variations
export const colorPalette = {
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  surface: {
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

// Main Theme Configuration
export const theme = {
  ...DefaultTheme,
  borderRadius: {
    full: borderRadius.full,
    lg: borderRadius.lg,
    md: borderRadius.md,
    sm: borderRadius.sm,
    xl: borderRadius.xl,
  },
  colorPalette,
  colors: {
    ...DefaultTheme.colors,
    ...colors,
    backdrop: 'rgba(0, 0, 0, 0.5)',
    border: colors.border,
    errorBackground: '#FEF2F2',
    errorText: '#DC2626',
    errorTitle: '#B91C1C',
    loadingBackground: '#F9FAFB',
    loadingText: '#4B5563',
    notificationLight: '#818CF8',
    onPrimaryContainer: colors.primary,
    onSurface: DefaultTheme.colors.onSurface,
    onSurfaceVariant: DefaultTheme.colors.onSurfaceVariant,
    outlineVariant: DefaultTheme.colors.outlineVariant,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    shadow: DefaultTheme.colors.shadow,
    shadowColor: '#000000',
    surface: DefaultTheme.colors.surface,
    transparent: 'transparent',
  },
  shadows: {
    lg: shadows.lg as ThemeShadow,
    md: shadows.md as ThemeShadow,
    sm: shadows.sm as ThemeShadow,
    subtle: shadows.subtle as ThemeShadow,
    xl: shadows.xl as ThemeShadow,
  },
  spacing: {
    '2xl': spacing['2xl'],
    lg: spacing.lg,
    md: spacing.md,
    sm: spacing.sm,
    xl: spacing.xl,
    xs: spacing.xs,
  },
  typography: {
    ...typography,
    fontSizes: typography.fontSizes,
    fontWeights: {
      bold: typography.fontWeights.bold as '700',
      medium: typography.fontWeights.medium as '500',
      semibold: typography.fontWeights.semibold as '600',
    },
    lineHeights: typography.lineHeights,
  },
};

// Task Category Colors
export const taskCategoryColors: TaskCategoryColors = {
  Errands: colors.warning,
  Financial: colors.success,
  Household: colors.error,
  Misc: colors.gray600,
  Planning: colors.primary,
  Wellness: colors.primaryLight,
};

// Simple helper functions
export const getColor = (colorName: keyof ColorPalette): string =>
  colors[colorName];
export const getSpacing = (size: keyof Spacing): number => spacing[size];
export const getFontSize = (size: keyof Typography['fontSizes']): number =>
  typography.fontSizes[size];
export const getFontWeight = (
  weight: keyof Typography['fontWeights'],
): '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'normal' | 'bold' => 
  typography.fontWeights[weight] as '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'normal' | 'bold';
export const getShadow = (level: keyof Shadows) => shadows[level];
export const getBorderRadius = (size: keyof BorderRadius): number =>
  borderRadius[size];
