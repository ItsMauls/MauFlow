/**
 * Tests for useNotifications Hook
 */

import { renderHook, act } from '@testing-library/react';
import { useNotifications, useNotificationStats, useNotificationSimulation } from '@/hooks/useNotifications';
import { notificationService } from '@/services/NotificationService';
import * as mockData from '@/lib/mockData';

// Mock the notification service
jest.mock('@/services/NotificationService');
jest.mock('@/lib/mockData');

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;
const mockDataModule = mockData as jest.Mocked<typeof mockData>;

describe('useNotifications', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      type: 'task_delegated' as const,
      title: 'New Task Assigned',
      message: 'You have been assigned a task',
      recipientId: 'user-1',
      senderId: 'user-2',
      isRead: false,
      createdAt: '2025-08-29T10:00:00Z'
    },
    {
      id: 'notif-2',
      type: 'comment_mention' as const,
      title: 'You were mentioned',
      message: 'Someone mentioned you',
      recipientId: 'user-1',
      senderId: 'user-3',
      isRead: true,
      readAt: '2025-08-29T11:00:00Z',
      createdAt: '2025-08-29T09:00:00Z'
    }
  ];

  const mockCurrentUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: {
      id: 'role-1',
      name: 'Developer',
      description: 'Developer role',
      permissions: [],
      canDelegate: false,
      canReceiveDelegations: true,
      canManageTeam: false
    },
    permissions: [],
    createdAt: '2025-08-29T10:00:00Z',
    isActive: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockDataModule.currentUser = mockCurrentUser;
    mockNotificationService.getNotifications.mockReturnValue(mockNotifications);
    mockNotificationService.getUnreadCount.mockReturnValue(1);
    mockNotificationService.subscribe.mockImplementation((callback) => {
      // Immediately call callback with mock data
      callback(mockNotifications);
      return jest.fn(); // Return unsubscribe function
    });
    mockNotificationService.markAsRead.mockResolvedValue();
    mockNotificationService.markAllAsRead.mockResolvedValue();
    mockNotificationService.deleteNotification.mockResolvedValue();
    mockNotificationService.clearOldNotifications.mockResolvedValue();
  });

  describe('useNotifications Hook', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.error).toBeNull();
    });

    it('should load notifications on mount', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(mockNotificationService.subscribe).toHaveBeenCalled();
      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith('user-1');
      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user-1');
    });

    it('should update state when notifications change', () => {
      const { result } = renderHook(() => useNotifications());
      
      // The subscribe callback should have been called
      expect(result.current.notifications).toEqual(mockNotifications);
      expect(result.current.unreadCount).toBe(1); // One unread notification
      expect(result.current.isLoading).toBe(false);
    });

    it('should use provided userId', () => {
      renderHook(() => useNotifications('user-2'));
      
      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith('user-2');
      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user-2');
    });

    it('should mark notification as read', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.markAsRead('notif-1');
      });
      
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
      expect(result.current.error).toBeNull();
    });

    it('should mark all notifications as read', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.markAllAsRead();
      });
      
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(result.current.error).toBeNull();
    });

    it('should delete notification', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.deleteNotification('notif-1');
      });
      
      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith('notif-1', 'user-1');
      expect(result.current.error).toBeNull();
    });

    it('should clear old notifications', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.clearOldNotifications();
      });
      
      expect(mockNotificationService.clearOldNotifications).toHaveBeenCalledWith('user-1');
      expect(result.current.error).toBeNull();
    });

    it('should refresh notifications', () => {
      const { result } = renderHook(() => useNotifications());
      
      act(() => {
        result.current.refreshNotifications();
      });
      
      // Should call getNotifications again
      expect(mockNotificationService.getNotifications).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Failed to mark as read';
      mockNotificationService.markAsRead.mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        try {
          await result.current.markAsRead('notif-1');
        } catch (error) {
          // Expected to throw
        }
      });
      
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle loading errors', () => {
      mockNotificationService.getNotifications.mockImplementation(() => {
        throw new Error('Loading failed');
      });
      
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current.error).toBe('Loading failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('should unsubscribe on unmount', () => {
      const unsubscribeMock = jest.fn();
      mockNotificationService.subscribe.mockReturnValue(unsubscribeMock);
      
      const { unmount } = renderHook(() => useNotifications());
      
      unmount();
      
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('useNotificationStats Hook', () => {
    it('should return notification statistics', () => {
      const { result } = renderHook(() => useNotificationStats());
      
      expect(result.current.total).toBe(2);
      expect(result.current.unread).toBe(1);
      expect(result.current.read).toBe(1);
      expect(result.current.byType.task_delegated).toBe(1);
      expect(result.current.byType.comment_mention).toBe(1);
    });

    it('should update stats when notifications change', () => {
      let subscribeCallback: (notifications: any[]) => void = () => {};
      mockNotificationService.subscribe.mockImplementation((callback) => {
        subscribeCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => useNotificationStats());
      
      // Simulate notification update
      const updatedNotifications = [
        ...mockNotifications,
        {
          id: 'notif-3',
          type: 'task_completed' as const,
          title: 'Task Completed',
          message: 'Task was completed',
          recipientId: 'user-1',
          senderId: 'user-2',
          isRead: false,
          createdAt: '2025-08-29T12:00:00Z'
        }
      ];

      act(() => {
        subscribeCallback(updatedNotifications);
      });
      
      expect(result.current.total).toBe(3);
      expect(result.current.unread).toBe(2);
      expect(result.current.byType.task_completed).toBe(1);
    });

    it('should use provided userId for stats', () => {
      renderHook(() => useNotificationStats('user-2'));
      
      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith('user-2');
    });
  });

  describe('useNotificationSimulation Hook', () => {
    it('should simulate delegation notification', () => {
      const { result } = renderHook(() => useNotificationSimulation());
      
      act(() => {
        result.current.simulateNotification('task_delegated', 'user-2', 1000);
      });
      
      expect(mockNotificationService.simulateRealTimeNotification).toHaveBeenCalledWith(
        'task_delegated',
        'user-2',
        1000
      );
    });

    it('should simulate mention notification with default user', () => {
      const { result } = renderHook(() => useNotificationSimulation());
      
      act(() => {
        result.current.simulateNotification('comment_mention');
      });
      
      expect(mockNotificationService.simulateRealTimeNotification).toHaveBeenCalledWith(
        'comment_mention',
        'user-1', // current user
        undefined
      );
    });

    it('should use default delay when not provided', () => {
      const { result } = renderHook(() => useNotificationSimulation());
      
      act(() => {
        result.current.simulateNotification('task_delegated', 'user-2');
      });
      
      expect(mockNotificationService.simulateRealTimeNotification).toHaveBeenCalledWith(
        'task_delegated',
        'user-2',
        undefined
      );
    });
  });

  describe('Hook Dependencies', () => {
    it('should re-subscribe when userId changes', () => {
      const { rerender } = renderHook(
        ({ userId }) => useNotifications(userId),
        { initialProps: { userId: 'user-1' } }
      );
      
      expect(mockNotificationService.subscribe).toHaveBeenCalledTimes(1);
      
      rerender({ userId: 'user-2' });
      
      expect(mockNotificationService.subscribe).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith('user-2');
    });

    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useNotifications());
      
      const firstMarkAsRead = result.current.markAsRead;
      const firstMarkAllAsRead = result.current.markAllAsRead;
      
      rerender();
      
      expect(result.current.markAsRead).toBe(firstMarkAsRead);
      expect(result.current.markAllAsRead).toBe(firstMarkAllAsRead);
    });
  });
});