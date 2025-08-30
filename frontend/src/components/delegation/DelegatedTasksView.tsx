'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useDelegatedTasks } from '@/hooks/useDelegatedTasks';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { EmptyState } from '@/components/fallback/EmptyState';

type SortOption = 'delegatedAt' | 'dueDate' | 'priority' | 'status' | 'title';
type FilterStatus = 'all' | 'active' | 'completed' | 'overdue';

interface DelegatedTasksViewProps {
  className?: string;
  showHeader?: boolean;
  maxHeight?: string;
}

export const DelegatedTasksView: React.FC<DelegatedTasksViewProps> = ({
  className,
  showHeader = true,
  maxHeight = '600px'
}) => {
  const {
    delegatedTasks,
    filteredAndSortedTasks,
    isLoading,
    sortBy,
    sortDirection,
    filterStatus,
    filterDelegator,
    searchQuery,
    setFilterStatus,
    setFilterDelegator,
    setSearchQuery,
    handleSortChange,
    clearFilters,
    handleTaskStatusUpdate,
    getDelegationHistory,
    uniqueDelegators,
    stats,
    getMemberById
  } = useDelegatedTasks();

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-white/70">Loading delegated tasks...</span>
      </div>
    );
  }

  if (delegatedTasks.length === 0) {
    return (
      <div className={className}>
        {showHeader && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">My Delegated Tasks</h2>
            <p className="text-white/70">Tasks assigned to you by team members</p>
          </div>
        )}
        <EmptyState
          title="No Delegated Tasks"
          description="You don't have any tasks assigned to you yet."
          icon="📋"
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">My Delegated Tasks</h2>
            <p className="text-white/70">
              {filteredAndSortedTasks.length} of {delegatedTasks.length} tasks
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {stats.active}
              </div>
              <div className="text-xs text-white/60">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {stats.completed}
              </div>
              <div className="text-xs text-white/60">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">
                {stats.overdue}
              </div>
              <div className="text-xs text-white/60">Overdue</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search tasks, delegators, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Delegator Filter */}
          <div>
            <select
              value={filterDelegator}
              onChange={(e) => setFilterDelegator(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            >
              <option value="all">All Delegators</option>
              {uniqueDelegators.map(delegator => (
                <option key={delegator!.id} value={delegator!.id}>
                  {delegator!.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
          <span className="text-white/70 text-sm font-medium">Sort by:</span>
          {[
            { key: 'delegatedAt', label: 'Date Assigned' },
            { key: 'dueDate', label: 'Due Date' },
            { key: 'priority', label: 'Priority' },
            { key: 'status', label: 'Status' },
            { key: 'title', label: 'Title' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSortChange(key as SortOption)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200',
                sortBy === key
                  ? 'bg-blue-500/20 text-blue-200 border-blue-400/30'
                  : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20 hover:text-white'
              )}
            >
              {label}
              {sortBy === key && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div 
        className="space-y-4 overflow-y-auto"
        style={{ maxHeight }}
      >
        {filteredAndSortedTasks.map((task) => {
          const isOverdue = task.dueDate && 
            new Date(task.dueDate) < new Date() && 
            task.status !== 'done';
          const isDueSoon = task.dueDate && 
            new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && 
            task.status !== 'done';

          return (
            <div
              key={task.id}
              className={cn(
                'bg-white/5 rounded-xl p-6 border backdrop-blur-sm transition-all duration-300 hover:bg-white/10',
                isOverdue 
                  ? 'border-red-400/50 bg-red-500/5' 
                  : isDueSoon 
                    ? 'border-yellow-400/50 bg-yellow-500/5'
                    : 'border-white/10',
                task.status === 'done' && 'opacity-75'
              )}
            >
              {/* Task Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={cn(
                      'text-lg font-semibold text-white',
                      task.status === 'done' && 'line-through opacity-75'
                    )}>
                      {task.title}
                    </h3>
                    
                    {/* Priority Badge */}
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      task.priority === 'high' 
                        ? 'bg-red-500/20 text-red-200 border border-red-400/30'
                        : task.priority === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-400/30'
                          : 'bg-green-500/20 text-green-200 border border-green-400/30'
                    )}>
                      {task.priority.toUpperCase()}
                    </span>

                    {/* Status Badge */}
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      task.status === 'todo' 
                        ? 'bg-gray-500/20 text-gray-200 border border-gray-400/30'
                        : task.status === 'doing'
                          ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
                          : 'bg-green-500/20 text-green-200 border border-green-400/30'
                    )}>
                      {task.status === 'todo' ? 'TO DO' : task.status === 'doing' ? 'IN PROGRESS' : 'COMPLETED'}
                    </span>

                    {isOverdue && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-200 border border-red-400/30 animate-pulse">
                        OVERDUE
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-white/70 text-sm mb-3">{task.description}</p>
                  )}
                </div>

                {/* Task Actions */}
                <div className="flex items-center gap-2">
                  {task.status !== 'done' && (
                    <>
                      {task.status === 'todo' && (
                        <button
                          onClick={() => handleTaskStatusUpdate(task.id, 'doing')}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30 hover:bg-blue-500/30 transition-all duration-200"
                        >
                          Start
                        </button>
                      )}
                      {task.status === 'doing' && (
                        <button
                          onClick={() => handleTaskStatusUpdate(task.id, 'done')}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-200 border border-green-400/30 hover:bg-green-500/30 transition-all duration-200"
                        >
                          Complete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Delegation Info */}
              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-xs">{task.delegator?.avatar || '👤'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Assigned by {task.delegator?.name}
                      </p>
                      <p className="text-xs text-white/60">
                        {new Date(task.delegation.delegatedAt).toLocaleDateString()} at{' '}
                        {new Date(task.delegation.delegatedAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      task.delegation.status === 'active'
                        ? 'bg-blue-500/20 text-blue-200'
                        : task.delegation.status === 'completed'
                          ? 'bg-green-500/20 text-green-200'
                          : 'bg-gray-500/20 text-gray-200'
                    )}>
                      {task.delegation.status.toUpperCase()}
                    </div>
                    {task.delegation.priority === 'urgent' && (
                      <div className="text-xs text-red-300 mt-1">🔥 Urgent</div>
                    )}
                  </div>
                </div>

                {task.delegation.note && (
                  <div className="mt-2 p-2 bg-white/5 rounded border-l-2 border-blue-400/50">
                    <p className="text-sm text-white/80 italic">"{task.delegation.note}"</p>
                  </div>
                )}
              </div>

              {/* Task Metadata */}
              <div className="flex items-center justify-between text-xs text-white/60">
                <div className="flex items-center gap-4">
                  {task.dueDate && (
                    <span className={cn(
                      'flex items-center gap-1',
                      isOverdue ? 'text-red-300' : isDueSoon ? 'text-yellow-300' : ''
                    )}>
                      📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  
                  {task.commentCount > 0 && (
                    <span className="flex items-center gap-1">
                      💬 {task.commentCount} comment{task.commentCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  
                  <span className="flex items-center gap-1">
                    👥 {task.collaborators.length} collaborator{task.collaborators.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                  {task.updatedAt && task.updatedAt !== task.createdAt && (
                    <span>• Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Delegation History (if multiple delegations) */}
              {(() => {
                const history = getDelegationHistory(task.id);
                if (history.length > 1) {
                  return (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-white/70 hover:text-white transition-colors">
                          Delegation History ({history.length} entries)
                        </summary>
                        <div className="mt-2 space-y-2">
                          {history.map((hist, index) => {
                            const delegator = getMemberById(hist.delegatorId);
                            return (
                              <div key={hist.id} className="flex items-center gap-2 text-xs text-white/60">
                                <div className="w-2 h-2 bg-white/30 rounded-full" />
                                <span>
                                  {delegator?.name} • {new Date(hist.delegatedAt).toLocaleDateString()} • 
                                  Status: {hist.status}
                                  {hist.note && ` • "${hist.note}"`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredAndSortedTasks.length === 0 && delegatedTasks.length > 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-white mb-2">No tasks found</h3>
          <p className="text-white/60">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-lg hover:bg-blue-500/30 transition-all duration-200"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};