/**
 * Tests for Notification Storage Utilities
 */

import {
  getStoredNotifications,
  storeNotifications,
  addNotificationToStorage,
  updateNotificationInStorage,
  removeNotificationFromStorage,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationsForUser,
  getUnreadNotificationCount,
  clearOldNotifications,
  clearAllNotificationsForUser,
  getNotificationsByType,
  searchNotifications,
  getNotificationStats,
  validateNotification
} from '@/lib/notificationStorage';
import { Notification } from '@/types/collaboration';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Notification Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  const mockNotification: Notification = {
    id: 'notif-1',
    type: 'task_delegated',
    title: 'Test Notification',
    message: 'Test message',
    recipientId: 'user-1',
    senderId: 'user-2',
    resourceId: 'task-1',
    resourceType: 'task',
    isRead: false,
    createdAt: '2025-08-29T10:00:00Z',
    metadata: { test: 'data' }
  };

  describe('getStoredNotifications', () => {
    it('should return empty array when no notifications stored', () => {
      const notifications = getStoredNotifications();
      expect(notifications).toEqual([]);
    });

    it('should return parsed notifications from localStorage', () => {
      const storedNotifications = [mockNotification];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedNotifications));

      const notifications = getStoredNotifications();
      expect(notifications).toEqual(storedNotifications);
    });

    it('should filter out expired notifications', () => {
      const oldNotification = {
        ...mockNotification,
        id: 'old-notif',
        createdAt: '2024-01-01T10:00:00Z' // Very old
      };
      const recentNotification = {
        ...mockNotification,
        id: 'recent-notif',
        createdAt: new Date().toISOString()
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([oldNotification, recentNotification])
      );

      const notifications = getStoredNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe('recent-notif');
    });

    it('should handle JSON parse errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const notifications = getStoredNotifications();
      expect(notifications).toEqual([]);
    });
  });

  describe('storeNotifications', () => {
    it('should store notifications to localStorage', () => {
      const notifications = [mockNotification];
      
      storeNotifications(notifications);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mauflow_notifications',
        JSON.stringify(notifications)
      );
    });

    it('should handle storage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => storeNotifications([mockNotification])).not.toThrow();
    });
  });

  describe('addNotificationToStorage', () => {
    it('should add notification to beginning of array', () => {
      const existingNotifications = [
        { ...mockNotification, id: 'existing-1' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingNotifications));

      addNotificationToStorage(mockNotification);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mauflow_notifications',
        JSON.stringify([mockNotification, ...existingNotifications])
      );
    });
  });

  describe('updateNotificationInStorage', () => {
    it('should update existing notification', () => {
      const notifications = [mockNotification];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      updateNotificationInStorage('notif-1', { isRead: true });

      const expectedNotifications = [
        { ...mockNotification, isRead: true }
      ];
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mauflow_notifications',
        JSON.stringify(expectedNotifications)
      );
    });

    it('should not update if notification not found', () => {
      const notifications = [mockNotification];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      updateNotificationInStorage('non-existent', { isRead: true });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mauflow_notifications',
        JSON.stringify(notifications)
      );
    });
  });

  describe('removeNotificationFromStorage', () => {
    it('should remove notification by id', () => {
      const notifications = [
        mockNotification,
        { ...mockNotification, id: 'notif-2' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      removeNotificationFromStorage('notif-1');

      const expectedNotifications = [
        { ...mockNotification, id: 'notif-2' }
      ];
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mauflow_notifications',
        JSON.stringify(expectedNotifications)
      );
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read with timestamp', () => {
      const notifications = [mockNotification];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      markNotificationAsRead('notif-1');

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      
      expect(storedData[0].isRead).toBe(true);
      expect(storedData[0].readAt).toBeDefined();
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all user notifications as read', () => {
      const notifications = [
        mockNotification,
        { ...mockNotification, id: 'notif-2', recipientId: 'user-2' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      markAllNotificationsAsRead('user-1');

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      
      expect(storedData[0].isRead).toBe(true); // user-1's notification
      expect(storedData[1].isRead).toBe(false); // user-2's notification unchanged
    });
  });

  describe('getNotificationsForUser', () => {
    it('should return notifications for specific user', () => {
      const notifications = [
        mockNotification,
        { ...mockNotification, id: 'notif-2', recipientId: 'user-2' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      const userNotifications = getNotificationsForUser('user-1');
      
      expect(userNotifications).toHaveLength(1);
      expect(userNotifications[0].recipientId).toBe('user-1');
    });
  });

  describe('getUnreadNotificationCount', () => {
    it('should return count of unread notifications for user', () => {
      const notifications = [
        mockNotification, // unread
        { ...mockNotification, id: 'notif-2', isRead: true }, // read
        { ...mockNotification, id: 'notif-3', recipientId: 'user-2' } // different user
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      const count = getUnreadNotificationCount('user-1');
      expect(count).toBe(1);
    });
  });

  describe('clearOldNotifications', () => {
    it('should remove notifications older than specified days', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago

      const notifications = [
        mockNotification, // recent
        { ...mockNotification, id: 'old-notif', createdAt: oldDate.toISOString() }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      clearOldNotifications(30);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      
      expect(storedData).toHaveLength(1);
      expect(storedData[0].id).toBe('notif-1');
    });
  });

  describe('getNotificationsByType', () => {
    it('should return notifications of specific type for user', () => {
      const notifications = [
        mockNotification, // task_delegated
        { ...mockNotification, id: 'notif-2', type: 'comment_mention' as const }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      const delegationNotifications = getNotificationsByType('user-1', 'task_delegated');
      
      expect(delegationNotifications).toHaveLength(1);
      expect(delegationNotifications[0].type).toBe('task_delegated');
    });
  });

  describe('searchNotifications', () => {
    it('should search notifications by title and message', () => {
      const notifications = [
        mockNotification,
        { ...mockNotification, id: 'notif-2', title: 'Different Title', message: 'Different message' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      const results = searchNotifications('user-1', 'test');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Test Notification');
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics for user', () => {
      const notifications = [
        mockNotification, // unread task_delegated
        { ...mockNotification, id: 'notif-2', isRead: true }, // read task_delegated
        { ...mockNotification, id: 'notif-3', type: 'comment_mention' as const } // unread comment_mention
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      const stats = getNotificationStats('user-1');
      
      expect(stats.total).toBe(3);
      expect(stats.unread).toBe(2);
      expect(stats.read).toBe(1);
      expect(stats.byType.task_delegated).toBe(2);
      expect(stats.byType.comment_mention).toBe(1);
    });
  });

  describe('validateNotification', () => {
    it('should return true for valid notification', () => {
      expect(validateNotification(mockNotification)).toBe(true);
    });

    it('should return false for invalid notification', () => {
      const invalidNotification = { ...mockNotification, id: '' };
      expect(validateNotification(invalidNotification)).toBe(false);
    });

    it('should return false for notification missing required fields', () => {
      const { title, ...incompleteNotification } = mockNotification;
      expect(validateNotification(incompleteNotification as Notification)).toBe(false);
    });
  });
});