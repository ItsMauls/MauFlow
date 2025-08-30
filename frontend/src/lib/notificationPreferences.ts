/**
 * Notification Preferences Utilities
 * Handles user notification preferences and filtering
 */

import { NotificationPreferences, NotificationType, Notification } from '@/types/collaboration';

const PREFERENCES_STORAGE_KEY = 'mauflow_notification_preferences';

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  task_delegated: true,
  task_completed: true,
  task_updated: true,
  comment_mention: true,
  comment_reply: true,
  delegation_revoked: true,
  emailNotifications: false,
  pushNotifications: true,
  soundEnabled: true,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00'
  }
};

/**
 * Get user notification preferences from storage
 */
export const getNotificationPreferences = (userId?: string): NotificationPreferences => {
  try {
    if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFERENCES;
    
    const key = userId ? `${PREFERENCES_STORAGE_KEY}_${userId}` : PREFERENCES_STORAGE_KEY;
    const stored = localStorage.getItem(key);
    
    if (!stored) return DEFAULT_NOTIFICATION_PREFERENCES;
    
    const preferences = JSON.parse(stored);
    
    // Merge with defaults to ensure all properties exist
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...preferences };
  } catch (error) {
    console.error('Error reading notification preferences:', error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
};

/**
 * Save user notification preferences to storage
 */
export const saveNotificationPreferences = (
  preferences: NotificationPreferences, 
  userId?: string
): void => {
  try {
    if (typeof window === 'undefined') return;
    
    const key = userId ? `${PREFERENCES_STORAGE_KEY}_${userId}` : PREFERENCES_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  }
};

/**
 * Update a specific notification preference
 */
export const updateNotificationPreference = (
  type: keyof NotificationPreferences,
  value: boolean | NotificationPreferences['quietHours'],
  userId?: string
): void => {
  const preferences = getNotificationPreferences(userId);
  
  if (type === 'quietHours' && typeof value === 'object') {
    preferences.quietHours = value;
  } else if (typeof value === 'boolean') {
    (preferences as any)[type] = value;
  }
  
  saveNotificationPreferences(preferences, userId);
};

/**
 * Check if a notification type is enabled for a user
 */
export const isNotificationTypeEnabled = (
  type: NotificationType,
  userId?: string
): boolean => {
  const preferences = getNotificationPreferences(userId);
  return preferences[type] ?? true;
};

/**
 * Check if notifications should be shown during quiet hours
 */
export const isInQuietHours = (userId?: string): boolean => {
  const preferences = getNotificationPreferences(userId);
  
  if (!preferences.quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const { startTime, endTime } = preferences.quietHours;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }
  
  // Handle same-day quiet hours (e.g., 12:00 to 14:00)
  return currentTime >= startTime && currentTime <= endTime;
};

/**
 * Filter notifications based on user preferences
 */
export const filterNotificationsByPreferences = (
  notifications: Notification[],
  userId?: string
): Notification[] => {
  const preferences = getNotificationPreferences(userId);
  
  return notifications.filter(notification => {
    // Check if notification type is enabled
    if (!preferences[notification.type]) {
      return false;
    }
    
    // During quiet hours, only show urgent notifications
    if (isInQuietHours(userId)) {
      const isUrgent = notification.metadata?.priority === 'urgent' || 
                      notification.type === 'delegation_revoked';
      return isUrgent;
    }
    
    return true;
  });
};

/**
 * Get notification preferences summary for display
 */
export const getPreferencesSummary = (userId?: string): {
  enabledTypes: NotificationType[];
  disabledTypes: NotificationType[];
  totalEnabled: number;
  totalDisabled: number;
} => {
  const preferences = getNotificationPreferences(userId);
  
  const allTypes: NotificationType[] = [
    'task_delegated',
    'task_completed', 
    'task_updated',
    'comment_mention',
    'comment_reply',
    'delegation_revoked'
  ];
  
  const enabledTypes = allTypes.filter(type => preferences[type]);
  const disabledTypes = allTypes.filter(type => !preferences[type]);
  
  return {
    enabledTypes,
    disabledTypes,
    totalEnabled: enabledTypes.length,
    totalDisabled: disabledTypes.length
  };
};

/**
 * Reset notification preferences to defaults
 */
export const resetNotificationPreferences = (userId?: string): void => {
  saveNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES, userId);
};

/**
 * Export notification preferences for backup
 */
export const exportNotificationPreferences = (userId?: string): NotificationPreferences => {
  return getNotificationPreferences(userId);
};

/**
 * Import notification preferences from backup
 */
export const importNotificationPreferences = (
  preferences: NotificationPreferences,
  userId?: string
): void => {
  // Validate preferences before importing
  const validatedPreferences = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...preferences };
  saveNotificationPreferences(validatedPreferences, userId);
};

/**
 * Get notification type display names
 */
export const getNotificationTypeDisplayName = (type: NotificationType): string => {
  const displayNames: Record<NotificationType, string> = {
    task_delegated: 'Task Assignments',
    task_completed: 'Task Completions',
    task_updated: 'Task Updates',
    comment_mention: 'Comment Mentions',
    comment_reply: 'Comment Replies',
    delegation_revoked: 'Delegation Changes'
  };
  
  return displayNames[type] || type;
};

/**
 * Get notification type descriptions
 */
export const getNotificationTypeDescription = (type: NotificationType): string => {
  const descriptions: Record<NotificationType, string> = {
    task_delegated: 'When tasks are assigned to you',
    task_completed: 'When delegated tasks are completed',
    task_updated: 'When tasks you delegated are updated',
    comment_mention: 'When you are mentioned in comments',
    comment_reply: 'When someone replies to your comments',
    delegation_revoked: 'When task assignments are revoked'
  };
  
  return descriptions[type] || 'Notification type';
};