/**
 * Theme type definitions for consistent typing across the application
 */

export interface ThemeColors {
  backdrop: string;
  onPrimaryContainer: string;
  onSurface: string;
  onSurfaceVariant: string;
  outlineVariant: string;
  primary: string;
  primaryContainer: string;
  shadow: string;
  surface: string;
  transparent: string;
}

export interface ThemeTypography {
  fontSizes: {
    '2xl': number;
    '3xl': number;
    base: number;
    lg: number;
    sm: number;
    xl: number;
    xs: number;
  };
  fontWeights: {
    bold: '700';
    medium: '500';
    semibold: '600';
  };
  lineHeights: {
    normal: number;
    relaxed: number;
    tight: number;
  };
}

export interface ThemeShadow {
  elevation: number;
  shadowColor: string;
  shadowOffset: {
    height: number;
    width: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
}

export interface ThemeShadows {
  lg: ThemeShadow;
  md: ThemeShadow;
  sm: ThemeShadow;
  subtle: ThemeShadow;
  xl: ThemeShadow;
}

export interface ThemeBorderRadius {
  full: number;
  lg: number;
  md: number;
  sm: number;
  xl: number;
}

export interface ThemeSpacing {
  '2xl': number;
  lg: number;
  md: number;
  sm: number;
  xl: number;
  xs: number;
}

export interface ThemeType {
  borderRadius: ThemeBorderRadius;
  colorPalette: Record<string, Record<string, string>>;
  colors: ThemeColors & { border: string; shadowColor: string };
  shadows: ThemeShadows;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
}

// Legacy compatibility types
export interface ColorPalette {
  background: string;
  border: string;
  error: string;
  gray100: string;
  gray400: string;
  gray50: string;
  gray600: string;
  gray900: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  shimmer: string;
  success: string;
  surface: string;
  textShadowSubtle: string;
  textShadowTransparent: string;
  warning: string;
  white: string;
}

export interface Typography {
  fontFamilies: Record<string, string>;
  fontSizes: Record<string, number>;
  fontWeights: Record<string, string>;
  lineHeights: Record<string, number>;
  sizes: Record<string, number>;
  weights: Record<string, string>;
}

export interface Spacing {
  [key: string]: number;
}

export interface BorderRadius {
  [key: string]: number;
}

export interface Shadows {
  [key: string]: ThemeShadow;
}

export interface TaskCategoryColors {
  [key: string]: string;
}