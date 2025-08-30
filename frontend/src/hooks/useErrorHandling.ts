/**
 * Error Handling Hooks for Collaboration Features
 * Provides centralized error handling, retry mechanisms, and user feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  CollaborationError, 
  RetryConfig, 
  DEFAULT_RETRY_CONFIG,
  withRetry,
  logCollaborationError,
  getErrorRecoverySuggestions
} from '@/lib/errorHandling';

// Error state interface
export interface ErrorState {
  error: CollaborationError | null;
  isRetrying: boolean;
  retryCount: number;
  lastRetryAt: Date | null;
  suggestions: string[];
}

// Error handling hook return type
export interface UseErrorHandlingReturn {
  errorState: ErrorState;
  clearError: () => void;
  handleError: (error: Error | CollaborationError, context?: Record<string, any>) => void;
  retryLastOperation: () => Promise<void>;
  executeWithErrorHandling: <T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ) => Promise<T>;
}

/**
 * Main error handling hook
 */
export function useErrorHandling(): UseErrorHandlingReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    lastRetryAt: null,
    suggestions: []
  });

  const lastOperationRef = useRef<{
    operation: () => Promise<any>;
    config?: Partial<RetryConfig>;
  } | null>(null);

  // Clear error state
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      lastRetryAt: null,
      suggestions: []
    });
    lastOperationRef.current = null;
  }, []);

  // Handle error with proper typing and logging
  const handleError = useCallback((
    error: Error | CollaborationError,
    context?: Record<string, any>
  ) => {
    const collaborationError = error as CollaborationError;
    
    // Log the error
    logCollaborationError(collaborationError, context);
    
    // Get recovery suggestions
    const suggestions = getErrorRecoverySuggestions(collaborationError);
    
    // Update error state
    setErrorState(prev => ({
      ...prev,
      error: collaborationError,
      suggestions,
      isRetrying: false
    }));
  }, []);

  // Retry the last failed operation
  const retryLastOperation = useCallback(async (): Promise<void> => {
    if (!lastOperationRef.current || !errorState.error?.retryable) {
      throw new Error('No retryable operation available');
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
      lastRetryAt: new Date()
    }));

    try {
      const { operation, config } = lastOperationRef.current;
      await withRetry(operation, config);
      
      // Clear error on success
      clearError();
    } catch (error) {
      handleError(error as CollaborationError);
      throw error;
    }
  }, [errorState.error, handleError, clearError]);

  // Execute operation with error handling and retry
  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> => {
    // Store operation for potential retry
    lastOperationRef.current = { operation, config };
    
    // Clear previous errors
    clearError();

    try {
      return await withRetry(operation, config);
    } catch (error) {
      handleError(error as CollaborationError);
      throw error;
    }
  }, [handleError, clearError]);

  return {
    errorState,
    clearError,
    handleError,
    retryLastOperation,
    executeWithErrorHandling
  };
}

/**
 * Hook for delegation-specific error handling
 */
export function useDelegationErrorHandling() {
  const { errorState, clearError, handleError, executeWithErrorHandling } = useErrorHandling();

  const handleDelegationError = useCallback((
    error: Error,
    operation: 'delegate' | 'revoke' | 'complete',
    taskId?: string,
    userId?: string
  ) => {
    const context = {
      operation,
      taskId,
      userId,
      timestamp: new Date().toISOString()
    };
    
    handleError(error, context);
  }, [handleError]);

  const executeDelegationOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationType: 'delegate' | 'revoke' | 'complete',
    taskId?: string,
    userId?: string
  ): Promise<T> => {
    try {
      return await executeWithErrorHandling(operation, {
        maxRetries: 2,
        baseDelay: 1500,
        retryCondition: (error) => error.retryable && error.type !== 'permission_denied'
      });
    } catch (error) {
      handleDelegationError(error as Error, operationType, taskId, userId);
      throw error;
    }
  }, [executeWithErrorHandling, handleDelegationError]);

  return {
    errorState,
    clearError,
    handleDelegationError,
    executeDelegationOperation
  };
}

/**
 * Hook for comment-specific error handling
 */
export function useCommentErrorHandling() {
  const { errorState, clearError, handleError, executeWithErrorHandling } = useErrorHandling();

  const handleCommentError = useCallback((
    error: Error,
    operation: 'add' | 'edit' | 'delete',
    taskId?: string,
    commentId?: string
  ) => {
    const context = {
      operation,
      taskId,
      commentId,
      timestamp: new Date().toISOString()
    };
    
    handleError(error, context);
  }, [handleError]);

  const executeCommentOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationType: 'add' | 'edit' | 'delete',
    taskId?: string,
    commentId?: string
  ): Promise<T> => {
    try {
      return await executeWithErrorHandling(operation, {
        maxRetries: 3,
        baseDelay: 1000,
        retryCondition: (error) => error.retryable && error.type === 'storage_error'
      });
    } catch (error) {
      handleCommentError(error as Error, operationType, taskId, commentId);
      throw error;
    }
  }, [executeWithErrorHandling, handleCommentError]);

  return {
    errorState,
    clearError,
    handleCommentError,
    executeCommentOperation
  };
}

/**
 * Hook for notification-specific error handling
 */
export function useNotificationErrorHandling() {
  const { errorState, clearError, handleError, executeWithErrorHandling } = useErrorHandling();

  const handleNotificationError = useCallback((
    error: Error,
    operation: 'mark_read' | 'mark_unread' | 'delete' | 'clear',
    notificationId?: string
  ) => {
    const context = {
      operation,
      notificationId,
      timestamp: new Date().toISOString()
    };
    
    handleError(error, context);
  }, [handleError]);

  const executeNotificationOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationType: 'mark_read' | 'mark_unread' | 'delete' | 'clear',
    notificationId?: string
  ): Promise<T> => {
    try {
      return await executeWithErrorHandling(operation, {
        maxRetries: 2,
        baseDelay: 800,
        retryCondition: (error) => error.retryable
      });
    } catch (error) {
      handleNotificationError(error as Error, operationType, notificationId);
      throw error;
    }
  }, [executeWithErrorHandling, handleNotificationError]);

  return {
    errorState,
    clearError,
    handleNotificationError,
    executeNotificationOperation
  };
}

/**
 * Hook for managing multiple error states across different features
 */
export function useCollaborationErrorManager() {
  const delegationErrors = useDelegationErrorHandling();
  const commentErrors = useCommentErrorHandling();
  const notificationErrors = useNotificationErrorHandling();

  // Get the most recent error across all features
  const getCurrentError = useCallback(() => {
    const errors = [
      delegationErrors.errorState,
      commentErrors.errorState,
      notificationErrors.errorState
    ].filter(state => state.error !== null);

    if (errors.length === 0) return null;

    // Return the most recent error
    return errors.reduce((latest, current) => {
      if (!latest.lastRetryAt && !current.lastRetryAt) return latest;
      if (!latest.lastRetryAt) return current;
      if (!current.lastRetryAt) return latest;
      
      return current.lastRetryAt > latest.lastRetryAt ? current : latest;
    });
  }, [delegationErrors.errorState, commentErrors.errorState, notificationErrors.errorState]);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    delegationErrors.clearError();
    commentErrors.clearError();
    notificationErrors.clearError();
  }, [delegationErrors.clearError, commentErrors.clearError, notificationErrors.clearError]);

  // Check if any feature has errors
  const hasErrors = useCallback(() => {
    return delegationErrors.errorState.error !== null ||
           commentErrors.errorState.error !== null ||
           notificationErrors.errorState.error !== null;
  }, [delegationErrors.errorState, commentErrors.errorState, notificationErrors.errorState]);

  // Check if any feature is retrying
  const isRetrying = useCallback(() => {
    return delegationErrors.errorState.isRetrying ||
           commentErrors.errorState.isRetrying ||
           notificationErrors.errorState.isRetrying;
  }, [delegationErrors.errorState, commentErrors.errorState, notificationErrors.errorState]);

  return {
    delegation: delegationErrors,
    comment: commentErrors,
    notification: notificationErrors,
    getCurrentError,
    clearAllErrors,
    hasErrors: hasErrors(),
    isRetrying: isRetrying()
  };
}

/**
 * Hook for error toast notifications
 */
export function useErrorToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    error: CollaborationError;
    timestamp: Date;
  }>>([]);

  const showErrorToast = useCallback((error: CollaborationError) => {
    const toast = {
      id: `error-${Date.now()}-${Math.random()}`,
      error,
      timestamp: new Date()
    };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showErrorToast,
    removeToast,
    clearAllToasts
  };
}