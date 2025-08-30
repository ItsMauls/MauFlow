'use client';

import React from 'react';

export interface TaskControlsProps {
  // Filter props
  filterStatus: 'all' | 'todo' | 'doing' | 'done';
  onFilterChange: (status: 'all' | 'todo' | 'doing' | 'done') => void;
  
  // Sort props
  sortBy: 'created' | 'priority' | 'dueDate' | 'ai';
  onSortChange: (sortBy: 'created' | 'priority' | 'dueDate' | 'ai') => void;
  
  // View props
  viewMode: 'grid' | 'list' | 'calendar';
  onViewModeChange: (viewMode: 'grid' | 'list' | 'calendar') => void;
  
  // Task count
  filteredCount: number;
  totalCount: number;
}

export const TaskControls: React.FC<TaskControlsProps> = ({
  filterStatus,
  onFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  filteredCount,
  totalCount
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 my-5 items-start lg:items-center justify-between">
      {/* Left side - Filter and Sort */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Status Filter Select */}
        <div className="flex gap-3 items-center">
          <span className="text-white/90 text-sm font-semibold">
            Filter:
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

      {/* Right side - View Mode and Task Count */}
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
              <option value="calendar" className="bg-gray-800">Calendar</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Task Count */}
        <div className="text-white/60 text-sm">
          {filteredCount} of {totalCount} tasks
        </div>
      </div>
    </div>
  );
};