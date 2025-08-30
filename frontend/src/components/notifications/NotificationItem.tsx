/**
 * NotificationItem Component
 * Individual notification item with actions and content display
 * Enhanced with comprehensive accessibility support
 */

'use client';

import React, { forwardRef } from 'react';
import { Notification } from '@/types/collaboration';
import { cn } from '@/lib/utils';
import { 
  ARIA_ROLES, 
  KEYBOARD_KEYS, 
  generateAriaLabel,
  mobileAccessibility,
  reducedMotionSupport
} from '@/lib/accessibility';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDelete: () => void;
  onMarkAsRead: () => void;
  onMarkAsUnread?: () => void;
  onToggleSelection?: () => void;
  isSelected?: boolean;
  showSelection?: boolean;
  isFocused?: boolean;
  isMobile?: boolean;
  className?: string;
}

export const NotificationItem = forwardRef<HTMLDivElement, NotificationItemProps>(({
  notification,
  onClick,
  onDelete,
  onMarkAsRead,
  onMarkAsUnread,
  onToggleSelection,
  isSelected = false,
  showSelection = false,
  isFocused = false,
  isMobile = false,
  className
}, ref) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        e.preventDefault();
        onClick();
        break;
      case 'r':
      case 'R':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          if (notification.isRead && onMarkAsUnread) {
            onMarkAsUnread();
          } else {
            onMarkAsRead();
          }
        }
        break;
      case 'd':
      case 'D':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }
        break;
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead();
  };

  const handleMarkAsUnread = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsUnread?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleToggleSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection?.();
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'task_delegated':
        return '📋';
      case 'task_completed':
        return '✅';
      case 'task_updated':
        return '📝';
      case 'comment_mention':
        return '💬';
      case 'comment_reply':
        return '↩️';
      case 'delegation_revoked':
        return '❌';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'task_delegated':
        return 'text-blue-300';
      case 'task_completed':
        return 'text-green-300';
      case 'task_updated':
        return 'text-yellow-300';
      case 'comment_mention':
        return 'text-purple-300';
      case 'comment_reply':
        return 'text-indigo-300';
      case 'delegation_revoked':
        return 'text-red-300';
      default:
        return 'text-gray-300';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatNotificationType = (type: string): string => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const ariaLabel = generateAriaLabel.notificationItem(notification);
  const notificationId = `notification-${notification.id}`;

  return (
    <div
      ref={ref}
      id={notificationId}
      className={cn(
        'transition-all duration-200 cursor-pointer group',
        'hover:bg-white/10 active:bg-white/15 focus:bg-white/15',
        'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-inset',
        !notification.isRead && 'bg-blue-500/10 border-l-2 border-l-blue-400',
        isFocused && 'bg-white/15 ring-2 ring-white/50',
        // Mobile-friendly spacing and touch targets
        isMobile ? 'p-3 min-h-[60px]' : 'p-4',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={ARIA_ROLES.NOTIFICATION_ITEM}
      tabIndex={0}
      aria-label={ariaLabel}
      aria-describedby={`${notificationId}-content ${notificationId}-actions`}
      aria-selected={showSelection ? isSelected : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Selection Checkbox */}
        {showSelection && (
          <div className="flex-shrink-0 mt-1">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleToggleSelection}
                className="sr-only peer"
                aria-describedby={`${notificationId}-selection-description`}
              />
              <div className={cn(
                'border-2 rounded transition-colors duration-200',
                'focus-within:ring-2 focus-within:ring-white/50',
                // Mobile-friendly touch targets
                isMobile ? 'w-5 h-5' : 'w-4 h-4',
                isSelected 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'border-white/30 hover:border-white/50'
              )}>
                {isSelected && (
                  <svg 
                    className={cn('text-white', isMobile ? 'w-4 h-4' : 'w-3 h-3')} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </label>
            <div id={`${notificationId}-selection-description`} className="sr-only">
              {isSelected ? 'Selected for bulk actions' : 'Not selected'}
            </div>
          </div>
        )}

        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <span className="text-lg" role="img" aria-label={formatNotificationType(notification.type)}>
            {getNotificationIcon(notification.type)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0" id={`${notificationId}-content`}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={cn(
              'font-medium truncate',
              // Mobile-friendly font sizes
              isMobile ? 'text-base' : 'text-sm',
              notification.isRead ? 'text-white/80' : 'text-white'
            )}>
              {notification.title}
            </h4>
            
            {/* Unread indicator */}
            {!notification.isRead && (
              <div
                className={cn(
                  'flex-shrink-0 bg-blue-400 rounded-full mt-1',
                  isMobile ? 'w-3 h-3' : 'w-2 h-2'
                )}
                aria-hidden="true" // Status is conveyed through aria-label
              />
            )}
          </div>

          {/* Message */}
          <p className={cn(
            'mb-2 line-clamp-2',
            // Mobile-friendly font sizes
            isMobile ? 'text-base' : 'text-sm',
            notification.isRead ? 'text-white/60' : 'text-white/80'
          )}>
            {notification.message}
          </p>

          {/* Metadata */}
          <div className={cn(
            'flex items-center justify-between text-white/50',
            isMobile ? 'text-sm' : 'text-xs'
          )}>
            <div className="flex items-center gap-2">
              <span className={getNotificationColor(notification.type)}>
                {formatNotificationType(notification.type)}
              </span>
              {notification.resourceType && (
                <>
                  <span aria-hidden="true">•</span>
                  <span className="capitalize">{notification.resourceType}</span>
                </>
              )}
            </div>
            <time dateTime={notification.createdAt} title={new Date(notification.createdAt).toLocaleString()}>
              {formatTimeAgo(notification.createdAt)}
            </time>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!showSelection && (
        <div 
          className={cn(
            'flex items-center justify-end gap-2 mt-3 transition-opacity duration-200',
            // Always show on mobile for better accessibility
            isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
          )}
          id={`${notificationId}-actions`}
          role="group"
          aria-label="Notification actions"
        >
          {!notification.isRead ? (
            <button
              onClick={handleMarkAsRead}
              className={cn(
                'rounded border transition-colors duration-200',
                'bg-blue-500/20 hover:bg-blue-500/30 focus:bg-blue-500/30',
                'border-blue-500/30 text-blue-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-400/50',
                // Mobile-friendly touch targets
                isMobile ? 'px-3 py-2 text-sm min-h-[44px]' : 'px-2 py-1 text-xs'
              )}
              aria-label={`Mark "${notification.title}" as read`}
              title="Ctrl+R to mark as read"
            >
              Mark read
            </button>
          ) : onMarkAsUnread && (
            <button
              onClick={handleMarkAsUnread}
              className={cn(
                'rounded border transition-colors duration-200',
                'bg-gray-500/20 hover:bg-gray-500/30 focus:bg-gray-500/30',
                'border-gray-500/30 text-gray-200',
                'focus:outline-none focus:ring-2 focus:ring-gray-400/50',
                // Mobile-friendly touch targets
                isMobile ? 'px-3 py-2 text-sm min-h-[44px]' : 'px-2 py-1 text-xs'
              )}
              aria-label={`Mark "${notification.title}" as unread`}
              title="Ctrl+R to mark as unread"
            >
              Mark unread
            </button>
          )}
          
          <button
            onClick={handleDelete}
            className={cn(
              'rounded border transition-colors duration-200',
              'bg-red-500/20 hover:bg-red-500/30 focus:bg-red-500/30',
              'border-red-500/30 text-red-200',
              'focus:outline-none focus:ring-2 focus:ring-red-400/50',
              // Mobile-friendly touch targets
              isMobile ? 'px-3 py-2 text-sm min-h-[44px]' : 'px-2 py-1 text-xs'
            )}
            aria-label={`Delete "${notification.title}" notification`}
            title="Ctrl+D to delete"
          >
            Delete
          </button>
        </div>
      )}

      {/* Keyboard shortcuts hint for screen readers */}
      <div className="sr-only">
        Keyboard shortcuts: Enter or Space to open, Ctrl+R to toggle read status, Ctrl+D to delete
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';