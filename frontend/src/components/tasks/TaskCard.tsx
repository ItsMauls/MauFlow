'use client';

import React, { useState } from 'react';
import { GlassCard, GlassButton } from '../ui';
import { cn } from '@/lib/utils';

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
    color: 'bg-gray-500/20 text-gray-200',
    icon: '📋'
  },
  doing: {
    label: 'In Progress',
    color: 'bg-blue-500/20 text-blue-200',
    icon: '⚡'
  },
  done: {
    label: 'Completed',
    color: 'bg-green-500/20 text-green-200',
    icon: '✅'
  }
};

const priorityConfig = {
  high: {
    label: 'High',
    color: 'bg-red-500/20 text-red-200 border-red-400/30',
    cardColor: 'border-red-400/30 bg-red-50/10 shadow-red-500/20'
  },
  medium: {
    label: 'Medium',
    color: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30',
    cardColor: 'border-yellow-400/30 bg-yellow-50/10 shadow-yellow-500/20'
  },
  low: {
    label: 'Low',
    color: 'bg-green-500/20 text-green-200 border-green-400/30',
    cardColor: 'border-green-400/30 bg-green-50/10 shadow-green-500/20'
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');

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

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isDueSoon = task.dueDate && 
    new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && 
    task.status !== 'done';

  return (
    <GlassCard
      className={cn(
        'transition-all duration-200',
        priorityConfig[task.priority].cardColor,
        task.status === 'done' && 'opacity-75',
        isOverdue && 'ring-2 ring-red-500/50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {statusConfig[task.status].icon}
          </span>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm flex-1"
              autoFocus
            />
          ) : (
            <h3 className={cn(
              'font-semibold text-white',
              task.status === 'done' && 'line-through'
            )}>
              {task.title}
            </h3>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {task.aiScore && (
            <div className="text-xs text-white/60 bg-purple-500/20 px-2 py-1 rounded-full">
              AI: {task.aiScore}
            </div>
          )}
          <div className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            priorityConfig[task.priority].color
          )}>
            {priorityConfig[task.priority].label}
          </div>
        </div>
      </div>

      {/* Description */}
      {(task.description || isEditing) && (
        <div className="mb-4">
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add description..."
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm resize-none"
              rows={3}
            />
          ) : (
            <p className="text-white/80 text-sm leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <div className={cn(
          'mb-4 text-xs px-2 py-1 rounded-full inline-block',
          isOverdue 
            ? 'bg-red-500/20 text-red-200' 
            : isDueSoon 
              ? 'bg-yellow-500/20 text-yellow-200'
              : 'bg-white/10 text-white/70'
        )}>
          📅 Due: {new Date(task.dueDate).toLocaleDateString()}
          {isOverdue && ' (Overdue)'}
          {isDueSoon && !isOverdue && ' (Due Soon)'}
        </div>
      )}

      {/* Status Selector */}
      <div className="mb-4">
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
          {Object.entries(statusConfig).map(([status, config]) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status as Task['status'])}
              className={cn(
                'flex-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                task.status === status
                  ? config.color
                  : 'text-white/60 hover:text-white/80 hover:bg-white/10'
              )}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-between">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <GlassButton size="sm" variant="success" onClick={handleSaveEdit}>
                Save
              </GlassButton>
              <GlassButton size="sm" variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </GlassButton>
            </>
          ) : (
            <>
              <GlassButton 
                size="sm" 
                variant="secondary" 
                onClick={() => setIsEditing(true)}
              >
                Edit
              </GlassButton>
              
              {/* Priority Quick Actions */}
              <div className="flex gap-1">
                {Object.entries(priorityConfig).map(([priority, config]) => (
                  <button
                    key={priority}
                    onClick={() => handlePriorityChange(priority as Task['priority'])}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-all',
                      task.priority === priority
                        ? config.color.replace('bg-', 'border-').replace('/20', '/50') + ' scale-110'
                        : 'border-white/30 hover:border-white/50'
                    )}
                    title={`Set ${config.label} Priority`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        
        <GlassButton 
          size="sm" 
          variant="danger" 
          onClick={() => onDelete(task.id)}
        >
          Delete
        </GlassButton>
      </div>

      {/* Metadata */}
      <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/50">
        Created: {new Date(task.createdAt).toLocaleDateString()}
        {task.updatedAt !== task.createdAt && (
          <span className="ml-2">
            • Updated: {new Date(task.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </GlassCard>
  );
};