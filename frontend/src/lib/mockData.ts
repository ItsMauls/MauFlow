/**
 * Mock Data Generators for Collaboration Features
 * Provides realistic test data for users, roles, delegations, and notifications
 */

import { 
  User, 
  UserRole, 
  Permission, 
  TaskDelegation, 
  Notification, 
  TeamMember, 
  EnhancedTask,
  NotificationType 
} from '@/types/collaboration';

// Mock Permissions
export const mockPermissions: Permission[] = [
  {
    id: 'perm-1',
    name: 'Delegate Tasks',
    resource: 'task',
    action: 'delegate'
  },
  {
    id: 'perm-2',
    name: 'Manage Team',
    resource: 'team',
    action: 'manage'
  },
  {
    id: 'perm-3',
    name: 'View All Tasks',
    resource: 'task',
    action: 'view_all'
  },
  {
    id: 'perm-4',
    name: 'Create Tasks',
    resource: 'task',
    action: 'create'
  },
  {
    id: 'perm-5',
    name: 'Edit Tasks',
    resource: 'task',
    action: 'update'
  },
  {
    id: 'perm-6',
    name: 'Delete Tasks',
    resource: 'task',
    action: 'delete'
  },
  {
    id: 'perm-7',
    name: 'Create Comments',
    resource: 'comment',
    action: 'create'
  },
  {
    id: 'perm-8',
    name: 'Read Tasks',
    resource: 'task',
    action: 'read'
  }
];

// Mock User Roles
export const mockUserRoles: UserRole[] = [
  {
    id: 'role-1',
    name: 'Project Manager',
    description: 'Can delegate tasks and manage team members',
    permissions: mockPermissions, // All permissions
    canDelegate: true,
    canReceiveDelegations: true,
    canManageTeam: true
  },
  {
    id: 'role-2',
    name: 'Team Lead',
    description: 'Can delegate tasks within their team',
    permissions: mockPermissions.filter(p => p.name !== 'Manage Team'),
    canDelegate: true,
    canReceiveDelegations: true,
    canManageTeam: false
  },
  {
    id: 'role-3',
    name: 'Developer',
    description: 'Can work on assigned tasks and create new ones',
    permissions: mockPermissions.filter(p => 
      ['Create Tasks', 'Edit Tasks', 'View All Tasks', 'Create Comments', 'Read Tasks'].includes(p.name)
    ),
    canDelegate: false,
    canReceiveDelegations: true,
    canManageTeam: false
  },
  {
    id: 'role-4',
    name: 'Designer',
    description: 'Can work on design tasks and collaborate',
    permissions: mockPermissions.filter(p => 
      ['Create Tasks', 'Edit Tasks', 'View All Tasks', 'Create Comments', 'Read Tasks'].includes(p.name)
    ),
    canDelegate: false,
    canReceiveDelegations: true,
    canManageTeam: false
  }
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    email: 'alice@company.com',
    avatar: '👩‍💼',
    role: mockUserRoles[0], // Project Manager
    permissions: mockUserRoles[0].permissions,
    createdAt: '2025-01-15T09:00:00Z',
    lastLoginAt: '2025-08-29T08:30:00Z',
    isActive: true,
    isOnline: true
  },
  {
    id: 'user-2',
    name: 'Bob Smith',
    email: 'bob@company.com',
    avatar: '👨‍💻',
    role: mockUserRoles[1], // Team Lead
    permissions: mockUserRoles[1].permissions,
    createdAt: '2025-01-20T10:00:00Z',
    lastLoginAt: '2025-08-29T07:45:00Z',
    isActive: true,
    isOnline: true
  },
  {
    id: 'user-3',
    name: 'Carol Davis',
    email: 'carol@company.com',
    avatar: '👩‍💻',
    role: mockUserRoles[2], // Developer
    permissions: mockUserRoles[2].permissions,
    createdAt: '2025-02-01T11:00:00Z',
    lastLoginAt: '2025-08-29T09:15:00Z',
    isActive: true,
    isOnline: false,
    lastSeen: '2025-08-28T18:30:00Z'
  },
  {
    id: 'user-4',
    name: 'David Wilson',
    email: 'david@company.com',
    avatar: '👨‍🎨',
    role: mockUserRoles[3], // Designer
    permissions: mockUserRoles[3].permissions,
    createdAt: '2025-02-10T12:00:00Z',
    lastLoginAt: '2025-08-29T08:00:00Z',
    isActive: true,
    isOnline: true
  },
  {
    id: 'user-5',
    name: 'Eva Martinez',
    email: 'eva@company.com',
    avatar: '👩‍💻',
    role: mockUserRoles[2], // Developer
    permissions: mockUserRoles[2].permissions,
    createdAt: '2025-02-15T13:00:00Z',
    lastLoginAt: '2025-08-28T17:20:00Z',
    isActive: true,
    isOnline: false,
    lastSeen: '2025-08-28T17:20:00Z'
  }
];

// Current user (for testing purposes)
export const currentUser = mockUsers[0]; // Alice Johnson (Project Manager)

// Mock Team Members (derived from users)
export const mockTeamMembers: TeamMember[] = mockUsers.map(user => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
  isOnline: user.isOnline || false,
  lastSeen: user.lastSeen
}));

// Mock Task Delegations
export const mockDelegations: TaskDelegation[] = [
  {
    id: 'delegation-1',
    taskId: 'task-1',
    delegatorId: 'user-1', // Alice
    assigneeId: 'user-3', // Carol
    delegatedAt: '2025-08-28T10:00:00Z',
    note: 'Please focus on the API integration part',
    status: 'active',
    priority: 'normal'
  },
  {
    id: 'delegation-2',
    taskId: 'task-2',
    delegatorId: 'user-2', // Bob
    assigneeId: 'user-4', // David
    delegatedAt: '2025-08-27T14:30:00Z',
    note: 'Need the mockups by end of week',
    status: 'active',
    priority: 'urgent'
  },
  {
    id: 'delegation-3',
    taskId: 'task-3',
    delegatorId: 'user-1', // Alice
    assigneeId: 'user-5', // Eva
    delegatedAt: '2025-08-26T09:15:00Z',
    completedAt: '2025-08-28T16:45:00Z',
    note: 'Great work on the previous sprint',
    status: 'completed',
    priority: 'normal'
  }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'task_delegated',
    title: 'New Task Assigned',
    message: 'Alice Johnson assigned you a task: "Implement user authentication"',
    recipientId: 'user-3',
    senderId: 'user-1',
    resourceId: 'task-1',
    resourceType: 'task',
    isRead: false,
    createdAt: '2025-08-28T10:00:00Z',
    metadata: {
      taskTitle: 'Implement user authentication',
      delegatorName: 'Alice Johnson'
    }
  },
  {
    id: 'notif-2',
    type: 'comment_mention',
    title: 'You were mentioned',
    message: 'Bob Smith mentioned you in a comment on "Design system updates"',
    recipientId: 'user-4',
    senderId: 'user-2',
    resourceId: 'comment-1',
    resourceType: 'comment',
    isRead: false,
    createdAt: '2025-08-28T15:30:00Z',
    metadata: {
      commentContent: '@david Can you review the color palette?',
      mentionerName: 'Bob Smith',
      taskTitle: 'Design system updates'
    }
  },
  {
    id: 'notif-3',
    type: 'task_completed',
    title: 'Task Completed',
    message: 'Eva Martinez completed the task you assigned: "Database migration"',
    recipientId: 'user-1',
    senderId: 'user-5',
    resourceId: 'task-3',
    resourceType: 'task',
    isRead: true,
    readAt: '2025-08-28T17:00:00Z',
    createdAt: '2025-08-28T16:45:00Z',
    metadata: {
      taskTitle: 'Database migration',
      assigneeName: 'Eva Martinez'
    }
  },
  {
    id: 'notif-4',
    type: 'task_updated',
    title: 'Task Updated',
    message: 'Carol Davis updated the status of "Implement user authentication"',
    recipientId: 'user-1',
    senderId: 'user-3',
    resourceId: 'task-1',
    resourceType: 'task',
    isRead: false,
    createdAt: '2025-08-29T09:15:00Z',
    metadata: {
      taskTitle: 'Implement user authentication',
      updaterName: 'Carol Davis',
      statusChange: 'todo -> doing'
    }
  }
];

// Data Generator Functions
export const generateMockUser = (overrides: Partial<User> = {}): User => {
  const baseUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name: 'New User',
    email: 'user@company.com',
    role: mockUserRoles[2], // Default to Developer
    permissions: mockUserRoles[2].permissions,
    createdAt: new Date().toISOString(),
    isActive: true,
    isOnline: Math.random() > 0.5
  };

  return { ...baseUser, ...overrides };
};

export const generateMockDelegation = (overrides: Partial<TaskDelegation> = {}): TaskDelegation => {
  const baseDelegation: TaskDelegation = {
    id: `delegation-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    taskId: 'task-new',
    delegatorId: currentUser.id,
    assigneeId: mockUsers[2].id, // Default to Carol
    delegatedAt: new Date().toISOString(),
    status: 'active',
    priority: 'normal'
  };

  return { ...baseDelegation, ...overrides };
};

export const generateMockNotification = (
  type: NotificationType,
  recipientId: string,
  overrides: Partial<Notification> = {}
): Notification => {
  const notificationTemplates = {
    task_delegated: {
      title: 'New Task Assigned',
      message: 'You have been assigned a new task'
    },
    task_completed: {
      title: 'Task Completed',
      message: 'A task you delegated has been completed'
    },
    task_updated: {
      title: 'Task Updated',
      message: 'A task has been updated'
    },
    comment_mention: {
      title: 'You were mentioned',
      message: 'Someone mentioned you in a comment'
    },
    comment_reply: {
      title: 'New Reply',
      message: 'Someone replied to your comment'
    },
    delegation_revoked: {
      title: 'Delegation Revoked',
      message: 'A task delegation has been revoked'
    }
  };

  const template = notificationTemplates[type];
  const baseNotification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type,
    title: template.title,
    message: template.message,
    recipientId,
    senderId: currentUser.id,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  return { ...baseNotification, ...overrides };
};

// Enhanced Task Generator
export const generateMockEnhancedTask = (overrides: Partial<EnhancedTask> = {}): EnhancedTask => {
  const baseTask: EnhancedTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    title: 'New Task',
    description: 'Task description',
    status: 'todo',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    collaborators: [],
    commentCount: 0,
    watchers: []
  };

  return { ...baseTask, ...overrides };
};

// Utility Functions
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getTeamMemberById = (id: string): TeamMember | undefined => {
  return mockTeamMembers.find(member => member.id === id);
};

export const getDelegationsByTaskId = (taskId: string): TaskDelegation[] => {
  return mockDelegations.filter(delegation => delegation.taskId === taskId);
};

export const getDelegationsByAssigneeId = (assigneeId: string): TaskDelegation[] => {
  return mockDelegations.filter(delegation => delegation.assigneeId === assigneeId);
};

export const getNotificationsByRecipientId = (recipientId: string): Notification[] => {
  return mockNotifications.filter(notification => notification.recipientId === recipientId);
};

export const getUnreadNotificationCount = (recipientId: string): number => {
  return mockNotifications.filter(
    notification => notification.recipientId === recipientId && !notification.isRead
  ).length;
};

export const getOnlineTeamMembers = (): TeamMember[] => {
  return mockTeamMembers.filter(member => member.isOnline);
};

export const searchTeamMembers = (query: string): TeamMember[] => {
  const lowercaseQuery = query.toLowerCase();
  return mockTeamMembers.filter(member =>
    member.name.toLowerCase().includes(lowercaseQuery) ||
    member.email.toLowerCase().includes(lowercaseQuery) ||
    member.role.name.toLowerCase().includes(lowercaseQuery)
  );
};