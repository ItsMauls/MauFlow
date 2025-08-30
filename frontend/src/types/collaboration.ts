/**
 * Project Collaboration System Types
 * Defines interfaces and types for task delegation, user roles, permissions, and notifications
 */

// Real-time Connection Types
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface NotificationBroadcast {
  type: 'delegation' | 'mention' | 'task_update' | 'comment_reply';
  payload: any;
  timestamp: string;
  recipients: string[];
}

// User and Role Models
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  canDelegate: boolean;
  canReceiveDelegations: boolean;
  canManageTeam: boolean;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

// Task Delegation Models
export interface TaskDelegation {
  id: string;
  taskId: string;
  delegatorId: string;
  assigneeId: string;
  delegatedAt: string;
  completedAt?: string;
  revokedAt?: string;
  note?: string;
  status: 'active' | 'completed' | 'revoked';
  priority: 'normal' | 'urgent';
}

// Enhanced Task Comment with Mentions
export interface TaskCommentWithMentions {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  mentions: string[];
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  parentCommentId?: string;
  attachments?: string[];
}

// Notification Models
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  senderId?: string;
  resourceId?: string;
  resourceType?: 'task' | 'project' | 'comment';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
  isArchived?: boolean;
  archivedAt?: string;
}

export type NotificationType = 
  | 'task_delegated'
  | 'task_completed'
  | 'task_updated'
  | 'comment_mention'
  | 'comment_reply'
  | 'delegation_revoked';

// Notification Preferences
export interface NotificationPreferences {
  task_delegated: boolean;
  task_completed: boolean;
  task_updated: boolean;
  comment_mention: boolean;
  comment_reply: boolean;
  delegation_revoked: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
}

// Enhanced Task Model with Collaboration Features
export interface EnhancedTask {
  // Existing fields from current Task interface
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  aiScore?: number;
  projectId?: string;
  
  // New collaboration fields
  assigneeId?: string;
  delegatorId?: string;
  delegatedAt?: string;
  delegationNote?: string;
  collaborators: string[];
  commentCount: number;
  lastCommentAt?: string;
  watchers: string[];
}

// Team Member Models
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  isOnline: boolean;
  lastSeen?: string;
}

// Component Props Interfaces
export interface NotificationCenterProps {
  className?: string;
}

export interface DelegationControlsProps {
  task: EnhancedTask;
  onDelegate: (taskId: string, assigneeId: string, note?: string) => void;
  canDelegate: boolean;
}

export interface CommentWithMentionsProps {
  taskId: string;
  onSubmit: (content: string, mentions: string[]) => void;
  placeholder?: string;
}

export interface TeamMemberSelectorProps {
  onSelect: (userId: string) => void;
  excludeUsers?: string[];
  filterByRole?: string[];
  searchable?: boolean;
}

export interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

// Error Types
export interface CollaborationError {
  type: 'permission_denied' | 'user_not_found' | 'delegation_failed' | 'notification_failed';
  message: string;
  details?: Record<string, any>;
}

// Hook Return Types
export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearOldNotifications: () => Promise<void>;
}

export interface UseDelegationReturn {
  delegations: TaskDelegation[];
  isLoading: boolean;
  delegateTask: (taskId: string, assigneeId: string, note?: string) => Promise<void>;
  revokeDelegation: (delegationId: string) => Promise<void>;
  completeDelegation: (delegationId: string) => Promise<void>;
  getDelegationsByTaskId: (taskId: string) => TaskDelegation[];
  getDelegationsByAssigneeId: (assigneeId: string) => TaskDelegation[];
  getMyActiveDelegations: () => TaskDelegation[];
  getMyCreatedDelegations: () => TaskDelegation[];
  isTaskDelegated: (taskId: string) => boolean;
  getActiveDelegationForTask: (taskId: string) => TaskDelegation | undefined;
}

export interface UseTeamMembersReturn {
  teamMembers: TeamMember[];
  isLoading: boolean;
  searchMembers: (query: string) => TeamMember[];
  getMemberById: (id: string) => TeamMember | undefined;
  getOnlineMembers: () => TeamMember[];
  getDelegatableMembers: () => TeamMember[];
}