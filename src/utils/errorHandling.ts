import { FirebaseError } from 'firebase/app';
// AuthError import removed as it's not used
import crashlytics from '@react-native-firebase/crashlytics';
import { shouldEnableCrashlytics } from '../config/environment';
import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export interface ErrorInfo {
  message: string;
  code?: string;
  isRetryable: boolean;
  userMessage: string;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
};

/**
 * Executes a function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Check if error is retryable
      const errorInfo = analyzeError(error);
      if (!errorInfo.isRetryable) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt),
        config.maxDelay,
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      await sleep(jitteredDelay);
    }
  }

  throw lastError || new Error('Unknown error occurred during retry');
}

/**
 * Analyzes an error and returns structured information
 */
export function analyzeError(error: unknown): ErrorInfo {
  if (error instanceof FirebaseError) {
    return analyzeFirebaseError(error);
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('Network Error') || 
        error.message.includes('fetch') ||
        error.message.includes('timeout')) {
      return {
        message: error.message,
        isRetryable: true,
        userMessage: 'Network connection issue. Please check your internet connection.',
      };
    }

    // Generic error
    return {
      message: error.message,
      isRetryable: false,
      userMessage: 'An unexpected error occurred. Please try again.',
    };
  }

  // Unknown error type
  return {
    message: String(error),
    isRetryable: false,
    userMessage: 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Analyzes Firebase-specific errors
 */
function analyzeFirebaseError(error: FirebaseError): ErrorInfo {
  const { code, message } = error;

  // Network-related Firebase errors (retryable)
  const networkErrors = [
    'unavailable',
    'deadline-exceeded',
    'internal',
    'resource-exhausted',
  ];

  if (networkErrors.some(errorCode => code.includes(errorCode))) {
    return {
      message,
      code,
      isRetryable: true,
      userMessage: 'Connection issue. Retrying...',
    };
  }

  // Authentication errors (not retryable)
  const authErrors: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  };

  if (code in authErrors) {
    return {
      message,
      code,
      isRetryable: code === 'auth/network-request-failed',
      userMessage: authErrors[code],
    };
  }

  // Firestore errors
  const firestoreErrors: Record<string, { message: string; retryable: boolean }> = {
    'permission-denied': {
      message: 'You don\'t have permission to perform this action.',
      retryable: false,
    },
    'not-found': {
      message: 'The requested data was not found.',
      retryable: false,
    },
    'already-exists': {
      message: 'This item already exists.',
      retryable: false,
    },
    'failed-precondition': {
      message: 'Operation failed due to current state.',
      retryable: false,
    },
    'aborted': {
      message: 'Operation was aborted. Please try again.',
      retryable: true,
    },
    'out-of-range': {
      message: 'Invalid input range.',
      retryable: false,
    },
    'data-loss': {
      message: 'Data corruption detected.',
      retryable: false,
    },
  };

  const errorKey = code.split('/').pop() || '';
  if (errorKey in firestoreErrors) {
    const errorConfig = firestoreErrors[errorKey];
    return {
      message,
      code,
      isRetryable: errorConfig.retryable,
      userMessage: errorConfig.message,
    };
  }

  // Default Firebase error
  return {
    message,
    code,
    isRetryable: false,
    userMessage: 'A service error occurred. Please try again.',
  };
}

/**
 * Utility function to sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  const errorInfo = analyzeError(error);
  return errorInfo.userMessage;
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const errorInfo = analyzeError(error);
  return errorInfo.isRetryable;
}

/**
 * Sets user context for Crashlytics
 */
export function setCrashlyticsUserContext(userId: string, email?: string, displayName?: string): void {
  if (!shouldEnableCrashlytics()) {
    return;
  }

  try {
    crashlytics().setUserId(userId);
    
    if (email) {
      crashlytics().setAttribute('user_email', email);
    }
    
    if (displayName) {
      crashlytics().setAttribute('user_display_name', displayName);
    }
    
    crashlytics().setAttribute('user_set_at', new Date().toISOString());
    
    if (__DEV__) {
      logger.info('🔥 Crashlytics user context set for', { userId });
    }
  } catch (error) {
    if (__DEV__) {
      logger.warn('Failed to set Crashlytics user context', { error });
    }
  }
}

/**
 * Clears user context from Crashlytics
 */
export function clearCrashlyticsUserContext(): void {
  if (!shouldEnableCrashlytics()) {
    return;
  }

  try {
    crashlytics().setUserId('');
    crashlytics().setAttribute('user_email', '');
    crashlytics().setAttribute('user_display_name', '');
    crashlytics().setAttribute('user_cleared_at', new Date().toISOString());
    
    if (__DEV__) {
      logger.info('🔥 Crashlytics user context cleared');
    }
  } catch (error) {
    if (__DEV__) {
      logger.warn('Failed to clear Crashlytics user context', { error });
    }
  }
}

/**
 * Reports error to Crashlytics
 */
export function reportErrorToCrashlytics(error: unknown, context?: string): void {
  if (!shouldEnableCrashlytics()) {
    return;
  }

  try {
    const errorInfo = analyzeError(error);
    
    // Set context attributes
    if (context) {
      crashlytics().setAttribute('error_context', context);
    }
    crashlytics().setAttribute('error_code', errorInfo.code || 'unknown');
    crashlytics().setAttribute('is_retryable', errorInfo.isRetryable.toString());
    crashlytics().setAttribute('user_message', errorInfo.userMessage);
    
    // Record the error
    if (error instanceof Error) {
      crashlytics().recordError(error);
    } else {
      // Create an Error object for non-Error types
      const errorObj = new Error(errorInfo.message);
      crashlytics().recordError(errorObj);
    }
  } catch (crashlyticsError) {
    // Silently fail if Crashlytics reporting fails
    if (__DEV__) {
      logger.warn('Failed to report error to Crashlytics', { crashlyticsError });
    }
  }
}

/**
 * Logs error information for debugging and reports to Crashlytics
 */
export function logError(error: unknown, context?: string): void {
  const errorInfo = analyzeError(error);
  
  // Report to Crashlytics
  reportErrorToCrashlytics(error, context);
  
  if (__DEV__) {
    logger.error(`🚨 Error${context ? ` in ${context}` : ''}`, error, {
      code: errorInfo.code,
      isRetryable: errorInfo.isRetryable,
      userMessage: errorInfo.userMessage,
    });
  }
}

/**
 * Error handler for async operations with user feedback
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options: {
    context?: string;
    showLoading?: boolean;
    retryOptions?: RetryOptions;
    onError?: (error: ErrorInfo) => void;
  } = {},
): Promise<{ success: true; data: T } | { success: false; error: ErrorInfo }> {
  try {
    const data = await withRetry(operation, options.retryOptions);
    return { success: true, data };
  } catch (error) {
    const errorInfo = analyzeError(error);
    
    // Log error for debugging
    logError(error, options.context);
    
    // Call custom error handler if provided
    options.onError?.(errorInfo);
    
    return { success: false, error: errorInfo };
  }
}

/**
 * Enhanced error classification for UI display
 */
export interface ErrorDisplayConfig {
  type: 'network' | 'validation' | 'server' | 'client' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  displayVariant: 'inline' | 'modal' | 'banner' | 'toast';
  retryable: boolean;
  autoHide: boolean;
  duration?: number;
}

/**
 * Manually logs a crash for testing purposes (development only)
 */
export function testCrashlytics(message: string = 'Test crash from MoonGaze'): void {
  if (!shouldEnableCrashlytics()) {
    if (__DEV__) {
      logger.info('🔥 Crashlytics test skipped - disabled in current environment');
    }
    return;
  }

  try {
    crashlytics().log('Testing Crashlytics integration');
    crashlytics().setAttribute('test_crash', 'true');
    crashlytics().setAttribute('test_timestamp', new Date().toISOString());
    
    // Create and record a test error
    const testError = new Error(message);
    crashlytics().recordError(testError);
    
    if (__DEV__) {
      logger.info('🔥 Test crash logged to Crashlytics', { message });
    }
  } catch (error) {
    if (__DEV__) {
      logger.warn('Failed to log test crash to Crashlytics', { error });
    }
  }
}

/**
 * Logs a custom message to Crashlytics
 */
export function logToCrashlytics(message: string): void {
  if (!shouldEnableCrashlytics()) {
    return;
  }

  try {
    crashlytics().log(message);
  } catch (error) {
    if (__DEV__) {
      logger.warn('Failed to log message to Crashlytics', { error });
    }
  }
}

/**
 * Determines the best display configuration for an error
 */
export function getErrorDisplayConfig(error: unknown): ErrorDisplayConfig {
  const errorInfo = analyzeError(error);
  
  // Network errors
  if (errorInfo.code?.includes('network') || errorInfo.message.includes('Network')) {
    return {
      type: 'network',
      severity: 'medium',
      displayVariant: 'banner',
      retryable: true,
      autoHide: false,
    };
  }
  
  // Authentication errors
  if (errorInfo.code?.includes('auth/')) {
    return {
      type: 'client',
      severity: 'high',
      displayVariant: 'inline',
      retryable: false,
      autoHide: false,
    };
  }
  
  // Permission errors
  if (errorInfo.code?.includes('permission-denied')) {
    return {
      type: 'server',
      severity: 'critical',
      displayVariant: 'modal',
      retryable: false,
      autoHide: false,
    };
  }
  
  // Validation errors
  if (errorInfo.code?.includes('invalid') || errorInfo.code?.includes('validation')) {
    return {
      type: 'validation',
      severity: 'low',
      displayVariant: 'inline',
      retryable: false,
      autoHide: true,
      duration: 3000,
    };
  }
  
  // Default configuration
  return {
    type: 'unknown',
    severity: 'medium',
    displayVariant: 'toast',
    retryable: errorInfo.isRetryable,
    autoHide: true,
    duration: 4000,
  };
}

/**
 * Validate environment configuration and log any issues
 */
export async function validateEnvironmentSetup(): Promise<boolean> {
  try {
    // Import here to avoid circular dependencies
    const { validateEnvironmentConfig, getCurrentEnvironment } = await import('../config/environment');
    
    const validation = validateEnvironmentConfig();
    const environment = getCurrentEnvironment();
    
    if (!validation.isValid) {
      const errorMessage = `Environment configuration validation failed for ${environment}:\n${validation.errors.join('\n')}`;
      
      if (environment === 'production') {
        // In production, this is a critical error
        logError(new Error(errorMessage), 'Environment Validation');
        return false;
      } else {
        // In development/staging, log as warning
        logger.warn('⚠️ Environment Configuration Warning', { errorMessage });
        return true; // Allow app to continue in non-production
      }
    }
    
    
    return true;
  } catch (error) {
    logError(error as Error, 'Environment Validation Setup');
    return false;
  }
}