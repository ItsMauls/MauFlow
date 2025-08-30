/**
 * Error Handling Hooks Tests
 * Tests for error handling hooks and their integration with collaboration features
 */

import { renderHook, act } from '@testing-library/react';
import {
  useErrorHandling,
  useDelegationErrorHandling,
  useCommentErrorHandling,
  useNotificationErrorHandling,
  useCollaborationErrorManager
} from '@/hooks/useErrorHandling';
import { createCollaborationError } from '@/lib/errorHandling';

// Mock the error handling utilities
jest.mock('@/lib/errorHandling', () => ({
  ...jest.requireActual('@/lib/errorHandling'),
  logCollaborationError: jest.fn(),
  getErrorRecoverySuggestions: jest.fn(() => ['Try again', 'Check permissions'])
}));

describe('Error Handling Hooks', () => {
  describe('useErrorHandling', () => {
    it('should initialize with no error', () => {
      const { result } = renderHook(() => useErrorHandling());
      
      expect(result.current.errorState.error).toBeNull();
      expect(result.current.errorState.isRetrying).toBe(false);
      expect(result.current.errorState.retryCount).toBe(0);
      expect(result.current.errorState.suggestions).toEqual([]);
    });

    it('should handle error correctly', () => {
      const { result } = renderHook(() => useErrorHandling());
      
      const testError = createCollaborationError(
        'permission_denied',
        'DELEGATION_PERMISSION_DENIED'
      );

      act(() => {
        result.current.handleError(testError, { userId: 'user-1' });
      });

      expect(result.current.errorState.error).toBe(testError);
      expect(result.current.errorState.suggestions).toEqual(['Try again', 'Check permissions']);
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useErrorHandling());
      
      const testError = createCollaborationError(
        'permission_denied',
        'DELEGATION_PERMISSION_DENIED'
      );

      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.errorState.error).toBe(testError);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.errorState.error).toBeNull();
      expect(result.current.errorState.retryCount).toBe(0);
      expect(result.current.errorState.suggestions).toEqual([]);
    });

    it('should execute operation with error handling', async () => {
      const { result } = renderHook(() => useErrorHandling());
      
      const successOperation = jest.fn().mockResolvedValue('success');

      let operationResult: string;
      await act(async () => {
        operationResult = await result.current.executeWithErrorHandling(successOperation);
      });

      expect(operationResult!).toBe('success');
      expect(result.current.errorState.error).toBeNull();
    });

    it('should handle operation failure', async () => {
      const { result } = renderHook(() => useErrorHandling());
      
      const testError = createCollaborationError(
        'network_error',
        'NETWORK_UNAVAILABLE'
      );
      const failingOperation = jest.fn().mockRejectedValue(testError);

      await act(async () => {
        try {
          await result.current.executeWithErrorHandling(failingOperation);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.error).toBe(testError);
    });

    it('should retry last operation', async () => {
      const { result } = renderHook(() => useErrorHandling());
      
      const retryableError = createCollaborationError(
        'network_error',
        'NETWORK_UNAVAILABLE'
      );
      
      const operation = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      // First execution fails
      await act(async () => {
        try {
          await result.current.executeWithErrorHandling(operation, { maxRetries: 0 });
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.errorState.error).toBe(retryableError);

      // Retry should succeed
      await act(async () => {
        await result.current.retryLastOperation();
      });

      expect(result.current.errorState.error).toBeNull();
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable operations', async () => {
      const { result } = renderHook(() => useErrorHandling());
      
      const nonRetryableError = createCollaborationError(
        'permission_denied',
        'DELEGATION_PERMISSION_DENIED'
      );

      act(() => {
        result.current.handleError(nonRetryableError);
      });

      await act(async () => {
        try {
          await result.current.retryLastOperation();
        } catch (error) {
          expect(error.message).toBe('No retryable operation available');
        }
      });
    });
  });

  describe('useDelegationErrorHandling', () => {
    it('should handle delegation errors with context', () => {
      const { result } = renderHook(() => useDelegationErrorHandling());
      
      const testError = new Error('Delegation failed');

      act(() => {
        result.current.handleDelegationError(testError, 'delegate', 'task-1', 'user-1');
      });

      expect(result.current.errorState.error).toBeTruthy();
    });

    it('should execute delegation operation with retry', async () => {
      const { result } = renderHook(() => useDelegationErrorHandling());
      
      const successOperation = jest.fn().mockResolvedValue('delegated');

      let operationResult: string;
      await act(async () => {
        operationResult = await result.current.executeDelegationOperation(
          successOperation,
          'delegate',
          'task-1',
          'user-1'
        );
      });

      expect(operationResult!).toBe('delegated');
      expect(result.current.errorState.error).toBeNull();
    });

    it('should handle delegation operation failure', async () => {
      const { result } = renderHook(() => useDelegationErrorHandling());
      
      const testError = new Error('Permission denied');
      const failingOperation = jest.fn().mockRejectedValue(testError);

      await act(async () => {
        try {
          await result.current.executeDelegationOperation(
            failingOperation,
            'delegate',
            'task-1',
            'user-1'
          );
        } catch (error) {
          expect(error).toBe(testError);
        }
      });

      expect(result.current.errorState.error).toBeTruthy();
    });
  });

  describe('useCommentErrorHandling', () => {
    it('should handle comment errors with context', () => {
      const { result } = renderHook(() => useCommentErrorHandling());
      
      const testError = new Error('Comment failed');

      act(() => {
        result.current.handleCommentError(testError, 'add', 'task-1', 'comment-1');
      });

      expect(result.current.errorState.error).toBeTruthy();
    });

    it('should execute comment operation with retry', async () => {
      const { result } = renderHook(() => useCommentErrorHandling());
      
      const successOperation = jest.fn().mockResolvedValue('commented');

      let operationResult: string;
      await act(async () => {
        operationResult = await result.current.executeCommentOperation(
          successOperation,
          'add',
          'task-1',
          'comment-1'
        );
      });

      expect(operationResult!).toBe('commented');
      expect(result.current.errorState.error).toBeNull();
    });
  });

  describe('useNotificationErrorHandling', () => {
    it('should handle notification errors with context', () => {
      const { result } = renderHook(() => useNotificationErrorHandling());
      
      const testError = new Error('Notification failed');

      act(() => {
        result.current.handleNotificationError(testError, 'mark_read', 'notif-1');
      });

      expect(result.current.errorState.error).toBeTruthy();
    });

    it('should execute notification operation with retry', async () => {
      const { result } = renderHook(() => useNotificationErrorHandling());
      
      const successOperation = jest.fn().mockResolvedValue('marked');

      let operationResult: string;
      await act(async () => {
        operationResult = await result.current.executeNotificationOperation(
          successOperation,
          'mark_read',
          'notif-1'
        );
      });

      expect(operationResult!).toBe('marked');
      expect(result.current.errorState.error).toBeNull();
    });
  });

  describe('useCollaborationErrorManager', () => {
    it('should manage multiple error states', () => {
      const { result } = renderHook(() => useCollaborationErrorManager());
      
      const delegationError = new Error('Delegation failed');
      const commentError = new Error('Comment failed');

      act(() => {
        result.current.delegation.handleDelegationError(
          delegationError,
          'delegate',
          'task-1',
          'user-1'
        );
      });

      expect(result.current.hasErrors).toBe(true);
      expect(result.current.getCurrentError()?.error).toBeTruthy();

      act(() => {
        result.current.comment.handleCommentError(
          commentError,
          'add',
          'task-1',
          'comment-1'
        );
      });

      expect(result.current.hasErrors).toBe(true);

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.hasErrors).toBe(false);
      expect(result.current.getCurrentError()).toBeNull();
    });

    it('should detect retry state', async () => {
      const { result } = renderHook(() => useCollaborationErrorManager());
      
      const retryableError = createCollaborationError(
        'network_error',
        'NETWORK_UNAVAILABLE'
      );
      
      const operation = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      // Execute operation that will fail
      await act(async () => {
        try {
          await result.current.delegation.executeDelegationOperation(
            operation,
            'delegate',
            'task-1',
            'user-1'
          );
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.hasErrors).toBe(true);
      expect(result.current.isRetrying).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('should provide recovery suggestions', () => {
      const { result } = renderHook(() => useErrorHandling());
      
      const testError = createCollaborationError(
        'permission_denied',
        'DELEGATION_PERMISSION_DENIED'
      );

      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.errorState.suggestions).toEqual(['Try again', 'Check permissions']);
    });

    it('should track retry attempts', async () => {
      const { result } = renderHook(() => useErrorHandling());
      
      const retryableError = createCollaborationError(
        'network_error',
        'NETWORK_UNAVAILABLE'
      );
      
      const operation = jest.fn().mockRejectedValue(retryableError);

      // First execution fails
      await act(async () => {
        try {
          await result.current.executeWithErrorHandling(operation, { maxRetries: 0 });
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.errorState.retryCount).toBe(0);

      // Retry fails
      await act(async () => {
        try {
          await result.current.retryLastOperation();
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.errorState.retryCount).toBe(1);
      expect(result.current.errorState.lastRetryAt).toBeTruthy();
    });
  });

  describe('Error Context', () => {
    it('should preserve error context across operations', () => {
      const { result } = renderHook(() => useDelegationErrorHandling());
      
      const testError = new Error('Context test');
      const context = { taskId: 'task-1', userId: 'user-1' };

      act(() => {
        result.current.handleDelegationError(testError, 'delegate', context.taskId, context.userId);
      });

      // Error context should be preserved in the error state
      expect(result.current.errorState.error).toBeTruthy();
    });

    it('should clear context when error is cleared', () => {
      const { result } = renderHook(() => useDelegationErrorHandling());
      
      const testError = new Error('Context test');

      act(() => {
        result.current.handleDelegationError(testError, 'delegate', 'task-1', 'user-1');
      });

      expect(result.current.errorState.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.errorState.error).toBeNull();
    });
  });
});