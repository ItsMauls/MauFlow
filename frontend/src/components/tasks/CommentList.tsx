'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CommentListProps } from '@/types/comments';
import { CommentItem } from './CommentItem';

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  onEdit,
  onDelete,
  className
}) => {
  if (comments.length === 0) {
    return (
      <div className={cn(
        'text-center py-8 text-white/60 text-sm',
        className
      )}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p>No comments yet</p>
          <p className="text-xs text-white/40">Be the first to add a comment!</p>
        </div>
      </div>
    );
  }

  // Sort comments by creation date (newest first)
  const sortedComments = [...comments].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className={cn('space-y-3', className)}>
      {sortedComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};