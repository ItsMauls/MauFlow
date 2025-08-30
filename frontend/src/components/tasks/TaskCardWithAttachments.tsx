'use client';

import React from 'react';
import { TaskCard, Task } from './TaskCard';
import { CommentSection } from './CommentSection';
import { FileAttachment } from './FileAttachment';
import { useAttachments } from '@/hooks/useAttachments';

interface TaskCardWithAttachmentsProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  className?: string;
}

/**
 * Enhanced TaskCard component with integrated comment system and file attachments
 * Combines TaskCard, CommentSection, and FileAttachment components
 */
export const TaskCardWithAttachments: React.FC<TaskCardWithAttachmentsProps> = ({
  task,
  onUpdate,
  onDelete,
  className
}) => {
  const {
    attachments,
    addAttachment,
    removeAttachment,
    downloadAttachment,
    isLoading,
    error
  } = useAttachments(task.id);

  return (
    <div className={className}>
      {/* Existing TaskCard */}
      <TaskCard
        task={task}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
      
      {/* Enhanced Features Container */}
      <div className="mt-4 space-y-4">
        {/* File Attachment System */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
          {error && (
            <div className="mb-3 p-2 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <FileAttachment
            taskId={task.id}
            attachments={attachments}
            onAttachmentAdd={addAttachment}
            onAttachmentRemove={removeAttachment}
            onAttachmentDownload={downloadAttachment}
          />
        </div>

        {/* Comment System */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
          <CommentSection taskId={task.id} />
        </div>
      </div>
    </div>
  );
};