/**
 * useUserPermissions Hook Unit Tests
 * Tests for the user permissions hook functionality
 */

import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useUserPermissions,
  useUserPermissionsFor,
  useDelegationPermissions,
  useCollaborationPermissions
} from '@/hooks/useUserPermissions';
import { User } from '@/types/collaboration';
import { mockUsers, mockUserRoles, currentUser } from '@/lib/mockData';

describe('useUserPermissions Hook', () => {
  const projectManager = mockUsers.find(u => u.role.name === 'Project Manager')!;
  const developer = mockUsers.find(u => u.role.name === 'Developer')!;
  const teamLead = mockUsers.find(u => u.role.name === 'Team Lead')!;

  describe('useUserPermissions', () => {
    test('should return permissions for current user by default', () => {
      const { result } = renderHook(() => useUserPermissions());
      
      expect(result.current.user).toBeDefined();
      expect(result.current.user.id).toBe(currentUser.id);
      expect(result.current.roleName).toBe(currentUser.role.name);
      expect(result.current.isValidUser).toBe(true);
    });

    test('should return permissions for provided user', () => {
      const { result } = renderHook(() => useUserPermissions(developer));
      
      expect(result.current.user).toBe(developer);
      expect(result.current.roleName).toBe('Developer');
      expect(result.current.canDelegate).toBe(false);
      expect(result.current.canReceiveDelegations).toBe(true);
    });

    test('should return correct permissions for project manager', () => {
      const { result } = renderHook(() => useUserPermissions(projectManager));
      
      expect(result.current.canDelegate).toBe(true);
      expect(result.current.canManageTeam).toBe(true);
      expect(result.current.canReceiveDelegations).toBe(true);
      expect(result.current.canCreateTasks).toBe(true);
      expect(result.current.canEditTasks).toBe(true);
      expect(result.current.canViewAllTasks).toBe(true);
      expect(result.current.canComment).toBe(true);
    });

    test('should return correct permissions for developer', () => {
      const { result } = renderHook(() => useUserPermissions(developer));
      
      expect(result.current.canDelegate).toBe(false);
      expect(result.current.canManageTeam).toBe(false);
      expect(result.current.canReceiveDelegations).toBe(true);
      expect(result.current.canCreateTasks).toBe(true);
      expect(result.current.canEditTasks).toBe(true);
      expect(result.current.canComment).toBe(true);
    });

    test('should return correct permissions for team lead', () => {
      const { result } = renderHook(() => useUserPermissions(teamLead));
      
      expect(result.current.canDelegate).toBe(true);
      expect(result.current.canManageTeam).toBe(false);
      expect(result.current.canReceiveDelegations).toBe(true);
      expect(result.current.canCreateTasks).toBe(true);
    });

    test('should provide working permission check functions', () => {
      const { result } = renderHook(() => useUserPermissions(projectManager));
      
      expect(result.current.hasPermission('task', 'delegate')).toBe(true);
      expect(result.current.hasPermission('task', 'nonexistent')).toBe(false);
      
      expect(result.current.hasAnyPermission([
        { resource: 'task', action: 'delegate' },
        { resource: 'task', action: 'nonexistent' }
      ])).toBe(true);
      
      expect(result.current.hasAllPermissions([
        { resource: 'task', action: 'create' },
        { resource: 'task', action: 'update' }
      ])).toBe(true);
    });

    test('should provide working utility functions', () => {
      const { result } = renderHook(() => useUserPermissions(projectManager));
      
      expect(result.current.checkUserPermission(developer, 'task', 'create')).toBe(true);
      expect(result.current.checkUserPermission(developer, 'task', 'delegate')).toBe(false);
      
      const validation = result.current.validateUserData(developer);
      expect(validation.isValid).toBe(true);
      
      const summary = result.current.getPermissionSummary();
      expect(summary.roleName).toBe('Project Manager');
      expect(summary.canDelegate).toBe(true);
    });

    test('should return correct role information', () => {
      const { result } = renderHook(() => useUserPermissions(developer));
      
      expect(result.current.roleName).toBe('Developer');
      expect(result.current.roleDescription).toBe('Can work on assigned tasks and create new ones');
      expect(result.current.totalPermissions).toBeGreaterThan(0);
    });

    test('should return correct delegation permissions', () => {
      const { result } = renderHook(() => useUserPermissions(projectManager));
      
      expect(result.current.delegationPermissions.canDelegate).toBe(true);
      expect(result.current.delegationPermissions.canReceive).toBe(true);
      expect(result.current.delegationPermissions.canRevoke).toBe(true);
      expect(result.current.delegationPermissions.canViewAll).toBe(true);
    });

    test('should return correct collaboration permissions', () => {
      const { result } = renderHook(() => useUserPermissions(developer));
      
      expect(result.current.collaborationPermissions.canComment).toBe(true);
      expect(result.current.collaborationPermissions.canMention).toBe(true);
      expect(result.current.collaborationPermissions.canDelegate).toBe(false);
      expect(result.current.collaborationPermissions.canReceiveDelegations).toBe(true);
      expect(result.current.collaborationPermissions.canManageTeam).toBe(false);
    });

    test('should handle invalid user gracefully', () => {
      const invalidUser: User = {
        id: '',
        name: '',
        email: 'invalid-email',
        role: null as any,
        permissions: null as any,
        createdAt: '',
        isActive: false
      };

      const { result } = renderHook(() => useUserPermissions(invalidUser));
      
      expect(result.current.isValidUser).toBe(false);
      expect(result.current.validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('useUserPermissionsFor', () => {
    test('should work identically to useUserPermissions with user parameter', () => {
      const { result: result1 } = renderHook(() => useUserPermissions(developer));
      const { result: result2 } = renderHook(() => useUserPermissionsFor(developer));
      
      expect(result1.current.user).toBe(result2.current.user);
      expect(result1.current.canDelegate).toBe(result2.current.canDelegate);
      expect(result1.current.roleName).toBe(result2.current.roleName);
    });
  });

  describe('useDelegationPermissions', () => {
    test('should return delegation permissions for current user', () => {
      // Mock currentUser as project manager for this test
      const { result } = renderHook(() => useDelegationPermissions());
      
      expect(result.current.canDelegate).toBeDefined();
      expect(result.current.canReceive).toBeDefined();
      expect(result.current.canRevoke).toBeDefined();
      expect(result.current.canComplete).toBeDefined();
      expect(result.current.canViewAll).toBeDefined();
    });

    test('should provide canDelegateToUser function', () => {
      const { result } = renderHook(() => useDelegationPermissions());
      
      // Test with a user who can receive delegations
      expect(typeof result.current.canDelegateToUser).toBe('function');
      
      // The result depends on current user's delegation permissions and target user's ability to receive
      const canDelegateToDevResult = result.current.canDelegateToUser(developer);
      expect(typeof canDelegateToDevResult).toBe('boolean');
    });

    test('should provide canRevokeDelegation function', () => {
      const { result } = renderHook(() => useDelegationPermissions());
      
      expect(typeof result.current.canRevokeDelegation).toBe('function');
      
      // Should be able to revoke own delegations
      const canRevokeOwn = result.current.canRevokeDelegation(currentUser.id);
      expect(typeof canRevokeOwn).toBe('boolean');
    });

    test('should provide canCompleteDelegation function', () => {
      const { result } = renderHook(() => useDelegationPermissions());
      
      expect(typeof result.current.canCompleteDelegation).toBe('function');
      
      // Should be able to complete delegations assigned to current user
      const canCompleteOwn = result.current.canCompleteDelegation(currentUser.id);
      expect(typeof canCompleteOwn).toBe('boolean');
    });
  });

  describe('useCollaborationPermissions', () => {
    test('should return collaboration permissions for current user', () => {
      const { result } = renderHook(() => useCollaborationPermissions());
      
      expect(result.current.canComment).toBeDefined();
      expect(result.current.canMention).toBeDefined();
      expect(result.current.canDelegate).toBeDefined();
      expect(result.current.canReceiveDelegations).toBeDefined();
      expect(result.current.canManageTeam).toBeDefined();
      expect(result.current.canViewTeamTasks).toBeDefined();
    });

    test('should provide canMentionUser function', () => {
      const { result } = renderHook(() => useCollaborationPermissions());
      
      expect(typeof result.current.canMentionUser).toBe('function');
      
      // Should be able to mention active users
      const canMentionActive = result.current.canMentionUser(developer);
      expect(typeof canMentionActive).toBe('boolean');
      
      // Should not be able to mention inactive users
      const inactiveUser = { ...developer, isActive: false };
      const canMentionInactive = result.current.canMentionUser(inactiveUser);
      expect(canMentionInactive).toBe(false);
    });

    test('should provide canCommentOnTask function', () => {
      const { result } = renderHook(() => useCollaborationPermissions());
      
      expect(typeof result.current.canCommentOnTask).toBe('function');
      
      // Should return boolean for any task ID
      const canComment = result.current.canCommentOnTask('task-123');
      expect(typeof canComment).toBe('boolean');
    });
  });

  describe('Hook Memoization', () => {
    test('should memoize permission calculations', () => {
      const { result, rerender } = renderHook(() => useUserPermissions(developer));
      
      const firstRender = result.current;
      rerender();
      const secondRender = result.current;
      
      // Objects should be the same reference due to memoization
      expect(firstRender.delegationPermissions).toBe(secondRender.delegationPermissions);
      expect(firstRender.collaborationPermissions).toBe(secondRender.collaborationPermissions);
    });

    test('should recalculate when user changes', () => {
      const { result, rerender } = renderHook(
        ({ user }) => useUserPermissions(user),
        { initialProps: { user: developer } }
      );
      
      const developerPermissions = result.current.canDelegate;
      
      rerender({ user: projectManager });
      const managerPermissions = result.current.canDelegate;
      
      expect(developerPermissions).toBe(false);
      expect(managerPermissions).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle user without role gracefully', () => {
      const userWithoutRole = { ...developer, role: null as any };
      const { result } = renderHook(() => useUserPermissions(userWithoutRole));
      
      expect(result.current.isValidUser).toBe(false);
      expect(result.current.canDelegate).toBe(false);
      expect(result.current.roleName).toBe('Unknown');
    });

    test('should handle user without permissions gracefully', () => {
      const userWithoutPermissions = { ...developer, permissions: null as any };
      const { result } = renderHook(() => useUserPermissions(userWithoutPermissions));
      
      expect(result.current.isValidUser).toBe(false);
      expect(result.current.canDelegate).toBe(false);
    });

    test('should handle empty permissions array', () => {
      const userWithEmptyPermissions = { ...developer, permissions: [] };
      const { result } = renderHook(() => useUserPermissions(userWithEmptyPermissions));
      
      expect(result.current.canCreateTasks).toBe(false);
      expect(result.current.canEditTasks).toBe(false);
      expect(result.current.totalPermissions).toBe(0);
    });
  });
});