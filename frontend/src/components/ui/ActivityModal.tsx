'use client';

import React from 'react';
import { GlassButton } from './GlassButton';

export interface ActivityItem {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'task_delegated' | 'comment_added' | 'file_uploaded';
  title: string;
  description: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  metadata?: {
    taskId?: string;
    taskTitle?: string;
    fromStatus?: string;
    toStatus?: string;
    assigneeId?: string;
    assigneeName?: string;
  };
}

export interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  activities?: ActivityItem[];
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  projectId,
  activities = []
}) => {
  if (!isOpen) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'task_updated':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'task_completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'task_delegated':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'comment_added':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'file_uploaded':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_created': return 'text-blue-400 bg-blue-400/20';
      case 'task_updated': return 'text-yellow-400 bg-yellow-400/20';
      case 'task_completed': return 'text-green-400 bg-green-400/20';
      case 'task_delegated': return 'text-purple-400 bg-purple-400/20';
      case 'comment_added': return 'text-cyan-400 bg-cyan-400/20';
      case 'file_uploaded': return 'text-orange-400 bg-orange-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="max-w-2xl w-full max-h-[80vh] transform animate-in zoom-in-95 duration-300">
        <div className="relative rounded-3xl border border-white/30 bg-gradient-to-br from-white/25 via-white/15 to-white/10 backdrop-blur-2xl shadow-2xl shadow-purple-500/20 overflow-hidden">
          {/* Subtle glowing border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-sm -z-10" />
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div>
              <h2 className="text-2xl font-bold text-white">Project Activity</h2>
              <p className="text-white/70 text-sm">Recent project updates and changes</p>
            </div>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </GlassButton>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Activity Yet</h3>
                <p className="text-white/70">No recent activity found for this project.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="group relative rounded-2xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 p-4 hover:bg-white/15 hover:border-white/30 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      {/* Activity icon */}
                      <div className={`w-10 h-10 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0`}>
                        {getActivityIcon(activity.type)}
                      </div>

                      {/* Activity content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">{activity.title}</h3>
                          <span className="text-xs text-white/60 flex-shrink-0">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm mb-2">{activity.description}</p>
                        
                        {/* User info */}
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {activity.user.avatar ? (
                              <img src={activity.user.avatar} alt={activity.user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              activity.user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="text-white/60 text-xs">{activity.user.name}</span>
                        </div>

                        {/* Metadata */}
                        {activity.metadata && (
                          <div className="mt-2 text-xs text-white/50">
                            {activity.metadata.taskTitle && (
                              <span>Task: {activity.metadata.taskTitle}</span>
                            )}
                            {activity.metadata.fromStatus && activity.metadata.toStatus && (
                              <span> • {activity.metadata.fromStatus} → {activity.metadata.toStatus}</span>
                            )}
                            {activity.metadata.assigneeName && (
                              <span> • Assigned to {activity.metadata.assigneeName}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-white/20">
            <GlassButton
              variant="secondary"
              onClick={onClose}
            >
              Close
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};