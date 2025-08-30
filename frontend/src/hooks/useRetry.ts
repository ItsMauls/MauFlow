'use client';

import { useState, useCallback, useRef } from 'react';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

interface UseRetryReturn<T> {
  execute: (...args: any[]) => Promise<T>;
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  reset: () => void;
}

/**
 * Custom hook for implementing retry logic with exponential backoff
 */
export function useRetry<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: RetryOptions = {}
): UseRetryReturn<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    onRetry,
    onMaxRetriesReached
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
    setLastError(null);
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const execute = useCallback(async (...args: any[]): Promise<T> => {
    const attemptExecution = async (attempt: number): Promise<T> => {
      try {
        const result = await asyncFunction(...args);
        reset();
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setLastError(err);
        
        if (attempt >= maxRetries) {
          setIsRetrying(false);
          onMaxRetriesReached?.(err);
          throw err;
        }

        setRetryCount(attempt);
        setIsRetrying(true);
        onRetry?.(attempt, err);

        const delay = retryDelay * Math.pow(backoffMultiplier, attempt - 1);
        
        return new Promise<T>((resolve, reject) => {
          retryTimeoutRef.current = setTimeout(async () => {
            try {
              const result = await attemptExecution(attempt + 1);
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          }, delay);
        });
      }
    };

    return attemptExecution(1);
  }, [asyncFunction, maxRetries, retryDelay, backoffMultiplier, onRetry, onMaxRetriesReached, reset]);

  return {
    execute,
    isRetrying,
    retryCount,
    lastError,
    reset
  };
}