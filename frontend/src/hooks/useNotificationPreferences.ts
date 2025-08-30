/**
 * useNotificationPreferences Hook
 * Manages user notification preferences and settings
 */

import { useState, useEffect, useCallback } from 'react';
import { NotificationPreferences, NotificationType } from '@/types/collaboration';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  updateNotificationPreference,
  isNotificationTypeEnabled,
  isInQuietHours,
  getPreferencesSummary,
  resetNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '@/lib/notificationPreferences';
import { currentUser } from '@/lib/mockData';

export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;
  updatePreference: (type: keyof NotificationPreferences, value: boolean | NotificationPreferences['quietHours']) => void;
  toggleNotificationType: (type: NotificationType) => void;
  isTypeEnabled: (type: NotificationType) => boolean;
  isInQuietHours: boolean;
  summary: {
    enabledTypes: NotificationType[];
    disabledTypes: NotificationType[];
    totalEnabled: number;
    totalDisabled: number;
  };
  resetToDefaults: () => void;
  exportPreferences: () => NotificationPreferences;
  importPreferences: (preferences: NotificationPreferences) => void;
}

/**
 * Hook for managing notification preferences
 */
export const useNotificationPreferences = (userId?: string): UseNotificationPreferencesReturn => {
  const effectiveUserId = userId || currentUser.id;
  
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userPreferences = getNotificationPreferences(effectiveUserId);
      setPreferences(userPreferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notification preferences');
      console.error('Error loading notification preferences:', err);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  // Update a specific preference
  const updatePreference = useCallback((
    type: keyof NotificationPreferences,
    value: boolean | NotificationPreferences['quietHours']
  ) => {
    try {
      setError(null);
      
      updateNotificationPreference(type, value, effectiveUserId);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        [type]: value
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preference';
      setError(errorMessage);
      console.error('Error updating notification preference:', err);
    }
  }, [effectiveUserId]);

  // Toggle a notification type on/off
  const toggleNotificationType = useCallback((type: NotificationType) => {
    const currentValue = preferences[type];
    updatePreference(type, !currentValue);
  }, [preferences, updatePreference]);

  // Check if a notification type is enabled
  const isTypeEnabled = useCallback((type: NotificationType): boolean => {
    return isNotificationTypeEnabled(type, effectiveUserId);
  }, [effectiveUserId]);

  // Check if currently in quiet hours
  const isCurrentlyInQuietHours = isInQuietHours(effectiveUserId);

  // Get preferences summary
  const summary = getPreferencesSummary(effectiveUserId);

  // Reset preferences to defaults
  const resetToDefaults = useCallback(() => {
    try {
      setError(null);
      
      resetNotificationPreferences(effectiveUserId);
      setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset preferences';
      setError(errorMessage);
      console.error('Error resetting notification preferences:', err);
    }
  }, [effectiveUserId]);

  // Export preferences for backup
  const exportPreferences = useCallback((): NotificationPreferences => {
    return { ...preferences };
  }, [preferences]);

  // Import preferences from backup
  const importPreferences = useCallback((importedPreferences: NotificationPreferences) => {
    try {
      setError(null);
      
      // Validate and merge with defaults
      const validatedPreferences = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...importedPreferences };
      
      saveNotificationPreferences(validatedPreferences, effectiveUserId);
      setPreferences(validatedPreferences);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import preferences';
      setError(errorMessage);
      console.error('Error importing notification preferences:', err);
    }
  }, [effectiveUserId]);

  return {
    preferences,
    isLoading,
    error,
    updatePreference,
    toggleNotificationType,
    isTypeEnabled,
    isInQuietHours: isCurrentlyInQuietHours,
    summary,
    resetToDefaults,
    exportPreferences,
    importPreferences
  };
};

/**
 * Hook for notification preferences validation
 */
export const useNotificationPreferencesValidation = () => {
  const validatePreferences = useCallback((preferences: Partial<NotificationPreferences>): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    // Validate quiet hours format
    if (preferences.quietHours) {
      const { startTime, endTime } = preferences.quietHours;
      
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (startTime && !timeRegex.test(startTime)) {
        errors.push('Invalid start time format. Use HH:MM format.');
      }
      
      if (endTime && !timeRegex.test(endTime)) {
        errors.push('Invalid end time format. Use HH:MM format.');
      }
    }

    // Validate boolean preferences
    const booleanPrefs: (keyof NotificationPreferences)[] = [
      'task_delegated', 'task_completed', 'task_updated',
      'comment_mention', 'comment_reply', 'delegation_revoked',
      'emailNotifications', 'pushNotifications', 'soundEnabled'
    ];

    booleanPrefs.forEach(pref => {
      if (preferences[pref] !== undefined && typeof preferences[pref] !== 'boolean') {
        errors.push(`${pref} must be a boolean value.`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return { validatePreferences };
};

/**
 * Hook for notification preferences statistics
 */
export const useNotificationPreferencesStats = (userId?: string) => {
  const effectiveUserId = userId || currentUser.id;
  const [stats, setStats] = useState({
    totalPreferences: 0,
    enabledPreferences: 0,
    disabledPreferences: 0,
    quietHoursEnabled: false,
    lastUpdated: null as Date | null
  });

  useEffect(() => {
    const preferences = getNotificationPreferences(effectiveUserId);
    
    const notificationTypes: NotificationType[] = [
      'task_delegated', 'task_completed', 'task_updated',
      'comment_mention', 'comment_reply', 'delegation_revoked'
    ];
    
    const enabledCount = notificationTypes.filter(type => preferences[type]).length;
    
    setStats({
      totalPreferences: notificationTypes.length,
      enabledPreferences: enabledCount,
      disabledPreferences: notificationTypes.length - enabledCount,
      quietHoursEnabled: preferences.quietHours.enabled,
      lastUpdated: new Date()
    });
  }, [effectiveUserId]);

  return stats;
};