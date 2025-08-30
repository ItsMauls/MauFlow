/**
 * Notification Preferences Utilities Tests
 * Tests for notification preferences management and filtering
 */

import {
  getNotificationPreferences,
  saveNotificationPreferences,
  updateNotificationPreference,
  isNotificationTypeEnabled,
  isInQuietHours,
  filterNotificationsByPreferences,
  getPreferencesSummary,
  resetNotificationPreferences,
  exportNotificationPreferences,
  importNotificationPreferences,
  getNotificationTypeDisplayName,
  getNotificationTypeDescription,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '@/lib/notificationPreferences';
import { NotificationPreferences, NotificationType, Notification } from '@/types/collaboration';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

const mockPreferences: NotificationPreferences = {
  task_delegated: true,
  task_completed: false,
  task_updated: true,
  comment_mention: true,
  comment_reply: false,
  delegation_revoked: true,
  emailNotifications: false,
  pushNotifications: true,
  soundEnabled: false,
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00'
  }
};

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'task_delegated',
    title: 'Task Assigned',
    message: 'You have been assigned a task',
    recipientId: 'user-1',
    isRead: false,
    createdAt: '2025-08-29T10:00:00Z'
  },
  {
    id: 'notif-2',
    type: 'task_completed',
    title: 'Task Completed',
    message: 'A task has been completed',
    recipientId: 'user-1',
    isRead: false,
    createdAt: '2025-08-29T11:00:00Z'
  },
  {
    id: 'notif-3',
    type: 'comment_mention',
    title: 'You were mentioned',
    message: 'Someone mentioned you',
    recipientId: 'user-1',
    isRead: false,
    createdAt: '2025-08-29T12:00:00Z'
  },
  {
    id: 'notif-4',
    type: 'delegation_revoked',
    title: 'Delegation Revoked',
    message: 'A delegation was revoked',
    recipientId: 'user-1',
    isRead: false,
    createdAt: '2025-08-29T13:00:00Z',
    metadata: { priority: 'urgent' }
  }
];

describe('Notification Preferences Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('getNotificationPreferences', () => {
    it('should return default preferences when no stored preferences exist', () => {
      const preferences = getNotificationPreferences();
      expect(preferences).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    });

    it('should return stored preferences when they exist', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockPreferences));
      
      const preferences = getNotificationPreferences();
      expect(preferences).toEqual(mockPreferences);
    });

    it('should merge stored preferences with defaults', () => {
      const partialPreferences = {
        task_delegated: false,
        soundEnabled: true
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(partialPreferences));
      
      const preferences = getNotificationPreferences();
      expect(preferences).toEqual({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...partialPreferences
      });
    });

    it('should return defaults when localStorage throws error', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const preferences = getNotificationPreferences();
      expect(preferences).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    });

    it('should use user-specific key when userId provided', () => {
      getNotificationPreferences('user-123');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('mauflow_notification_preferences_user-123');
    });
  });

  describe('saveNotificationPreferences', () => {
    it('should save preferences to localStorage', () => {
      saveNotificationPreferences(mockPreferences);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'mauflow_notification_preferences',
        JSON.stringify(mockPreferences)
      );
    });

    it('should use user-specific key when userId provided', () => {
      saveNotificationPreferences(mockPreferences, 'user-123');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'mauflow_notification_preferences_user-123',
        JSON.stringify(mockPreferences)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      expect(() => saveNotificationPreferences(mockPreferences)).not.toThrow();
    });
  });

  describe('updateNotificationPreference', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockPreferences));
    });

    it('should update boolean preference', () => {
      updateNotificationPreference('soundEnabled', true);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'mauflow_notification_preferences',
        JSON.stringify({
          ...mockPreferences,
          soundEnabled: true
        })
      );
    });

    it('should update quiet hours preference', () => {
      const newQuietHours = {
        enabled: false,
        startTime: '23:00',
        endTime: '07:00'
      };
      
      updateNotificationPreference('quietHours', newQuietHours);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'mauflow_notification_preferences',
        JSON.stringify({
          ...mockPreferences,
          quietHours: newQuietHours
        })
      );
    });
  });

  describe('isNotificationTypeEnabled', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockPreferences));
    });

    it('should return true for enabled notification types', () => {
      expect(isNotificationTypeEnabled('task_delegated')).toBe(true);
      expect(isNotificationTypeEnabled('comment_mention')).toBe(true);
    });

    it('should return false for disabled notification types', () => {
      expect(isNotificationTypeEnabled('task_completed')).toBe(false);
      expect(isNotificationTypeEnabled('comment_reply')).toBe(false);
    });

    it('should return true for unknown notification types', () => {
      expect(isNotificationTypeEnabled('unknown_type' as NotificationType)).toBe(true);
    });
  });

  describe('isInQuietHours', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockPreferences));
    });

    it('should return false when quiet hours are disabled', () => {
      const disabledQuietHours = {
        ...mockPreferences,
        quietHours: { ...mockPreferences.quietHours, enabled: false }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(disabledQuietHours));
      
      expect(isInQuietHours()).toBe(false);
    });

    it('should detect overnight quiet hours correctly', () => {
      // Mock current time to be 23:30 (within quiet hours 22:00-08:00)
      const mockDate = new Date('2025-08-29T23:30:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      expect(isInQuietHours()).toBe(true);
      
      jest.restoreAllMocks();
    });

    it('should detect same-day quiet hours correctly', () => {
      const sameDayQuietHours = {
        ...mockPreferences,
        quietHours: {
          enabled: true,
          startTime: '12:00',
          endTime: '14:00'
        }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sameDayQuietHours));
      
      // Mock current time to be 13:00 (within quiet hours 12:00-14:00)
      const mockDate = new Date('2025-08-29T13:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      expect(isInQuietHours()).toBe(true);
      
      jest.restoreAllMocks();
    });
  });

  describe('filterNotificationsByPreferences', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockPreferences));
    });

    it('should filter out disabled notification types', () => {
      const filtered = filterNotificationsByPreferences(mockNotifications);
      
      // task_completed and comment_reply are disabled in mockPreferences
      const expectedNotifications = mockNotifications.filter(n => 
        n.type !== 'task_completed' && n.type !== 'comment_reply'
      );
      
      expect(filtered).toEqual(expectedNotifications);
    });

    it('should allow urgent notifications during quiet hours', () => {
      // Mock being in quiet hours
      const mockDate = new Date('2025-08-29T23:30:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const filtered = filterNotificationsByPreferences(mockNotifications);
      
      // Only urgent notifications and delegation_revoked should pass through
      const expectedNotifications = mockNotifications.filter(n => 
        n.metadata?.priority === 'urgent' || n.type === 'delegation_revoked'
      );
      
      expect(filtered).toEqual(expectedNotifications);
      
      jest.restoreAllMocks();
    });

    it('should return all enabled notifications when not in quiet hours', () => {
      // Mock being outside quiet hours
      const mockDate = new Date('2025-08-29T15:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const filtered = filterNotificationsByPreferences(mockNotifications);
      
      // Should include all enabled types
      const expectedNotifications = mockNotifications.filter(n => 
        mockPreferences[n.type] !== false
      );
      
      expect(filtered).toEqual(expectedNotifications);
      
      jest.restoreAllMocks();
    });
  });

  describe('getPreferencesSummary', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockPreferences));
    });

    it('should return correct preferences summary', () => {
      const summary = getPreferencesSummary();
      
      expect(summary).toEqual({
        enabledTypes: ['task_delegated', 'task_updated', 'comment_mention', 'delegation_revoked'],
        disabledTypes: ['task_completed', 'comment_reply'],
        totalEnabled: 4,
        totalDisabled: 2
      });
    });
  });

  describe('resetNotificationPreferences', () => {
    it('should reset preferences to defaults', () => {
      resetNotificationPreferences();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'mauflow_notification_preferences',
        JSON.stringify(DEFAULT_NOTIFICATION_PREFERENCES)
      );
    });

    it('should use user-specific key when userId provided', () => {
      resetNotificationPreferences('user-123');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'mauflow_notification_preferences_user-123',
        JSON.stringify(DEFAULT_NOTIFICATION_PREFERENCES)
      );
    });
  });

  describe('exportNotificationPreferences', () => {
    it('should export current preferences', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockPreferences));
      
      const exported = exportNotificationPreferences();
      expect(exported).toEqual(mockPreferences);
    });
  });

  describe('importNotificationPreferences', () => {
    it('should import and validate preferences', () => {
      const importedPreferences = {
        task_delegated: false,
        soundEnabled: true,
        // Missing some properties - should be merged with defaults
      } as Partial<NotificationPreferences>;
      
      importNotificationPreferences(importedPreferences as NotificationPreferences);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'mauflow_notification_preferences',
        JSON.stringify({
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...importedPreferences
        })
      );
    });
  });

  describe('getNotificationTypeDisplayName', () => {
    it('should return correct display names', () => {
      expect(getNotificationTypeDisplayName('task_delegated')).toBe('Task Assignments');
      expect(getNotificationTypeDisplayName('task_completed')).toBe('Task Completions');
      expect(getNotificationTypeDisplayName('task_updated')).toBe('Task Updates');
      expect(getNotificationTypeDisplayName('comment_mention')).toBe('Comment Mentions');
      expect(getNotificationTypeDisplayName('comment_reply')).toBe('Comment Replies');
      expect(getNotificationTypeDisplayName('delegation_revoked')).toBe('Delegation Changes');
    });

    it('should return the type itself for unknown types', () => {
      expect(getNotificationTypeDisplayName('unknown_type' as NotificationType)).toBe('unknown_type');
    });
  });

  describe('getNotificationTypeDescription', () => {
    it('should return correct descriptions', () => {
      expect(getNotificationTypeDescription('task_delegated')).toBe('When tasks are assigned to you');
      expect(getNotificationTypeDescription('task_completed')).toBe('When delegated tasks are completed');
      expect(getNotificationTypeDescription('task_updated')).toBe('When tasks you delegated are updated');
      expect(getNotificationTypeDescription('comment_mention')).toBe('When you are mentioned in comments');
      expect(getNotificationTypeDescription('comment_reply')).toBe('When someone replies to your comments');
      expect(getNotificationTypeDescription('delegation_revoked')).toBe('When task assignments are revoked');
    });

    it('should return default description for unknown types', () => {
      expect(getNotificationTypeDescription('unknown_type' as NotificationType)).toBe('Notification type');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const preferences = getNotificationPreferences();
      expect(preferences).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    });

    it('should handle null values in localStorage gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const preferences = getNotificationPreferences();
      expect(preferences).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    });

    it('should handle localStorage quota exceeded errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });
      
      expect(() => saveNotificationPreferences(mockPreferences)).not.toThrow();
    });

    it('should handle missing window object (SSR)', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      const preferences = getNotificationPreferences();
      expect(preferences).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
      
      global.window = originalWindow;
    });
  });
});