'use client';

import React, { useState } from 'react';
import { GlassButton } from '../ui';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { Task } from './TaskCard';

interface TaskListItemProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  size: 'small' | 'medium' | 'large';
  className?: string;
}

const statusConfig = {
  todo: {
    label: 'To Do',
    color: 'bg-gradient-to-r from-slate-400/20 to-gray-400/20 text-slate-100 border-slate-400/30',
    dot: 'bg-slate-400'
  },
  doing: {
    label: 'In Progress',
    color: 'bg-gradient-to-r from-zinc-400/20 to-slate-400/20 text-zinc-100 border-zinc-400/30',
    dot: 'bg-zinc-400'
  },
  done: {
    label: 'Completed',
    color: 'bg-gradient-to-r from-gray-300/20 to-slate-300/20 text-gray-100 border-gray-300/30',
    dot: 'bg-gray-300'
  }
};

const priorityConfig = {
  high: {
    label: 'High',
    color: 'text-white',
    dot: 'bg-white'
  },
  medium: {
    label: 'Medium', 
    color: 'text-gray-300',
    dot: 'bg-gray-400'
  },
  low: {
    label: 'Low',
    color: 'text-slate-300',
    dot: 'bg-slate-400'
  }
};

const sizeConfig = {
  small: {
    container: 'py-3 px-4',
    title: 'text-sm',
    description: 'text-xs',
    meta: 'text-xs',
    button: 'px-2 py-1 text-xs',
    dot: 'w-2 h-2'
  },
  medium: {
    container: 'py-4 px-5',
    title: 'text-base',
    description: 'text-sm',
    meta: 'text-xs',
    button: 'px-3 py-1.5 text-sm',
    dot: 'w-3 h-3'
  },
  large: {
    container: 'py-5 px-6',
    title: 'text-lg',
    description: 'text-base',
    meta: 'text-sm',
    button: 'px-4 py-2 text-sm',
    dot: 'w-4 h-4'
  }
};

export const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  onUpdate,
  onDelete,
  size,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showActions, setShowActions] = useState(false);

  // Swipe gestures for mobile
  const swipeRef = useSwipeGesture({
    onSwipeRight: () => {
      if (task.status !== 'done') {
        handleStatusChange('done');
      }
    },
    onSwipeLeft: () => {
      if (confirm('Delete this task?')) {
        onDelete(task.id);
      }
    },
    threshold: 100
  });

  const handleStatusChange = (newStatus: Task['status']) => {
    onUpdate(task.id, { status: newStatus });
  };

  const handlePriorityChange = (newPriority: Task['priority']) => {
    onUpdate(task.id, { priority: newPriority });
  };

  const handleSaveEdit = () => {
    onUpdate(task.id, { title: editTitle });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isDueSoon = task.dueDate && 
    new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && 
    task.status !== 'done';

  const sizeStyles = sizeConfig[size];

  return (
    <div
      ref={swipeRef}
      data-task-id={task.id}
      className={cn(
        'group relative rounded-xl border border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:shadow-lg',
        task.status === 'done' && 'opacity-75',
        isOverdue && 'ring-1 ring-white/40 animate-pulse',
        sizeStyles.container,
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className={cn(
            'rounded-full transition-all duration-200',
            sizeStyles.dot,
            statusConfig[task.status].dot
          )} />
          <div className="w-4 h-4 rounded bg-white/30"></div>
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-white/15 border border-white/30 rounded-lg px-3 py-1 text-white text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
                  autoFocus
                  onBlur={handleSaveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
              ) : (
                <h3 className={cn(
                  'font-semibold text-white truncate',
                  task.status === 'done' && 'line-through opacity-75',
                  sizeStyles.title
                )}>
                  {task.title}
                </h3>
              )}
              
              {task.description && size !== 'small' && (
                <p className={cn(
                  'text-white/70 mt-1 line-clamp-2',
                  sizeStyles.description
                )}>
                  {task.description}
                </p>
              )}
            </div>

            {/* Priority & Meta Info */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Priority Indicator */}
              <div className="flex items-center gap-1">
                <div className={cn(
                  'rounded-full',
                  sizeStyles.dot,
                  priorityConfig[task.priority].dot
                )} />
                {size === 'large' && (
                  <span className={cn(
                    'font-medium',
                    sizeStyles.meta,
                    priorityConfig[task.priority].color
                  )}>
                    {priorityConfig[task.priority].label}
                  </span>
                )}
              </div>

              {/* AI Score */}
              {task.aiScore && size !== 'small' && (
                <div className={cn(
                  'text-white/60 bg-white/10 px-2 py-1 rounded-full',
                  sizeStyles.meta
                )}>
                  AI {task.aiScore}
                </div>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full',
                  sizeStyles.meta,
                  isOverdue 
                    ? 'bg-white/20 text-white animate-pulse' 
                    : isDueSoon 
                      ? 'bg-white/15 text-white/80'
                      : 'bg-white/10 text-white/70'
                )}>
                  <div className="w-3 h-3 rounded bg-white/40"></div>
                  {size === 'large' && (
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={cn(
          'flex items-center gap-2 transition-all duration-200',
          showActions ? 'opacity-100' : 'opacity-0 md:opacity-100'
        )}>
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className={cn(
                  'bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 hover:scale-105',
                  sizeStyles.button
                )}
              >
                ✓
              </button>
              <button
                onClick={handleCancelEdit}
                className={cn(
                  'bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 hover:scale-105',
                  sizeStyles.button
                )}
              >
                ❌
              </button>
            </>
          ) : (
            <>
              {/* Status Toggle */}
              <button
                onClick={() => {
                  const statuses: Task['status'][] = ['todo', 'doing', 'done'];
                  const currentIndex = statuses.indexOf(task.status);
                  const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                  handleStatusChange(nextStatus);
                }}
                className={cn(
                  'bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 hover:scale-105',
                  sizeStyles.button
                )}
                title="Change Status"
              >
                ●
              </button>

              {/* Edit */}
              <button
                onClick={() => setIsEditing(true)}
                className={cn(
                  'bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 hover:scale-105',
                  sizeStyles.button
                )}
                title="Edit Task"
              >
                ✏️
              </button>

              {/* Priority Toggle */}
              <button
                onClick={() => {
                  const priorities: Task['priority'][] = ['low', 'medium', 'high'];
                  const currentIndex = priorities.indexOf(task.priority);
                  const nextPriority = priorities[(currentIndex + 1) % priorities.length];
                  handlePriorityChange(nextPriority);
                }}
                className={cn(
                  'bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 hover:scale-105',
                  sizeStyles.button
                )}
                title="Change Priority"
              >
                <div className={cn(
                  'rounded-full',
                  size === 'small' ? 'w-2 h-2' : 'w-3 h-3',
                  priorityConfig[task.priority].dot
                )} />
              </button>

              {/* Delete */}
              <button
                onClick={() => onDelete(task.id)}
                className={cn(
                  'bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 hover:scale-105',
                  sizeStyles.button
                )}
                title="Delete Task"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile swipe hints */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 md:hidden">
        <div className="bg-white/20 text-white px-2 py-1 rounded text-xs animate-pulse">
          ← Complete
        </div>
        <div className="bg-white/20 text-white px-2 py-1 rounded text-xs animate-pulse">
          Delete →
        </div>
      </div>
    </div>
  );
};