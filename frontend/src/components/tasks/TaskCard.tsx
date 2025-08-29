'use client';

import React, { useState } from 'react';
import { GlassCard } from '../ui';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  aiScore?: number;
}

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  className?: string;
}

const statusConfig = {
  todo: {
    label: 'To Do',
    color: 'bg-gradient-to-r from-slate-400/20 to-gray-400/20 text-slate-100 border-slate-400/30',
    icon: '📝',
    gradient: 'from-slate-400/10 to-gray-400/10'
  },
  doing: {
    label: 'In Progress',
    color: 'bg-gradient-to-r from-zinc-400/20 to-slate-400/20 text-zinc-100 border-zinc-400/30',
    icon: '⚡',
    gradient: 'from-zinc-400/10 to-slate-400/10'
  },
  done: {
    label: 'Completed',
    color: 'bg-gradient-to-r from-gray-300/20 to-slate-300/20 text-gray-100 border-gray-300/30',
    icon: '✅',
    gradient: 'from-gray-300/10 to-slate-300/10'
  }
};

const priorityConfig = {
  high: {
    label: 'High',
    color: 'bg-gradient-to-r from-white/25 to-gray-200/25 text-white border-white/40',
    cardColor: 'border-white/30 bg-gradient-to-br from-white/12 to-gray-100/8 shadow-xl shadow-white/15',
    pill: 'bg-gradient-to-r from-white/80 to-gray-200/80'
  },
  medium: {
    label: 'Medium', 
    color: 'bg-gradient-to-r from-gray-400/25 to-slate-400/25 text-gray-100 border-gray-400/40',
    cardColor: 'border-gray-400/30 bg-gradient-to-br from-gray-500/10 to-slate-500/8 shadow-xl shadow-gray-500/15',
    pill: 'bg-gradient-to-r from-gray-400 to-slate-400'
  },
  low: {
    label: 'Low',
    color: 'bg-gradient-to-r from-slate-400/25 to-zinc-400/25 text-slate-100 border-slate-400/40',
    cardColor: 'border-slate-400/30 bg-gradient-to-br from-slate-500/10 to-zinc-500/8 shadow-xl shadow-slate-500/15',
    pill: 'bg-gradient-to-r from-slate-400 to-zinc-400'
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  className
}) => {
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');

  // Swipe gestures for mobile
  const swipeRef = useSwipeGesture({
    onSwipeRight: () => {
      // Mark as done on swipe right
      if (task.status !== 'done') {
        handleStatusChange('done');
      }
    },
    onSwipeLeft: () => {
      // Delete on swipe left (with confirmation)
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
    onUpdate(task.id, {
      title: editTitle,
      description: editDescription
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isDueSoon = task.dueDate && 
    new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && 
    task.status !== 'done';

  return (
    <div
      ref={swipeRef}
      data-task-id={task.id}
      className={cn(
        'group relative rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer hover-lift swipe-indicator',
        priorityConfig[task.priority].cardColor,
        task.status === 'done' && 'opacity-80 scale-95',
        isOverdue && 'ring-2 ring-red-400/60 animate-pulse',
        'transform-gpu', // Enable hardware acceleration
        className
      )}
      onMouseEnter={() => setShowSwipeHint(true)}
      onMouseLeave={() => setShowSwipeHint(false)}
    >
      {/* Mobile swipe hints */}
      {showSwipeHint && (
        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none md:hidden">
          <div className="bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
            ← Swipe to complete
          </div>
          <div className="bg-red-500/20 text-red-200 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
            Swipe to delete →
          </div>
        </div>
      )}
      {/* Glowing border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative z-10 p-6">
        {/* Traffic Light Header */}
        <div className="flex items-start justify-between mb-4">
          {/* Traffic Light Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-all duration-200 hover:scale-110 shadow-lg shadow-red-400/30 hover:shadow-red-500/50"
              title="Delete Task"
            />
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                'w-3 h-3 rounded-full transition-all duration-200 hover:scale-110 shadow-lg',
                isEditing 
                  ? 'bg-yellow-500 shadow-yellow-500/50' 
                  : 'bg-yellow-400 hover:bg-yellow-500 shadow-yellow-400/30 hover:shadow-yellow-500/50'
              )}
              title={isEditing ? "Cancel Edit" : "Edit Task"}
            />
            <button
              onClick={() => handleStatusChange('done')}
              className={cn(
                'w-3 h-3 rounded-full transition-all duration-200 hover:scale-110 shadow-lg',
                task.status === 'done' 
                  ? 'bg-green-500 shadow-green-500/50' 
                  : 'bg-green-400 hover:bg-green-500 shadow-green-400/30 hover:shadow-green-500/50'
              )}
              title="Mark as Done"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {task.aiScore && (
              <div className="text-xs text-white bg-gradient-to-r from-gray-500/30 to-slate-500/30 border border-gray-400/40 px-3 py-1 rounded-full backdrop-blur-sm">
                🤖 {task.aiScore}
              </div>
            )}
            <div className={cn(
              'relative px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm',
              priorityConfig[task.priority].color
            )}>
              <div className={cn(
                'absolute inset-0 rounded-full opacity-20',
                priorityConfig[task.priority].pill
              )} />
              <span className="relative z-10">
                {priorityConfig[task.priority].label}
              </span>
            </div>
          </div>
        </div>

        {/* Task Content */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl transform group-hover:scale-110 transition-transform duration-200 inline-block">
              {statusConfig[task.status].icon}
            </span>
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 bg-white/15 border border-white/30 rounded-xl px-3 py-2 text-white text-lg font-bold backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all duration-200"
                autoFocus
                onBlur={handleSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
            ) : (
              <h3 className={cn(
                'font-bold text-white text-lg leading-tight flex-1',
                task.status === 'done' && 'line-through opacity-75'
              )}>
                {task.title}
              </h3>
            )}
            {task.status === 'done' && (
              <div className="w-6 h-6 bg-gradient-to-r from-white/80 to-gray-200/80 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-xs">✨</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {(task.description || isEditing) && (
          <div className="mb-4">
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add some details..."
                className="w-full bg-white/15 border border-white/30 rounded-xl px-4 py-3 text-white text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all duration-200 resize-none"
                rows={3}
                onBlur={handleSaveEdit}
              />
            ) : (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white/90 text-sm leading-relaxed">
                  {task.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div className="mb-4">
            <div className={cn(
              'inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium border backdrop-blur-sm',
              isOverdue 
                ? 'bg-gradient-to-r from-white/25 to-gray-200/25 text-white border-white/40 animate-pulse' 
                : isDueSoon 
                  ? 'bg-gradient-to-r from-gray-400/25 to-slate-400/25 text-gray-100 border-gray-400/40'
                  : 'bg-gradient-to-r from-slate-500/15 to-zinc-500/15 text-slate-100 border-slate-400/30'
            )}>
              <span className="text-lg">
                {isOverdue ? '⚠️' : isDueSoon ? '⏰' : '📅'}
              </span>
              <span>
                Due: {new Date(task.dueDate).toLocaleDateString()}
                {isOverdue && ' (Overdue!)'}
                {isDueSoon && !isOverdue && ' (Due Soon)'}
              </span>
            </div>
          </div>
        )}

        {/* Status Selector */}
        <div className="mb-4">
          <div className="flex gap-2 p-2 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status as Task['status'])}
                className={cn(
                  'flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 border',
                  task.status === status
                    ? cn(config.color, 'shadow-lg')
                    : 'text-white/70 hover:text-white border-white/20 hover:bg-white/15'
                )}
              >
                <span className="flex items-center justify-center gap-1">
                  <span className="text-sm">{config.icon}</span>
                  <span className="hidden sm:inline">{config.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Priority Controls */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-medium">Priority:</span>
            <div className="flex gap-2">
              {Object.entries(priorityConfig).map(([priority, config]) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityChange(priority as Task['priority'])}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all duration-200 transform hover:scale-110 active:scale-95',
                    task.priority === priority
                      ? `${config.pill} border-white/50 shadow-lg scale-110`
                      : 'border-white/40 hover:border-white/70 bg-white/10'
                  )}
                  title={`Set ${config.label} Priority`}
                >
                  <div className={cn(
                    'w-full h-full rounded-full',
                    task.priority !== priority && 'bg-gradient-to-br from-white/20 to-white/5'
                  )} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Metadata */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                🕒 Created: {new Date(task.createdAt).toLocaleDateString()}
              </span>
              {task.updatedAt && task.updatedAt !== task.createdAt && (
                <span className="flex items-center gap-1">
                  • ✏️ Updated: {new Date(task.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {task.status === 'done' && (
              <div className="flex items-center gap-1 text-emerald-300">
                <span>🎉 Completed!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};