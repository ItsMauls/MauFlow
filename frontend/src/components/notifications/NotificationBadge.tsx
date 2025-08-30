/**
 * NotificationBadge Component
 * Standalone notification badge for use in navigation or other components
 */

'use client';

import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showZero?: boolean;
  onClick?: () => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  className,
  size = 'md',
  showZero = false,
  onClick
}) => {
  const { unreadCount, isLoading } = useNotifications();

  const sizeClasses = {
    sm: 'min-w-[14px] h-[14px] text-[10px]',
    md: 'min-w-[18px] h-[18px] text-xs',
    lg: 'min-w-[22px] h-[22px] text-sm'
  };

  // Don't render if no unread notifications and showZero is false
  if (!showZero && unreadCount === 0) {
    return null;
  }

  // Don't render while loading
  if (isLoading) {
    return null;
  }

  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'bg-red-500 text-white font-bold rounded-full',
        'border-2 border-white/20 shadow-lg',
        sizeClasses[size],
        unreadCount > 0 && 'animate-pulse',
        onClick && 'cursor-pointer hover:bg-red-600 transition-colors duration-200',
        className
      )}
      onClick={onClick}
      aria-label={`${unreadCount} unread notifications`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {showZero || unreadCount > 0 ? displayCount : null}
    </span>
  );
};