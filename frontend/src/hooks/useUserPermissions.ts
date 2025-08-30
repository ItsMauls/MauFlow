/**
 * useUserPermissions Hook
 * Provides role-based permission checking for delegation and collaboration features
 */

import { useMemo, useCallback } from 'react';
import { User } from '@/types/collaboration';
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
  getUserPermissionSummary,
  getDelegationPermissions,
  getCollaborationPermissions,
  validateUser,
  RESOURCES,
  ACTIONS
} from '@/lib/permissions';
import { currentUser } from '@/lib/mockData';

export interface UseUserPermissionsReturn {
  // Current user
  user: User;
  
  // Basic permission checks
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (permissions: Array<{ resource: string; action: string }>) => boolean;
  hasAllPermissions: (permissions: Array<{ resource: string; action: string }>) => boolean;
  
  // Task-related permissions
  canDelegate: boolean;
  canReceiveDelegations: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canViewAllTasks: boolean;
  
  // Team management permissions
  canManageTeam: boolean;
  
  // Collaboration permissions
  canComment: boolean;
  canMention: boolean;
  
  // Permission groups
  delegationPermissions: {
    canDelegate: boolean;
    canReceive: boolean;
    canRevoke: boolean;
    canComplete: boolean;
    canViewAll: boolean;
  };
  
  collaborationPermissions: {
    canComment: boolean;
    canMention: boolean;
    canDelegate: boolean;
    canReceiveDelegations: boolean;
    canManageTeam: boolean;
    canViewTeamTasks: boolean;
  };
  
  // Utility functions
  checkUserPermission: (user: User, resource: string, action: string) => boolean;
  validateUserData: (user: User) => { isValid: boolean; errors: string[] };
  getPermissionSummary: () => ReturnType<typeof getUserPermissionSummary>;
  
  // Role information
  roleName: string;
  roleDescription: string;
  totalPermissions: number;
  
  // Validation
  isValidUser: boolean;
  validationErrors: string[];
}

/**
 * Hook for managing user permissions and role-based access control
 */
export const useUserPermissions = (user?: User): UseUserPermissionsReturn => {
  // Use provided user or fall back to current user
  const activeUser = user || currentUser;
  
  // Validate user data
  const validation = useMemo(() => {
    return validateUser(activeUser);
  }, [activeUser]);
  
  // Memoize permission checks for performance
  const permissions = useMemo(() => {
    return {
      canDelegate: canDelegateTask(activeUser),
      canReceiveDelegations: canReceiveDelegation(activeUser),
      canCreateTasks: canCreateTask(activeUser),
      canEditTasks: canEditTask(activeUser),
      canDeleteTasks: canDeleteTask(activeUser),
      canViewAllTasks: canViewAllTasks(activeUser),
      canManageTeam: canManageTeam(activeUser),
      canComment: canCommentOnTask(activeUser),
      canMention: canMentionUsers(activeUser)
    };
  }, [activeUser]);
  
  // Memoize permission groups
  const delegationPermissions = useMemo(() => {
    return getDelegationPermissions(activeUser);
  }, [activeUser]);
  
  const collaborationPermissions = useMemo(() => {
    return getCollaborationPermissions(activeUser);
  }, [activeUser]);
  
  // Memoize role information
  const roleInfo = useMemo(() => {
    return {
      roleName: activeUser.role?.name || 'Unknown',
      roleDescription: activeUser.role?.description || 'No description',
      totalPermissions: activeUser.permissions?.length || 0
    };
  }, [activeUser]);
  
  // Permission checking functions
  const checkPermission = useCallback((resource: string, action: string): boolean => {
    return hasPermission(activeUser, resource, action);
  }, [activeUser]);
  
  const checkAnyPermission = useCallback((
    permissions: Array<{ resource: string; action: string }>
  ): boolean => {
    return hasAnyPermission(activeUser, permissions);
  }, [activeUser]);
  
  const checkAllPermissions = useCallback((
    permissions: Array<{ resource: string; action: string }>
  ): boolean => {
    return hasAllPermissions(activeUser, permissions);
  }, [activeUser]);
  
  // Check permission for any user
  const checkUserPermission = useCallback((
    user: User, 
    resource: string, 
    action: string
  ): boolean => {
    return hasPermission(user, resource, action);
  }, []);
  
  // Validate user data
  const validateUserData = useCallback((user: User) => {
    return validateUser(user);
  }, []);
  
  // Get permission summary
  const getPermissionSummary = useCallback(() => {
    return getUserPermissionSummary(activeUser);
  }, [activeUser]);
  
  return {
    // Current user
    user: activeUser,
    
    // Basic permission checks
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    
    // Task-related permissions
    canDelegate: permissions.canDelegate,
    canReceiveDelegations: permissions.canReceiveDelegations,
    canCreateTasks: permissions.canCreateTasks,
    canEditTasks: permissions.canEditTasks,
    canDeleteTasks: permissions.canDeleteTasks,
    canViewAllTasks: permissions.canViewAllTasks,
    
    // Team management permissions
    canManageTeam: permissions.canManageTeam,
    
    // Collaboration permissions
    canComment: permissions.canComment,
    canMention: permissions.canMention,
    
    // Permission groups
    delegationPermissions,
    collaborationPermissions,
    
    // Utility functions
    checkUserPermission,
    validateUserData,
    getPermissionSummary,
    
    // Role information
    roleName: roleInfo.roleName,
    roleDescription: roleInfo.roleDescription,
    totalPermissions: roleInfo.totalPermissions,
    
    // Validation
    isValidUser: validation.isValid,
    validationErrors: validation.errors
  };
};

/**
 * Hook for checking permissions of a specific user (not the current user)
 */
export const useUserPermissionsFor = (user: User): UseUserPermissionsReturn => {
  return useUserPermissions(user);
};

/**
 * Hook for checking if current user can perform specific delegation actions
 */
export const useDelegationPermissions = () => {
  const { delegationPermissions, user } = useUserPermissions();
  
  const canDelegateToUser = useCallback((targetUser: User): boolean => {
    return delegationPermissions.canDelegate && canReceiveDelegation(targetUser);
  }, [delegationPermissions.canDelegate]);
  
  const canRevokeDelegation = useCallback((delegatorId: string): boolean => {
    return delegationPermissions.canRevoke || user.id === delegatorId;
  }, [delegationPermissions.canRevoke, user.id]);
  
  const canCompleteDelegation = useCallback((assigneeId: string): boolean => {
    return delegationPermissions.canComplete && user.id === assigneeId;
  }, [delegationPermissions.canComplete, user.id]);
  
  return {
    ...delegationPermissions,
    canDelegateToUser,
    canRevokeDelegation,
    canCompleteDelegation
  };
};

/**
 * Hook for checking collaboration permissions
 */
export const useCollaborationPermissions = () => {
  const { collaborationPermissions } = useUserPermissions();
  
  const canMentionUser = useCallback((targetUser: User): boolean => {
    return collaborationPermissions.canMention && targetUser.isActive;
  }, [collaborationPermissions.canMention]);
  
  const canCommentOnTask = useCallback((taskId: string): boolean => {
    // For now, just check if user can comment
    // In a real app, you might check task-specific permissions
    return collaborationPermissions.canComment;
  }, [collaborationPermissions.canComment]);
  
  return {
    ...collaborationPermissions,
    canMentionUser,
    canCommentOnTask
  };
};

// Export constants for use in components
export { RESOURCES, ACTIONS } from '@/lib/permissions';