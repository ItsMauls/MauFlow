'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GlassCard } from './GlassCard';
import { useAriaLiveRegion } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onAction?: (id: string, action: () => void) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  onAction
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-400/30 bg-gradient-to-r from-green-500/20 to-green-600/10';
      case 'error':
        return 'border-red-400/30 bg-gradient-to-r from-red-500/20 to-red-600/10';
      case 'warning':
        return 'border-yellow-400/30 bg-gradient-to-r from-yellow-500/20 to-yellow-600/10';
      default:
        return 'border-blue-400/30 bg-gradient-to-r from-blue-500/20 to-blue-600/10';
    }
  };

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  }, [notification.id, onDismiss]);

  const handleAction = useCallback(() => {
    if (notification.action && onAction) {
      onAction(notification.id, notification.action.onClick);
    }
  }, [notification.id, notification.action, onAction]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!notification.persistent && notification.duration) {
      const timer = setTimeout(handleDismiss, notification.duration);
      
      // Progress bar animation
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (notification.duration! / 100));
          return Math.max(0, newProgress);
        });
      }, 100);

      return () => {
        clearTimeout(timer);
        clearInterval(progressTimer);
      };
    }
  }, [notification.duration, notification.persistent, handleDismiss]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300',
        getColorClasses(),
        isExiting ? 'notification-exit' : 'notification-enter'
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white mb-1">
              {notification.title}
            </h4>
            {notification.message && (
              <p className="text-sm text-white/80 leading-relaxed">
                {notification.message}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {notification.action && (
              <button
                onClick={handleAction}
                className="text-xs font-medium text-white/90 hover:text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {notification.action.label}
              </button>
            )}
            
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white/90 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded p-1"
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      {!notification.persistent && notification.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-white/40 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onAction?: (id: string, action: () => void) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onDismiss,
  onAction,
  position = 'top-right',
  maxNotifications = 5
}) => {
  const { announce } = useAriaLiveRegion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Announce new notifications to screen readers
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      announce(
        `${latestNotification.type}: ${latestNotification.title}${
          latestNotification.message ? `. ${latestNotification.message}` : ''
        }`,
        latestNotification.type === 'error' ? 'assertive' : 'polite'
      );
    }
  }, [notifications, announce]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (!mounted) return null;

  const visibleNotifications = notifications.slice(-maxNotifications);

  return createPortal(
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none',
        getPositionClasses()
      )}
      aria-label="Notifications"
    >
      {visibleNotifications.map(notification => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationItem
            notification={notification}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        </div>
      ))}
      
      {notifications.length > maxNotifications && (
        <div className="text-center text-white/60 text-xs mt-2 pointer-events-auto">
          +{notifications.length - maxNotifications} more notifications
        </div>
      )}
    </div>,
    document.body
  );
};