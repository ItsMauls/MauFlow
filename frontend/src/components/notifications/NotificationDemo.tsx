/**
 * Notification System Demo Component
 * Demonstrates the notification system functionality with mock data
 */

'use client';

import React from 'react';
import { useNotifications, useNotificationStats, useNotificationSimulation } from '@/hooks/useNotifications';
import { notificationService } from '@/services/NotificationService';
import { currentUser, mockUsers, mockNotifications } from '@/lib/mockData';

export const NotificationDemo: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearOldNotifications,
    refreshNotifications
  } = useNotifications();

  const stats = useNotificationStats();
  const { simulateNotification } = useNotificationSimulation();

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleSimulateDelegation = () => {
    simulateNotification('task_delegated', currentUser.id, 1000);
  };

  const handleSimulateMention = () => {
    simulateNotification('comment_mention', currentUser.id, 1500);
  };

  const handleLoadMockNotifications = () => {
    // Add some mock notifications to demonstrate the system
    mockNotifications.forEach(notification => {
      if (notification.recipientId === currentUser.id) {
        notificationService.createBatchNotifications([{
          type: notification.type,
          title: notification.title,
          message: notification.message,
          recipientId: notification.recipientId,
          senderId: notification.senderId,
          resourceId: notification.resourceId,
          resourceType: notification.resourceType,
          isRead: notification.isRead,
          metadata: notification.metadata
        }]);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-white/20 rounded"></div>
            <div className="h-3 bg-white/20 rounded w-5/6"></div>
            <div className="h-3 bg-white/20 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Notification System Demo</h2>
        <p className="text-white/80 mb-4">
          This demo showcases the notification system for collaboration features including task delegations, 
          mentions, and real-time updates.
        </p>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-200 text-sm">Error: {error}</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-300">{stats.total}</div>
            <div className="text-sm text-white/70">Total</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-300">{stats.unread}</div>
            <div className="text-sm text-white/70">Unread</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-300">{stats.read}</div>
            <div className="text-sm text-white/70">Read</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-300">
              {Object.keys(stats.byType).length}
            </div>
            <div className="text-sm text-white/70">Types</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Demo Controls</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleLoadMockNotifications}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-200 transition-colors"
          >
            Load Mock Notifications
          </button>
          <button
            onClick={handleSimulateDelegation}
            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-200 transition-colors"
          >
            Simulate Delegation
          </button>
          <button
            onClick={handleSimulateMention}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-200 transition-colors"
          >
            Simulate Mention
          </button>
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg text-yellow-200 transition-colors"
            disabled={unreadCount === 0}
          >
            Mark All Read ({unreadCount})
          </button>
          <button
            onClick={refreshNotifications}
            className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg text-gray-200 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => clearOldNotifications()}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-200 transition-colors"
          >
            Clear Old
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Notifications ({notifications.length})
        </h3>
        
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-white/50 mb-2">📭</div>
            <p className="text-white/70">No notifications yet</p>
            <p className="text-white/50 text-sm">Try loading mock notifications or simulating events</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all ${
                  notification.isRead
                    ? 'bg-white/5 border-white/10'
                    : 'bg-blue-500/10 border-blue-500/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      )}
                      <span className="text-xs text-white/50">
                        {getNotificationTypeIcon(notification.type)}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      {notification.resourceType && (
                        <span className="capitalize">
                          {notification.resourceType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-200 transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Type Statistics */}
      {Object.keys(stats.byType).length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Notifications by Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80 capitalize">
                    {type.replace('_', ' ')}
                  </span>
                  <span className="text-lg font-semibold text-white">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function getNotificationTypeIcon(type: string): string {
  switch (type) {
    case 'task_delegated':
      return '📋';
    case 'task_completed':
      return '✅';
    case 'task_updated':
      return '📝';
    case 'comment_mention':
      return '💬';
    case 'comment_reply':
      return '↩️';
    case 'delegation_revoked':
      return '❌';
    default:
      return '📢';
  }
}

export default NotificationDemo;