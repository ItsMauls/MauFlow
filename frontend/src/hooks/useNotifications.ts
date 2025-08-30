/**
 * useNotifications Hook
 * Manages notification state and provides methods for notification operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Notification, ConnectionStatus } from '@/types/collaboration';
import { notificationService } from '@/services/NotificationService';
import { currentUser } from '@/lib/mockData';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearOldNotifications: () => Promise<void>;
  archiveOldNotifications: (days?: number) => Promise<void>;
  bulkMarkAsRead: (notificationIds: string[]) => Promise<void>;
  bulkDeleteNotifications: (notificationIds: string[]) => Promise<void>;
  getArchivedNotifications: () => Notification[];
  refreshNotifications: () => void;
}

/**
 * Hook for managing notifications
 */
export const useNotifications = (userId?: string): UseNotificationsReturn => {
  const effectiveUserId = userId || currentUser.id;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');

  // Load initial notifications
  const loadNotifications = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userNotifications = notificationService.getNotifications(effectiveUserId);
      const unread = notificationService.getUnreadCount(effectiveUserId);
      
      setNotifications(userNotifications);
      setUnreadCount(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  // Subscribe to notification updates and connection status
  useEffect(() => {
    const unsubscribeNotifications = notificationService.subscribe((updatedNotifications) => {
      // Filter notifications for current user
      const userNotifications = updatedNotifications.filter(
        notif => notif.recipientId === effectiveUserId
      );
      
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.isRead).length);
    });

    const unsubscribeConnection = notificationService.subscribeToConnection((status) => {
      setConnectionStatus(status);
    });

    // Load initial data
    loadNotifications();

    return () => {
      unsubscribeNotifications();
      unsubscribeConnection();
    };
  }, [effectiveUserId, loadNotifications]);

  // Listen for real-time notification events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRealTimeNotification = (event: CustomEvent) => {
      const { notification } = event.detail;
      
      // Only process if it's for the current user
      if (notification.recipientId === effectiveUserId) {
        // Trigger a visual notification effect
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          });
        }
        
        // Refresh notifications to ensure UI is updated
        setTimeout(() => {
          loadNotifications();
        }, 100);
      }
    };

    window.addEventListener('realtime-notification', handleRealTimeNotification as EventListener);

    return () => {
      window.removeEventListener('realtime-notification', handleRealTimeNotification as EventListener);
    };
  }, [effectiveUserId, loadNotifications]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      setError(null);
      await notificationService.markAsRead(notificationId, effectiveUserId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [effectiveUserId]);

  // Mark a notification as unread
  const markAsUnread = useCallback(async (notificationId: string): Promise<void> => {
    try {
      setError(null);
      await notificationService.markAsUnread(notificationId, effectiveUserId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as unread';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [effectiveUserId]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await notificationService.markAllAsRead(effectiveUserId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [effectiveUserId]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string): Promise<void> => {
    try {
      setError(null);
      await notificationService.deleteNotification(notificationId, effectiveUserId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [effectiveUserId]);

  // Clear old notifications
  const clearOldNotifications = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await notificationService.clearOldNotifications(effectiveUserId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear old notifications';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [effectiveUserId]);

  // Archive old notifications
  const archiveOldNotifications = useCallback(async (days: number = 30): Promise<void> => {
    try {
      setError(null);
      await notificationService.archiveOldNotifications(effectiveUserId, days);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive old notifications';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [effectiveUserId]);

  // Bulk mark notifications as read
  const bulkMarkAsRead = useCallback(async (notificationIds: string[]): Promise<void> => {
    try {
      setError(null);
      await notificationService.bulkMarkAsRead(notificationIds, effectiveUserId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk mark notifications as read';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [effectiveUserId]);

  // Bulk delete notifications
  const bulkDeleteNotifications = useCallback(async (notificationIds: string[]): Promise<void> => {
    try {
      setError(null);
      await notificationService.bulkDeleteNotifications(notificationIds, effectiveUserId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk delete notifications';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [effectiveUserId]);

  // Get archived notifications
  const getArchivedNotifications = useCallback((): Notification[] => {
    return notificationService.getArchivedNotifications(effectiveUserId);
  }, [effectiveUserId]);

  // Refresh notifications manually
  const refreshNotifications = useCallback(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
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
    bulkDeleteNotifications,
    getArchivedNotifications,
    refreshNotifications
  };
};

/**
 * Hook for notification statistics
 */
export const useNotificationStats = (userId?: string) => {
  const effectiveUserId = userId || currentUser.id;
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    byType: {} as Record<string, number>
  });

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      const notifications = notificationService.getNotifications(effectiveUserId);
      const unreadCount = notifications.filter(n => !n.isRead).length;
      
      const byType = notifications.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setStats({
        total: notifications.length,
        unread: unreadCount,
        read: notifications.length - unreadCount,
        byType
      });
    });

    // Load initial stats
    const notifications = notificationService.getNotifications(effectiveUserId);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    const byType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      total: notifications.length,
      unread: unreadCount,
      read: notifications.length - unreadCount,
      byType
    });

    return unsubscribe;
  }, [effectiveUserId]);

  return stats;
};

/**
 * Hook for real-time notification simulation (for demo purposes)
 */
export const useNotificationSimulation = () => {
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateNotification = useCallback((
    type: 'task_delegated' | 'comment_mention',
    recipientId?: string,
    delay?: number
  ) => {
    const targetUserId = recipientId || currentUser.id;
    notificationService.simulateRealTimeNotification(type, targetUserId, delay);
  }, []);

  const startSimulation = useCallback((userId?: string, interval?: number) => {
    const targetUserId = userId || currentUser.id;
    notificationService.startNotificationSimulation(targetUserId, interval);
    setIsSimulating(true);
  }, []);

  const stopSimulation = useCallback(() => {
    notificationService.stopNotificationSimulation();
    setIsSimulating(false);
  }, []);

  const broadcastToUsers = useCallback((
    type: 'delegation' | 'mention' | 'task_update' | 'comment_reply',
    payload: any,
    recipients: string[]
  ) => {
    notificationService.broadcastToMultipleUsers(type, payload, recipients);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSimulating) {
        notificationService.stopNotificationSimulation();
      }
    };
  }, [isSimulating]);

  return { 
    simulateNotification, 
    startSimulation, 
    stopSimulation, 
    broadcastToUsers,
    isSimulating 
  };
};

/**
 * Hook for connection status monitoring
 */
export const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [lastConnected, setLastConnected] = useState<Date>(new Date());

  useEffect(() => {
    const unsubscribe = notificationService.subscribeToConnection((status) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        setLastConnected(new Date());
      }
    });

    return unsubscribe;
  }, []);

  return {
    connectionStatus,
    lastConnected,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isDisconnected: connectionStatus === 'disconnected'
  };
};