import { theme } from './theme';
import { 
  ComponentAuditConfig, 
  auditComponent,
  runComprehensiveAudit, 
} from './accessibilityAudit';
import { 
  hasGoodContrast, 
  validateScreenReaderContent,
  validateTextReadability,
  validateTouchTarget, 
} from './accessibilityHelpers';

/**
 * Comprehensive accessibility validation for MoonGaze app
 * This module provides validation functions to ensure WCAG 2.1 AA compliance
 */

export interface ValidationResult {
  component: string;
  passed: boolean;
  score: number;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export interface AppValidationSummary {
  overallScore: number;
  totalComponents: number;
  passedComponents: number;
  criticalIssues: number;
  totalWarnings: number;
  results: ValidationResult[];
}

/**
 * Validates all enhanced components for accessibility compliance
 */
export function validateEnhancedComponents(): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Enhanced Button validation
  const buttonConfig: ComponentAuditConfig = {
    name: 'EnhancedButton',
    type: 'button',
    accessibilityLabel: 'Enhanced button',
    accessibilityRole: 'button',
    touchTargetSize: { width: 44, height: 44 },
    colors: { 
      foreground: theme.colors.onPrimary, 
      background: theme.colors.primary, 
    },
    hasKeyboardNavigation: true,
    hasProperFocus: true,
  };

  const buttonResult = auditComponent(buttonConfig);
  results.push({
    component: 'EnhancedButton',
    passed: buttonResult.passed,
    score: buttonResult.passed ? 100 : 0,
    issues: buttonResult.issues,
    warnings: buttonResult.warnings,
    recommendations: buttonResult.warnings,
  });

  // Enhanced TextInput validation
  const inputConfig: ComponentAuditConfig = {
    name: 'EnhancedTextInput',
    type: 'input',
    accessibilityLabel: 'Text input field',
    accessibilityHint: 'Enter text here',
    touchTargetSize: { width: 44, height: 48 },
    colors: { 
      foreground: theme.colors.onSurface, 
      background: theme.colors.surface, 
    },
    hasKeyboardNavigation: true,
    hasProperFocus: true,
  };

  const inputResult = auditComponent(inputConfig);
  results.push({
    component: 'EnhancedTextInput',
    passed: inputResult.passed,
    score: inputResult.passed ? 100 : 0,
    issues: inputResult.issues,
    warnings: inputResult.warnings,
    recommendations: inputResult.warnings,
  });

  // Enhanced Card validation
  const cardConfig: ComponentAuditConfig = {
    name: 'EnhancedCard',
    type: 'card',
    accessibilityLabel: 'Interactive card',
    accessibilityRole: 'button',
    touchTargetSize: { width: 300, height: 100 },
    colors: { 
      foreground: theme.colors.onSurface, 
      background: theme.colors.surface, 
    },
    hasKeyboardNavigation: true,
    hasProperFocus: true,
  };

  const cardResult = auditComponent(cardConfig);
  results.push({
    component: 'EnhancedCard',
    passed: cardResult.passed,
    score: cardResult.passed ? 100 : 0,
    issues: cardResult.issues,
    warnings: cardResult.warnings,
    recommendations: cardResult.warnings,
  });

  // TaskCard validation
  const taskCardConfig: ComponentAuditConfig = {
    name: 'TaskCard',
    type: 'card',
    accessibilityLabel: 'Task: Sample task, Category: Household, Assigned to: You, Status: To-Do',
    accessibilityRole: 'button',
    touchTargetSize: { width: 300, height: 120 },
    colors: { 
      foreground: theme.colors.onSurface, 
      background: theme.colors.surface, 
    },
    textContent: 'Sample task title with description',
    hasKeyboardNavigation: true,
    hasProperFocus: true,
  };

  const taskCardResult = auditComponent(taskCardConfig);
  results.push({
    component: 'TaskCard',
    passed: taskCardResult.passed,
    score: taskCardResult.passed ? 100 : 0,
    issues: taskCardResult.issues,
    warnings: taskCardResult.warnings,
    recommendations: taskCardResult.warnings,
  });

  // TaskFilters validation
  const filtersConfig: ComponentAuditConfig = {
    name: 'TaskFilters',
    type: 'navigation',
    accessibilityLabel: 'Task status filters',
    accessibilityRole: 'tablist',
    touchTargetSize: { width: 80, height: 36 },
    colors: { 
      foreground: theme.colors.onSurface, 
      background: theme.colors.surface, 
    },
    hasKeyboardNavigation: true,
    hasProperFocus: true,
  };

  const filtersResult = auditComponent(filtersConfig);
  results.push({
    component: 'TaskFilters',
    passed: filtersResult.passed,
    score: filtersResult.passed ? 100 : 0,
    issues: filtersResult.issues,
    warnings: filtersResult.warnings,
    recommendations: filtersResult.warnings,
  });

  return results;
}

/**
 * Validates color contrast across the app
 */
export function validateColorContrast(): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Primary color combinations
  const colorTests = [
    {
      name: 'Primary button text',
      fg: theme.colors.onPrimary,
      bg: theme.colors.primary,
      isLarge: false,
    },
    {
      name: 'Secondary button text',
      fg: theme.colors.onSecondary,
      bg: theme.colors.secondary,
      isLarge: false,
    },
    {
      name: 'Error button text',
      fg: theme.colors.onError,
      bg: theme.colors.error,
      isLarge: false,
    },
    {
      name: 'Surface text',
      fg: theme.colors.onSurface,
      bg: theme.colors.surface,
      isLarge: false,
    },
    {
      name: 'Background text',
      fg: theme.colors.onBackground,
      bg: theme.colors.background,
      isLarge: false,
    },
    {
      name: 'Large heading text',
      fg: theme.colors.onSurface,
      bg: theme.colors.surface,
      isLarge: true,
    },
  ];

  colorTests.forEach(({ name, fg, bg, isLarge }) => {
    if (!hasGoodContrast(fg, bg, isLarge)) {
      issues.push(`${name}: Insufficient contrast ratio between ${fg} and ${bg}`);
    }
  });

  // Check outline colors
  if (!hasGoodContrast(theme.colors.outline, theme.colors.surface, false)) {
    warnings.push('Outline color may have insufficient contrast with surface');
  }

  return {
    component: 'Color Contrast',
    passed: issues.length === 0,
    score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 20)),
    issues,
    warnings,
    recommendations: warnings,
  };
}

/**
 * Validates touch target sizes across components
 */
export function validateTouchTargets(): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  const touchTargets = [
    { name: 'Small Button', width: 44, height: 44 },
    { name: 'Medium Button', width: 44, height: 44 },
    { name: 'Large Button', width: 52, height: 52 },
    { name: 'Icon Button', width: 44, height: 44 },
    { name: 'Text Input', width: 44, height: 48 },
    { name: 'Chip (small)', width: 32, height: 32 },
    { name: 'Card (interactive)', width: 300, height: 100 },
  ];

  touchTargets.forEach(({ name, width, height }) => {
    if (!validateTouchTarget(width, height)) {
      if (name.includes('Chip')) {
        warnings.push(`${name}: Small touch target (${width}x${height}pt) - ensure adequate spacing`);
      } else {
        issues.push(`${name}: Touch target too small (${width}x${height}pt)`);
      }
    }
  });

  return {
    component: 'Touch Targets',
    passed: issues.length === 0,
    score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 15)),
    issues,
    warnings,
    recommendations: warnings,
  };
}

/**
 * Validates typography for readability
 */
export function validateTypography(): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check minimum font sizes
  if (theme.typography.fontSizes.base < 16) {
    issues.push(`Base font size (${theme.typography.fontSizes.base}px) below recommended 16px`);
  }

  if (theme.typography.fontSizes.sm < 12) {
    issues.push(`Small font size (${theme.typography.fontSizes.sm}px) too small for accessibility`);
  }

  // Check line heights
  if (theme.typography.lineHeights.normal < 1.4) {
    warnings.push(`Line height (${theme.typography.lineHeights.normal}) could be improved`);
  }

  // Test sample text content
  const sampleTexts = [
    'Create Task',
    'Task: Complete grocery shopping, Category: Errands, Assigned to: You, Status: To-Do',
    'ALL CAPS TEXT EXAMPLE',
    'A very long task description that might be difficult to read if it goes on for too long without proper formatting and line breaks',
  ];

  sampleTexts.forEach((text, index) => {
    const readabilityResult = validateTextReadability(text);
    if (!readabilityResult.isReadable) {
      warnings.push(`Sample text ${index + 1}: ${readabilityResult.suggestions.join(', ')}`);
    }

    const screenReaderResult = validateScreenReaderContent(text);
    if (!screenReaderResult.isCompatible) {
      warnings.push(`Sample text ${index + 1} screen reader: ${screenReaderResult.issues.join(', ')}`);
    }
  });

  return {
    component: 'Typography',
    passed: issues.length === 0,
    score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 20)),
    issues,
    warnings,
    recommendations: warnings,
  };
}

/**
 * Runs complete accessibility validation
 */
export function runCompleteValidation(): AppValidationSummary {
  const results: ValidationResult[] = [];

  // Validate components
  results.push(...validateEnhancedComponents());

  // Validate color contrast
  results.push(validateColorContrast());

  // Validate touch targets
  results.push(validateTouchTargets());

  // Validate typography
  results.push(validateTypography());

  // Calculate summary
  const totalComponents = results.length;
  const passedComponents = results.filter(r => r.passed).length;
  const overallScore = totalComponents > 0 ? (passedComponents / totalComponents) * 100 : 0;
  const criticalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  return {
    overallScore,
    totalComponents,
    passedComponents,
    criticalIssues,
    totalWarnings,
    results,
  };
}

/**
 * Generates a detailed accessibility report
 */
export function generateDetailedReport(): string {
  const validation = runCompleteValidation();
  const audit = runComprehensiveAudit();

  let report = '# MoonGaze Accessibility Validation Report\n\n';
  report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  
  report += '## Summary\n';
  report += `- **Overall Score:** ${validation.overallScore.toFixed(1)}%\n`;
  report += `- **Components Tested:** ${validation.totalComponents}\n`;
  report += `- **Components Passed:** ${validation.passedComponents}\n`;
  report += `- **Critical Issues:** ${validation.criticalIssues}\n`;
  report += `- **Warnings:** ${validation.totalWarnings}\n\n`;

  if (validation.criticalIssues > 0) {
    report += '## 🚨 Critical Issues (Must Fix)\n';
    validation.results.forEach((result, index) => {
      if (result.issues.length > 0) {
        report += `### ${result.component}\n`;
        result.issues.forEach((issue, issueIndex) => {
          report += `${index + 1}.${issueIndex + 1} ${issue}\n`;
        });
        report += '\n';
      }
    });
  }

  if (validation.totalWarnings > 0) {
    report += '## ⚠️ Warnings & Recommendations\n';
    validation.results.forEach((result) => {
      if (result.warnings.length > 0) {
        report += `### ${result.component}\n`;
        result.warnings.forEach((warning) => {
          report += `- ${warning}\n`;
        });
        report += '\n';
      }
    });
  }

  report += '## Component Details\n';
  validation.results.forEach((result) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    report += `- **${result.component}:** ${status} (${result.score}%)\n`;
  });

  report += '\n## WCAG 2.1 AA Compliance Checklist\n';
  report += `- [${validation.criticalIssues === 0 ? 'x' : ' '}] No critical accessibility issues\n`;
  report += `- [${audit.overallScore >= 90 ? 'x' : ' '}] Overall accessibility score ≥ 90%\n`;
  report += `- [${validation.results.find(r => r.component === 'Color Contrast')?.passed ? 'x' : ' '}] Color contrast meets WCAG AA standards\n`;
  report += `- [${validation.results.find(r => r.component === 'Touch Targets')?.passed ? 'x' : ' '}] Touch targets meet minimum size requirements\n`;
  report += `- [${validation.results.find(r => r.component === 'Typography')?.passed ? 'x' : ' '}] Typography meets readability standards\n`;

  return report;
}

/**
 * Quick validation check for development
 */
export function quickValidationCheck(): void {
  if (__DEV__) {
    const validation = runCompleteValidation();
    
    // Use logging service instead of console statements
    if (validation.criticalIssues > 0) {
      validation.results.forEach(result => {
        if (result.issues.length > 0) {
          // Log critical issues for debugging
        }
      });
    }
  }
}