'use client';

import React from 'react';

export interface ProjectControlsProps {
  // Filter props
  filterStatus: 'all' | 'todo' | 'doing' | 'done';
  onFilterChange: (status: 'all' | 'todo' | 'doing' | 'done') => void;
  
  // Delegation filter props
  delegationFilter: 'all' | 'delegated' | 'my_delegations' | 'assigned_to_me';
  onDelegationFilterChange: (filter: 'all' | 'delegated' | 'my_delegations' | 'assigned_to_me') => void;
  
  // Sort props
  sortBy: 'created' | 'priority' | 'dueDate' | 'ai';
  onSortChange: (sortBy: 'created' | 'priority' | 'dueDate' | 'ai') => void;
  
  // View props
  viewMode: 'grid' | 'list';
  onViewModeChange: (viewMode: 'grid' | 'list') => void;
  
  // Task count and selection
  filteredCount: number;
  totalCount: number;
  selectedCount?: number;
  
  // Bulk actions
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onBulkDelegate?: () => void;
  canDelegate?: boolean;
}

export const ProjectControls: React.FC<ProjectControlsProps> = ({
  filterStatus,
  onFilterChange,
  delegationFilter,
  onDelegationFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  filteredCount,
  totalCount,
  selectedCount = 0,
  onSelectAll,
  onDeselectAll,
  onBulkDelegate,
  canDelegate = false
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      {/* Left side - Filters and Sort */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Status Filter Select */}
        <div className="flex gap-3 items-center">
          <span className="text-white/90 text-sm font-semibold">
            Status:
          </span>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => onFilterChange(e.target.value as any)}
              className="appearance-none bg-gradient-to-r from-white/15 to-white/10 border border-white/30 rounded-xl px-4 py-2 pr-10 text-white text-sm font-medium backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
            >
              <option value="all" className="bg-gray-800">All</option>
              <option value="todo" className="bg-gray-800">To Do</option>
              <option value="doing" className="bg-gray-800">Doing</option>
              <option value="done" className="bg-gray-800">Done</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Delegation Filter Select */}
        <div className="flex gap-3 items-center">
          <span className="text-white/90 text-sm font-semibold">
            Delegation:
          </span>
          <div className="relative">
            <select
              value={delegationFilter}
              onChange={(e) => onDelegationFilterChange(e.target.value as any)}
              className="appearance-none bg-gradient-to-r from-white/15 to-white/10 border border-white/30 rounded-xl px-4 py-2 pr-10 text-white text-sm font-medium backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
            >
              <option value="all" className="bg-gray-800">All</option>
              <option value="delegated" className="bg-gray-800">Delegated</option>
              <option value="my_delegations" className="bg-gray-800">My Delegations</option>
              <option value="assigned_to_me" className="bg-gray-800">Assigned to Me</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sort Select */}
        <div className="flex gap-3 items-center">
          <span className="text-white/90 text-sm font-semibold">
            Sort:
          </span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="appearance-none bg-gradient-to-r from-white/15 to-white/10 border border-white/30 rounded-xl px-4 py-2 pr-10 text-white text-sm font-medium backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
            >
              <option value="created" className="bg-gray-800">Created Date</option>
              <option value="priority" className="bg-gray-800">Priority</option>
              <option value="dueDate" className="bg-gray-800">Due Date</option>
              <option value="ai" className="bg-gray-800">AI Score</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - View Mode, Bulk Actions, and Task Count */}
      <div className="flex gap-4 items-center">
        {/* View Mode Select */}
        <div className="flex gap-3 items-center">
          <span className="text-white/90 text-sm font-semibold">
            View:
          </span>
          <div className="relative">
            <select
              value={viewMode}
              onChange={(e) => onViewModeChange(e.target.value as any)}
              className="appearance-none bg-gradient-to-r from-white/15 to-white/10 border border-white/30 rounded-xl px-4 py-2 pr-10 text-white text-sm font-medium backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
            >
              <option value="grid" className="bg-gray-800">Grid</option>
              <option value="list" className="bg-gray-800">List</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {canDelegate && (
          <div className="flex gap-2 items-center">
            {selectedCount > 0 ? (
              <>
                <button
                  onClick={onBulkDelegate}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200"
                >
                  Delegate {selectedCount}
                </button>
                <button
                  onClick={onDeselectAll}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-white/15 to-white/10 border border-white/30 text-white text-sm font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
                >
                  Clear
                </button>
              </>
            ) : (
              filteredCount > 0 && (
                <button
                  onClick={onSelectAll}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-white/15 to-white/10 border border-white/30 text-white text-sm font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
                >
                  Select All
                </button>
              )
            )}
          </div>
        )}

        {/* Task Count */}
        <div className="text-white/60 text-sm">
          {filteredCount} of {totalCount} tasks
          {selectedCount > 0 && (
            <span className="ml-2 text-blue-400">
              ({selectedCount} selected)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};