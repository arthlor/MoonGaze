import { useCallback, useState } from 'react';
import { ErrorInfo, RetryOptions, analyzeError, logError, withRetry } from '../utils/errorHandling';

interface UseErrorHandlerOptions {
  defaultRetryOptions?: RetryOptions;
  onError?: (error: ErrorInfo) => void;
}

interface ErrorState {
  error: ErrorInfo | null;
  isRetrying: boolean;
  retryCount: number;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
  });

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
    });
  }, []);

  const handleError = useCallback((error: unknown, context?: string) => {
    const errorInfo = analyzeError(error);
    
    // Log error for debugging
    logError(error, context);
    
    // Update error state
    setErrorState(prev => ({
      error: errorInfo,
      isRetrying: false,
      retryCount: prev.retryCount,
    }));

    // Call custom error handler if provided
    options.onError?.(errorInfo);
  }, [options]);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string,
    retryOptions?: RetryOptions,
  ): Promise<T | null> => {
    try {
      clearError();
      
      const result = await withRetry(operation, {
        ...options.defaultRetryOptions,
        ...retryOptions,
      });
      
      return result;
    } catch (error) {
      handleError(error, context);
      return null;
    }
  }, [clearError, handleError, options.defaultRetryOptions]);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string,
    _retryOptions?: RetryOptions,
  ): Promise<T | null> => {
    if (!errorState.error?.isRetryable) {
      return null;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      const result = await operation();
      clearError();
      return result;
    } catch (error) {
      handleError(error, context);
      return null;
    }
  }, [errorState.error?.isRetryable, handleError, clearError]);

  return {
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    hasError: errorState.error !== null,
    isRetryable: errorState.error?.isRetryable ?? false,
    clearError,
    handleError,
    executeWithErrorHandling,
    retry,
  };
}

/**
 * Hook for handling async operations with loading and error states
 */
export function useAsyncOperation<T>() {
  const [loading, setLoading] = useState(false);
  const errorHandler = useErrorHandler();

  const execute = useCallback(async (
    operation: () => Promise<T>,
    context?: string,
  ): Promise<T | null> => {
    setLoading(true);
    
    try {
      const result = await errorHandler.executeWithErrorHandling(operation, context);
      return result;
    } finally {
      setLoading(false);
    }
  }, [errorHandler]);

  const retry = useCallback(async (
    operation: () => Promise<T>,
    context?: string,
  ): Promise<T | null> => {
    setLoading(true);
    
    try {
      const result = await errorHandler.retry(operation, context);
      return result;
    } finally {
      setLoading(false);
    }
  }, [errorHandler]);

  return {
    loading,
    error: errorHandler.error,
    isRetrying: errorHandler.isRetrying,
    hasError: errorHandler.hasError,
    isRetryable: errorHandler.isRetryable,
    execute,
    retry,
    clearError: errorHandler.clearError,
  };
}

/**
 * Hook for managing form submission with error handling
 */
export function useFormSubmission<T>() {
  const [submitting, setSubmitting] = useState(false);
  const errorHandler = useErrorHandler();

  const submit = useCallback(async (
    operation: () => Promise<T>,
    context?: string,
  ): Promise<{ success: boolean; data?: T }> => {
    setSubmitting(true);
    
    try {
      const result = await errorHandler.executeWithErrorHandling(operation, context);
      
      if (result !== null) {
        return { success: true, data: result };
      } else {
        return { success: false };
      }
    } finally {
      setSubmitting(false);
    }
  }, [errorHandler]);

  return {
    submitting,
    error: errorHandler.error,
    hasError: errorHandler.hasError,
    submit,
    clearError: errorHandler.clearError,
  };
}