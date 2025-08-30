'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useVirtualScrolling, usePerformanceMonitor } from '@/hooks/usePerformanceOptimization';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  'aria-label'?: string;
}

export const VirtualList = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent,
  'aria-label': ariaLabel
}: VirtualListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { measureOperation } = usePerformanceMonitor('VirtualList');

  const {
    visibleItems,
    totalHeight,
    handleScroll: handleVirtualScroll,
    visibleRange
  } = useVirtualScrolling(items, itemHeight, containerHeight, overscan);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    measureOperation('scroll', () => {
      handleVirtualScroll(event);
      onScroll?.(event.currentTarget.scrollTop);
      
      setIsScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set scrolling to false after scroll ends
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    });
  }, [handleVirtualScroll, onScroll, measureOperation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div 
        className={cn('flex items-center justify-center', className)}
        style={{ height: containerHeight }}
        role="status"
        aria-label="Loading items"
      >
        {loadingComponent || (
          <div className="flex items-center gap-3 text-white/70">
            <div className="w-6 h-6 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />
            <span>Loading items...</span>
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div 
        className={cn('flex items-center justify-center', className)}
        style={{ height: containerHeight }}
        role="status"
        aria-label="No items available"
      >
        {emptyComponent || (
          <div className="text-center text-white/60">
            <p>No items to display</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/30',
        isScrolling && 'scrolling',
        className
      )}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      role="list"
      aria-label={ariaLabel || `List of ${items.length} items`}
      aria-rowcount={items.length}
    >
      {/* Virtual container */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items */}
        {visibleItems.map(({ item, index, offsetTop }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: offsetTop,
              left: 0,
              right: 0,
              height: itemHeight
            }}
            role="listitem"
            aria-rowindex={index + 1}
            className="will-change-transform"
          >
            {renderItem(item, index)}
          </div>
        ))}
        
        {/* Scroll indicators */}
        {isScrolling && (
          <>
            {/* Top indicator */}
            {visibleRange.startIndex > 0 && (
              <div 
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-10"
                aria-hidden="true"
              />
            )}
            
            {/* Bottom indicator */}
            {visibleRange.endIndex < items.length - 1 && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-white/20 to-transparent pointer-events-none z-10"
                aria-hidden="true"
              />
            )}
          </>
        )}
      </div>
      
      {/* Accessibility info */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Showing items {visibleRange.startIndex + 1} to {Math.min(visibleRange.endIndex + 1, items.length)} of {items.length}
      </div>
    </div>
  );
};