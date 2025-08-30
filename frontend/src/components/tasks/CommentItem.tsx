'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CommentItemProps } from '@/types/comments';
import { CommentInput } from './CommentInput';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { formatMentionsForDisplay } from '@/lib/mentions';

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onEdit,
  onDelete,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { teamMembers } = useTeamMembers();

  const handleEdit = async (content: string, mentions?: string[]) => {
    try {
      setIsSaving(true);
      await onEdit(comment.id, content, mentions);
      setIsEditing(false);
    } catch (err) {
      // Error handling is done by parent component
      console.error('Failed to edit comment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        setIsDeleting(true);
        await onDelete(comment.id);
      } catch (err) {
        // Error handling is done by parent component
        console.error('Failed to delete comment:', err);
        setIsDeleting(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };

  const isEdited = comment.updatedAt && comment.updatedAt !== comment.createdAt;
  
  // Convert team members to mention users for display
  const mentionUsers = teamMembers.map(member => ({
    id: member.id,
    name: member.name,
    avatar: member.avatar,
    role: member.role.name,
    email: member.email
  }));
  
  // Format content with mentions
  const formattedContent = formatMentionsForDisplay(comment.content, mentionUsers);
  const hasMentions = comment.mentions && comment.mentions.length > 0;

  return (
    <div
      className={cn(
        'group relative rounded-xl p-4 transition-all duration-200',
        'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20',
        'backdrop-blur-sm',
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Comment Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Author Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/30 to-gray-300/20 border border-white/20 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {comment.author.charAt(0).toUpperCase()}
            </span>
          </div>
          
          {/* Author and Timestamp */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {comment.author}
            </span>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span>{formatTimestamp(comment.createdAt)}</span>
              {isEdited && (
                <>
                  <span>•</span>
                  <span className="italic">edited</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && !isEditing && !isDeleting && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => setIsEditing(true)}
              disabled={isSaving}
              className={cn(
                'p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10',
                'transition-all duration-200 transform hover:scale-110',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="Edit comment"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className={cn(
                'p-1.5 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/10',
                'transition-all duration-200 transform hover:scale-110',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="Delete comment"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}

        {/* Loading/Deleting State */}
        {(isDeleting || isSaving) && (
          <div className="flex items-center gap-2 text-white/60">
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white/60" />
            <span className="text-xs">
              {isDeleting ? 'Deleting...' : 'Saving...'}
            </span>
          </div>
        )}
      </div>

      {/* Comment Content */}
      {isEditing ? (
        <CommentInput
          initialValue={comment.content}
          onSubmit={handleEdit}
          onCancel={handleCancelEdit}
          isEditing={true}
          placeholder="Edit your comment..."
          className="mt-2"
          disabled={isSaving}
          enableMentions={true}
        />
      ) : (
        <div className={cn(
          'ml-11',
          isDeleting && 'opacity-50'
        )}>
          {/* Mentions indicator */}
          {hasMentions && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 text-xs text-blue-300">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Mentioned:</span>
              </div>
              <div className="flex items-center gap-1">
                {comment.mentions!.slice(0, 3).map(userId => {
                  const user = mentionUsers.find(u => u.id === userId);
                  return user ? (
                    <div
                      key={userId}
                      className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400/30 to-blue-600/20 border border-blue-400/30 flex items-center justify-center"
                      title={user.name}
                    >
                      {user.avatar ? (
                        <span className="text-xs">{user.avatar}</span>
                      ) : (
                        <span className="text-xs font-bold text-blue-200">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  ) : null;
                })}
                {comment.mentions!.length > 3 && (
                  <span className="text-xs text-blue-300">
                    +{comment.mentions!.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Comment content with formatted mentions */}
          <div 
            className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap comment-content"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
            style={{
              // Custom styles for mentions
              '--mention-bg': 'rgba(59, 130, 246, 0.2)',
              '--mention-border': 'rgba(59, 130, 246, 0.4)',
              '--mention-text': 'rgb(147, 197, 253)'
            } as React.CSSProperties}
          />
        </div>
      )}
    </div>
  );
};