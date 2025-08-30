'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useComments } from '@/hooks/useComments';
import { useAttachments } from '@/hooks/useAttachments';
import { useDelegation } from '@/hooks/useDelegation';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { CommentInput } from './CommentInput';
import { CommentList } from './CommentList';
import { FileUploadArea } from './FileUploadArea';
import { AttachmentList } from './AttachmentList';
import { DelegationControls } from '@/components/delegation/DelegationControls';

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
  projectId?: string;
  comments?: import('@/types/comments').TaskComment[];
  attachments?: import('@/types/attachments').TaskAttachment[];
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
    gradient: 'from-slate-400/10 to-gray-400/10'
  },
  doing: {
    label: 'In Progress',
    color: 'bg-gradient-to-r from-zinc-400/20 to-slate-400/20 text-zinc-100 border-zinc-400/30',
    gradient: 'from-zinc-400/10 to-slate-400/10'
  },
  done: {
    label: 'Completed',
    color: 'bg-gradient-to-r from-gray-300/20 to-slate-300/20 text-gray-100 border-gray-300/30',
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
  const [showComments, setShowComments] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [showDelegation, setShowDelegation] = useState(false);

  // Hooks for comments, attachments, and delegation
  const {
    comments,
    isLoading: commentsLoading,
    addComment,
    editComment,
    deleteComment
  } = useComments(task.id);

  const {
    attachments,
    addAttachment,
    removeAttachment,
    downloadAttachment,
    isLoading: attachmentsLoading
  } = useAttachments(task.id);

  const { 
    getActiveDelegationForTask,
    isTaskDelegated 
  } = useDelegation();
  const { canDelegate } = useUserPermissions();
  const { getMemberById } = useTeamMembers();

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

  const handleAddComment = async (content: string, mentions?: string[]) => {
    try {
      await addComment(task.id, content, mentions);
      setShowCommentInput(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleEditComment = async (commentId: string, content: string, mentions?: string[]) => {
    try {
      await editComment(commentId, content, mentions);
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleFileSelect = async (files: FileList) => {
    for (const file of Array.from(files)) {
      try {
        await addAttachment(task.id, file);
      } catch (error) {
        console.error('Failed to add attachment:', error);
      }
    }
  };

  const handleDelegate = (taskId: string, assigneeId: string, note?: string) => {
    // Delegation is handled by the DelegationControls component
    // This callback can be used for additional UI updates if needed
    console.log(`Task ${taskId} delegated to ${assigneeId}`, { note });
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
      
      <div className="relative z-10 p-4">
        {/* Compact Header */}
        <div className="flex items-start justify-between mb-3">
          {/* Traffic Light Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDelete}
              className="w-2.5 h-2.5 rounded-full bg-red-400 hover:bg-red-500 transition-all duration-200"
              title="Delete Task"
            />
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-200',
                isEditing ? 'bg-yellow-500' : 'bg-yellow-400 hover:bg-yellow-500'
              )}
              title={isEditing ? "Cancel Edit" : "Edit Task"}
            />
            <button
              onClick={() => handleStatusChange('done')}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-200',
                task.status === 'done' ? 'bg-green-500' : 'bg-green-400 hover:bg-green-500'
              )}
              title="Mark as Done"
            />
          </div>
          
          <div className="flex items-center gap-1">
            {task.aiScore && (
              <div className="text-xs text-white bg-gradient-to-r from-gray-500/30 to-slate-500/30 border border-gray-400/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                AI {task.aiScore}
              </div>
            )}
            <div className={cn(
              'relative px-2 py-0.5 rounded-full text-xs font-bold border backdrop-blur-sm',
              priorityConfig[task.priority].color
            )}>
              <span className="relative z-10">
                {priorityConfig[task.priority].label}
              </span>
            </div>
          </div>
        </div>

        {/* Task Content */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full bg-white/20"></div>
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 bg-white/15 border border-white/30 rounded-lg px-2 py-1 text-white text-sm font-bold backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all duration-200"
                autoFocus
                onBlur={handleSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
            ) : (
              <h3 className={cn(
                'font-bold text-white text-sm leading-tight flex-1',
                task.status === 'done' && 'line-through opacity-75'
              )}>
                {task.title}
              </h3>
            )}
            {task.status === 'done' && (
              <div className="w-4 h-4 bg-gradient-to-r from-white/80 to-gray-200/80 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              </div>
            )}
          </div>

          {/* Delegation Status Indicator */}
          {(() => {
            const delegation = getActiveDelegationForTask?.(task.id);
            const assignee = delegation ? getMemberById(delegation.assigneeId) : null;
            
            if (delegation && assignee) {
              return (
                <div className="flex items-center space-x-2 mb-2 p-2 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                  <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-blue-200 font-medium">
                      Assigned to {assignee.name}
                    </p>
                    {delegation.note && (
                      <p className="text-xs text-blue-300/80 truncate">
                        {delegation.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {delegation.priority === 'urgent' && (
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" title="Urgent" />
                    )}
                    <span className="text-xs text-blue-300/70">
                      {new Date(delegation.delegatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })()}
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


        {/* Compact Status & Priority */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1">
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status as Task['status'])}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 border',
                  task.status === status
                    ? cn(config.color)
                    : 'text-white/60 hover:text-white border-white/20 hover:bg-white/10'
                )}
              >
                {config.label}
              </button>
            ))}
          </div>
          
          <div className="flex gap-1">
            {Object.entries(priorityConfig).map(([priority, config]) => (
              <button
                key={priority}
                onClick={() => handlePriorityChange(priority as Task['priority'])}
                className={cn(
                  'w-4 h-4 rounded-full border transition-all duration-200',
                  task.priority === priority
                    ? `${config.pill} border-white/50`
                    : 'border-white/30 hover:border-white/50 bg-white/10'
                )}
                title={`Set ${config.label} Priority`}
              />
            ))}
          </div>
        </div>



        {/* Delegation Controls */}
        {canDelegate && (
          <div className="mb-3">
            <DelegationControls
              task={task}
              onDelegate={handleDelegate}
              canDelegate={canDelegate}
            />
          </div>
        )}

        {/* Compact Action Buttons */}
        <div className="mb-3">
          <div className="flex items-center gap-1">
            {/* Comments Button */}
            <button
              onClick={() => setShowComments(!showComments)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all duration-200',
                showComments || comments.length > 0
                  ? 'bg-blue-500/20 text-blue-200 border-blue-400/30'
                  : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'
              )}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {comments.length > 0 && <span>{comments.length}</span>}
            </button>

            {/* Attachments Button */}
            <button
              onClick={() => setShowAttachments(!showAttachments)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all duration-200',
                showAttachments || attachments.length > 0
                  ? 'bg-green-500/20 text-green-200 border-green-400/30'
                  : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'
              )}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {attachments.length > 0 && <span>{attachments.length}</span>}
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
            <div className="space-y-3">
              {/* Add Comment Button/Input */}
              {!showCommentInput ? (
                <button
                  onClick={() => setShowCommentInput(true)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/60 bg-white/10 border border-white/20 hover:bg-white/15 hover:text-white/80 transition-all duration-200"
                >
                  Add a comment...
                </button>
              ) : (
                <CommentInput
                  onSubmit={handleAddComment}
                  onCancel={() => setShowCommentInput(false)}
                  placeholder="Share your thoughts..."
                  enableMentions={true}
                />
              )}

              {/* Comments List */}
              {commentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />
                  <span className="ml-2 text-sm text-white/60">Loading comments...</span>
                </div>
              ) : (
                <CommentList
                  comments={comments}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                />
              )}
            </div>
          </div>
        )}

        {/* Attachments Section */}
        {showAttachments && (
          <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
            <div className="space-y-3">
              {/* File Upload Area */}
              <FileUploadArea
                onFileSelect={handleFileSelect}
                className="border-2 border-dashed border-white/30 rounded-lg p-4 hover:border-white/50 hover:bg-white/5 transition-all duration-200"
              />

              {/* Attachments List */}
              {attachmentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />
                  <span className="ml-2 text-sm text-white/60">Loading attachments...</span>
                </div>
              ) : (
                <AttachmentList
                  attachments={attachments}
                  onRemove={removeAttachment}
                  onDownload={downloadAttachment}
                />
              )}
            </div>
          </div>
        )}

        {/* Delegation Section */}
        {showDelegation && canDelegate && (
          <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
            <div className="space-y-3">
              <h4 className="text-white font-medium text-sm">Task Delegation</h4>
              <DelegationControls
                task={task}
                onDelegate={handleDelegate}
                canDelegate={canDelegate}
                showQuickDelegate={true}
              />
            </div>
          </div>
        )}
          {/* Due Date */}
          {task.dueDate && (
          <div className="mb-4">
            <div className={cn(
              'inline-flex  items-center gap-2 text-xs px-4 py-2 rounded-xl font-medium border backdrop-blur-sm',
              isOverdue 
                ? 'bg-gradient-to-r from-white/25 to-gray-200/25 text-white border-white/40 animate-pulse' 
                : isDueSoon 
                  ? 'bg-gradient-to-r from-gray-400/25 to-slate-400/25 text-gray-100 border-gray-400/40'
                  : 'bg-gradient-to-r from-slate-500/15 to-zinc-500/15 text-slate-100 border-slate-400/30'
            )}>
              <div className="w-4 h-4 rounded  bg-white/30"></div>
              <span>
                Due: {new Date(task.dueDate).toLocaleDateString()}
                {isOverdue && ' (Overdue!)'}
                {isDueSoon && !isOverdue && ' (Due Soon)'}
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Metadata with Collaboration Activity */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                Created: {new Date(task.createdAt).toLocaleDateString()}
              </span>
              {task.updatedAt && task.updatedAt !== task.createdAt && (
                <span className="flex items-center gap-1">
                  • Updated: {new Date(task.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {task.status === 'done' && (
              <div className="flex items-center gap-1 text-emerald-300">
                <span>Completed!</span>
              </div>
            )}
          </div>
          
          {/* Collaboration Activity Summary */}
          {(comments.length > 0 || attachments.length > 0 || getActiveDelegationForTask?.(task.id)) && (
            <div className="flex items-center gap-3 text-xs text-white/50">
              {comments.length > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {comments.length} comment{comments.length !== 1 ? 's' : ''}
                  {(() => {
                    const latestComment = comments.sort((a, b) => 
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )[0];
                    if (latestComment) {
                      const timeDiff = Date.now() - new Date(latestComment.createdAt).getTime();
                      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
                      if (hoursAgo < 24) {
                        return ` (${hoursAgo}h ago)`;
                      }
                    }
                    return '';
                  })()}
                </span>
              )}
              
              {attachments.length > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                </span>
              )}
              
              {(() => {
                const delegation = getActiveDelegationForTask?.(task.id);
                if (delegation) {
                  const assignee = getMemberById(delegation.assigneeId);
                  const daysSinceDelegation = Math.floor(
                    (Date.now() - new Date(delegation.delegatedAt).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <span className="flex items-center gap-1 text-blue-300/70">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Delegated to {assignee?.name || 'Unknown'} 
                      {daysSinceDelegation === 0 ? ' today' : ` ${daysSinceDelegation}d ago`}
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};