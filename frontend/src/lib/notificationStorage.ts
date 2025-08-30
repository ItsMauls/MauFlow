/**
 * Notification Local Storage Utilities
 * Handles persistence and management of notifications in browser local storage
 */

import { Notification, NotificationType } from '@/types/collaboration';

const STORAGE_KEY = 'mauflow_notifications';
const NOTIFICATION_EXPIRY_DAYS = 30;

/**
 * Get all notifications from local storage
 */
export const getStoredNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const notifications: Notification[] = JSON.parse(stored);
    
    // Filter out expired notifications (older than 30 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - NOTIFICATION_EXPIRY_DAYS);
    
    const validNotifications = notifications.filter(notification => {
      const createdAt = new Date(notification.createdAt);
      return createdAt > cutoffDate;
    });
    
    // Update storage if we filtered out any notifications
    if (validNotifications.length !== notifications.length) {
      storeNotifications(validNotifications);
    }
    
    return validNotifications;
  } catch (error) {
    console.error('Error reading notifications from storage:', error);
    return [];
  }
};

/**
 * Store notifications array to local storage
 */
export const storeNotifications = (notifications: Notification[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error storing notifications:', error);
  }
};

/**
 * Add a new notification to storage
 */
export const addNotificationToStorage = (notification: Notification): void => {
  const notifications = getStoredNotifications();
  notifications.unshift(notification); // Add to beginning for chronological order
  storeNotifications(notifications);
};

/**
 * Update a notification in storage
 */
export const updateNotificationInStorage = (
  notificationId: string, 
  updates: Partial<Notification>
): void => {
  const notifications = getStoredNotifications();
  const index = notifications.findIndex(n => n.id === notificationId);
  
  if (index !== -1) {
    notifications[index] = { ...notifications[index], ...updates };
    storeNotifications(notifications);
  }
};

/**
 * Remove a notification from storage
 */
export const removeNotificationFromStorage = (notificationId: string): void => {
  const notifications = getStoredNotifications();
  const filtered = notifications.filter(n => n.id !== notificationId);
  storeNotifications(filtered);
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = (notificationId: string): void => {
  updateNotificationInStorage(notificationId, {
    isRead: true,
    readAt: new Date().toISOString()
  });
};

/**
 * Mark a notification as unread
 */
export const markNotificationAsUnread = (notificationId: string): void => {
  updateNotificationInStorage(notificationId, {
    isRead: false,
    readAt: undefined
  });
};

/**
 * Mark all notifications as read for a specific user
 */
export const markAllNotificationsAsRead = (userId: string): void => {
  const notifications = getStoredNotifications();
  const updated = notifications.map(notification => {
    if (notification.recipientId === userId && !notification.isRead) {
      return {
        ...notification,
        isRead: true,
        readAt: new Date().toISOString()
      };
    }
    return notification;
  });
  storeNotifications(updated);
};

/**
 * Get notifications for a specific user
 */
export const getNotificationsForUser = (userId: string): Notification[] => {
  const notifications = getStoredNotifications();
  return notifications.filter(n => n.recipientId === userId);
};

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = (userId: string): number => {
  const notifications = getNotificationsForUser(userId);
  return notifications.filter(n => !n.isRead).length;
};

/**
 * Clear old notifications (older than specified days)
 */
export const clearOldNotifications = (days: number = NOTIFICATION_EXPIRY_DAYS): void => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const notifications = getStoredNotifications();
  const filtered = notifications.filter(notification => {
    const createdAt = new Date(notification.createdAt);
    return createdAt > cutoffDate;
  });
  
  storeNotifications(filtered);
};

/**
 * Clear all notifications for a user
 */
export const clearAllNotificationsForUser = (userId: string): void => {
  const notifications = getStoredNotifications();
  const filtered = notifications.filter(n => n.recipientId !== userId);
  storeNotifications(filtered);
};

/**
 * Archive old notifications (mark as archived instead of deleting)
 */
export const archiveOldNotifications = (userId: string, days: number = NOTIFICATION_EXPIRY_DAYS): void => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const notifications = getStoredNotifications();
  const updated = notifications.map(notification => {
    if (notification.recipientId === userId && new Date(notification.createdAt) <= cutoffDate) {
      return { ...notification, isArchived: true, archivedAt: new Date().toISOString() };
    }
    return notification;
  });
  
  storeNotifications(updated);
};

/**
 * Get archived notifications for a user
 */
export const getArchivedNotifications = (userId: string): Notification[] => {
  const notifications = getStoredNotifications();
  return notifications.filter(n => n.recipientId === userId && (n as any).isArchived);
};

/**
 * Get active (non-archived) notifications for a user
 */
export const getActiveNotifications = (userId: string): Notification[] => {
  const notifications = getStoredNotifications();
  return notifications.filter(n => n.recipientId === userId && !(n as any).isArchived);
};

/**
 * Bulk mark notifications as read
 */
export const bulkMarkAsRead = (notificationIds: string[]): void => {
  const notifications = getStoredNotifications();
  const updated = notifications.map(notification => {
    if (notificationIds.includes(notification.id) && !notification.isRead) {
      return {
        ...notification,
        isRead: true,
        readAt: new Date().toISOString()
      };
    }
    return notification;
  });
  storeNotifications(updated);
};

/**
 * Bulk delete notifications
 */
export const bulkDeleteNotifications = (notificationIds: string[]): void => {
  const notifications = getStoredNotifications();
  const filtered = notifications.filter(n => !notificationIds.includes(n.id));
  storeNotifications(filtered);
};

/**
 * Get notifications by type for a user
 */
export const getNotificationsByType = (
  userId: string, 
  type: NotificationType
): Notification[] => {
  const notifications = getNotificationsForUser(userId);
  return notifications.filter(n => n.type === type);
};

/**
 * Search notifications by content
 */
export const searchNotifications = (
  userId: string, 
  query: string
): Notification[] => {
  const notifications = getNotificationsForUser(userId);
  const lowercaseQuery = query.toLowerCase();
  
  return notifications.filter(notification =>
    notification.title.toLowerCase().includes(lowercaseQuery) ||
    notification.message.toLowerCase().includes(lowercaseQuery)
  );
};

/**
 * Get notification statistics for a user
 */
export const getNotificationStats = (userId: string) => {
  const notifications = getNotificationsForUser(userId);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const typeStats = notifications.reduce((acc, notification) => {
    acc[notification.type] = (acc[notification.type] || 0) + 1;
    return acc;
  }, {} as Record<NotificationType, number>);
  
  return {
    total: notifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount,
    byType: typeStats
  };
};

/**
 * Validate notification data before storage
 */
export const validateNotification = (notification: Notification): boolean => {
  return !!(
    notification.id &&
    notification.type &&
    notification.title &&
    notification.message &&
    notification.recipientId &&
    notification.createdAt
  );
};