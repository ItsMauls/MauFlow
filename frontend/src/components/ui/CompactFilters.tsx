'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface CompactFiltersProps {
  sortOptions?: FilterOption[];
  viewOptions?: FilterOption[];
  statusOptions?: FilterOption[];
  onSortChange?: (value: string) => void;
  onViewChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  currentSort?: string;
  currentView?: string;
  currentStatus?: string;
  className?: string;
}

export const CompactFilters: React.FC<CompactFiltersProps> = ({
  sortOptions = [
    { value: 'recent', label: 'Recent' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'name', label: 'Name' }
  ],
  viewOptions = [
    { value: 'grid', label: 'Grid' },
    { value: 'list', label: 'List' },
    { value: 'compact', label: 'Compact' }
  ],
  statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Done' }
  ],
  onSortChange,
  onViewChange,
  onStatusChange,
  currentSort = 'recent',
  currentView = 'grid',
  currentStatus = 'all',
  className
}) => {
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {/* Sort Filter */}
      {sortOptions.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-white/60 text-xs">Sort:</span>
          <select
            value={currentSort}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/50 hover:bg-white/15 transition-all duration-200"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* View Filter */}
      {viewOptions.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-white/60 text-xs">View:</span>
          <select
            value={currentView}
            onChange={(e) => onViewChange?.(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/50 hover:bg-white/15 transition-all duration-200"
          >
            {viewOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status Filter */}
      {statusOptions.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-white/60 text-xs">Status:</span>
          <select
            value={currentStatus}
            onChange={(e) => onStatusChange?.(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/50 hover:bg-white/15 transition-all duration-200"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                {option.label} {option.count !== undefined && `(${option.count})`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};