'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CommentSectionProps } from '@/types/comments';
import { CommentInput } from './CommentInput';
import { CommentList } from './CommentList';
import { useComments } from '@/hooks/useComments';
import { getCommentStats } from '@/lib/comments';

interface EnhancedCommentSectionProps {
  taskId: string;
  className?: string;
}

export const CommentSection: React.FC<EnhancedCommentSectionProps> = ({
  taskId,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    comments,
    isLoading,
    error,
    addComment,
    editComment,
    deleteComment,
    clearError
  } = useComments(taskId);

  const handleAddComment = async (content: string) => {
    try {
      setIsSubmitting(true);
      await addComment(taskId, content);
      setShowInput(false);
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      await editComment(commentId, content);
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to edit comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to delete comment:', err);
    }
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setShowInput(false);
    }
    if (error) {
      clearError();
    }
  };

  const commentStats = getCommentStats(comments);
  const commentCount = commentStats.total;

  return (
    <div className={cn(
      'border-t border-white/20 pt-4 mt-4',
      className
    )}>
      {/* Comments Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleToggleExpanded}
          className={cn(
            'flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white',
            'transition-all duration-200 group',
            isLoading && 'opacity-50 cursor-wait'
          )}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />
            ) : (
              <svg 
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  isExpanded ? 'rotate-90' : 'rotate-0'
                )} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            
            <span>
              Comments {commentCount > 0 && `(${commentCount})`}
            </span>
            
            {commentStats.authors.length > 1 && (
              <span className="text-xs text-white/50">
                • {commentStats.authors.length} participants
              </span>
            )}
          </div>
        </button>

        {/* Quick add comment button */}
        {!isExpanded && !isLoading && (
          <button
            onClick={() => {
              setIsExpanded(true);
              setShowInput(true);
            }}
            className={cn(
              'text-xs text-white/60 hover:text-white px-2 py-1 rounded-lg',
              'hover:bg-white/10 transition-all duration-200',
              'border border-white/20 hover:border-white/30'
            )}
          >
            Add comment
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-400/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-200 hover:text-white transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Expanded Comments Section */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Add Comment Input */}
          <div className="space-y-3">
            {!showInput ? (
              <button
                onClick={() => setShowInput(true)}
                disabled={isSubmitting}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl text-sm text-white/60',
                  'bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/30',
                  'transition-all duration-200 backdrop-blur-sm',
                  isSubmitting && 'opacity-50 cursor-wait'
                )}
              >
                {isSubmitting ? 'Adding comment...' : 'Add a comment...'}
              </button>
            ) : (
              <CommentInput
                onSubmit={handleAddComment}
                onCancel={() => setShowInput(false)}
                placeholder="Share your thoughts..."
                disabled={isSubmitting}
              />
            )}
          </div>

          {/* Comments List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-white/60">
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-white/30 border-t-white/60" />
                <span className="text-sm">Loading comments...</span>
              </div>
            </div>
          ) : (
            <CommentList
              comments={comments}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
            />
          )}
        </div>
      )}

      {/* Collapsed State Summary */}
      {!isExpanded && commentCount > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <div className="flex -space-x-1">
              {comments.slice(0, 3).map((comment, index) => (
                <div
                  key={comment.id}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-white/30 to-gray-300/20 border border-white/20 flex items-center justify-center"
                  style={{ zIndex: 3 - index }}
                >
                  <span className="text-xs font-bold text-white">
                    {comment.author.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {commentCount > 3 && (
                <div className="w-6 h-6 rounded-full bg-white/20 border border-white/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    +{commentCount - 3}
                  </span>
                </div>
              )}
            </div>
            <span>
              Latest: {new Date(comments[comments.length - 1]?.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};