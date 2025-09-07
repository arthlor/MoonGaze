import { AccessibilityInfo } from 'react-native';

/**
 * Additional accessibility helper functions for enhanced components
 */

/**
 * Validates that a touch target meets minimum size requirements
 */
export function validateTouchTarget(width: number, height: number): boolean {
  const MIN_TOUCH_TARGET = 44; // 44pt minimum as per accessibility guidelines
  return width >= MIN_TOUCH_TARGET && height >= MIN_TOUCH_TARGET;
}

/**
 * Creates a comprehensive accessibility description for complex components
 */
export function createComplexAccessibilityLabel(
  baseLabel: string,
  state?: {
    selected?: boolean;
    disabled?: boolean;
    loading?: boolean;
    error?: boolean;
    required?: boolean;
  },
  additionalInfo?: string[],
): string {
  let label = baseLabel;
  
  if (state?.required) label += ', required';
  if (state?.selected) label += ', selected';
  if (state?.disabled) label += ', disabled';
  if (state?.loading) label += ', loading';
  if (state?.error) label += ', has error';
  
  if (additionalInfo && additionalInfo.length > 0) {
    label += `, ${  additionalInfo.join(', ')}`;
  }
  
  return label;
}

/**
 * Announces important state changes to screen readers
 */
export function announceStateChange(message: string, delay: number = 100): void {
  setTimeout(() => {
    AccessibilityInfo.announceForAccessibility(message);
  }, delay);
}

/**
 * Creates accessibility props for form validation
 */
export function createFormValidationAccessibility(
  fieldName: string,
  isValid: boolean,
  errorMessage?: string,
  required?: boolean,
): {
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityInvalid?: boolean;
} {
  let label = fieldName;
  if (required) label += ', required';
  
  return {
    accessibilityLabel: label,
    accessibilityHint: errorMessage || undefined,
    accessibilityInvalid: !isValid,
  };
}

/**
 * Creates accessibility props for interactive lists
 */
export function createListItemAccessibility(
  itemLabel: string,
  position: number,
  totalItems: number,
  additionalInfo?: string,
): {
  accessibilityLabel: string;
  accessibilityHint: string;
} {
  let label = `${itemLabel}, ${position} of ${totalItems}`;
  if (additionalInfo) {
    label += `, ${additionalInfo}`;
  }
  
  return {
    accessibilityLabel: label,
    accessibilityHint: 'Double tap to select',
  };
}

/**
 * Checks if high contrast mode is enabled (iOS specific)
 */
export async function isHighContrastEnabled(): Promise<boolean> {
  try {
    // This is iOS specific - Android handles high contrast differently
    return await AccessibilityInfo.isHighTextContrastEnabled?.() || false;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the current accessibility focus
 */
export function setAccessibilityFocus(reactTag: number): void {
  AccessibilityInfo.setAccessibilityFocus(reactTag);
}

/**
 * Converts hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Calculates relative luminance of a color
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1; // Default to failing ratio if colors can't be parsed
  
  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Validates color contrast ratio according to WCAG 2.1 AA standards
 */
export function hasGoodContrast(
  foregroundColor: string,
  backgroundColor: string,
  isLargeText: boolean = false,
): boolean {
  const minRatio = isLargeText ? 3.0 : 4.5; // WCAG AA standards
  const contrastRatio = getContrastRatio(foregroundColor, backgroundColor);
  return contrastRatio >= minRatio;
}

/**
 * Validates color contrast ratio according to WCAG 2.1 AAA standards
 */
export function hasExcellentContrast(
  foregroundColor: string,
  backgroundColor: string,
  isLargeText: boolean = false,
): boolean {
  const minRatio = isLargeText ? 4.5 : 7.0; // WCAG AAA standards
  const contrastRatio = getContrastRatio(foregroundColor, backgroundColor);
  return contrastRatio >= minRatio;
}

/**
 * Creates semantic role mappings for different component types
 */
export const SEMANTIC_ROLES = {
  navigation: 'tab' as const,
  filter: 'button' as const,
  toggle: 'switch' as const,
  selection: 'checkbox' as const,
  action: 'button' as const,
  link: 'link' as const,
  heading: 'header' as const,
  status: 'text' as const,
  alert: 'alert' as const,
  progress: 'progressbar' as const,
} as const;

/**
 * Default accessibility timeouts for different interaction types
 */
export const ACCESSIBILITY_TIMEOUTS = {
  announcement: 100,
  stateChange: 200,
  navigation: 300,
  error: 500,
} as const;

/**
 * WCAG 2.1 AA compliance checker for components
 */
export interface AccessibilityAuditResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Audits a component for WCAG 2.1 AA compliance
 */
export function auditComponentAccessibility(component: {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  touchTargetSize?: { width: number; height: number };
  colors?: { foreground: string; background: string; isLargeText?: boolean };
  hasKeyboardNavigation?: boolean;
  hasProperFocus?: boolean;
}): AccessibilityAuditResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check accessibility label
  if (!component.accessibilityLabel || component.accessibilityLabel.trim().length === 0) {
    issues.push('Missing or empty accessibility label');
  }

  // Check touch target size
  if (component.touchTargetSize) {
    const { width, height } = component.touchTargetSize;
    if (!validateTouchTarget(width, height)) {
      issues.push(`Touch target too small: ${width}x${height}pt (minimum 44x44pt required)`);
    }
  }

  // Check color contrast
  if (component.colors) {
    const { foreground, background, isLargeText = false } = component.colors;
    if (!hasGoodContrast(foreground, background, isLargeText)) {
      issues.push(`Insufficient color contrast between ${foreground} and ${background}`);
    }
    if (!hasExcellentContrast(foreground, background, isLargeText)) {
      warnings.push('Color contrast could be improved for better accessibility');
    }
  }

  // Check keyboard navigation
  if (component.hasKeyboardNavigation === false) {
    warnings.push('Component may not be keyboard accessible');
  }

  // Check focus management
  if (component.hasProperFocus === false) {
    issues.push('Component lacks proper focus management');
  }

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Validates that text meets readability standards
 */
export function validateTextReadability(text: string): {
  isReadable: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  
  // Check text length
  if (text.length > 120) {
    suggestions.push('Consider breaking long text into shorter sentences');
  }
  
  // Check for all caps (harder to read)
  if (text === text.toUpperCase() && text.length > 10) {
    suggestions.push('Avoid using all capital letters for better readability');
  }
  
  // Check for meaningful content
  if (text.trim().length < 2) {
    suggestions.push('Text should be descriptive and meaningful');
  }
  
  return {
    isReadable: suggestions.length === 0,
    suggestions,
  };
}

/**
 * Creates comprehensive accessibility props for complex interactive elements
 */
export function createInteractiveElementAccessibility(
  label: string,
  role: keyof typeof SEMANTIC_ROLES,
  state?: {
    selected?: boolean;
    disabled?: boolean;
    loading?: boolean;
    error?: boolean;
    expanded?: boolean;
  },
  hint?: string,
): {
  accessible: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole: string;
  accessibilityState: Record<string, boolean | undefined>;
} {
  return {
    accessible: true,
    accessibilityLabel: createComplexAccessibilityLabel(label, state),
    accessibilityHint: hint,
    accessibilityRole: SEMANTIC_ROLES[role],
    accessibilityState: {
      disabled: state?.disabled || false,
      selected: state?.selected || false,
      busy: state?.loading || false,
      expanded: state?.expanded,
    },
  };
}

/**
 * Validates screen reader compatibility for text content
 */
export function validateScreenReaderContent(content: string): {
  isCompatible: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check for special characters that might not read well
  const problematicChars = /[^\w\s.,!?;:()\-'"]/g;
  const matches = content.match(problematicChars);
  if (matches && matches.length > 0) {
    issues.push(`Contains characters that may not read well: ${matches.join(', ')}`);
  }
  
  // Check for numbers without context
  const numbersWithoutContext = /\b\d+\b/g;
  const numberMatches = content.match(numbersWithoutContext);
  if (numberMatches && numberMatches.length > 2) {
    issues.push('Consider providing context for numbers to improve screen reader experience');
  }
  
  // Check for abbreviations
  const abbreviations = /\b[A-Z]{2,}\b/g;
  const abbrevMatches = content.match(abbreviations);
  if (abbrevMatches && abbrevMatches.length > 0) {
    issues.push(`Consider spelling out abbreviations: ${abbrevMatches.join(', ')}`);
  }
  
  return {
    isCompatible: issues.length === 0,
    issues,
  };
}