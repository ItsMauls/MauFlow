'use client';

import React, { useState } from 'react';
import { TaskCard, Task } from './TaskCard';
import { CommentSection } from './CommentSection';
import { FileAttachment } from './FileAttachment';
import { useComments } from '@/hooks/useComments';
import { useAttachments } from '@/hooks/useAttachments';
import { cn } from '@/lib/utils';

interface EnhancedTaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  className?: string;
}

/**
 * Enhanced TaskCard component with integrated comment system and file attachments
 * Features:
 * - Expandable/collapsible sections for comments and files
 * - Visual indicators for tasks with comments or attachments
 * - Responsive design for enhanced task card features
 * - Integrated error handling and loading states
 */
export const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  className
}) => {
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [isAttachmentsExpanded, setIsAttachmentsExpanded] = useState(false);

  // Use hooks for comments and attachments
  const { comments, isLoading: commentsLoading } = useComments(task.id);
  const {
    attachments,
    addAttachment,
    removeAttachment,
    downloadAttachment,
    isLoading: attachmentsLoading,
    error: attachmentsError
  } = useAttachments(task.id);

  // Calculate counts for visual indicators
  const commentCount = comments.length;
  const attachmentCount = attachments.length;
  const hasEnhancements = commentCount > 0 || attachmentCount > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main TaskCard with visual indicators */}
      <div className="relative">
        <TaskCard
          task={task}
          onUpdate={onUpdate}
          onDelete={onDelete}
          className={cn(
            // Add subtle glow for tasks with enhancements
            hasEnhancements && 'ring-1 ring-white/20 shadow-lg shadow-white/10'
          )}
        />
        
        {/* Visual indicators for enhancements */}
        {hasEnhancements && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            {commentCount > 0 && (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
                {commentCount > 9 ? '9+' : commentCount}
              </div>
            )}
            {attachmentCount > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg shadow-green-500/30 animate-pulse">
                {attachmentCount > 9 ? '9+' : attachmentCount}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Features Container */}
      <div className="space-y-3">
        {/* Comments Section */}
        <div className="bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-300">
          {/* Comments Header */}
          <button
            onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
            className={cn(
              'w-full px-4 py-3 flex items-center justify-between text-left',
              'hover:bg-white/10 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-inset'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg 
                  className={cn(
                    'w-4 h-4 transition-transform duration-200 text-white/70',
                    isCommentsExpanded ? 'rotate-90' : 'rotate-0'
                  )} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/90">
                  Comments
                </span>
                
                {commentCount > 0 && (
                  <span className="bg-blue-500/30 text-blue-200 text-xs font-bold px-2 py-1 rounded-full">
                    {commentCount}
                  </span>
                )}
                
                {commentsLoading && (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />
                )}
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              {!isCommentsExpanded && commentCount === 0 && (
                <span className="text-xs text-white/50 px-2 py-1 rounded bg-white/10">
                  Add comment
                </span>
              )}
              
              {!isCommentsExpanded && commentCount > 0 && (
                <div className="flex -space-x-1">
                  {comments.slice(0, 3).map((comment, index) => (
                    <div
                      key={comment.id}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400/30 to-blue-600/20 border border-white/20 flex items-center justify-center"
                      style={{ zIndex: 3 - index }}
                      title={`Comment by ${comment.author}`}
                    >
                      <span className="text-xs font-bold text-white">
                        {comment.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ))}
                  {commentCount > 3 && (
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-white/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        +{commentCount - 3}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </button>

          {/* Expandable Comments Content */}
          <div className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isCommentsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}>
            <div className="px-4 pb-4">
              <CommentSection taskId={task.id} />
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-300">
          {/* Attachments Header */}
          <button
            onClick={() => setIsAttachmentsExpanded(!isAttachmentsExpanded)}
            className={cn(
              'w-full px-4 py-3 flex items-center justify-between text-left',
              'hover:bg-white/10 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:ring-inset'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg 
                  className={cn(
                    'w-4 h-4 transition-transform duration-200 text-white/70',
                    isAttachmentsExpanded ? 'rotate-90' : 'rotate-0'
                  )} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/90">
                  Attachments
                </span>
                
                {attachmentCount > 0 && (
                  <span className="bg-green-500/30 text-green-200 text-xs font-bold px-2 py-1 rounded-full">
                    {attachmentCount}
                  </span>
                )}
                
                {attachmentsLoading && (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />
                )}
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              {!isAttachmentsExpanded && attachmentCount === 0 && (
                <span className="text-xs text-white/50 px-2 py-1 rounded bg-white/10">
                  Add files
                </span>
              )}
              
              {!isAttachmentsExpanded && attachmentCount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white/60">
                    {attachments.reduce((total, att) => total + att.fileSize, 0) > 1024 * 1024 
                      ? `${(attachments.reduce((total, att) => total + att.fileSize, 0) / (1024 * 1024)).toFixed(1)}MB`
                      : `${Math.round(attachments.reduce((total, att) => total + att.fileSize, 0) / 1024)}KB`
                    }
                  </span>
                  <div className="flex -space-x-1">
                    {attachments.slice(0, 3).map((attachment, index) => (
                      <div
                        key={attachment.id}
                        className="w-6 h-6 rounded bg-gradient-to-br from-green-400/30 to-green-600/20 border border-white/20 flex items-center justify-center"
                        style={{ zIndex: 3 - index }}
                        title={attachment.fileName}
                      >
                        <span className="text-xs">
                          {attachment.fileType.includes('image') ? '🖼️' : 
                           attachment.fileType.includes('pdf') ? '📄' : 
                           attachment.fileType.includes('text') ? '📝' : '📎'}
                        </span>
                      </div>
                    ))}
                    {attachmentCount > 3 && (
                      <div className="w-6 h-6 rounded bg-green-500/20 border border-white/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          +{attachmentCount - 3}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </button>

          {/* Expandable Attachments Content */}
          <div className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isAttachmentsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}>
            <div className="px-4 pb-4">
              {attachmentsError && (
                <div className="mb-3 p-2 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
                  {attachmentsError}
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
          </div>
        </div>

        {/* Summary bar for collapsed state */}
        {!isCommentsExpanded && !isAttachmentsExpanded && hasEnhancements && (
          <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-white/70">
              <div className="flex items-center gap-4">
                {commentCount > 0 && (
                  <button
                    onClick={() => setIsCommentsExpanded(true)}
                    className="flex items-center gap-1 hover:text-blue-300 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
                  </button>
                )}
                
                {attachmentCount > 0 && (
                  <button
                    onClick={() => setIsAttachmentsExpanded(true)}
                    className="flex items-center gap-1 hover:text-green-300 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span>{attachmentCount} file{attachmentCount !== 1 ? 's' : ''}</span>
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsCommentsExpanded(true);
                    setIsAttachmentsExpanded(true);
                  }}
                  className="text-white/50 hover:text-white/80 transition-colors"
                >
                  Expand all
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};