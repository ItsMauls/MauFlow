/**
 * Core Collaboration Features Test Suite
 * Tests for types, mock data, storage utilities, and hooks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  User, 
  UserRole, 
  TaskDelegation, 
  Notification, 
  TeamMember,
  EnhancedTask 
} from '@/types/collaboration';
import { 
  mockUsers, 
  mockUserRoles, 
  mockDelegations, 
  mockNotifications, 
  mockTeamMembers,
  currentUser,
  generateMockUser,
  generateMockDelegation,
  generateMockNotification,
  getUserById,
  getTeamMemberById
} from '@/lib/mockData';
import CollaborationStorage from '@/lib/collaborationStorage';
import { useNotifications } from '@/hooks/useNotifications';
import { useDelegation } from '@/hooks/useDelegation';
import { useTeamMembers } from '@/hooks/useTeamMembers';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Collaboration Types', () => {
  it('should have correct User interface structure', () => {
    const user: User = mockUsers[0];
    
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('role');
    expect(user).toHaveProperty('permissions');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('isActive');
    expect(typeof user.id).toBe('string');
    expect(typeof user.name).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.isActive).toBe('boolean');
  });

  it('should have correct UserRole interface structure', () => {
    const role: UserRole = mockUserRoles[0];
    
    expect(role).toHaveProperty('id');
    expect(role).toHaveProperty('name');
    expect(role).toHaveProperty('description');
    expect(role).toHaveProperty('permissions');
    expect(role).toHaveProperty('canDelegate');
    expect(role).toHaveProperty('canReceiveDelegations');
    expect(role).toHaveProperty('canManageTeam');
    expect(typeof role.canDelegate).toBe('boolean');
    expect(typeof role.canReceiveDelegations).toBe('boolean');
    expect(typeof role.canManageTeam).toBe('boolean');
    expect(Array.isArray(role.permissions)).toBe(true);
  });

  it('should have correct TaskDelegation interface structure', () => {
    const delegation: TaskDelegation = mockDelegations[0];
    
    expect(delegation).toHaveProperty('id');
    expect(delegation).toHaveProperty('taskId');
    expect(delegation).toHaveProperty('delegatorId');
    expect(delegation).toHaveProperty('assigneeId');
    expect(delegation).toHaveProperty('delegatedAt');
    expect(delegation).toHaveProperty('status');
    expect(delegation).toHaveProperty('priority');
    expect(['active', 'completed', 'revoked']).toContain(delegation.status);
    expect(['normal', 'urgent']).toContain(delegation.priority);
  });

  it('should have correct Notification interface structure', () => {
    const notification: Notification = mockNotifications[0];
    
    expect(notification).toHaveProperty('id');
    expect(notification).toHaveProperty('type');
    expect(notification).toHaveProperty('title');
    expect(notification).toHaveProperty('message');
    expect(notification).toHaveProperty('recipientId');
    expect(notification).toHaveProperty('isRead');
    expect(notification).toHaveProperty('createdAt');
    expect(typeof notification.isRead).toBe('boolean');
    expect(['task_delegated', 'task_completed', 'task_updated', 'comment_mention', 'comment_reply', 'delegation_revoked']).toContain(notification.type);
  });
});

describe('Mock Data Generators', () => {
  it('should generate valid mock users', () => {
    const user = generateMockUser({ name: 'Test User' });
    
    expect(user.name).toBe('Test User');
    expect(user.id).toMatch(/^user-/);
    expect(user.email).toBe('user@company.com');
    expect(user.isActive).toBe(true);
    expect(user.role).toBeDefined();
    expect(user.permissions).toBeDefined();
  });

  it('should generate valid mock delegations', () => {
    const delegation = generateMockDelegation({ 
      taskId: 'test-task',
      note: 'Test delegation' 
    });
    
    expect(delegation.taskId).toBe('test-task');
    expect(delegation.note).toBe('Test delegation');
    expect(delegation.id).toMatch(/^delegation-/);
    expect(delegation.status).toBe('active');
    expect(delegation.priority).toBe('normal');
    expect(delegation.delegatorId).toBe(currentUser.id);
  });

  it('should generate valid mock notifications', () => {
    const notification = generateMockNotification('task_delegated', 'user-123', {
      title: 'Custom Title'
    });
    
    expect(notification.type).toBe('task_delegated');
    expect(notification.recipientId).toBe('user-123');
    expect(notification.title).toBe('Custom Title');
    expect(notification.id).toMatch(/^notif-/);
    expect(notification.isRead).toBe(false);
    expect(notification.senderId).toBe(currentUser.id);
  });

  it('should find users by ID', () => {
    const user = getUserById('user-1');
    expect(user).toBeDefined();
    expect(user?.id).toBe('user-1');
    
    const nonExistentUser = getUserById('non-existent');
    expect(nonExistentUser).toBeUndefined();
  });

  it('should find team members by ID', () => {
    const member = getTeamMemberById('user-1');
    expect(member).toBeDefined();
    expect(member?.id).toBe('user-1');
    
    const nonExistentMember = getTeamMemberById('non-existent');
    expect(nonExistentMember).toBeUndefined();
  });
});

describe('CollaborationStorage', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('should save and retrieve delegations', () => {
    const testDelegations = [mockDelegations[0]];
    
    // Mock localStorage.getItem to return null (empty storage)
    localStorageMock.getItem.mockReturnValue(null);
    
    CollaborationStorage.saveDelegations(testDelegations);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'mauflow_delegations',
      JSON.stringify(testDelegations)
    );
  });

  it('should add new delegations', () => {
    const existingDelegations = [mockDelegations[0]];
    const newDelegation = mockDelegations[1];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingDelegations));
    
    CollaborationStorage.addDelegation(newDelegation);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'mauflow_delegations',
      JSON.stringify([...existingDelegations, newDelegation])
    );
  });

  it('should save and retrieve notifications', () => {
    const testNotifications = [mockNotifications[0]];
    
    localStorageMock.getItem.mockReturnValue(null);
    
    CollaborationStorage.saveNotifications(testNotifications);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'mauflow_notifications',
      JSON.stringify(testNotifications)
    );
  });

  it('should mark notifications as read', () => {
    const notifications = [
      { ...mockNotifications[0], isRead: false },
      { ...mockNotifications[1], isRead: false }
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));
    
    CollaborationStorage.markNotificationAsRead(notifications[0].id);
    
    const expectedNotifications = [
      { ...notifications[0], isRead: true, readAt: expect.any(String) },
      notifications[1]
    ];
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'mauflow_notifications',
      JSON.stringify(expectedNotifications)
    );
  });

  it('should save and retrieve team members', () => {
    const testTeamMembers = [mockTeamMembers[0]];
    
    localStorageMock.getItem.mockReturnValue(null);
    
    CollaborationStorage.saveTeamMembers(testTeamMembers);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'mauflow_team_members',
      JSON.stringify(testTeamMembers)
    );
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    const result = CollaborationStorage.getDelegations();
    expect(result).toEqual([]);
  });
});

describe('useNotifications Hook', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockNotifications));
  });

  it('should initialize with notifications from storage', async () => {
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.isLoading).toBe(true);
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.notifications.length).toBeGreaterThan(0);
  });

  it('should calculate unread count correctly', async () => {
    const { result } = renderHook(() => useNotifications());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    const unreadNotifications = mockNotifications.filter(n => 
      n.recipientId === currentUser.id && !n.isRead
    );
    
    expect(result.current.unreadCount).toBe(unreadNotifications.length);
  });

  it('should mark notification as read', async () => {
    const { result } = renderHook(() => useNotifications());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    const notificationId = result.current.notifications[0]?.id;
    if (notificationId) {
      await act(async () => {
        await result.current.markAsRead(notificationId);
      });
      
      const updatedNotification = result.current.notifications.find(n => n.id === notificationId);
      expect(updatedNotification?.isRead).toBe(true);
    }
  });
});

describe('useDelegation Hook', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockDelegations));
  });

  it('should initialize with delegations from storage', async () => {
    const { result } = renderHook(() => useDelegation());
    
    expect(result.current.isLoading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.delegations.length).toBe(mockDelegations.length);
  });

  it('should delegate a task successfully', async () => {
    const { result } = renderHook(() => useDelegation());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    const initialCount = result.current.delegations.length;
    
    await act(async () => {
      await result.current.delegateTask('test-task', 'user-3', 'Test delegation');
    });
    
    expect(result.current.delegations.length).toBe(initialCount + 1);
    
    const newDelegation = result.current.delegations[0];
    expect(newDelegation.taskId).toBe('test-task');
    expect(newDelegation.assigneeId).toBe('user-3');
    expect(newDelegation.note).toBe('Test delegation');
  });

  it('should handle delegation errors', async () => {
    const { result } = renderHook(() => useDelegation());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Try to delegate to non-existent user
    await expect(
      act(async () => {
        await result.current.delegateTask('test-task', 'non-existent-user');
      })
    ).rejects.toThrow('Assignee not found');
  });
});

describe('useTeamMembers Hook', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockTeamMembers));
  });

  it('should initialize with team members from storage', async () => {
    const { result } = renderHook(() => useTeamMembers());
    
    expect(result.current.isLoading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.teamMembers.length).toBe(mockTeamMembers.length);
  });

  it('should search team members correctly', async () => {
    const { result } = renderHook(() => useTeamMembers());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    const searchResults = result.current.searchMembers('Alice');
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].name).toContain('Alice');
  });

  it('should get team member by ID', async () => {
    const { result } = renderHook(() => useTeamMembers());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    const member = result.current.getMemberById('user-1');
    expect(member).toBeDefined();
    expect(member?.id).toBe('user-1');
  });

  it('should get online members', async () => {
    const { result } = renderHook(() => useTeamMembers());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    const onlineMembers = result.current.getOnlineMembers();
    expect(onlineMembers.every(member => member.isOnline)).toBe(true);
  });

  it('should update member status', async () => {
    const { result } = renderHook(() => useTeamMembers());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    const memberId = 'user-2';
    const originalMember = result.current.getMemberById(memberId);
    const originalStatus = originalMember?.isOnline;
    
    act(() => {
      result.current.updateMemberStatus(memberId, !originalStatus);
    });
    
    const updatedMember = result.current.getMemberById(memberId);
    expect(updatedMember?.isOnline).toBe(!originalStatus);
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockImplementation((key) => {
      switch (key) {
        case 'mauflow_delegations':
          return JSON.stringify(mockDelegations);
        case 'mauflow_notifications':
          return JSON.stringify(mockNotifications);
        case 'mauflow_team_members':
          return JSON.stringify(mockTeamMembers);
        default:
          return null;
      }
    });
  });

  it('should create notification when delegating a task', async () => {
    const { result: delegationResult } = renderHook(() => useDelegation());
    const { result: notificationResult } = renderHook(() => useNotifications());
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    const initialNotificationCount = notificationResult.current.notifications.length;
    
    // Delegate a task
    await act(async () => {
      await delegationResult.current.delegateTask('test-task', 'user-3', 'Integration test');
    });
    
    // Check that delegation was created
    expect(delegationResult.current.delegations[0].taskId).toBe('test-task');
    
    // Note: In a real integration test, we would check that the notification
    // was created and stored, but since we're using separate hook instances,
    // we verify the storage calls instead
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'mauflow_notifications',
      expect.stringContaining('task_delegated')
    );
  });

  it('should handle complete delegation workflow', async () => {
    const { result } = renderHook(() => useDelegation());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // 1. Delegate task
    await act(async () => {
      await result.current.delegateTask('workflow-test', 'user-3', 'Workflow test');
    });
    
    const delegation = result.current.delegations.find(d => d.taskId === 'workflow-test');
    expect(delegation).toBeDefined();
    expect(delegation?.status).toBe('active');
    
    // 2. Complete delegation
    if (delegation) {
      await act(async () => {
        await result.current.completeDelegation(delegation.id);
      });
      
      const completedDelegation = result.current.delegations.find(d => d.id === delegation.id);
      expect(completedDelegation?.status).toBe('completed');
      expect(completedDelegation?.completedAt).toBeDefined();
    }
  });
});