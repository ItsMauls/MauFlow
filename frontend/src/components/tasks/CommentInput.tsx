'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CommentInputProps, MentionUser } from '@/types/comments';
import { MentionDropdown } from './MentionDropdown';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { 
  findMentionQuery, 
  filterUsersForMention, 
  replaceMentionQuery, 
  extractMentionIds,
  sanitizeMentionContent 
} from '@/lib/mentions';
import { 
  ARIA_ROLES, 
  KEYBOARD_KEYS, 
  ScreenReaderAnnouncer,
  mobileAccessibility,
  reducedMotionSupport
} from '@/lib/accessibility';

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  placeholder = "Add a comment...",
  initialValue = "",
  isEditing = false,
  onCancel,
  className,
  disabled = false,
  enableMentions = true,
  isMobile = false
}) => {
  const [content, setContent] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { teamMembers } = useTeamMembers();
  
  const maxLength = 500;
  const commentId = `comment-input-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
      
      // Announce editing mode to screen readers
      ScreenReaderAnnouncer.announce('Comment editing mode activated', 'assertive');
    }
  }, [isEditing, content.length]);

  // Update character count
  useEffect(() => {
    setCharacterCount(content.length);
  }, [content]);

  // Convert team members to mention users
  const mentionUsers: MentionUser[] = teamMembers.map(member => ({
    id: member.id,
    name: member.name,
    avatar: member.avatar,
    role: member.role.name,
    email: member.email
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    
    if (trimmedContent.length > maxLength) {
      ScreenReaderAnnouncer.announce(
        `Comment is too long. Maximum ${maxLength} characters allowed.`,
        'assertive'
      );
      return;
    }
    
    if (trimmedContent && !isSubmitting && !disabled) {
      try {
        setIsSubmitting(true);
        const sanitizedContent = sanitizeMentionContent(trimmedContent);
        const mentions = enableMentions ? extractMentionIds(sanitizedContent, mentionUsers) : [];
        
        // Announce mentions to screen readers
        if (mentions.length > 0) {
          const mentionedNames = mentions
            .map(id => mentionUsers.find(u => u.id === id)?.name)
            .filter(Boolean)
            .join(', ');
          ScreenReaderAnnouncer.announce(
            `Comment will mention: ${mentionedNames}`,
            'polite'
          );
        }
        
        await onSubmit(sanitizedContent, mentions);
        
        if (!isEditing) {
          setContent('');
          ScreenReaderAnnouncer.announce('Comment posted successfully', 'polite');
        } else {
          ScreenReaderAnnouncer.announce('Comment updated successfully', 'polite');
        }
        
        setShowMentionDropdown(false);
      } catch (err) {
        // Error handling is done by parent component
        console.error('Failed to submit comment:', err);
        ScreenReaderAnnouncer.announce('Failed to submit comment', 'assertive');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If mention dropdown is open, let it handle navigation keys
    if (showMentionDropdown && [
      KEYBOARD_KEYS.ARROW_DOWN, 
      KEYBOARD_KEYS.ARROW_UP, 
      KEYBOARD_KEYS.ENTER, 
      KEYBOARD_KEYS.ESCAPE
    ].includes(e.key)) {
      return;
    }

    switch (e.key) {
      case KEYBOARD_KEYS.ENTER:
        if (!e.shiftKey) {
          e.preventDefault();
          handleSubmit(e);
        }
        break;
      case KEYBOARD_KEYS.ESCAPE:
        if (isEditing && onCancel) {
          e.preventDefault();
          onCancel();
          ScreenReaderAnnouncer.announce('Comment editing cancelled', 'polite');
        }
        break;
      case 's':
      case 'S':
        if ((e.ctrlKey || e.metaKey) && isEditing) {
          e.preventDefault();
          handleSubmit(e);
        }
        break;
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      ScreenReaderAnnouncer.announce('Comment editing cancelled', 'polite');
    } else {
      setContent('');
      setIsFocused(false);
      ScreenReaderAnnouncer.announce('Comment input cleared', 'polite');
    }
    setShowMentionDropdown(false);
  };

  // Handle content change and mention detection
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const newCursorPosition = e.target.selectionStart;
    
    setContent(newContent);
    setCursorPosition(newCursorPosition);

    if (enableMentions) {
      // Check for mention query
      const mentionMatch = findMentionQuery(newContent, newCursorPosition);
      
      if (mentionMatch) {
        setMentionQuery(mentionMatch.query);
        setShowMentionDropdown(true);
        
        // Calculate dropdown position
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          const rect = textarea.getBoundingClientRect();
          const textBeforeCursor = newContent.substring(0, newCursorPosition);
          const lines = textBeforeCursor.split('\n');
          const currentLine = lines.length - 1;
          const currentColumn = lines[lines.length - 1].length;
          
          // Approximate position calculation
          const lineHeight = 20; // Approximate line height
          const charWidth = 8; // Approximate character width
          
          setMentionPosition({
            top: rect.top + (currentLine * lineHeight) + lineHeight + 5,
            left: rect.left + (currentColumn * charWidth)
          });
        }
      } else {
        setShowMentionDropdown(false);
      }
    }
  };

  // Handle mention selection
  const handleMentionSelect = (user: MentionUser) => {
    if (!textareaRef.current) return;

    const mentionMatch = findMentionQuery(content, cursorPosition);
    if (mentionMatch) {
      const { content: newContent, cursorPosition: newCursorPosition } = replaceMentionQuery(
        content,
        mentionMatch,
        user
      );
      
      setContent(newContent);
      setShowMentionDropdown(false);
      
      // Announce mention selection
      ScreenReaderAnnouncer.announce(
        `Mentioned ${user.name}`,
        'polite'
      );
      
      // Set cursor position after mention
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  // Handle mention dropdown close
  const handleMentionClose = () => {
    setShowMentionDropdown(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Filter users for mention dropdown
  const filteredUsers = enableMentions && showMentionDropdown 
    ? filterUsersForMention(mentionUsers, mentionQuery)
    : [];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className={cn('space-y-3', className)}
      role="form"
      aria-label={isEditing ? 'Edit comment' : 'Add new comment'}
    >
      <div className="relative">
        <textarea
          ref={textareaRef}
          id={commentId}
          value={content}
          onChange={handleContentChange}
          onFocus={() => {
            setIsFocused(true);
            if (isEditing) {
              ScreenReaderAnnouncer.announce('Comment editing mode', 'polite');
            }
          }}
          onBlur={() => {
            // Delay blur to allow mention dropdown clicks
            setTimeout(() => {
              if (!showMentionDropdown && !isEditing) {
                setIsFocused(false);
              }
            }, 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={enableMentions ? `${placeholder} (Use @ to mention team members)` : placeholder}
          disabled={disabled || isSubmitting}
          maxLength={maxLength}
          className={cn(
            'w-full resize-none rounded-xl text-white placeholder-white/50',
            'bg-white/10 border border-white/20 backdrop-blur-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40',
            'hover:bg-white/15 hover:border-white/30',
            // Mobile-friendly sizing
            isMobile ? 'min-h-[100px] max-h-[250px] px-3 py-3 text-base' : 'min-h-[80px] max-h-[200px] px-4 py-3 text-sm',
            isFocused && 'bg-white/15 border-white/40',
            (disabled || isSubmitting) && 'opacity-50 cursor-not-allowed',
            // Character limit warning
            characterCount > maxLength * 0.9 && 'border-yellow-400/50 focus:ring-yellow-400/50',
            characterCount > maxLength && 'border-red-400/50 focus:ring-red-400/50'
          )}
          rows={1}
          role={ARIA_ROLES.COMMENT_INPUT}
          aria-label={isEditing ? 'Edit comment text' : 'Comment text'}
          aria-describedby={`${commentId}-description ${commentId}-count`}
          aria-invalid={characterCount > maxLength}
          aria-multiline="true"
        />
        
        {/* Character count */}
        {(characterCount > 100 || characterCount > maxLength * 0.8) && (
          <div 
            id={`${commentId}-count`}
            className={cn(
              'absolute bottom-2 right-2 text-xs',
              characterCount > maxLength * 0.9 ? 'text-yellow-300' : 'text-white/40',
              characterCount > maxLength && 'text-red-300 font-medium'
            )}
            aria-live="polite"
          >
            {characterCount}/{maxLength}
          </div>
        )}
      </div>

      {/* Hidden description for screen readers */}
      <div id={`${commentId}-description`} className="sr-only">
        {isEditing ? 'Edit your comment. ' : 'Add a new comment. '}
        {enableMentions && 'Type @ followed by a name to mention team members. '}
        Press Enter to submit, Shift+Enter for new line.
        {isEditing && ' Press Escape to cancel editing, or Ctrl+S to save.'}
        {` Maximum ${maxLength} characters.`}
      </div>

      {/* Mention Dropdown */}
      {enableMentions && showMentionDropdown && (
        <MentionDropdown
          users={filteredUsers}
          onSelect={handleMentionSelect}
          onClose={handleMentionClose}
          position={mentionPosition}
          query={mentionQuery}
        />
      )}

      {/* Action buttons - show when focused or editing */}
      {(isFocused || isEditing || content.trim()) && (
        <div className={cn(
          'flex items-center justify-between',
          isMobile && 'flex-col gap-3 items-stretch'
        )}>
          <div className={cn(
            'text-white/60',
            isMobile ? 'text-sm text-center' : 'text-xs'
          )}>
            {isEditing ? 'Press Enter to save, Esc to cancel' : 'Press Enter to post, Shift+Enter for new line'}
            {enableMentions && (
              <span className={cn('mt-1', isMobile ? 'block' : 'block')}>
                Use @ to mention team members
              </span>
            )}
            {isEditing && (
              <span className="block mt-1">Ctrl+S to save quickly</span>
            )}
          </div>
          
          <div className={cn(
            'flex items-center gap-2',
            isMobile && 'justify-center'
          )}>
            {(isEditing || content.trim()) && (
              <button
                type="button"
                onClick={handleCancel}
                className={cn(
                  'font-medium rounded-lg transition-all duration-200',
                  'text-white/70 hover:text-white hover:bg-white/10',
                  'border border-white/20 hover:border-white/30',
                  'focus:outline-none focus:ring-2 focus:ring-white/50',
                  // Mobile-friendly touch targets
                  isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-3 py-1.5 text-xs'
                )}
                aria-label={isEditing ? 'Cancel editing comment' : 'Cancel comment'}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={!content.trim() || disabled || isSubmitting || characterCount > maxLength}
              className={cn(
                'font-medium rounded-lg transition-all duration-200',
                'bg-gradient-to-r from-white/20 to-gray-200/20 text-white',
                'border border-white/30 hover:border-white/40',
                'hover:from-white/30 hover:to-gray-200/30',
                'focus:outline-none focus:ring-2 focus:ring-white/50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                // Mobile-friendly touch targets
                isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-4 py-1.5 text-xs',
                // Reduced motion support
                reducedMotionSupport.getAnimationStyles(
                  'transform hover:scale-105 active:scale-95',
                  'hover:bg-white/25'
                ),
                content.trim() && !disabled && !isSubmitting && 'shadow-lg shadow-white/10'
              )}
              aria-label={isEditing ? 'Save comment changes' : 'Post comment'}
              aria-describedby={characterCount > maxLength ? `${commentId}-error` : undefined}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div 
                    className={cn(
                      'rounded-full border border-white/30 border-t-white',
                      isMobile ? 'w-4 h-4' : 'w-3 h-3',
                      reducedMotionSupport.getAnimationStyles('animate-spin', '')
                    )}
                    aria-hidden="true"
                  />
                  <span>{isEditing ? 'Saving...' : 'Posting...'}</span>
                </div>
              ) : (
                isEditing ? 'Save' : 'Post'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Character limit error message */}
      {characterCount > maxLength && (
        <div 
          id={`${commentId}-error`}
          className="text-red-300 text-sm"
          role="alert"
          aria-live="assertive"
        >
          Comment exceeds maximum length by {characterCount - maxLength} character{characterCount - maxLength !== 1 ? 's' : ''}.
        </div>
      )}
    </form>
  );
};