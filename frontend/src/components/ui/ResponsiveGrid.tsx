'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

const gapSizes = {
  sm: 'gap-3',
  md: 'gap-4 md:gap-6',
  lg: 'gap-6 md:gap-8',
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
}) => {
  const gridCols = cn(
    // Mobile columns
    columns.mobile === 1 && 'grid-cols-1',
    columns.mobile === 2 && 'grid-cols-2',
    columns.mobile === 3 && 'grid-cols-3',
    // Tablet columns
    columns.tablet === 1 && 'md:grid-cols-1',
    columns.tablet === 2 && 'md:grid-cols-2',
    columns.tablet === 3 && 'md:grid-cols-3',
    columns.tablet === 4 && 'md:grid-cols-4',
    // Desktop columns
    columns.desktop === 1 && 'lg:grid-cols-1',
    columns.desktop === 2 && 'lg:grid-cols-2',
    columns.desktop === 3 && 'lg:grid-cols-3',
    columns.desktop === 4 && 'lg:grid-cols-4',
    columns.desktop === 5 && 'lg:grid-cols-5',
  );

  return (
    <div
      className={cn(
        'grid',
        gridCols,
        gapSizes[gap],
        className
      )}
    >
      {children}
    </div>
  );
};