/**
 * Notification Helper Functions
 * Provides utility functions for creating notifications in response to collaboration events
 */

import { notificationService } from '@/services/NotificationService';
import { 
  TaskDelegation, 
  EnhancedTask, 
  User, 
  TaskCommentWithMentions 
} from '@/types/collaboration';
import { getUserById } from '@/lib/mockData';

/**
 * Handle task delegation notification
 */
export const handleTaskDelegationNotification = (
  delegation: TaskDelegation,
  task: EnhancedTask
): void => {
  const delegator = getUserById(delegation.delegatorId);
  
  if (!delegator) {
    console.error('Delegator not found:', delegation.delegatorId);
    return;
  }

  try {
    notificationService.createDelegationNotification(delegation, task, delegator);
  } catch (error) {
    console.error('Failed to create delegation notification:', error);
  }
};

/**
 * Handle task completion notification
 */
export const handleTaskCompletionNotification = (
  delegation: TaskDelegation,
  task: EnhancedTask
): void => {
  const assignee = getUserById(delegation.assigneeId);
  
  if (!assignee) {
    console.error('Assignee not found:', delegation.assigneeId);
    return;
  }

  try {
    notificationService.createTaskCompletionNotification(delegation, task, assignee);
  } catch (error) {
    console.error('Failed to create task completion notification:', error);
  }
};

/**
 * Handle task update notification
 */
export const handleTaskUpdateNotification = (
  task: EnhancedTask,
  updaterId: string,
  updateDetails: string
): void => {
  const updater = getUserById(updaterId);
  
  if (!updater) {
    console.error('Updater not found:', updaterId);
    return;
  }

  // Notify delegator if task is delegated
  if (task.delegatorId && task.delegatorId !== updaterId) {
    try {
      notificationService.createTaskUpdateNotification(
        task,
        updater,
        task.delegatorId,
        updateDetails
      );
    } catch (error) {
      console.error('Failed to create task update notification:', error);
    }
  }

  // Notify watchers (excluding the updater)
  task.watchers
    .filter(watcherId => watcherId !== updaterId)
    .forEach(watcherId => {
      try {
        notificationService.createTaskUpdateNotification(
          task,
          updater,
          watcherId,
          updateDetails
        );
      } catch (error) {
        console.error('Failed to create task update notification for watcher:', error);
      }
    });
};

/**
 * Handle comment mention notifications
 */
export const handleCommentMentionNotifications = (
  comment: TaskCommentWithMentions,
  task: EnhancedTask
): void => {
  const mentioner = getUserById(comment.authorId);
  
  if (!mentioner) {
    console.error('Comment author not found:', comment.authorId);
    return;
  }

  // Create notifications for each mentioned user
  comment.mentions.forEach(mentionedUserId => {
    // Don't notify the author of their own mention
    if (mentionedUserId === comment.authorId) return;

    try {
      notificationService.createMentionNotification(
        mentionedUserId,
        mentioner,
        task.id,
        task.title,
        comment.content,
        comment.id
      );
    } catch (error) {
      console.error('Failed to create mention notification:', error);
    }
  });
};

/**
 * Handle comment reply notification
 */
export const handleCommentReplyNotification = (
  reply: TaskCommentWithMentions,
  originalComment: TaskCommentWithMentions,
  task: EnhancedTask
): void => {
  const replier = getUserById(reply.authorId);
  
  if (!replier) {
    console.error('Reply author not found:', reply.authorId);
    return;
  }

  // Don't notify if replying to own comment
  if (originalComment.authorId === reply.authorId) return;

  try {
    notificationService.createCommentReplyNotification(
      originalComment.authorId,
      replier,
      task.id,
      task.title,
      reply.content,
      reply.id
    );
  } catch (error) {
    console.error('Failed to create comment reply notification:', error);
  }
};

/**
 * Handle delegation revoked notification
 */
export const handleDelegationRevokedNotification = (
  delegation: TaskDelegation,
  task: EnhancedTask,
  revokerId: string
): void => {
  const revoker = getUserById(revokerId);
  
  if (!revoker) {
    console.error('Revoker not found:', revokerId);
    return;
  }

  try {
    notificationService.createDelegationRevokedNotification(delegation, task, revoker);
  } catch (error) {
    console.error('Failed to create delegation revoked notification:', error);
  }
};

/**
 * Parse mentions from comment content
 */
export const parseMentionsFromContent = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const username = match[1];
    // In a real app, you'd look up user ID by username
    // For now, we'll assume the username is the user ID or part of it
    mentions.push(username);
  }

  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Create notification for task status change
 */
export const handleTaskStatusChangeNotification = (
  task: EnhancedTask,
  oldStatus: string,
  newStatus: string,
  updaterId: string
): void => {
  const updateDetails = `Status changed from ${oldStatus} to ${newStatus}`;
  handleTaskUpdateNotification(task, updaterId, updateDetails);
};

/**
 * Create notification for task priority change
 */
export const handleTaskPriorityChangeNotification = (
  task: EnhancedTask,
  oldPriority: string,
  newPriority: string,
  updaterId: string
): void => {
  const updateDetails = `Priority changed from ${oldPriority} to ${newPriority}`;
  handleTaskUpdateNotification(task, updaterId, updateDetails);
};

/**
 * Create notification for task due date change
 */
export const handleTaskDueDateChangeNotification = (
  task: EnhancedTask,
  oldDueDate: string | undefined,
  newDueDate: string | undefined,
  updaterId: string
): void => {
  let updateDetails: string;
  
  if (!oldDueDate && newDueDate) {
    updateDetails = `Due date set to ${new Date(newDueDate).toLocaleDateString()}`;
  } else if (oldDueDate && !newDueDate) {
    updateDetails = 'Due date removed';
  } else if (oldDueDate && newDueDate) {
    updateDetails = `Due date changed from ${new Date(oldDueDate).toLocaleDateString()} to ${new Date(newDueDate).toLocaleDateString()}`;
  } else {
    return; // No change
  }

  handleTaskUpdateNotification(task, updaterId, updateDetails);
};

/**
 * Batch create notifications for multiple events
 */
export const handleBatchNotifications = (
  events: Array<{
    type: 'delegation' | 'completion' | 'mention' | 'reply' | 'revoked';
    data: any;
  }>
): void => {
  events.forEach(event => {
    try {
      switch (event.type) {
        case 'delegation':
          handleTaskDelegationNotification(event.data.delegation, event.data.task);
          break;
        case 'completion':
          handleTaskCompletionNotification(event.data.delegation, event.data.task);
          break;
        case 'mention':
          handleCommentMentionNotifications(event.data.comment, event.data.task);
          break;
        case 'reply':
          handleCommentReplyNotification(
            event.data.reply,
            event.data.originalComment,
            event.data.task
          );
          break;
        case 'revoked':
          handleDelegationRevokedNotification(
            event.data.delegation,
            event.data.task,
            event.data.revokerId
          );
          break;
        default:
          console.warn('Unknown notification event type:', event.type);
      }
    } catch (error) {
      console.error('Failed to handle batch notification:', error);
    }
  });
};

/**
 * Validate notification trigger conditions
 */
export const shouldCreateNotification = (
  recipientId: string,
  senderId: string,
  notificationType: string
): boolean => {
  // Don't notify users about their own actions
  if (recipientId === senderId) return false;

  // Add any other business logic for notification filtering
  // For example, check user preferences, do not disturb settings, etc.
  
  return true;
};

/**
 * Format notification message with user-friendly text
 */
export const formatNotificationMessage = (
  type: string,
  senderName: string,
  resourceTitle: string,
  additionalInfo?: string
): string => {
  switch (type) {
    case 'task_delegated':
      return `${senderName} assigned you a task: "${resourceTitle}"`;
    case 'task_completed':
      return `${senderName} completed the task you assigned: "${resourceTitle}"`;
    case 'task_updated':
      return `${senderName} updated the task: "${resourceTitle}"${additionalInfo ? ` - ${additionalInfo}` : ''}`;
    case 'comment_mention':
      return `${senderName} mentioned you in a comment on "${resourceTitle}"`;
    case 'comment_reply':
      return `${senderName} replied to your comment on "${resourceTitle}"`;
    case 'delegation_revoked':
      return `${senderName} revoked your assignment for task: "${resourceTitle}"`;
    default:
      return `${senderName} performed an action on "${resourceTitle}"`;
  }
};