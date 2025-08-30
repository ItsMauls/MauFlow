'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

/**
 * Hook for virtual scrolling to handle large lists efficiently
 */
export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index,
      offsetTop: (visibleRange.startIndex + index) * itemHeight
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleRange
  };
};

/**
 * Hook for debouncing expensive operations
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for throttling high-frequency events
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

/**
 * Hook for lazy loading images and content
 */
export const useLazyLoading = (threshold: number = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, hasLoaded]);

  return { elementRef, isVisible, hasLoaded };
};

/**
 * Hook for optimizing file operations with progress tracking
 */
export const useFileOperations = () => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  const uploadFile = useCallback(async (
    file: File,
    uploadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const fileId = `${file.name}-${Date.now()}`;
    const controller = new AbortController();
    abortControllersRef.current[fileId] = controller;

    setIsUploading(true);
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

    try {
      // Simulate chunked upload for large files
      const chunkSize = 1024 * 1024; // 1MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      
      if (file.size > chunkSize) {
        // Chunked upload for large files
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          if (controller.signal.aborted) {
            throw new Error('Upload cancelled');
          }

          const start = chunkIndex * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);

          const formData = new FormData();
          formData.append('chunk', chunk);
          formData.append('chunkIndex', chunkIndex.toString());
          formData.append('totalChunks', totalChunks.toString());
          formData.append('fileName', file.name);

          await fetch(`${uploadUrl}/chunk`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });

          const progress = ((chunkIndex + 1) / totalChunks) * 100;
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          onProgress?.(progress);
        }
      } else {
        // Direct upload for small files
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        onProgress?.(100);
      }

      // Cleanup
      delete abortControllersRef.current[fileId];
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });

      return fileId;
    } catch (error) {
      // Cleanup on error
      delete abortControllersRef.current[fileId];
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const cancelUpload = useCallback((fileId: string) => {
    const controller = abortControllersRef.current[fileId];
    if (controller) {
      controller.abort();
      delete abortControllersRef.current[fileId];
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }
  }, []);

  const cancelAllUploads = useCallback(() => {
    Object.keys(abortControllersRef.current).forEach(fileId => {
      cancelUpload(fileId);
    });
  }, [cancelUpload]);

  return {
    uploadFile,
    cancelUpload,
    cancelAllUploads,
    uploadProgress,
    isUploading
  };
};

/**
 * Hook for memoizing expensive computations
 */
export const useExpensiveComputation = <T, Args extends any[]>(
  computeFn: (...args: Args) => T,
  deps: Args,
  shouldRecompute?: (prevDeps: Args, newDeps: Args) => boolean
): T => {
  const memoizedValue = useMemo(() => {
    return computeFn(...deps);
  }, shouldRecompute ? [shouldRecompute, ...deps] : deps);

  return memoizedValue;
};

/**
 * Hook for optimizing re-renders with shallow comparison
 */
export const useShallowMemo = <T extends Record<string, any>>(obj: T): T => {
  const prevRef = useRef<T>(obj);
  
  return useMemo(() => {
    const prev = prevRef.current;
    const keys = Object.keys(obj);
    const prevKeys = Object.keys(prev);
    
    if (keys.length !== prevKeys.length) {
      prevRef.current = obj;
      return obj;
    }
    
    for (const key of keys) {
      if (obj[key] !== prev[key]) {
        prevRef.current = obj;
        return obj;
      }
    }
    
    return prev;
  }, [obj]);
};

/**
 * Hook for batch processing large datasets
 */
export const useBatchProcessor = <T, R>(
  items: T[],
  processFn: (item: T) => R,
  batchSize: number = 100,
  delay: number = 10
) => {
  const [processedItems, setProcessedItems] = useState<R[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processItems = useCallback(async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setProcessedItems([]);
    setProgress(0);

    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = batch.map(processFn);
      results.push(...batchResults);
      
      setProcessedItems([...results]);
      setProgress((i + batch.length) / items.length * 100);
      
      // Allow UI to update between batches
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setIsProcessing(false);
    setProgress(100);
  }, [items, processFn, batchSize, delay]);

  useEffect(() => {
    processItems();
  }, [processItems]);

  return {
    processedItems,
    isProcessing,
    progress,
    reprocess: processItems
  };
};

/**
 * Hook for monitoring performance metrics
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} - Render #${renderCountRef.current}, Time since last: ${timeSinceLastRender}ms`);
    }
  });

  const measureOperation = useCallback((operationName: string, operation: () => void) => {
    const start = performance.now();
    operation();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}.${operationName} took ${end - start}ms`);
    }
  }, [componentName]);

  return {
    renderCount: renderCountRef.current,
    measureOperation
  };
};