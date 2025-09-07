import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Accessibility utility functions for better screen reader support
 */

export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 
    | 'none'
    | 'button'
    | 'link'
    | 'search'
    | 'image'
    | 'keyboardkey'
    | 'text'
    | 'adjustable'
    | 'imagebutton'
    | 'header'
    | 'summary'
    | 'alert'
    | 'checkbox'
    | 'combobox'
    | 'menu'
    | 'menubar'
    | 'menuitem'
    | 'progressbar'
    | 'radio'
    | 'radiogroup'
    | 'scrollbar'
    | 'spinbutton'
    | 'switch'
    | 'tab'
    | 'tablist'
    | 'timer'
    | 'toolbar';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}

/**
 * Creates accessibility props for buttons
 */
export function createButtonAccessibility(
  label: string,
  hint?: string,
  disabled?: boolean,
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: {
      disabled: disabled || false,
    },
  };
}

/**
 * Creates accessibility props for text inputs
 */
export function createTextInputAccessibility(
  label: string,
  hint?: string,
  required?: boolean,
  error?: string,
): AccessibilityProps {
  const accessibilityLabel = required ? `${label}, required` : label;
  const accessibilityHint = error 
    ? `${hint || ''} ${error}`.trim()
    : hint;

  return {
    accessible: true,
    accessibilityLabel,
    accessibilityHint,
    accessibilityState: {
      disabled: false,
    },
  };
}

/**
 * Creates accessibility props for task cards
 */
export function createTaskCardAccessibility(
  title: string,
  status: string,
  assignedTo?: string,
  category?: string,
  dueDate?: Date,
): AccessibilityProps {
  let label = `Task: ${title}`;
  
  if (category) {
    label += `, Category: ${category}`;
  }
  
  if (assignedTo) {
    label += `, Assigned to: ${assignedTo}`;
  }
  
  label += `, Status: ${status}`;
  
  if (dueDate) {
    const dueDateString = dueDate.toLocaleDateString();
    label += `, Due: ${dueDateString}`;
  }

  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: 'Double tap to view or edit task details',
  };
}

/**
 * Creates accessibility props for status indicators
 */
export function createStatusAccessibility(
  status: string,
  count?: number,
): AccessibilityProps {
  const label = count !== undefined 
    ? `${status}: ${count} tasks`
    : status;

  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'text',
  };
}

/**
 * Creates accessibility props for progress indicators
 */
export function createProgressAccessibility(
  current: number,
  total: number,
  label?: string,
): AccessibilityProps {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const accessibilityLabel = label 
    ? `${label}: ${current} of ${total}, ${percentage} percent complete`
    : `${current} of ${total}, ${percentage} percent complete`;

  return {
    accessible: true,
    accessibilityRole: 'progressbar',
    accessibilityLabel,
    accessibilityValue: {
      min: 0,
      max: total,
      now: current,
      text: `${percentage}%`,
    },
  };
}

/**
 * Creates accessibility props for navigation elements
 */
export function createNavigationAccessibility(
  label: string,
  hint?: string,
  selected?: boolean,
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'tab',
    accessibilityLabel: label,
    accessibilityHint: hint || 'Double tap to navigate',
    accessibilityState: {
      selected: selected || false,
    },
  };
}

/**
 * Creates accessibility props for form sections
 */
export function createSectionAccessibility(
  title: string,
  description?: string,
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'header',
    accessibilityLabel: title,
    accessibilityHint: description,
  };
}

/**
 * Creates accessibility props for alerts and notifications
 */
export function createAlertAccessibility(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
): AccessibilityProps {
  const typeLabel = {
    info: 'Information',
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
  }[type];

  return {
    accessible: true,
    accessibilityRole: 'alert',
    accessibilityLabel: `${typeLabel}: ${message}`,
  };
}

/**
 * Announces a message to screen readers
 */
export function announceForAccessibility(message: string): void {
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibility(message);
  } else if (Platform.OS === 'android') {
    AccessibilityInfo.announceForAccessibility(message);
  }
}

/**
 * Checks if screen reader is enabled
 */
export async function isScreenReaderEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    // Silently fail for accessibility checks
    return false;
  }
}

/**
 * Checks if reduce motion is enabled
 */
export async function isReduceMotionEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch (error) {
    
    return false;
  }
}

/**
 * Hook for managing accessibility state
 */
export function useAccessibility() {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);

  useEffect(() => {
    // Check initial state
    isScreenReaderEnabled().then(setScreenReaderEnabled);
    isReduceMotionEnabled().then(setReduceMotionEnabled);
    
    // Check high contrast (iOS only)
    if (Platform.OS === 'ios') {
      AccessibilityInfo.isHighTextContrastEnabled?.().then(setHighContrastEnabled).catch(() => {});
    }

    // Listen for changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReaderEnabled,
    );

    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled,
    );

    const highContrastListener = Platform.OS === 'ios' 
      ? AccessibilityInfo.addEventListener('highTextContrastChanged', setHighContrastEnabled)
      : null;

    return () => {
      screenReaderListener?.remove();
      reduceMotionListener?.remove();
      highContrastListener?.remove();
    };
  }, []);

  return {
    screenReaderEnabled,
    reduceMotionEnabled,
    highContrastEnabled,
    announceForAccessibility,
  };
}

