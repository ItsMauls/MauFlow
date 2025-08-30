/**
 * NotificationCenter Component
 * Main notification dropdown component with badge and notification list
 * Enhanced with comprehensive accessibility support
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import ConnectionStatus from './ConnectionStatus';
import RealTimeIndicator from './RealTimeIndicator';
import { 
  ARIA_ROLES, 
  KEYBOARD_KEYS, 
  FocusManager, 
  ScreenReaderAnnouncer,
  generateAriaLabel,
  mobileAccessibility,
  reducedMotionSupport
} from '@/lib/accessibility';

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [focusedNotificationIndex, setFocusedNotificationIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const notificationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const announcementRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    connectionStatus,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearOldNotifications,
    archiveOldNotifications,
    bulkMarkAsRead,
    bulkDeleteNotifications
  } = useNotifications();

  // Initialize notification refs array
  useEffect(() => {
    notificationRefs.current = notificationRefs.current.slice(0, notifications.length);
  }, [notifications.length]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedNotificationIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case KEYBOARD_KEYS.ESCAPE:
          event.preventDefault();
          setIsOpen(false);
          setFocusedNotificationIndex(-1);
          FocusManager.popFocus();
          break;

        case KEYBOARD_KEYS.ARROW_DOWN:
          event.preventDefault();
          if (notifications.length > 0) {
            const nextIndex = focusedNotificationIndex < notifications.length - 1 
              ? focusedNotificationIndex + 1 
              : 0;
            setFocusedNotificationIndex(nextIndex);
            notificationRefs.current[nextIndex]?.focus();
          }
          break;

        case KEYBOARD_KEYS.ARROW_UP:
          event.preventDefault();
          if (notifications.length > 0) {
            const prevIndex = focusedNotificationIndex > 0 
              ? focusedNotificationIndex - 1 
              : notifications.length - 1;
            setFocusedNotificationIndex(prevIndex);
            notificationRefs.current[prevIndex]?.focus();
          }
          break;

        case KEYBOARD_KEYS.HOME:
          event.preventDefault();
          if (notifications.length > 0) {
            setFocusedNotificationIndex(0);
            notificationRefs.current[0]?.focus();
          }
          break;

        case KEYBOARD_KEYS.END:
          event.preventDefault();
          if (notifications.length > 0) {
            const lastIndex = notifications.length - 1;
            setFocusedNotificationIndex(lastIndex);
            notificationRefs.current[lastIndex]?.focus();
          }
          break;

        case KEYBOARD_KEYS.TAB:
          // Allow normal tab navigation within dropdown
          if (dropdownRef.current) {
            FocusManager.trapFocus(dropdownRef.current, event);
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, focusedNotificationIndex, notifications.length]);

  const handleToggleDropdown = () => {
    if (!isOpen) {
      setIsOpen(true);
      setFocusedNotificationIndex(-1);
      if (buttonRef.current) {
        FocusManager.pushFocus(buttonRef.current);
      }
      
      // Announce dropdown opening to screen readers
      ScreenReaderAnnouncer.announce(
        `Notifications panel opened. ${notifications.length} notification${notifications.length !== 1 ? 's' : ''} available.`
      );
    } else {
      setIsOpen(false);
      setFocusedNotificationIndex(-1);
      FocusManager.popFocus();
    }
  };

  const handleNotificationClick = async (notificationId: string, resourceId?: string, resourceType?: string) => {
    // Mark notification as read when clicked
    try {
      await markAsRead(notificationId);
      
      // Navigate to relevant resource
      if (resourceId && resourceType) {
        handleNavigation(resourceId, resourceType);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleNavigation = (resourceId: string, resourceType: string) => {
    // Navigation logic for different resource types
    switch (resourceType) {
      case 'task':
        // In a real app, this would use Next.js router
        console.log(`Navigate to task: ${resourceId}`);
        // router.push(`/tasks/${resourceId}`);
        break;
      case 'project':
        console.log(`Navigate to project: ${resourceId}`);
        // router.push(`/projects/${resourceId}`);
        break;
      case 'comment':
        console.log(`Navigate to comment: ${resourceId}`);
        // router.push(`/comments/${resourceId}`);
        break;
      default:
        console.log(`Navigate to resource: ${resourceType}/${resourceId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await markAllAsRead();
      
      // Announce action completion
      ScreenReaderAnnouncer.announce(
        `${unreadNotifications.length} notification${unreadNotifications.length !== 1 ? 's' : ''} marked as read`,
        'assertive'
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      ScreenReaderAnnouncer.announce('Failed to mark notifications as read', 'assertive');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      await markAsUnread(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
    }
  };

  const handleToggleSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      const count = selectedNotifications.length;
      await bulkMarkAsRead(selectedNotifications);
      setSelectedNotifications([]);
      setShowBulkActions(false);
      
      // Announce bulk action completion
      ScreenReaderAnnouncer.announce(
        `${count} notification${count !== 1 ? 's' : ''} marked as read`,
        'assertive'
      );
    } catch (error) {
      console.error('Failed to bulk mark as read:', error);
      ScreenReaderAnnouncer.announce('Failed to mark notifications as read', 'assertive');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const count = selectedNotifications.length;
      await bulkDeleteNotifications(selectedNotifications);
      setSelectedNotifications([]);
      setShowBulkActions(false);
      
      // Announce bulk action completion
      ScreenReaderAnnouncer.announce(
        `${count} notification${count !== 1 ? 's' : ''} deleted`,
        'assertive'
      );
    } catch (error) {
      console.error('Failed to bulk delete notifications:', error);
      ScreenReaderAnnouncer.announce('Failed to delete notifications', 'assertive');
    }
  };

  const handleClearOldNotifications = async () => {
    try {
      await clearOldNotifications();
    } catch (error) {
      console.error('Failed to clear old notifications:', error);
    }
  };

  const handleArchiveOldNotifications = async () => {
    try {
      await archiveOldNotifications(30);
    } catch (error) {
      console.error('Failed to archive old notifications:', error);
    }
  };

  return (
    <div className={cn('relative', className)} role={ARIA_ROLES.NOTIFICATION_CENTER} aria-label="Notification center">
      {/* Screen reader live region for announcements */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Compact Notification Bell Button */}
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className={cn(
          'relative rounded-full transition-all duration-200',
          'bg-white/10 hover:bg-white/20 border border-white/20',
          'backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white/50',
          'p-2 w-9 h-9 flex items-center justify-center',
          isOpen && 'bg-white/20'
        )}
        aria-label={generateAriaLabel.notificationBadge(unreadCount)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={isOpen ? 'notification-dropdown' : undefined}
        aria-describedby="notification-description"
      >
        {/* Bell Icon */}
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white font-bold text-xs rounded-full flex items-center justify-center border border-white/20"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Hidden description for screen readers */}
      <button>
      <div id="notification-description" className="sr-only">
        Notification center. Use arrow keys to navigate notifications when open.
        {unreadCount > 0 && ` ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}.`}
      </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id="notification-dropdown"
          className={cn(
            'absolute right-0 top-full mt-2 z-50 max-h-96 overflow-hidden',
            // Responsive width
            isMobile ? 'w-[calc(100vw-2rem)] max-w-sm' : 'w-80 max-w-[90vw]',
            // Reduced motion support
            reducedMotionSupport.getAnimationStyles(
              'animate-in slide-in-from-top-2 duration-200',
              'opacity-100'
            )
          )}
          role="region"
          aria-label="Notifications"
          aria-describedby="notification-instructions"
        >
          <GlassCard className="p-0 border-white/30 bg-white/15 backdrop-blur-xl">
            {/* Hidden instructions for screen readers */}
            <div id="notification-instructions" className="sr-only">
              Use arrow keys to navigate notifications. Press Enter to open, Escape to close.
              {showBulkActions && ' Selection mode is active. Use Tab to navigate bulk actions.'}
            </div>

            {/* Header */}
            <div className={cn('border-b border-white/20', isMobile ? 'p-3' : 'p-4')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 
                    id="notification-header"
                    className={cn(
                      'font-semibold text-white',
                      isMobile ? 'text-base' : 'text-lg'
                    )}
                  >
                    Notifications
                  </h3>
                  <RealTimeIndicator />
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className={cn(
                        'text-sm text-white/70 hover:text-white',
                        'transition-colors duration-200',
                        'focus:outline-none focus:underline'
                      )}
                    >
                      {showBulkActions ? 'Cancel' : 'Select'}
                    </button>
                  )}
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className={cn(
                        'text-sm text-blue-300 hover:text-blue-200',
                        'transition-colors duration-200',
                        'focus:outline-none focus:underline'
                      )}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <ConnectionStatus showText />
                  {unreadCount > 0 && (
                    <span className="text-sm text-white/70">
                      {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                {connectionStatus === 'disconnected' && (
                  <span className="text-xs text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded">
                    Offline mode
                  </span>
                )}
              </div>

              {/* Bulk Actions */}
              {showBulkActions && notifications.length > 0 && (
                <div 
                  className={cn('mt-3 bg-white/5 rounded-lg border border-white/10', isMobile ? 'p-2' : 'p-3')}
                  role={ARIA_ROLES.BULK_ACTIONS}
                  aria-label="Bulk notification actions"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAll}
                        className={cn(
                          'text-blue-300 hover:text-blue-200 focus:outline-none focus:underline',
                          'focus:ring-2 focus:ring-blue-400/50 rounded',
                          isMobile ? 'text-sm p-1' : 'text-sm'
                        )}
                        aria-describedby="select-all-description"
                      >
                        {selectedNotifications.length === notifications.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <div id="select-all-description" className="sr-only">
                        {selectedNotifications.length === notifications.length 
                          ? 'Deselect all notifications' 
                          : 'Select all notifications for bulk actions'
                        }
                      </div>
                      {selectedNotifications.length > 0 && (
                        <span 
                          className={cn('text-white/70', isMobile ? 'text-sm' : 'text-sm')}
                          aria-live="polite"
                        >
                          {selectedNotifications.length} selected
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {selectedNotifications.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBulkMarkAsRead}
                        className={cn(
                          'rounded border transition-colors duration-200',
                          'bg-blue-500/20 hover:bg-blue-500/30 focus:bg-blue-500/30',
                          'border-blue-500/30 text-blue-200',
                          'focus:outline-none focus:ring-2 focus:ring-blue-400/50',
                          isMobile ? 'px-2 py-1.5 text-sm min-h-[44px]' : 'px-3 py-1 text-xs'
                        )}
                        aria-describedby="bulk-read-description"
                      >
                        Mark Read
                      </button>
                      <div id="bulk-read-description" className="sr-only">
                        Mark {selectedNotifications.length} selected notification{selectedNotifications.length !== 1 ? 's' : ''} as read
                      </div>
                      
                      <button
                        onClick={handleBulkDelete}
                        className={cn(
                          'rounded border transition-colors duration-200',
                          'bg-red-500/20 hover:bg-red-500/30 focus:bg-red-500/30',
                          'border-red-500/30 text-red-200',
                          'focus:outline-none focus:ring-2 focus:ring-red-400/50',
                          isMobile ? 'px-2 py-1.5 text-sm min-h-[44px]' : 'px-3 py-1 text-xs'
                        )}
                        aria-describedby="bulk-delete-description"
                      >
                        Delete
                      </button>
                      <div id="bulk-delete-description" className="sr-only">
                        Delete {selectedNotifications.length} selected notification{selectedNotifications.length !== 1 ? 's' : ''} permanently
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Management Actions */}
              {notifications.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleArchiveOldNotifications}
                    className="text-xs text-white/60 hover:text-white/80 focus:outline-none focus:underline"
                  >
                    Archive Old
                  </button>
                  <span className="text-white/30">•</span>
                  <button
                    onClick={handleClearOldNotifications}
                    className="text-xs text-white/60 hover:text-white/80 focus:outline-none focus:underline"
                  >
                    Clear Old
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div 
              className="max-h-80 overflow-y-auto"
              role={ARIA_ROLES.NOTIFICATION_LIST}
              aria-label={`${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <div className={cn('text-center', isMobile ? 'p-3' : 'p-4')} role="status" aria-live="polite">
                  <div 
                    className={cn(
                      'border-2 border-white/30 border-t-white rounded-full mx-auto mb-2',
                      isMobile ? 'w-8 h-8' : 'w-6 h-6',
                      reducedMotionSupport.getAnimationStyles('animate-spin', '')
                    )}
                    aria-hidden="true"
                  />
                  <p className={cn('text-white/70', isMobile ? 'text-base' : 'text-sm')}>
                    Loading notifications...
                  </p>
                </div>
              ) : error ? (
                <div className={cn('text-center', isMobile ? 'p-3' : 'p-4')} role="alert">
                  <p className={cn('text-red-300 mb-2', isMobile ? 'text-base' : 'text-sm')}>
                    Failed to load notifications
                  </p>
                  <p className={cn('text-white/50', isMobile ? 'text-sm' : 'text-xs')}>
                    {error}
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className={cn('text-center', isMobile ? 'p-6' : 'p-8')}>
                  <div className={cn('mb-2', isMobile ? 'text-3xl' : 'text-4xl')} role="img" aria-label="Empty mailbox">
                    📭
                  </div>
                  <p className={cn('text-white/70', isMobile ? 'text-base' : 'text-sm')}>
                    No notifications
                  </p>
                  <p className={cn('text-white/50 mt-1', isMobile ? 'text-sm' : 'text-xs')}>
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {notifications.map((notification, index) => (
                    <NotificationItem
                      key={notification.id}
                      ref={(el) => (notificationRefs.current[index] = el)}
                      notification={notification}
                      onClick={() => handleNotificationClick(
                        notification.id,
                        notification.resourceId,
                        notification.resourceType
                      )}
                      onDelete={() => handleDeleteNotification(notification.id)}
                      onMarkAsRead={() => markAsRead(notification.id)}
                      onMarkAsUnread={() => handleMarkAsUnread(notification.id)}
                      onToggleSelection={() => handleToggleSelection(notification.id)}
                      isSelected={selectedNotifications.includes(notification.id)}
                      showSelection={showBulkActions}
                      isFocused={focusedNotificationIndex === index}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/20 bg-white/5">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to full notifications page
                    console.log('Navigate to all notifications');
                  }}
                  className={cn(
                    'w-full text-sm text-blue-300 hover:text-blue-200',
                    'transition-colors duration-200 text-center',
                    'focus:outline-none focus:underline'
                  )}
                >
                  View all notifications
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
};