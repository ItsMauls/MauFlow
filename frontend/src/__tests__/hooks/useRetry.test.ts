/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useRetry } from '@/hooks/useRetry';

describe('useRetry Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should execute function successfully on first try', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useRetry(mockFn));

    let resolvedValue: string;
    await act(async () => {
      resolvedValue = await result.current.execute('arg1', 'arg2');
    });

    expect(resolvedValue!).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
  });

  it('should retry on failure and eventually succeed', async () => {
    let attemptCount = 0;
    const mockFn = jest.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.reject(new Error('Temporary failure'));
      }
      return Promise.resolve('success');
    });

    const { result } = renderHook(() => useRetry(mockFn, { maxRetries: 3, retryDelay: 100 }));

    let resolvedValue: string;
    const executePromise = act(async () => {
      return result.current.execute();
    });

    // Fast-forward through retry delays
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    resolvedValue = await executePromise;

    expect(resolvedValue!).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(result.current.retryCount).toBe(0); // Reset after success
    expect(result.current.isRetrying).toBe(false);
  });

  it('should fail after max retries', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));
    const onMaxRetriesReached = jest.fn();

    const { result } = renderHook(() => 
      useRetry(mockFn, { 
        maxRetries: 2, 
        retryDelay: 100,
        onMaxRetriesReached 
      })
    );

    let error: Error;
    const executePromise = act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        error = err as Error;
      }
    });

    // Fast-forward through retry delays
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await executePromise;

    expect(error!.message).toBe('Persistent failure');
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(onMaxRetriesReached).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.isRetrying).toBe(false);
  });

  it('should use exponential backoff', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
    const { result } = renderHook(() => 
      useRetry(mockFn, { 
        maxRetries: 3, 
        retryDelay: 100,
        backoffMultiplier: 2 
      })
    );

    const executePromise = act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        // Expected to fail
      }
    });

    // First retry after 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Second retry after 200ms (100 * 2^1)
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Third retry after 400ms (100 * 2^2)
    act(() => {
      jest.advanceTimersByTime(400);
    });

    await executePromise;

    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should call onRetry callback', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
    const onRetry = jest.fn();

    const { result } = renderHook(() => 
      useRetry(mockFn, { 
        maxRetries: 2, 
        retryDelay: 100,
        onRetry 
      })
    );

    const executePromise = act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        // Expected to fail
      }
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await executePromise;

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('should reset state correctly', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
    const { result } = renderHook(() => useRetry(mockFn, { maxRetries: 1 }));

    // First execution that fails
    await act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        // Expected to fail
      }
    });

    expect(result.current.lastError).toBeTruthy();

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('should handle concurrent executions', async () => {
    let callCount = 0;
    const mockFn = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.reject(new Error('Failure'));
      }
      return Promise.resolve(`success-${callCount}`);
    });

    const { result } = renderHook(() => useRetry(mockFn, { maxRetries: 3, retryDelay: 50 }));

    // Start two concurrent executions
    const promise1 = act(async () => result.current.execute('arg1'));
    const promise2 = act(async () => result.current.execute('arg2'));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(result1).toBe('success-3');
    expect(result2).toBe('success-4');
    expect(mockFn).toHaveBeenCalledTimes(4);
  });

  it('should clear timeout on reset', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
    const { result } = renderHook(() => useRetry(mockFn, { maxRetries: 3, retryDelay: 1000 }));

    // Start execution
    const executePromise = act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        // Expected to fail initially
      }
    });

    // Let it fail once and start retry
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.isRetrying).toBe(true);

    // Reset while retrying
    act(() => {
      result.current.reset();
    });

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.retryCount).toBe(0);

    // Advance time to see if retry would have happened
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await executePromise;

    // Should not have retried after reset
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle non-Error rejections', async () => {
    const mockFn = jest.fn().mockRejectedValue('String error');
    const { result } = renderHook(() => useRetry(mockFn, { maxRetries: 1 }));

    let error: Error;
    await act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        error = err as Error;
      }
    });

    expect(error!.message).toBe('String error');
    expect(result.current.lastError).toBeInstanceOf(Error);
  });
});