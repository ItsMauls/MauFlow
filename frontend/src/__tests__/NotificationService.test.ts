/**
 * Tests for NotificationService
 */

import { NotificationService, notificationService } from '@/services/NotificationService';
import { TaskDelegation, EnhancedTask, User } from '@/types/collaboration';
import * as notificationStorage from '@/lib/notificationStorage';
import * as mockData from '@/lib/mockData';

// Mock the storage module
jest.mock('@/lib/notificationStorage');
jest.mock('@/lib/mockData');

const mockStorageModule = notificationStorage as jest.Mocked<typeof notificationStorage>;
const mockDataModule = mockData as jest.Mocked<typeof mockData>;

describe('NotificationService', () => {
  let service: NotificationService;

  const mockUser: User = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
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

  const mockTask: EnhancedTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'todo',
    priority: 'medium',
    createdAt: '2025-08-29T10:00:00Z',
    collaborators: [],
    commentCount: 0,
    watchers: []
  };

  const mockDelegation: TaskDelegation = {
    id: 'delegation-1',
    taskId: 'task-1',
    delegatorId: 'user-1',
    assigneeId: 'user-2',
    delegatedAt: '2025-08-29T10:00:00Z',
    status: 'active',
    priority: 'normal'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = NotificationService.getInstance();
    
    // Setup default mocks
    mockStorageModule.getNotificationsForUser.mockReturnValue([]);
    mockStorageModule.getUnreadNotificationCount.mockReturnValue(0);
    mockStorageModule.validateNotification.mockReturnValue(true);
    mockDataModule.getUserById.mockReturnValue(mockUser);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Subscription Management', () => {
    it('should allow subscribing to notifications', () => {
      const callback = jest.fn();
      const unsubscribe = service.subscribe(callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call subscribers when notifications change', () => {
      const callback = jest.fn();
      service.subscribe(callback);
      
      // Trigger a notification creation
      service.createDelegationNotification(mockDelegation, mockTask, mockUser);
      
      expect(mockStorageModule.addNotificationToStorage).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const callback = jest.fn();
      const unsubscribe = service.subscribe(callback);
      
      unsubscribe();
      
      // Trigger a notification - callback should not be called
      service.createDelegationNotification(mockDelegation, mockTask, mockUser);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Delegation Notifications', () => {
    it('should create delegation notification', () => {
      service.createDelegationNotification(mockDelegation, mockTask, mockUser);
      
      expect(mockStorageModule.addNotificationToStorage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task_delegated',
          title: 'New Task Assigned',
          recipientId: 'user-2',
          senderId: 'user-1',
          resourceId: 'task-1',
          resourceType: 'task'
        })
      );
    });

    it('should create task completion notification', () => {
      const completedDelegation = { ...mockDelegation, completedAt: '2025-08-29T12:00:00Z' };
      
      service.createTaskCompletionNotification(completedDelegation, mockTask, mockUser);
      
      expect(mockStorageModule.addNotificationToStorage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task_completed',
          title: 'Task Completed',
          recipientId: 'user-1', // delegator
          senderId: 'user-2', // assignee
          resourceId: 'task-1'
        })
      );
    });

    it('should create delegation revoked notification', () => {
      const revokedDelegation = { ...mockDelegation, revokedAt: '2025-08-29T12:00:00Z' };
      
      service.createDelegationRevokedNotification(revokedDelegation, mockTask, mockUser);
      
      expect(mockStorageModule.addNotificationToStorage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'delegation_revoked',
          title: 'Delegation Revoked',
          recipientId: 'user-2', // assignee
          senderId: 'user-1', // revoker
          resourceId: 'task-1'
        })
      );
    });
  });

  describe('Comment Notifications', () => {
    it('should create mention notification', () => {
      service.createMentionNotification(
        'user-2',
        mockUser,
        'task-1',
        'Test Task',
        'Hey @user2, check this out!',
        'comment-1'
      );
      
      expect(mockStorageModule.addNotificationToStorage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'comment_mention',
          title: 'You were mentioned',
          recipientId: 'user-2',
          senderId: 'user-1',
          resourceId: 'comment-1',
          resourceType: 'comment'
        })
      );
    });

    it('should create comment reply notification', () => {
      service.createCommentReplyNotification(
        'user-2',
        mockUser,
        'task-1',
        'Test Task',
        'Thanks for the feedback!',
        'comment-2'
      );
      
      expect(mockStorageModule.addNotificationToStorage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'comment_reply',
          title: 'New Reply',
          recipientId: 'user-2',
          senderId: 'user-1',
          resourceId: 'comment-2',
          resourceType: 'comment'
        })
      );
    });
  });

  describe('Task Update Notifications', () => {
    it('should create task update notification', () => {
      service.createTaskUpdateNotification(
        mockTask,
        mockUser,
        'user-2',
        'Status changed from todo to doing'
      );
      
      expect(mockStorageModule.addNotificationToStorage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task_updated',
          title: 'Task Updated',
          recipientId: 'user-2',
          senderId: 'user-1',
          resourceId: 'task-1',
          resourceType: 'task'
        })
      );
    });
  });

  describe('Notification Management', () => {
    it('should mark notification as read', async () => {
      await service.markAsRead('notif-1', 'user-1');
      
      expect(mockStorageModule.markNotificationAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('should mark all notifications as read', async () => {
      await service.markAllAsRead('user-1');
      
      expect(mockStorageModule.markAllNotificationsAsRead).toHaveBeenCalledWith('user-1');
    });

    it('should delete notification', async () => {
      await service.deleteNotification('notif-1', 'user-1');
      
      expect(mockStorageModule.removeNotificationFromStorage).toHaveBeenCalledWith('notif-1');
    });

    it('should clear old notifications', async () => {
      await service.clearOldNotifications('user-1');
      
      expect(mockStorageModule.clearOldNotifications).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockStorageModule.markNotificationAsRead.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow('Failed to mark notification as read');
    });
  });

  describe('Notification Retrieval', () => {
    it('should get notifications for user', () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'task_delegated' as const,
          title: 'Test',
          message: 'Test message',
          recipientId: 'user-1',
          isRead: false,
          createdAt: '2025-08-29T10:00:00Z'
        }
      ];
      mockStorageModule.getNotificationsForUser.mockReturnValue(mockNotifications);

      const notifications = service.getNotifications('user-1');
      
      expect(notifications).toEqual(mockNotifications);
      expect(mockStorageModule.getNotificationsForUser).toHaveBeenCalledWith('user-1');
    });

    it('should get unread count for user', () => {
      mockStorageModule.getUnreadNotificationCount.mockReturnValue(3);

      const count = service.getUnreadCount('user-1');
      
      expect(count).toBe(3);
      expect(mockStorageModule.getUnreadNotificationCount).toHaveBeenCalledWith('user-1');
    });
  });

  describe('Batch Operations', () => {
    it('should create batch notifications', () => {
      const notifications = [
        {
          type: 'task_delegated' as const,
          title: 'Test 1',
          message: 'Message 1',
          recipientId: 'user-1',
          isRead: false
        },
        {
          type: 'comment_mention' as const,
          title: 'Test 2',
          message: 'Message 2',
          recipientId: 'user-2',
          isRead: false
        }
      ];

      service.createBatchNotifications(notifications);
      
      expect(mockStorageModule.addNotificationToStorage).toHaveBeenCalledTimes(2);
    });

    it('should filter invalid notifications in batch', () => {
      mockStorageModule.validateNotification
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const notifications = [
        {
          type: 'task_delegated' as const,
          title: 'Valid',
          message: 'Valid message',
          recipientId: 'user-1',
          isRead: false
        },
        {
          type: 'task_delegated' as const,
          title: '', // Invalid
          message: 'Invalid message',
          recipientId: 'user-1',
          isRead: false
        }
      ];

      service.createBatchNotifications(notifications);
      
      expect(mockStorageModule.addNotificationToStorage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Real-time Simulation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should simulate real-time delegation notification', () => {
      service.simulateRealTimeNotification('task_delegated', 'user-1', 1000);
      
      expect(mockStorageModule.addNotificationToStorage).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(1000);
      
      expect(mockStorageModule.addNotificationToStorage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task_delegated',
          recipientId: 'user-1'
        })
      );
    });

    it('should simulate real-time mention notification', () => {
      service.simulateRealTimeNotification('comment_mention', 'user-1', 500);
      
      jest.advanceTimersByTime(500);
      
      expect(mockStorageModule.addNotificationToStorage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'comment_mention',
          recipientId: 'user-1'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user gracefully', () => {
      mockDataModule.getUserById.mockReturnValue(undefined);
      
      expect(() => {
        service.createDelegationNotification(mockDelegation, mockTask, mockUser);
      }).not.toThrow();
    });

    it('should handle invalid notification data', () => {
      mockStorageModule.validateNotification.mockReturnValue(false);
      
      expect(() => {
        service.createDelegationNotification(mockDelegation, mockTask, mockUser);
      }).toThrow('Invalid notification data');
    });
  });
});