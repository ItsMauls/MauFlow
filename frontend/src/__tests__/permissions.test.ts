/**
 * Permission System Unit Tests
 * Tests for role-based permission checking and validation
 */

import { describe, test, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canDelegateTask,
  canReceiveDelegation,
  canManageTeam,
  canCreateTask,
  canEditTask,
  canDeleteTask,
  canViewAllTasks,
  canCommentOnTask,
  canMentionUsers,
  validateUserRole,
  validatePermission,
  validateUser,
  getUserPermissionSummary,
  getDelegationPermissions,
  getCollaborationPermissions,
  PERMISSIONS,
  RESOURCES,
  ACTIONS
} from '@/lib/permissions';
import { User, UserRole, Permission } from '@/types/collaboration';
import { mockUsers, mockUserRoles, mockPermissions } from '@/lib/mockData';

describe('Permission System', () => {
  // Test data
  const mockPermission: Permission = {
    id: 'test-perm-1',
    name: 'Test Permission',
    resource: 'task',
    action: 'create'
  };

  const mockRole: UserRole = {
    id: 'test-role-1',
    name: 'Test Role',
    description: 'A test role',
    permissions: [mockPermission],
    canDelegate: true,
    canReceiveDelegations: true,
    canManageTeam: false
  };

  const mockUser: User = {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: mockRole,
    permissions: [mockPermission],
    createdAt: '2025-08-29T00:00:00Z',
    isActive: true
  };

  describe('Basic Permission Checking', () => {
    test('hasPermission should return true for valid permission', () => {
      expect(hasPermission(mockUser, 'task', 'create')).toBe(true);
    });

    test('hasPermission should return false for invalid permission', () => {
      expect(hasPermission(mockUser, 'task', 'delete')).toBe(false);
    });

    test('hasPermission should return false for null user', () => {
      expect(hasPermission(null as any, 'task', 'create')).toBe(false);
    });

    test('hasPermission should return false for user without permissions', () => {
      const userWithoutPermissions = { ...mockUser, permissions: [] };
      expect(hasPermission(userWithoutPermissions, 'task', 'create')).toBe(false);
    });

    test('hasAnyPermission should return true if user has any of the permissions', () => {
      const permissions = [
        { resource: 'task', action: 'create' },
        { resource: 'task', action: 'delete' }
      ];
      expect(hasAnyPermission(mockUser, permissions)).toBe(true);
    });

    test('hasAnyPermission should return false if user has none of the permissions', () => {
      const permissions = [
        { resource: 'task', action: 'delete' },
        { resource: 'team', action: 'manage' }
      ];
      expect(hasAnyPermission(mockUser, permissions)).toBe(false);
    });

    test('hasAllPermissions should return true if user has all permissions', () => {
      const permissions = [
        { resource: 'task', action: 'create' }
      ];
      expect(hasAllPermissions(mockUser, permissions)).toBe(true);
    });

    test('hasAllPermissions should return false if user is missing any permission', () => {
      const permissions = [
        { resource: 'task', action: 'create' },
        { resource: 'task', action: 'delete' }
      ];
      expect(hasAllPermissions(mockUser, permissions)).toBe(false);
    });
  });

  describe('Specific Permission Checks', () => {
    test('canDelegateTask should return true for users with delegation permissions', () => {
      const projectManager = mockUsers.find(u => u.role.name === 'Project Manager')!;
      expect(canDelegateTask(projectManager)).toBe(true);
    });

    test('canDelegateTask should return false for users without delegation permissions', () => {
      const developer = mockUsers.find(u => u.role.name === 'Developer')!;
      expect(canDelegateTask(developer)).toBe(false);
    });

    test('canReceiveDelegation should return true for users who can receive delegations', () => {
      const developer = mockUsers.find(u => u.role.name === 'Developer')!;
      expect(canReceiveDelegation(developer)).toBe(true);
    });

    test('canManageTeam should return true for project managers', () => {
      const projectManager = mockUsers.find(u => u.role.name === 'Project Manager')!;
      expect(canManageTeam(projectManager)).toBe(true);
    });

    test('canManageTeam should return false for developers', () => {
      const developer = mockUsers.find(u => u.role.name === 'Developer')!;
      expect(canManageTeam(developer)).toBe(false);
    });

    test('canCreateTask should return true for users with create permission', () => {
      const developer = mockUsers.find(u => u.role.name === 'Developer')!;
      expect(canCreateTask(developer)).toBe(true);
    });

    test('canEditTask should return true for users with edit permission', () => {
      const developer = mockUsers.find(u => u.role.name === 'Developer')!;
      expect(canEditTask(developer)).toBe(true);
    });

    test('canViewAllTasks should return true for users with view all permission', () => {
      const projectManager = mockUsers.find(u => u.role.name === 'Project Manager')!;
      expect(canViewAllTasks(projectManager)).toBe(true);
    });

    test('canCommentOnTask should return true for users with comment permission', () => {
      const developer = mockUsers.find(u => u.role.name === 'Developer')!;
      expect(canCommentOnTask(developer)).toBe(true);
    });
  });

  describe('Validation Functions', () => {
    describe('validatePermission', () => {
      test('should validate correct permission', () => {
        const result = validatePermission(mockPermission);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject permission without id', () => {
        const invalidPermission = { ...mockPermission, id: '' };
        const result = validatePermission(invalidPermission);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Permission ID is required and must be a string');
      });

      test('should reject permission without name', () => {
        const invalidPermission = { ...mockPermission, name: '' };
        const result = validatePermission(invalidPermission);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Permission name is required and must be a string');
      });

      test('should reject permission without resource', () => {
        const invalidPermission = { ...mockPermission, resource: '' };
        const result = validatePermission(invalidPermission);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Permission resource is required and must be a string');
      });

      test('should reject permission without action', () => {
        const invalidPermission = { ...mockPermission, action: '' };
        const result = validatePermission(invalidPermission);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Permission action is required and must be a string');
      });
    });

    describe('validateUserRole', () => {
      test('should validate correct user role', () => {
        const result = validateUserRole(mockRole);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject role without id', () => {
        const invalidRole = { ...mockRole, id: '' };
        const result = validateUserRole(invalidRole);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Role ID is required and must be a string');
      });

      test('should reject role without name', () => {
        const invalidRole = { ...mockRole, name: '' };
        const result = validateUserRole(invalidRole);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Role name is required and must be a string');
      });

      test('should reject role with invalid permissions', () => {
        const invalidRole = { ...mockRole, permissions: 'invalid' as any };
        const result = validateUserRole(invalidRole);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Role permissions must be an array');
      });

      test('should reject role with invalid canDelegate type', () => {
        const invalidRole = { ...mockRole, canDelegate: 'yes' as any };
        const result = validateUserRole(invalidRole);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('canDelegate must be a boolean');
      });
    });

    describe('validateUser', () => {
      test('should validate correct user', () => {
        const result = validateUser(mockUser);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject user without id', () => {
        const invalidUser = { ...mockUser, id: '' };
        const result = validateUser(invalidUser);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('User ID is required and must be a string');
      });

      test('should reject user without name', () => {
        const invalidUser = { ...mockUser, name: '' };
        const result = validateUser(invalidUser);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('User name is required and must be a string');
      });

      test('should reject user with invalid email', () => {
        const invalidUser = { ...mockUser, email: 'invalid-email' };
        const result = validateUser(invalidUser);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('User email must be a valid email address');
      });

      test('should reject user without role', () => {
        const invalidUser = { ...mockUser, role: null as any };
        const result = validateUser(invalidUser);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('User role is required');
      });

      test('should reject user with invalid permissions array', () => {
        const invalidUser = { ...mockUser, permissions: 'invalid' as any };
        const result = validateUser(invalidUser);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('User permissions must be an array');
      });

      test('should reject user with invalid isActive type', () => {
        const invalidUser = { ...mockUser, isActive: 'yes' as any };
        const result = validateUser(invalidUser);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('User isActive must be a boolean');
      });
    });
  });

  describe('Permission Summary Functions', () => {
    test('getUserPermissionSummary should return correct summary', () => {
      const projectManager = mockUsers.find(u => u.role.name === 'Project Manager')!;
      const summary = getUserPermissionSummary(projectManager);
      
      expect(summary.canDelegate).toBe(true);
      expect(summary.canManageTeam).toBe(true);
      expect(summary.roleName).toBe('Project Manager');
      expect(summary.totalPermissions).toBeGreaterThan(0);
    });

    test('getDelegationPermissions should return correct delegation permissions', () => {
      const projectManager = mockUsers.find(u => u.role.name === 'Project Manager')!;
      const permissions = getDelegationPermissions(projectManager);
      
      expect(permissions.canDelegate).toBe(true);
      expect(permissions.canReceive).toBe(true);
      expect(permissions.canRevoke).toBe(true);
      expect(permissions.canViewAll).toBe(true);
    });

    test('getCollaborationPermissions should return correct collaboration permissions', () => {
      const developer = mockUsers.find(u => u.role.name === 'Developer')!;
      const permissions = getCollaborationPermissions(developer);
      
      expect(permissions.canComment).toBe(true);
      expect(permissions.canDelegate).toBe(false);
      expect(permissions.canReceiveDelegations).toBe(true);
      expect(permissions.canManageTeam).toBe(false);
    });
  });

  describe('Constants', () => {
    test('RESOURCES should contain expected values', () => {
      expect(RESOURCES.TASK).toBe('task');
      expect(RESOURCES.TEAM).toBe('team');
      expect(RESOURCES.PROJECT).toBe('project');
      expect(RESOURCES.COMMENT).toBe('comment');
    });

    test('ACTIONS should contain expected values', () => {
      expect(ACTIONS.CREATE).toBe('create');
      expect(ACTIONS.READ).toBe('read');
      expect(ACTIONS.UPDATE).toBe('update');
      expect(ACTIONS.DELETE).toBe('delete');
      expect(ACTIONS.DELEGATE).toBe('delegate');
      expect(ACTIONS.MANAGE).toBe('manage');
    });
  });

  describe('Edge Cases', () => {
    test('should handle user with empty permissions array', () => {
      const userWithoutPermissions = { ...mockUser, permissions: [] };
      expect(hasPermission(userWithoutPermissions, 'task', 'create')).toBe(false);
      expect(canDelegateTask(userWithoutPermissions)).toBe(false);
    });

    test('should handle user with undefined permissions', () => {
      const userWithUndefinedPermissions = { ...mockUser, permissions: undefined as any };
      expect(hasPermission(userWithUndefinedPermissions, 'task', 'create')).toBe(false);
    });

    test('should handle role with empty permissions array', () => {
      const roleWithoutPermissions = { ...mockRole, permissions: [] };
      const userWithEmptyRole = { ...mockUser, role: roleWithoutPermissions, permissions: [] };
      expect(canDelegateTask(userWithEmptyRole)).toBe(false);
    });

    test('should handle null/undefined inputs gracefully', () => {
      expect(hasPermission(null as any, 'task', 'create')).toBe(false);
      expect(hasPermission(undefined as any, 'task', 'create')).toBe(false);
      expect(canDelegateTask(null as any)).toBe(false);
      expect(canDelegateTask(undefined as any)).toBe(false);
    });
  });

  describe('Real Mock Data Integration', () => {
    test('should work correctly with actual mock users', () => {
      const projectManager = mockUsers.find(u => u.role.name === 'Project Manager')!;
      const developer = mockUsers.find(u => u.role.name === 'Developer')!;
      const teamLead = mockUsers.find(u => u.role.name === 'Team Lead')!;

      // Project Manager permissions
      expect(canDelegateTask(projectManager)).toBe(true);
      expect(canManageTeam(projectManager)).toBe(true);
      expect(canReceiveDelegation(projectManager)).toBe(true);

      // Developer permissions
      expect(canDelegateTask(developer)).toBe(false);
      expect(canManageTeam(developer)).toBe(false);
      expect(canReceiveDelegation(developer)).toBe(true);
      expect(canCreateTask(developer)).toBe(true);

      // Team Lead permissions
      expect(canDelegateTask(teamLead)).toBe(true);
      expect(canManageTeam(teamLead)).toBe(false);
      expect(canReceiveDelegation(teamLead)).toBe(true);
    });

    test('should validate all mock users successfully', () => {
      mockUsers.forEach(user => {
        const validation = validateUser(user);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });

    test('should validate all mock roles successfully', () => {
      mockUserRoles.forEach(role => {
        const validation = validateUserRole(role);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });

    test('should validate all mock permissions successfully', () => {
      mockPermissions.forEach(permission => {
        const validation = validatePermission(permission);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });
  });
});