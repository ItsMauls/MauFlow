'use client';

import React from 'react';
import { TaskCard, Task } from './TaskCard';
import { CommentSection } from './CommentSection';

interface TaskCardWithCommentsProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  className?: string;
}

/**
 * Enhanced TaskCard component with integrated comment system
 * Uses the new useComments hook for persistence and optimistic updates
 */
export const TaskCardWithComments: React.FC<TaskCardWithCommentsProps> = ({
  task,
  onUpdate,
  onDelete,
  className
}) => {
  return (
    <div className={className}>
      {/* Existing TaskCard */}
      <TaskCard
        task={task}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
      
      {/* Enhanced Comment System with persistence */}
      <div className="mt-4">
        <CommentSection taskId={task.id} />
      </div>
    </div>
  );
};