/**
 * Notification Service
 * Handles creation, management, and delivery of notifications for collaboration features
 */

import { 
  Notification, 
  NotificationType, 
  User, 
  TaskDelegation, 
  EnhancedTask,
  ConnectionStatus,
  NotificationBroadcast
} from '@/types/collaboration';
import {
  addNotificationToStorage,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotificationFromStorage,
  getNotificationsForUser,
  getUnreadNotificationCount,
  clearOldNotifications,
  validateNotification
} from '@/lib/notificationStorage';
import { getUserById } from '@/lib/mockData';

export class NotificationService {
  private static instance: NotificationService;
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private connectionListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private connectionStatus: ConnectionStatus = 'connected';
  private offlineQueue: Notification[] = [];
  private simulationInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.startHeartbeat();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Subscribe to connection status updates
   */
  subscribeToConnection(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionListeners.add(callback);
    // Immediately call with current status
    callback(this.connectionStatus);
    return () => this.connectionListeners.delete(callback);
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Set connection status and notify listeners
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.connectionListeners.forEach(callback => callback(status));
      
      // Handle offline queue when reconnecting
      if (status === 'connected' && this.offlineQueue.length > 0) {
        this.processOfflineQueue();
      }
    }
  }

  /**
   * Notify all subscribers of notification changes
   */
  private notifyListeners(userId: string): void {
    const notifications = getNotificationsForUser(userId);
    this.listeners.forEach(callback => callback(notifications));
  }

  /**
   * Create a new notification
   */
  private createNotification(
    type: NotificationType,
    recipientId: string,
    title: string,
    message: string,
    senderId?: string,
    resourceId?: string,
    resourceType?: 'task' | 'project' | 'comment',
    metadata?: Record<string, any>
  ): Notification {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type,
      title,
      message,
      recipientId,
      senderId,
      resourceId,
      resourceType,
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata
    };

    if (!validateNotification(notification)) {
      throw new Error('Invalid notification data');
    }

    return notification;
  }

  /**
   * Send a notification (add to storage and notify listeners)
   */
  private sendNotification(notification: Notification): void {
    if (this.connectionStatus === 'connected') {
      addNotificationToStorage(notification);
      this.notifyListeners(notification.recipientId);
      this.broadcastNotification(notification);
    } else {
      // Queue notification for later delivery
      this.offlineQueue.push(notification);
    }
  }

  /**
   * Process queued notifications when connection is restored
   */
  private processOfflineQueue(): void {
    const queuedNotifications = [...this.offlineQueue];
    this.offlineQueue = [];
    
    queuedNotifications.forEach(notification => {
      addNotificationToStorage(notification);
      this.notifyListeners(notification.recipientId);
    });
  }

  /**
   * Broadcast notification to simulate real-time delivery
   */
  private broadcastNotification(notification: Notification): void {
    // Simulate network delay
    const delay = Math.random() * 500 + 100; // 100-600ms delay
    
    setTimeout(() => {
      // Simulate real-time notification delivery
      this.simulateRealTimeDelivery(notification);
    }, delay);
  }

  /**
   * Simulate real-time notification delivery with visual effects
   */
  private simulateRealTimeDelivery(notification: Notification): void {
    // Create a custom event for real-time notification
    const event = new CustomEvent('realtime-notification', {
      detail: {
        notification,
        timestamp: new Date().toISOString()
      }
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  /**
   * Create and send a task delegation notification
   */
  createDelegationNotification(
    delegation: TaskDelegation,
    task: EnhancedTask,
    delegator: User
  ): void {
    const notification = this.createNotification(
      'task_delegated',
      delegation.assigneeId,
      'New Task Assigned',
      `${delegator.name} assigned you a task: "${task.title}"`,
      delegation.delegatorId,
      delegation.taskId,
      'task',
      {
        taskTitle: task.title,
        delegatorName: delegator.name,
        delegationNote: delegation.note,
        priority: delegation.priority
      }
    );

    this.sendNotification(notification);
  }

  /**
   * Create and send a task completion notification
   */
  createTaskCompletionNotification(
    delegation: TaskDelegation,
    task: EnhancedTask,
    assignee: User
  ): void {
    const notification = this.createNotification(
      'task_completed',
      delegation.delegatorId,
      'Task Completed',
      `${assignee.name} completed the task you assigned: "${task.title}"`,
      delegation.assigneeId,
      delegation.taskId,
      'task',
      {
        taskTitle: task.title,
        assigneeName: assignee.name,
        completedAt: delegation.completedAt
      }
    );

    this.sendNotification(notification);
  }

  /**
   * Create and send a task update notification
   */
  createTaskUpdateNotification(
    task: EnhancedTask,
    updater: User,
    delegatorId: string,
    updateDetails: string
  ): void {
    const notification = this.createNotification(
      'task_updated',
      delegatorId,
      'Task Updated',
      `${updater.name} updated the task: "${task.title}"`,
      updater.id,
      task.id,
      'task',
      {
        taskTitle: task.title,
        updaterName: updater.name,
        updateDetails
      }
    );

    this.sendNotification(notification);
  }

  /**
   * Create and send a comment mention notification
   */
  createMentionNotification(
    mentionedUserId: string,
    mentioner: User,
    taskId: string,
    taskTitle: string,
    commentContent: string,
    commentId: string
  ): void {
    const notification = this.createNotification(
      'comment_mention',
      mentionedUserId,
      'You were mentioned',
      `${mentioner.name} mentioned you in a comment on "${taskTitle}"`,
      mentioner.id,
      commentId,
      'comment',
      {
        taskId,
        taskTitle,
        commentContent: commentContent.substring(0, 100) + (commentContent.length > 100 ? '...' : ''),
        mentionerName: mentioner.name
      }
    );

    this.sendNotification(notification);
  }

  /**
   * Create and send a comment reply notification
   */
  createCommentReplyNotification(
    originalCommentAuthorId: string,
    replier: User,
    taskId: string,
    taskTitle: string,
    replyContent: string,
    commentId: string
  ): void {
    const notification = this.createNotification(
      'comment_reply',
      originalCommentAuthorId,
      'New Reply',
      `${replier.name} replied to your comment on "${taskTitle}"`,
      replier.id,
      commentId,
      'comment',
      {
        taskId,
        taskTitle,
        replyContent: replyContent.substring(0, 100) + (replyContent.length > 100 ? '...' : ''),
        replierName: replier.name
      }
    );

    this.sendNotification(notification);
  }

  /**
   * Create and send a delegation revoked notification
   */
  createDelegationRevokedNotification(
    delegation: TaskDelegation,
    task: EnhancedTask,
    revoker: User
  ): void {
    const notification = this.createNotification(
      'delegation_revoked',
      delegation.assigneeId,
      'Delegation Revoked',
      `${revoker.name} revoked your assignment for task: "${task.title}"`,
      revoker.id,
      delegation.taskId,
      'task',
      {
        taskTitle: task.title,
        revokerName: revoker.name,
        revokedAt: delegation.revokedAt
      }
    );

    this.sendNotification(notification);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      markNotificationAsRead(notificationId);
      this.notifyListeners(userId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark a notification as unread
   */
  async markAsUnread(notificationId: string, userId: string): Promise<void> {
    try {
      const { markNotificationAsUnread } = await import('@/lib/notificationStorage');
      markNotificationAsUnread(notificationId);
      this.notifyListeners(userId);
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      throw new Error('Failed to mark notification as unread');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      markAllNotificationsAsRead(userId);
      this.notifyListeners(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      removeNotificationFromStorage(notificationId);
      this.notifyListeners(userId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Clear old notifications (older than 30 days)
   */
  async clearOldNotifications(userId: string): Promise<void> {
    try {
      clearOldNotifications();
      this.notifyListeners(userId);
    } catch (error) {
      console.error('Error clearing old notifications:', error);
      throw new Error('Failed to clear old notifications');
    }
  }

  /**
   * Archive old notifications instead of deleting them
   */
  async archiveOldNotifications(userId: string, days: number = 30): Promise<void> {
    try {
      const { archiveOldNotifications } = await import('@/lib/notificationStorage');
      archiveOldNotifications(userId, days);
      this.notifyListeners(userId);
    } catch (error) {
      console.error('Error archiving old notifications:', error);
      throw new Error('Failed to archive old notifications');
    }
  }

  /**
   * Bulk mark notifications as read
   */
  async bulkMarkAsRead(notificationIds: string[], userId: string): Promise<void> {
    try {
      const { bulkMarkAsRead } = await import('@/lib/notificationStorage');
      bulkMarkAsRead(notificationIds);
      this.notifyListeners(userId);
    } catch (error) {
      console.error('Error bulk marking notifications as read:', error);
      throw new Error('Failed to bulk mark notifications as read');
    }
  }

  /**
   * Bulk delete notifications
   */
  async bulkDeleteNotifications(notificationIds: string[], userId: string): Promise<void> {
    try {
      const { bulkDeleteNotifications } = await import('@/lib/notificationStorage');
      bulkDeleteNotifications(notificationIds);
      this.notifyListeners(userId);
    } catch (error) {
      console.error('Error bulk deleting notifications:', error);
      throw new Error('Failed to bulk delete notifications');
    }
  }

  /**
   * Get archived notifications for a user
   */
  getArchivedNotifications(userId: string): Notification[] {
    try {
      const { getArchivedNotifications } = require('@/lib/notificationStorage');
      return getArchivedNotifications(userId);
    } catch (error) {
      console.error('Error getting archived notifications:', error);
      return [];
    }
  }

  /**
   * Get active (non-archived) notifications for a user
   */
  getActiveNotifications(userId: string): Notification[] {
    try {
      const { getActiveNotifications } = require('@/lib/notificationStorage');
      return getActiveNotifications(userId);
    } catch (error) {
      console.error('Error getting active notifications:', error);
      return getNotificationsForUser(userId);
    }
  }

  /**
   * Get notifications for a user
   */
  getNotifications(userId: string): Notification[] {
    return getNotificationsForUser(userId);
  }

  /**
   * Get unread notification count for a user
   */
  getUnreadCount(userId: string): number {
    return getUnreadNotificationCount(userId);
  }

  /**
   * Simulate real-time notification delivery (for demo purposes)
   */
  simulateRealTimeNotification(
    type: NotificationType,
    recipientId: string,
    delay: number = 2000
  ): void {
    setTimeout(() => {
      const sender = getUserById('user-1'); // Default sender for simulation
      if (!sender) return;

      switch (type) {
        case 'task_delegated':
          const delegationNotif = this.createNotification(
            'task_delegated',
            recipientId,
            'New Task Assigned',
            `${sender.name} assigned you a new task`,
            sender.id,
            'task-demo',
            'task',
            { taskTitle: 'Demo Task', delegatorName: sender.name }
          );
          this.sendNotification(delegationNotif);
          break;

        case 'comment_mention':
          const mentionNotif = this.createNotification(
            'comment_mention',
            recipientId,
            'You were mentioned',
            `${sender.name} mentioned you in a comment`,
            sender.id,
            'comment-demo',
            'comment',
            { taskTitle: 'Demo Task', mentionerName: sender.name }
          );
          this.sendNotification(mentionNotif);
          break;

        default:
          break;
      }
    }, delay);
  }

  /**
   * Batch create multiple notifications (useful for bulk operations)
   */
  createBatchNotifications(notifications: Omit<Notification, 'id' | 'createdAt'>[]): void {
    const validNotifications = notifications
      .map(notif => ({
        ...notif,
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        createdAt: new Date().toISOString()
      }))
      .filter(validateNotification);

    validNotifications.forEach(notification => {
      addNotificationToStorage(notification);
    });

    // Notify listeners for all affected users
    const affectedUsers = new Set(validNotifications.map(n => n.recipientId));
    affectedUsers.forEach(userId => this.notifyListeners(userId));
  }

  /**
   * Start heartbeat to simulate connection monitoring
   */
  private startHeartbeat(): void {
    if (typeof window === 'undefined') return;
    
    this.heartbeatInterval = setInterval(() => {
      // Simulate occasional connection issues (5% chance)
      if (Math.random() < 0.05 && this.connectionStatus === 'connected') {
        this.simulateConnectionIssue();
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Simulate connection issues and recovery
   */
  private simulateConnectionIssue(): void {
    this.setConnectionStatus('disconnected');
    
    // Simulate reconnection after 2-5 seconds
    const reconnectDelay = Math.random() * 3000 + 2000;
    
    this.reconnectTimeout = setTimeout(() => {
      this.setConnectionStatus('connecting');
      
      // Simulate connection establishment
      setTimeout(() => {
        this.setConnectionStatus('connected');
      }, 1000);
    }, reconnectDelay);
  }

  /**
   * Start automatic notification simulation for demo purposes
   */
  startNotificationSimulation(userId: string, interval: number = 30000): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    this.simulationInterval = setInterval(() => {
      if (this.connectionStatus === 'connected') {
        this.simulateRandomNotification(userId);
      }
    }, interval);
  }

  /**
   * Stop automatic notification simulation
   */
  stopNotificationSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  /**
   * Simulate a random notification for demo purposes
   */
  private simulateRandomNotification(userId: string): void {
    const notificationTypes: NotificationType[] = [
      'task_delegated',
      'comment_mention',
      'task_updated',
      'comment_reply'
    ];
    
    const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const sender = getUserById('user-2') || getUserById('user-1');
    
    if (!sender) return;

    const notifications = {
      task_delegated: () => this.createNotification(
        'task_delegated',
        userId,
        'New Task Assigned',
        `${sender.name} assigned you a task: "Review quarterly reports"`,
        sender.id,
        `task-${Date.now()}`,
        'task',
        { taskTitle: 'Review quarterly reports', delegatorName: sender.name }
      ),
      comment_mention: () => this.createNotification(
        'comment_mention',
        userId,
        'You were mentioned',
        `${sender.name} mentioned you in a comment on "Project Planning"`,
        sender.id,
        `comment-${Date.now()}`,
        'comment',
        { taskTitle: 'Project Planning', mentionerName: sender.name }
      ),
      task_updated: () => this.createNotification(
        'task_updated',
        userId,
        'Task Updated',
        `${sender.name} updated the task: "Design Review"`,
        sender.id,
        `task-${Date.now()}`,
        'task',
        { taskTitle: 'Design Review', updaterName: sender.name }
      ),
      comment_reply: () => this.createNotification(
        'comment_reply',
        userId,
        'New Reply',
        `${sender.name} replied to your comment on "Bug Fixes"`,
        sender.id,
        `comment-${Date.now()}`,
        'comment',
        { taskTitle: 'Bug Fixes', replierName: sender.name }
      )
    };

    const notification = notifications[randomType]();
    this.sendNotification(notification);
  }

  /**
   * Broadcast notification event to multiple recipients
   */
  broadcastToMultipleUsers(
    type: NotificationBroadcast['type'],
    payload: any,
    recipients: string[]
  ): void {
    const broadcast: NotificationBroadcast = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      recipients
    };

    // Simulate broadcasting delay
    setTimeout(() => {
      recipients.forEach(recipientId => {
        this.handleBroadcastForUser(broadcast, recipientId);
      });
    }, Math.random() * 200 + 50); // 50-250ms delay
  }

  /**
   * Handle broadcast for a specific user
   */
  private handleBroadcastForUser(broadcast: NotificationBroadcast, userId: string): void {
    const sender = getUserById(broadcast.payload.senderId);
    if (!sender) return;

    let notification: Notification;

    switch (broadcast.type) {
      case 'delegation':
        notification = this.createNotification(
          'task_delegated',
          userId,
          'New Task Assigned',
          `${sender.name} assigned you a task: "${broadcast.payload.taskTitle}"`,
          sender.id,
          broadcast.payload.taskId,
          'task',
          broadcast.payload
        );
        break;
      case 'mention':
        notification = this.createNotification(
          'comment_mention',
          userId,
          'You were mentioned',
          `${sender.name} mentioned you in a comment`,
          sender.id,
          broadcast.payload.commentId,
          'comment',
          broadcast.payload
        );
        break;
      case 'task_update':
        notification = this.createNotification(
          'task_updated',
          userId,
          'Task Updated',
          `${sender.name} updated a task`,
          sender.id,
          broadcast.payload.taskId,
          'task',
          broadcast.payload
        );
        break;
      case 'comment_reply':
        notification = this.createNotification(
          'comment_reply',
          userId,
          'New Reply',
          `${sender.name} replied to your comment`,
          sender.id,
          broadcast.payload.commentId,
          'comment',
          broadcast.payload
        );
        break;
      default:
        return;
    }

    this.sendNotification(notification);
  }

  /**
   * Cleanup intervals and timeouts
   */
  cleanup(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();