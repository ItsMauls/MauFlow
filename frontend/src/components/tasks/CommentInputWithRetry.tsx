'use client';

import React, { useState, useCallback } from 'react';
import { GlassButton } from '../ui';
import { LoadingSpinner } from '../loading/LoadingSpinner';
import { ErrorState } from '../fallback/ErrorState';
import { useRetry } from '@/hooks/useRetry';

interface CommentInputWithRetryProps {
  taskId: string;
  onSubmit: (taskId: string, content: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

/**
 * Comment input component with retry mechanism and comprehensive error handling
 */
export const CommentInputWithRetry: React.FC<CommentInputWithRetryProps> = ({
  taskId,
  onSubmit,
  placeholder = 'Add a comment...',
  maxLength = 1000,
  className = ''
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingContent, setPendingContent] = useState('');

  const submitComment = useCallback(async (content: string): Promise<void> => {
    if (!content.trim()) {
      throw new Error('Comment cannot be empty');
    }

    if (content.length > maxLength) {
      throw new Error(`Comment exceeds ${maxLength} character limit`);
    }

    await onSubmit(taskId, content.trim());
  }, [taskId, onSubmit, maxLength]);

  const {
    execute: executeSubmit,
    isRetrying,
    retryCount,
    lastError,
    reset: resetRetry
  } = useRetry(submitComment, {
    maxRetries: 3,
    retryDelay: 1000,
    onRetry: (attempt, error) => {
      console.log(`Comment submission attempt ${attempt} failed:`, error.message);
    },
    onMaxRetriesReached: (error) => {
      console.error('Comment submission failed after all retries:', error);
      setIsSubmitting(false);
    }
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isSubmitting) return;

    const commentContent = content.trim();
    setPendingContent(commentContent);
    setIsSubmitting(true);
    resetRetry();

    try {
      await executeSubmit(commentContent);
      setContent('');
      setPendingContent('');
      setIsSubmitting(false);
    } catch (error) {
      console.error('Failed to submit comment:', error);
      setIsSubmitting(false);
    }
  }, [content, isSubmitting, executeSubmit, resetRetry]);

  const handleRetry = useCallback(() => {
    if (pendingContent) {
      setIsSubmitting(true);
      executeSubmit(pendingContent)
        .then(() => {
          setContent('');
          setPendingContent('');
          setIsSubmitting(false);
        })
        .catch(() => {
          setIsSubmitting(false);
        });
    }
  }, [pendingContent, executeSubmit]);

  const handleDismissError = useCallback(() => {
    resetRetry();
    setIsSubmitting(false);
    // Restore the content so user can edit and retry
    if (pendingContent) {
      setContent(pendingContent);
      setPendingContent('');
    }
  }, [resetRetry, pendingContent]);

  const hasError = lastError && !isRetrying && !isSubmitting;
  const characterCount = content.length;
  const isOverLimit = characterCount > maxLength;

  return (
    <div className={className}>
      {hasError && (
        <div className="mb-4">
          <ErrorState
            title="Failed to Submit Comment"
            message={lastError.message}
            error={lastError}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
            showDetails={false}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            disabled={isSubmitting}
            className={`
              w-full p-3 rounded-xl border bg-white/5 backdrop-blur-sm
              text-white placeholder-white/50 resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-400/50
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isOverLimit 
                ? 'border-red-400/50 focus:ring-red-400/50' 
                : 'border-white/20 hover:border-white/30'
              }
            `}
            rows={3}
            maxLength={maxLength + 100} // Allow typing over limit to show error
          />
          
          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-xs">
            <span className={isOverLimit ? 'text-red-300' : 'text-white/50'}>
              {characterCount}/{maxLength}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSubmitting && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <LoadingSpinner size="sm" />
                <span>
                  {isRetrying ? `Retrying (${retryCount}/3)...` : 'Submitting...'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {content.trim() && !isSubmitting && (
              <GlassButton
                type="button"
                variant="ghost"
                onClick={() => setContent('')}
                className="text-sm px-3 py-1"
              >
                Clear
              </GlassButton>
            )}
            
            <GlassButton
              type="submit"
              variant="primary"
              disabled={!content.trim() || isSubmitting || isOverLimit}
              className="rounded-full px-6 py-2 text-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Submit
                </span>
              ) : (
                'Submit'
              )}
            </GlassButton>
          </div>
        </div>

        {isOverLimit && (
          <p className="text-red-300 text-sm">
            Comment exceeds the {maxLength} character limit
          </p>
        )}
      </form>

      {retryCount > 0 && !hasError && isSubmitting && (
        <div className="mt-2 text-center">
          <p className="text-white/60 text-sm">
            Retry attempt {retryCount} of 3
          </p>
        </div>
      )}
    </div>
  );
};