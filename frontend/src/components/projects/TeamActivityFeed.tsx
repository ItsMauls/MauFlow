/**
 * TeamActivityFeed Component
 * Shows recent delegations, comments, and team activities for a project
 */

import React, { useState, useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useDelegation } from '@/hooks/useDelegation';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { mockNotifications } from '@/lib/mockData';
import { Notification } from '@/types/collaboration';

interface TeamActivityFeedProps {
  projectId: string;
}

interface ActivityItem {
  id: string;
  type: 'delegation' | 'comment' | 'task_update' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  metadata?: Record<string, any>;
}

export const TeamActivityFeed: React.FC<TeamActivityFeedProps> = ({ projectId }) => {
  const { delegations } = useDelegation();
  const { getMemberById } = useTeamMembers();
  const [filter, setFilter] = useState<'all' | 'delegations' | 'comments' | 'updates'>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

  // Generate activity items from various sources
  const activityItems = useMemo(() => {
    const items: ActivityItem[] = [];

    // Add delegation activities
    delegations.forEach(delegation => {
      const delegator = getMemberById(delegation.delegatorId);
      const assignee = getMemberById(delegation.assigneeId);
      
      if (delegator && assignee) {
        items.push({
          id: `delegation-${delegation.id}`,
          type: 'delegation',
          title: 'Task Delegated',
          description: `${delegator.name} assigned a task to ${assignee.name}`,
          timestamp: delegation.delegatedAt,
          userId: delegation.delegatorId,
          userName: delegator.name,
          userAvatar: delegator.avatar,
          metadata: {
            taskId: delegation.taskId,
            assigneeName: assignee.name,
            note: delegation.note,
            priority: delegation.priority
          }
        });

        if (delegation.completedAt) {
          items.push({
            id: `completion-${delegation.id}`,
            type: 'task_update',
            title: 'Task Completed',
            description: `${assignee.name} completed a delegated task`,
            timestamp: delegation.completedAt,
            userId: delegation.assigneeId,
            userName: assignee.name,
            userAvatar: assignee.avatar,
            metadata: {
              taskId: delegation.taskId,
              delegatorName: delegator.name
            }
          });
        }

        if (delegation.revokedAt) {
          items.push({
            id: `revocation-${delegation.id}`,
            type: 'delegation',
            title: 'Delegation Revoked',
            description: `${delegator.name} revoked a task delegation`,
            timestamp: delegation.revokedAt,
            userId: delegation.delegatorId,
            userName: delegator.name,
            userAvatar: delegator.avatar,
            metadata: {
              taskId: delegation.taskId,
              assigneeName: assignee.name
            }
          });
        }
      }
    });

    // Add notification activities (simulating comments and mentions)
    mockNotifications.forEach(notification => {
      const sender = getMemberById(notification.senderId || '');
      const recipient = getMemberById(notification.recipientId);
      
      if (sender && recipient) {
        items.push({
          id: `notification-${notification.id}`,
          type: notification.type === 'comment_mention' ? 'comment' : 'notification',
          title: notification.title,
          description: notification.message,
          timestamp: notification.createdAt,
          userId: notification.senderId || '',
          userName: sender.name,
          userAvatar: sender.avatar,
          metadata: notification.metadata
        });
      }
    });

    // Filter by time range
    const now = new Date();
    const timeFilters = {
      today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };

    const filteredByTime = items.filter(item => 
      new Date(item.timestamp) >= timeFilters[timeRange]
    );

    // Filter by type
    const filteredByType = filter === 'all' 
      ? filteredByTime
      : filteredByTime.filter(item => {
          switch (filter) {
            case 'delegations':
              return item.type === 'delegation';
            case 'comments':
              return item.type === 'comment';
            case 'updates':
              return item.type === 'task_update' || item.type === 'notification';
            default:
              return true;
          }
        });

    // Sort by timestamp (newest first)
    return filteredByType.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [delegations, getMemberById, filter, timeRange]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'delegation':
        return '👥';
      case 'comment':
        return '💬';
      case 'task_update':
        return '✅';
      default:
        return '📢';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'delegation':
        return 'from-blue-400/20 to-blue-600/10 border-blue-400/30';
      case 'comment':
        return 'from-green-400/20 to-green-600/10 border-green-400/30';
      case 'task_update':
        return 'from-purple-400/20 to-purple-600/10 border-purple-400/30';
      default:
        return 'from-gray-400/20 to-gray-600/10 border-gray-400/30';
    }
  };

  return (
    <GlassCard>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Team Activity</h3>
          <div className="text-sm text-white/60">
            {activityItems.length} activities
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Type Filter */}
          <div className="flex gap-1 p-1 bg-white/10 rounded-lg">
            {[
              { key: 'all', label: 'All' },
              { key: 'delegations', label: 'Delegations' },
              { key: 'comments', label: 'Comments' },
              { key: 'updates', label: 'Updates' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  filter === tab.key
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Time Range Filter */}
          <div className="flex gap-1 p-1 bg-white/10 rounded-lg">
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setTimeRange(tab.key as any)}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  timeRange === tab.key
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activityItems.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <div className="text-4xl mb-4">📭</div>
              <div className="text-sm">No recent activity</div>
              <div className="text-xs mt-1">Team activities will appear here</div>
            </div>
          ) : (
            activityItems.map(item => (
              <div
                key={item.id}
                className={`relative rounded-lg bg-gradient-to-r ${getActivityColor(item.type)} border p-4 hover:scale-[1.02] transition-all duration-200`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">
                      {item.userAvatar || getActivityIcon(item.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium text-sm">
                        {item.title}
                      </p>
                      <span className="text-xs text-white/60">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-white/80 text-sm mt-1">
                      {item.description}
                    </p>

                    {/* Additional metadata */}
                    {item.metadata && (
                      <div className="mt-2 text-xs text-white/60">
                        {item.metadata.note && (
                          <div>Note: {item.metadata.note}</div>
                        )}
                        {item.metadata.priority && item.metadata.priority !== 'normal' && (
                          <div className="inline-block px-2 py-1 bg-white/10 rounded mt-1">
                            Priority: {item.metadata.priority}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Activity Summary */}
        {activityItems.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white">
                  {activityItems.filter(item => item.type === 'delegation').length}
                </div>
                <div className="text-xs text-white/60">Delegations</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {activityItems.filter(item => item.type === 'comment').length}
                </div>
                <div className="text-xs text-white/60">Comments</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {activityItems.filter(item => item.type === 'task_update').length}
                </div>
                <div className="text-xs text-white/60">Updates</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {new Set(activityItems.map(item => item.userId)).size}
                </div>
                <div className="text-xs text-white/60">Active Users</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default TeamActivityFeed;