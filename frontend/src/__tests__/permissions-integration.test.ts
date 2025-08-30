/**
 * Permission System Integration Tests
 * Tests integration between permissions, mock data, and hooks
 */

import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { mockUsers, currentUser } from '@/lib/mockData';
import { canDelegateTask, canReceiveDelegation, canManageTeam } from '@/lib/permissions';

describe('Permission System Integration', () => {
  test('should work with mock data users', () => {
    const projectManager = mockUsers.find(u => u.role.name === 'Project Manager')!;
    const developer = mockUsers.find(u => u.role.name === 'Developer')!;
    const teamLead = mockUsers.find(u => u.role.name === 'Team Lead')!;

    // Project Manager should have full permissions
    expect(canDelegateTask(projectManager)).toBe(true);
    expect(canManageTeam(projectManager)).toBe(true);
    expect(canReceiveDelegation(projectManager)).toBe(true);

    // Developer should have limited permissions
    expect(canDelegateTask(developer)).toBe(false);
    expect(canManageTeam(developer)).toBe(false);
    expect(canReceiveDelegation(developer)).toBe(true);

    // Team Lead should have delegation but not team management
    expect(canDelegateTask(teamLead)).toBe(true);
    expect(canManageTeam(teamLead)).toBe(false);
    expect(canReceiveDelegation(teamLead)).toBe(true);
  });

  test('useUserPermissions hook should work with current user', () => {
    const { result } = renderHook(() => useUserPermissions());
    
    expect(result.current.user).toBe(currentUser);
    expect(result.current.isValidUser).toBe(true);
    expect(result.current.roleName).toBe(currentUser.role.name);
    expect(result.current.validationErrors).toHaveLength(0);
  });

  test('useUserPermissions hook should work with different users', () => {
    const developer = mockUsers.find(u => u.role.name === 'Developer')!;
    const { result } = renderHook(() => useUserPermissions(developer));
    
    expect(result.current.user).toBe(developer);
    expect(result.current.roleName).toBe('Developer');
    expect(result.current.canDelegate).toBe(false);
    expect(result.current.canReceiveDelegations).toBe(true);
    expect(result.current.canCreateTasks).toBe(true);
    expect(result.current.canComment).toBe(true);
  });

  test('permission functions should be consistent between hook and utilities', () => {
    const projectManager = mockUsers.find(u => u.role.name === 'Project Manager')!;
    const { result } = renderHook(() => useUserPermissions(projectManager));
    
    // Compare hook results with utility functions
    expect(result.current.canDelegate).toBe(canDelegateTask(projectManager));
    expect(result.current.canReceiveDelegations).toBe(canReceiveDelegation(projectManager));
    expect(result.current.canManageTeam).toBe(canManageTeam(projectManager));
  });

  test('all mock users should be valid', () => {
    mockUsers.forEach(user => {
      const { result } = renderHook(() => useUserPermissions(user));
      expect(result.current.isValidUser).toBe(true);
      expect(result.current.validationErrors).toHaveLength(0);
    });
  });
});