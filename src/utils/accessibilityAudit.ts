import { theme } from './theme';
import { 
  AccessibilityAuditResult, 
  auditComponentAccessibility, 
  hasGoodContrast,
  validateScreenReaderContent,
  validateTextReadability,
  validateTouchTarget, 
} from './accessibilityHelpers';

/**
 * Comprehensive accessibility audit system for MoonGaze app
 */

export interface ComponentAuditConfig {
  name: string;
  type: 'button' | 'input' | 'card' | 'text' | 'navigation' | 'modal' | 'list';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  touchTargetSize?: { width: number; height: number };
  colors?: { foreground: string; background: string; isLargeText?: boolean };
  textContent?: string;
  hasKeyboardNavigation?: boolean;
  hasProperFocus?: boolean;
}

export interface AppAuditResult {
  overallScore: number;
  componentResults: Array<{
    component: string;
    result: AccessibilityAuditResult;
  }>;
  criticalIssues: string[];
  recommendations: string[];
}

/**
 * Audits theme colors for WCAG compliance
 */
export function auditThemeColors(): AccessibilityAuditResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check primary color combinations
  const primaryCombinations = [
    { fg: theme.colors.onPrimary, bg: theme.colors.primary, name: 'Primary button text' },
    { fg: theme.colors.onSecondary, bg: theme.colors.secondary, name: 'Secondary button text' },
    { fg: theme.colors.onError, bg: theme.colors.error, name: 'Error button text' },
    { fg: theme.colors.onSurface, bg: theme.colors.surface, name: 'Surface text' },
    { fg: theme.colors.onBackground, bg: theme.colors.background, name: 'Background text' },
  ];

  primaryCombinations.forEach(({ fg, bg, name }) => {
    if (!hasGoodContrast(fg, bg, false)) {
      issues.push(`${name}: Insufficient contrast between ${fg} and ${bg}`);
    }
  });

  // Check outline colors
  if (!hasGoodContrast(theme.colors.outline, theme.colors.surface, false)) {
    warnings.push('Outline color may have insufficient contrast with surface');
  }

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Audits component touch targets
 */
export function auditTouchTargets(): AccessibilityAuditResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Define minimum touch targets for different component types
  const componentTargets = [
    { name: 'Small Button', size: { width: 44, height: 44 } },
    { name: 'Medium Button', size: { width: 44, height: 44 } },
    { name: 'Large Button', size: { width: 52, height: 52 } },
    { name: 'Icon Button', size: { width: 44, height: 44 } },
    { name: 'Chip', size: { width: 32, height: 32 } }, // Chips can be smaller but should be grouped
    { name: 'Text Input', size: { width: 44, height: 44 } },
    { name: 'Card (interactive)', size: { width: 44, height: 44 } },
  ];

  componentTargets.forEach(({ name, size }) => {
    if (!validateTouchTarget(size.width, size.height)) {
      if (name === 'Chip') {
        warnings.push(`${name}: Small touch target (${size.width}x${size.height}pt) - ensure adequate spacing between chips`);
      } else {
        issues.push(`${name}: Touch target too small (${size.width}x${size.height}pt)`);
      }
    }
  });

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Audits typography for readability
 */
export function auditTypography(): AccessibilityAuditResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check font sizes meet minimum requirements
  const minFontSize = 16; // WCAG recommendation for body text

  if (theme.typography.fontSizes.base < minFontSize) {
    issues.push(`Base font size (${theme.typography.fontSizes.base}px) is below recommended minimum (${minFontSize}px)`);
  }

  if (theme.typography.fontSizes.sm < 12) {
    issues.push(`Small font size (${theme.typography.fontSizes.sm}px) is too small for accessibility`);
  }

  // Check line height ratios
  const minLineHeight = 1.4;
  if (theme.typography.lineHeights.normal < minLineHeight) {
    warnings.push(`Normal line height (${theme.typography.lineHeights.normal}) could be increased for better readability`);
  }

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Audits specific component configurations
 */
export function auditComponent(config: ComponentAuditConfig): AccessibilityAuditResult {
  const baseResult = auditComponentAccessibility(config);
  
  // Add component-specific checks
  if (config.textContent) {
    const readabilityResult = validateTextReadability(config.textContent);
    if (!readabilityResult.isReadable) {
      baseResult.warnings.push(...readabilityResult.suggestions);
    }

    const screenReaderResult = validateScreenReaderContent(config.textContent);
    if (!screenReaderResult.isCompatible) {
      baseResult.warnings.push(...screenReaderResult.issues);
    }
  }

  // Component-specific validations
  switch (config.type) {
    case 'button':
      if (!config.accessibilityRole || config.accessibilityRole !== 'button') {
        baseResult.warnings.push('Button should have accessibilityRole="button"');
      }
      break;
    
    case 'input':
      if (!config.accessibilityHint) {
        baseResult.warnings.push('Input fields should have accessibility hints for better user guidance');
      }
      break;
    
    case 'navigation':
      if (!config.accessibilityRole || !['tab', 'button'].includes(config.accessibilityRole)) {
        baseResult.warnings.push('Navigation elements should have appropriate accessibility roles');
      }
      break;
    
    case 'modal':
      if (config.hasProperFocus !== true) {
        baseResult.issues.push('Modals must manage focus properly for accessibility');
      }
      break;
  }

  return baseResult;
}

/**
 * Runs a comprehensive accessibility audit of the app
 */
export function runComprehensiveAudit(): AppAuditResult {
  const results: Array<{ component: string; result: AccessibilityAuditResult }> = [];
  const criticalIssues: string[] = [];
  const recommendations: string[] = [];

  // Audit theme
  const themeResult = auditThemeColors();
  results.push({ component: 'Theme Colors', result: themeResult });
  if (!themeResult.passed) {
    criticalIssues.push(...themeResult.issues);
  }
  recommendations.push(...themeResult.warnings);

  // Audit touch targets
  const touchTargetResult = auditTouchTargets();
  results.push({ component: 'Touch Targets', result: touchTargetResult });
  if (!touchTargetResult.passed) {
    criticalIssues.push(...touchTargetResult.issues);
  }
  recommendations.push(...touchTargetResult.warnings);

  // Audit typography
  const typographyResult = auditTypography();
  results.push({ component: 'Typography', result: typographyResult });
  if (!typographyResult.passed) {
    criticalIssues.push(...typographyResult.issues);
  }
  recommendations.push(...typographyResult.warnings);

  // Calculate overall score
  const totalComponents = results.length;
  const passedComponents = results.filter(r => r.result.passed).length;
  const overallScore = totalComponents > 0 ? (passedComponents / totalComponents) * 100 : 0;

  return {
    overallScore,
    componentResults: results,
    criticalIssues,
    recommendations,
  };
}

/**
 * Generates accessibility report
 */
export function generateAccessibilityReport(): string {
  const audit = runComprehensiveAudit();
  
  let report = '# MoonGaze Accessibility Audit Report\n\n';
  report += `**Overall Score:** ${audit.overallScore.toFixed(1)}%\n\n`;
  
  if (audit.criticalIssues.length > 0) {
    report += '## Critical Issues (Must Fix)\n';
    audit.criticalIssues.forEach((issue, index) => {
      report += `${index + 1}. ${issue}\n`;
    });
    report += '\n';
  }
  
  if (audit.recommendations.length > 0) {
    report += '## Recommendations\n';
    audit.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
    report += '\n';
  }
  
  report += '## Component Results\n';
  audit.componentResults.forEach(({ component, result }) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    report += `- **${component}:** ${status}\n`;
    
    if (result.issues.length > 0) {
      report += `  - Issues: ${result.issues.join(', ')}\n`;
    }
    
    if (result.warnings.length > 0) {
      report += `  - Warnings: ${result.warnings.join(', ')}\n`;
    }
  });
  
  return report;
}

/**
 * Quick accessibility check for development
 */
export function quickAccessibilityCheck(componentName: string, config: Partial<ComponentAuditConfig>): void {
  if (__DEV__) {
    const fullConfig: ComponentAuditConfig = {
      name: componentName,
      type: 'button',
      ...config,
    };
    
    const result = auditComponent(fullConfig);
    
    if (!result.passed || result.warnings.length > 0) {
      // Log accessibility issues for development debugging
      if (result.issues.length > 0) {
        // Use a logging service instead of console for issues
      }
      
      if (result.warnings.length > 0) {
        // Use a logging service instead of console for warnings
      }
    }
  }
}