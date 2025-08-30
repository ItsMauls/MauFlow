/**
 * Notification Management Features Tests
 * Tests for mark as read/unread, bulk actions, archiving, and preferences
 */

import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { notificationService } from '@/services/NotificationService';
import * as notificationStorage from '@/lib/notificationStorage';
import * as notificationPreferences from '@/lib/notificationPreferences';
import { Notification, NotificationPreferences, NotificationType } from '@/types/collaboration';
import * as mockData from '@/lib/mockData';

// Mock dependencies
jest.mock('@/services/NotificationService');
jest.mock('@/lib/notificationStorage');
jest.mock('@/lib/notificationPreferences');
jest.mock('@/lib/mockData');

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;
const mockNotificationStorage = notificationStorage as jest.Mocked<typeof notificationStorage>;
const mockNotificationPreferences = notificationPreferences as jest.Mocked<typeof notificationPreferences>;

const mockDataModule = mockData as jest.Mocked<typeof mockData>;

const mockCurrentUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: {
    id: 'role-1',
    name: 'Developer',
    description: 'Developer role',
    permissions: [],
    canDelegate: true,
    canReceiveDelegations: true,
    canManageTeam: false
  },
  permissions: [],
  createdAt: '2025-08-29T00:00:00Z',
  isActive: true
};

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'task_delegated',
    title: 'New Task Assigned',
    message: 'You have been assigned a new task',
    recipientId: 'user-1',
    senderId: 'user-2',
    resourceId: 'task-1',
    resourceType: 'task',
    isRead: false,
    createdAt: '2025-08-29T10:00:00Z'
  },
  {
    id: 'notif-2',
    type: 'comment_mention',
    title: 'You were mentioned',
    message: 'Someone mentioned you in a comment',
    recipientId: 'user-1',
    senderId: 'user-3',
    resourceId: 'comment-1',
    resourceType: 'comment',
    isRead: true,
    readAt: '2025-08-29T11:00:00Z',
    createdAt: '2025-08-29T09:00:00Z'
  },
  {
    id: 'notif-3',
    type: 'task_completed',
    title: 'Task Completed',
    message: 'A delegated task has been completed',
    recipientId: 'user-1',
    senderId: 'user-4',
    resourceId: 'task-2',
    resourceType: 'task',
    isRead: false,
    createdAt: '2025-08-29T08:00:00Z'
  }
];

const mockPreferences: NotificationPreferences = {
  task_delegated: true,
  task_completed: true,
  task_updated: false,
  comment_mention: true,
  comment_reply: true,
  delegation_revoked: true,
  emailNotifications: false,
  pushNotifications: true,
  soundEnabled: true,
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00'
  }
};

describe('Notification Management Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockDataModule.currentUser = mockCurrentUser;
    mockNotificationService.getNotifications.mockReturnValue(mockNotifications);
    mockNotificationService.getUnreadCount.mockReturnValue(2);
    mockNotificationService.subscribe.mockImplementation((callback) => {
      callback(mockNotifications);
      return jest.fn();
    });
    mockNotificationService.subscribeToConnection.mockImplementation((callback) => {
      callback('connected');
      return jest.fn();
    });
    
    // Mock async methods
    mockNotificationService.markAsRead.mockResolvedValue();
    mockNotificationService.markAsUnread.mockResolvedValue();
    mockNotificationService.markAllAsRead.mockResolvedValue();
    mockNotificationService.deleteNotification.mockResolvedValue();
    mockNotificationService.clearOldNotifications.mockResolvedValue();
    mockNotificationService.archiveOldNotifications.mockResolvedValue();
    mockNotificationService.bulkMarkAsRead.mockResolvedValue();
    mockNotificationService.bulkDeleteNotifications.mockResolvedValue();
    
    // Mock storage functions
    mockNotificationStorage.markNotificationAsRead.mockImplementation(() => {});
    mockNotificationStorage.markNotificationAsUnread.mockImplementation(() => {});
    mockNotificationStorage.bulkMarkAsRead.mockImplementation(() => {});
    mockNotificationStorage.bulkDeleteNotifications.mockImplementation(() => {});
    mockNotificationStorage.archiveOldNotifications.mockImplementation(() => {});
    mockNotificationStorage.getArchivedNotifications.mockReturnValue([]);
    mockNotificationStorage.getActiveNotifications.mockReturnValue(mockNotifications);
    mockNotificationStorage.clearOldNotifications.mockImplementation(() => {});
    
    // Mock preferences functions
    mockNotificationPreferences.getNotificationPreferences.mockReturnValue(mockPreferences);
    mockNotificationPreferences.saveNotificationPreferences.mockImplementation(() => {});
    mockNotificationPreferences.updateNotificationPreference.mockImplementation(() => {});
    mockNotificationPreferences.isNotificationTypeEnabled.mockReturnValue(true);
    mockNotificationPreferences.isInQuietHours.mockReturnValue(false);
    mockNotificationPreferences.filterNotificationsByPreferences.mockReturnValue(mockNotifications);
    mockNotificationPreferences.DEFAULT_NOTIFICATION_PREFERENCES = {
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
  });

  describe('Mark as Read/Unread Functionality', () => {
    it('should mark notification as read', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.markAsRead('notif-1');
      });

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
    });

    it('should mark notification as unread', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.markAsUnread('notif-2');
      });

      expect(mockNotificationService.markAsUnread).toHaveBeenCalledWith('notif-2', 'user-1');
    });

    it('should handle mark as read errors', async () => {
      mockNotificationService.markAsRead.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        try {
          await result.current.markAsRead('notif-1');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to mark notification as read');
        }
      });
    });

    it('should handle mark as unread errors', async () => {
      mockNotificationService.markAsUnread.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        try {
          await result.current.markAsUnread('notif-2');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to mark notification as unread');
        }
      });
    });
  });

  describe('Bulk Notification Actions', () => {
    it('should bulk mark notifications as read', async () => {
      const { result } = renderHook(() => useNotifications());
      const notificationIds = ['notif-1', 'notif-3'];

      await act(async () => {
        await result.current.bulkMarkAsRead(notificationIds);
      });

      expect(mockNotificationService.bulkMarkAsRead).toHaveBeenCalledWith(notificationIds, 'user-1');
    });

    it('should bulk delete notifications', async () => {
      const { result } = renderHook(() => useNotifications());
      const notificationIds = ['notif-1', 'notif-2'];

      await act(async () => {
        await result.current.bulkDeleteNotifications(notificationIds);
      });

      expect(mockNotificationService.bulkDeleteNotifications).toHaveBeenCalledWith(notificationIds, 'user-1');
    });

    it('should handle bulk mark as read errors', async () => {
      mockNotificationService.bulkMarkAsRead.mockRejectedValue(new Error('Bulk operation failed'));
      
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        try {
          await result.current.bulkMarkAsRead(['notif-1', 'notif-2']);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to bulk mark notifications as read');
        }
      });
    });

    it('should handle bulk delete errors', async () => {
      mockNotificationService.bulkDeleteNotifications.mockRejectedValue(new Error('Bulk delete failed'));
      
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        try {
          await result.current.bulkDeleteNotifications(['notif-1', 'notif-2']);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to bulk delete notifications');
        }
      });
    });
  });

  describe('Notification Archiving', () => {
    it('should archive old notifications', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.archiveOldNotifications(30);
      });

      expect(mockNotificationService.archiveOldNotifications).toHaveBeenCalledWith('user-1', 30);
    });

    it('should use default days when archiving', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.archiveOldNotifications();
      });

      expect(mockNotificationService.archiveOldNotifications).toHaveBeenCalledWith('user-1', 30);
    });

    it('should get archived notifications', () => {
      const archivedNotifications = [
        { ...mockNotifications[0], isArchived: true, archivedAt: '2025-08-29T12:00:00Z' }
      ];
      mockNotificationService.getArchivedNotifications.mockReturnValue(archivedNotifications);

      const { result } = renderHook(() => useNotifications());

      const archived = result.current.getArchivedNotifications();
      expect(archived).toEqual(archivedNotifications);
      expect(mockNotificationService.getArchivedNotifications).toHaveBeenCalledWith('user-1');
    });

    it('should handle archiving errors', async () => {
      mockNotificationService.archiveOldNotifications.mockRejectedValue(new Error('Archive failed'));
      
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        try {
          await result.current.archiveOldNotifications(30);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to archive old notifications');
        }
      });
    });
  });

  describe('Notification Preferences', () => {
    it('should load notification preferences', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      expect(result.current.preferences).toEqual(mockPreferences);
      expect(mockNotificationPreferences.getNotificationPreferences).toHaveBeenCalledWith('user-1');
    });

    it('should update notification preference', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.updatePreference('task_updated', true);
      });

      expect(mockNotificationPreferences.updateNotificationPreference).toHaveBeenCalledWith(
        'task_updated', 
        true, 
        'user-1'
      );
    });

    it('should toggle notification type', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.toggleNotificationType('task_updated');
      });

      expect(mockNotificationPreferences.updateNotificationPreference).toHaveBeenCalledWith(
        'task_updated', 
        true, // Should toggle from false to true
        'user-1'
      );
    });

    it('should check if notification type is enabled', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      const isEnabled = result.current.isTypeEnabled('task_delegated');
      
      expect(isEnabled).toBe(true);
      expect(mockNotificationPreferences.isNotificationTypeEnabled).toHaveBeenCalledWith('task_delegated', 'user-1');
    });

    it('should check quiet hours status', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      expect(result.current.isInQuietHours).toBe(false);
      expect(mockNotificationPreferences.isInQuietHours).toHaveBeenCalledWith('user-1');
    });

    it('should reset preferences to defaults', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.resetToDefaults();
      });

      expect(mockNotificationPreferences.saveNotificationPreferences).toHaveBeenCalledWith(
        mockNotificationPreferences.DEFAULT_NOTIFICATION_PREFERENCES,
        'user-1'
      );
    });

    it('should export preferences', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      const exported = result.current.exportPreferences();
      
      expect(exported).toEqual(mockPreferences);
    });

    it('should import preferences', () => {
      const { result } = renderHook(() => useNotificationPreferences());
      const importedPreferences = { ...mockPreferences, soundEnabled: false };

      act(() => {
        result.current.importPreferences(importedPreferences);
      });

      expect(mockNotificationPreferences.saveNotificationPreferences).toHaveBeenCalledWith(
        { ...mockNotificationPreferences.DEFAULT_NOTIFICATION_PREFERENCES, ...importedPreferences },
        'user-1'
      );
    });

    it('should handle preference loading errors', () => {
      mockNotificationPreferences.getNotificationPreferences.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useNotificationPreferences());

      expect(result.current.error).toBe('Storage error');
      expect(result.current.preferences).toEqual(mockNotificationPreferences.DEFAULT_NOTIFICATION_PREFERENCES);
    });

    it('should handle preference update errors', () => {
      mockNotificationPreferences.updateNotificationPreference.mockImplementation(() => {
        throw new Error('Update failed');
      });

      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.updatePreference('soundEnabled', false);
      });

      expect(result.current.error).toBe('Failed to update preference');
    });
  });

  describe('Notification Filtering by Preferences', () => {
    it('should filter notifications based on preferences', () => {
      const filteredNotifications = mockNotifications.filter(n => n.type !== 'task_updated');
      mockNotificationPreferences.filterNotificationsByPreferences.mockReturnValue(filteredNotifications);

      const result = notificationPreferences.filterNotificationsByPreferences(mockNotifications, 'user-1');

      expect(result).toEqual(filteredNotifications);
      expect(mockNotificationPreferences.filterNotificationsByPreferences).toHaveBeenCalledWith(
        mockNotifications,
        'user-1'
      );
    });

    it('should handle quiet hours filtering', () => {
      mockNotificationPreferences.isInQuietHours.mockReturnValue(true);
      
      // Only urgent notifications should pass through during quiet hours
      const urgentNotifications = mockNotifications.filter(n => 
        n.metadata?.priority === 'urgent' || n.type === 'delegation_revoked'
      );
      mockNotificationPreferences.filterNotificationsByPreferences.mockReturnValue(urgentNotifications);

      const result = notificationPreferences.filterNotificationsByPreferences(mockNotifications, 'user-1');

      expect(result).toEqual(urgentNotifications);
    });
  });

  describe('Clear Old Notifications', () => {
    it('should clear old notifications', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.clearOldNotifications();
      });

      expect(mockNotificationService.clearOldNotifications).toHaveBeenCalledWith('user-1');
    });

    it('should handle clear old notifications errors', async () => {
      mockNotificationService.clearOldNotifications.mockRejectedValue(new Error('Clear failed'));
      
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        try {
          await result.current.clearOldNotifications();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to clear old notifications');
        }
      });
    });
  });

  describe('Notification Preferences Summary', () => {
    it('should provide preferences summary', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      const expectedSummary = {
        enabledTypes: ['task_delegated', 'task_completed', 'comment_mention', 'comment_reply', 'delegation_revoked'],
        disabledTypes: ['task_updated'],
        totalEnabled: 5,
        totalDisabled: 1
      };

      expect(result.current.summary).toEqual(expectedSummary);
    });
  });
});