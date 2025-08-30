/**
 * Tests for Notification Helper Functions
 */

import {
  handleTaskDelegationNotification,
  handleTaskCompletionNotification,
  handleTaskUpdateNotification,
  handleCommentMentionNotifications,
  handleCommentReplyNotification,
  handleDelegationRevokedNotification,
  parseMentionsFromContent,
  handleTaskStatusChangeNotification,
  handleTaskPriorityChangeNotification,
  handleTaskDueDateChangeNotification,
  handleBatchNotifications,
  shouldCreateNotification,
  formatNotificationMessage
} from '@/lib/notificationHelpers';
import { notificationService } from '@/services/NotificationService';
import * as mockData from '@/lib/mockData';
import { TaskDelegation, EnhancedTask, User, TaskCommentWithMentions } from '@/types/collaboration';

// Mock dependencies
jest.mock('@/services/NotificationService');
jest.mock('@/lib/mockData');

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;
const mockDataModule = mockData as jest.Mocked<typeof mockData>;

describe('Notification Helpers', () => {
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
    watchers: ['user-3', 'user-4']
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

  const mockComment: TaskCommentWithMentions = {
    id: 'comment-1',
    taskId: 'task-1',
    authorId: 'user-1',
    content: 'Hey @user2 and @user3, check this out!',
    mentions: ['user2', 'user3'],
    createdAt: '2025-08-29T10:00:00Z',
    isEdited: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataModule.getUserById.mockReturnValue(mockUser);
  });

  describe('handleTaskDelegationNotification', () => {
    it('should create delegation notification when delegator exists', () => {
      handleTaskDelegationNotification(mockDelegation, mockTask);
      
      expect(mockNotificationService.createDelegationNotification).toHaveBeenCalledWith(
        mockDelegation,
        mockTask,
        mockUser
      );
    });

    it('should handle missing delegator gracefully', () => {
      mockDataModule.getUserById.mockReturnValue(undefined);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      handleTaskDelegationNotification(mockDelegation, mockTask);
      
      expect(consoleSpy).toHaveBeenCalledWith('Delegator not found:', 'user-1');
      expect(mockNotificationService.createDelegationNotification).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle notification service errors', () => {
      mockNotificationService.createDelegationNotification.mockImplementation(() => {
        throw new Error('Service error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      handleTaskDelegationNotification(mockDelegation, mockTask);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create delegation notification:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('handleTaskCompletionNotification', () => {
    it('should create completion notification when assignee exists', () => {
      handleTaskCompletionNotification(mockDelegation, mockTask);
      
      expect(mockNotificationService.createTaskCompletionNotification).toHaveBeenCalledWith(
        mockDelegation,
        mockTask,
        mockUser
      );
    });

    it('should handle missing assignee gracefully', () => {
      mockDataModule.getUserById.mockReturnValue(undefined);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      handleTaskCompletionNotification(mockDelegation, mockTask);
      
      expect(consoleSpy).toHaveBeenCalledWith('Assignee not found:', 'user-2');
      expect(mockNotificationService.createTaskCompletionNotification).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('handleTaskUpdateNotification', () => {
    it('should notify delegator when task is delegated', () => {
      const taskWithDelegator = { ...mockTask, delegatorId: 'user-2' };
      
      handleTaskUpdateNotification(taskWithDelegator, 'user-1', 'Status updated');
      
      expect(mockNotificationService.createTaskUpdateNotification).toHaveBeenCalledWith(
        taskWithDelegator,
        mockUser,
        'user-2',
        'Status updated'
      );
    });

    it('should not notify delegator if they are the updater', () => {
      const taskWithDelegator = { ...mockTask, delegatorId: 'user-1' };
      
      handleTaskUpdateNotification(taskWithDelegator, 'user-1', 'Status updated');
      
      expect(mockNotificationService.createTaskUpdateNotification).not.toHaveBeenCalled();
    });

    it('should notify watchers excluding the updater', () => {
      handleTaskUpdateNotification(mockTask, 'user-1', 'Status updated');
      
      expect(mockNotificationService.createTaskUpdateNotification).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.createTaskUpdateNotification).toHaveBeenCalledWith(
        mockTask,
        mockUser,
        'user-3',
        'Status updated'
      );
      expect(mockNotificationService.createTaskUpdateNotification).toHaveBeenCalledWith(
        mockTask,
        mockUser,
        'user-4',
        'Status updated'
      );
    });

    it('should handle missing updater gracefully', () => {
      mockDataModule.getUserById.mockReturnValue(undefined);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      handleTaskUpdateNotification(mockTask, 'user-1', 'Status updated');
      
      expect(consoleSpy).toHaveBeenCalledWith('Updater not found:', 'user-1');
      
      consoleSpy.mockRestore();
    });
  });

  describe('handleCommentMentionNotifications', () => {
    it('should create mention notifications for all mentioned users', () => {
      handleCommentMentionNotifications(mockComment, mockTask);
      
      expect(mockNotificationService.createMentionNotification).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.createMentionNotification).toHaveBeenCalledWith(
        'user2',
        mockUser,
        'task-1',
        'Test Task',
        'Hey @user2 and @user3, check this out!',
        'comment-1'
      );
      expect(mockNotificationService.createMentionNotification).toHaveBeenCalledWith(
        'user3',
        mockUser,
        'task-1',
        'Test Task',
        'Hey @user2 and @user3, check this out!',
        'comment-1'
      );
    });

    it('should not notify author of their own mention', () => {
      const commentWithSelfMention = {
        ...mockComment,
        mentions: ['user1', 'user2'] // user1 is the author
      };
      
      handleCommentMentionNotifications(commentWithSelfMention, mockTask);
      
      expect(mockNotificationService.createMentionNotification).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.createMentionNotification).toHaveBeenCalledWith(
        'user2',
        mockUser,
        'task-1',
        'Test Task',
        'Hey @user2 and @user3, check this out!',
        'comment-1'
      );
    });

    it('should handle missing comment author gracefully', () => {
      mockDataModule.getUserById.mockReturnValue(undefined);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      handleCommentMentionNotifications(mockComment, mockTask);
      
      expect(consoleSpy).toHaveBeenCalledWith('Comment author not found:', 'user-1');
      expect(mockNotificationService.createMentionNotification).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('handleCommentReplyNotification', () => {
    const originalComment: TaskCommentWithMentions = {
      id: 'comment-original',
      taskId: 'task-1',
      authorId: 'user-2',
      content: 'Original comment',
      mentions: [],
      createdAt: '2025-08-29T09:00:00Z',
      isEdited: false
    };

    const replyComment: TaskCommentWithMentions = {
      id: 'comment-reply',
      taskId: 'task-1',
      authorId: 'user-1',
      content: 'Reply to comment',
      mentions: [],
      createdAt: '2025-08-29T10:00:00Z',
      isEdited: false,
      parentCommentId: 'comment-original'
    };

    it('should create reply notification', () => {
      handleCommentReplyNotification(replyComment, originalComment, mockTask);
      
      expect(mockNotificationService.createCommentReplyNotification).toHaveBeenCalledWith(
        'user-2',
        mockUser,
        'task-1',
        'Test Task',
        'Reply to comment',
        'comment-reply'
      );
    });

    it('should not notify when replying to own comment', () => {
      const selfReply = { ...replyComment, authorId: 'user-2' };
      
      handleCommentReplyNotification(selfReply, originalComment, mockTask);
      
      expect(mockNotificationService.createCommentReplyNotification).not.toHaveBeenCalled();
    });
  });

  describe('handleDelegationRevokedNotification', () => {
    it('should create revoked notification', () => {
      handleDelegationRevokedNotification(mockDelegation, mockTask, 'user-1');
      
      expect(mockNotificationService.createDelegationRevokedNotification).toHaveBeenCalledWith(
        mockDelegation,
        mockTask,
        mockUser
      );
    });
  });

  describe('parseMentionsFromContent', () => {
    it('should parse mentions from content', () => {
      const content = 'Hey @john and @jane, check this @task out!';
      const mentions = parseMentionsFromContent(content);
      
      expect(mentions).toEqual(['john', 'jane', 'task']);
    });

    it('should remove duplicate mentions', () => {
      const content = 'Hey @john and @john again!';
      const mentions = parseMentionsFromContent(content);
      
      expect(mentions).toEqual(['john']);
    });

    it('should return empty array for no mentions', () => {
      const content = 'No mentions here';
      const mentions = parseMentionsFromContent(content);
      
      expect(mentions).toEqual([]);
    });
  });

  describe('Task Change Notifications', () => {
    it('should handle status change notification', () => {
      handleTaskStatusChangeNotification(mockTask, 'todo', 'doing', 'user-1');
      
      expect(mockNotificationService.createTaskUpdateNotification).toHaveBeenCalledWith(
        mockTask,
        mockUser,
        'user-3',
        'Status changed from todo to doing'
      );
    });

    it('should handle priority change notification', () => {
      handleTaskPriorityChangeNotification(mockTask, 'low', 'high', 'user-1');
      
      expect(mockNotificationService.createTaskUpdateNotification).toHaveBeenCalledWith(
        mockTask,
        mockUser,
        'user-3',
        'Priority changed from low to high'
      );
    });

    it('should handle due date set notification', () => {
      handleTaskDueDateChangeNotification(mockTask, undefined, '2025-09-01', 'user-1');
      
      expect(mockNotificationService.createTaskUpdateNotification).toHaveBeenCalledWith(
        mockTask,
        mockUser,
        'user-3',
        'Due date set to 9/1/2025'
      );
    });

    it('should handle due date removed notification', () => {
      handleTaskDueDateChangeNotification(mockTask, '2025-09-01', undefined, 'user-1');
      
      expect(mockNotificationService.createTaskUpdateNotification).toHaveBeenCalledWith(
        mockTask,
        mockUser,
        'user-3',
        'Due date removed'
      );
    });

    it('should handle due date changed notification', () => {
      handleTaskDueDateChangeNotification(mockTask, '2025-09-01', '2025-09-15', 'user-1');
      
      expect(mockNotificationService.createTaskUpdateNotification).toHaveBeenCalledWith(
        mockTask,
        mockUser,
        'user-3',
        'Due date changed from 9/1/2025 to 9/15/2025'
      );
    });

    it('should not create notification when no due date change', () => {
      handleTaskDueDateChangeNotification(mockTask, undefined, undefined, 'user-1');
      
      expect(mockNotificationService.createTaskUpdateNotification).not.toHaveBeenCalled();
    });
  });

  describe('handleBatchNotifications', () => {
    it('should handle multiple notification events', () => {
      const events = [
        {
          type: 'delegation' as const,
          data: { delegation: mockDelegation, task: mockTask }
        },
        {
          type: 'mention' as const,
          data: { comment: mockComment, task: mockTask }
        }
      ];

      handleBatchNotifications(events);
      
      expect(mockNotificationService.createDelegationNotification).toHaveBeenCalled();
      expect(mockNotificationService.createMentionNotification).toHaveBeenCalled();
    });

    it('should handle unknown event types gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const events = [
        {
          type: 'unknown' as any,
          data: {}
        }
      ];

      handleBatchNotifications(events);
      
      expect(consoleSpy).toHaveBeenCalledWith('Unknown notification event type:', 'unknown');
      
      consoleSpy.mockRestore();
    });
  });

  describe('shouldCreateNotification', () => {
    it('should return false when recipient and sender are the same', () => {
      const result = shouldCreateNotification('user-1', 'user-1', 'task_delegated');
      expect(result).toBe(false);
    });

    it('should return true when recipient and sender are different', () => {
      const result = shouldCreateNotification('user-1', 'user-2', 'task_delegated');
      expect(result).toBe(true);
    });
  });

  describe('formatNotificationMessage', () => {
    it('should format delegation message', () => {
      const message = formatNotificationMessage('task_delegated', 'John', 'Test Task');
      expect(message).toBe('John assigned you a task: "Test Task"');
    });

    it('should format completion message', () => {
      const message = formatNotificationMessage('task_completed', 'John', 'Test Task');
      expect(message).toBe('John completed the task you assigned: "Test Task"');
    });

    it('should format update message with additional info', () => {
      const message = formatNotificationMessage('task_updated', 'John', 'Test Task', 'Status changed');
      expect(message).toBe('John updated the task: "Test Task" - Status changed');
    });

    it('should format mention message', () => {
      const message = formatNotificationMessage('comment_mention', 'John', 'Test Task');
      expect(message).toBe('John mentioned you in a comment on "Test Task"');
    });

    it('should format reply message', () => {
      const message = formatNotificationMessage('comment_reply', 'John', 'Test Task');
      expect(message).toBe('John replied to your comment on "Test Task"');
    });

    it('should format revoked message', () => {
      const message = formatNotificationMessage('delegation_revoked', 'John', 'Test Task');
      expect(message).toBe('John revoked your assignment for task: "Test Task"');
    });

    it('should format default message for unknown types', () => {
      const message = formatNotificationMessage('unknown', 'John', 'Test Task');
      expect(message).toBe('John performed an action on "Test Task"');
    });
  });
});