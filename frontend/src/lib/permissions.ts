/**
 * Permission System Utilities
 * Provides role-based permission checking and validation for collaboration features
 */

import { User, UserRole, Permission } from '@/types/collaboration';

// Permission constants for easy reference
export const PERMISSIONS = {
    DELEGATE_TASKS: 'delegate_tasks',
    MANAGE_TEAM: 'manage_team',
    VIEW_ALL_TASKS: 'view_all_tasks',
    CREATE_TASKS: 'create_tasks',
    EDIT_TASKS: 'edit_tasks',
    DELETE_TASKS: 'delete_tasks',
    RECEIVE_DELEGATIONS: 'receive_delegations',
    COMMENT_ON_TASKS: 'comment_on_tasks',
    MENTION_USERS: 'mention_users'
} as const;

// Resource types for permission checking
export const RESOURCES = {
    TASK: 'task',
    TEAM: 'team',
    PROJECT: 'project',
    COMMENT: 'comment'
} as const;

// Actions for permission checking
export const ACTIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    DELEGATE: 'delegate',
    MANAGE: 'manage',
    VIEW_ALL: 'view_all'
} as const;

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (
    user: User,
    resource: string,
    action: string
): boolean => {
    if (!user || !user.permissions) {
        return false;
    }

    return user.permissions.some(permission =>
        permission.resource === resource && permission.action === action
    );
};

/**
 * Check if a user has any of the specified permissions
 */
export const hasAnyPermission = (
    user: User,
    permissions: Array<{ resource: string; action: string }>
): boolean => {
    if (!user || !user.permissions) {
        return false;
    }

    return permissions.some(({ resource, action }) =>
        hasPermission(user, resource, action)
    );
};

/**
 * Check if a user has all of the specified permissions
 */
export const hasAllPermissions = (
    user: User,
    permissions: Array<{ resource: string; action: string }>
): boolean => {
    if (!user || !user.permissions) {
        return false;
    }

    return permissions.every(({ resource, action }) =>
        hasPermission(user, resource, action)
    );
};

/**
 * Check if a user can delegate tasks
 */
export const canDelegateTask = (user: User): boolean => {
    return user?.role?.canDelegate === true &&
        hasPermission(user, RESOURCES.TASK, ACTIONS.DELEGATE);
};

/**
 * Check if a user can receive task delegations
 */
export const canReceiveDelegation = (user: User): boolean => {
    return user?.role?.canReceiveDelegations === true;
};

/**
 * Check if a user can manage team members
 */
export const canManageTeam = (user: User): boolean => {
    return user?.role?.canManageTeam === true &&
        hasPermission(user, RESOURCES.TEAM, ACTIONS.MANAGE);
};

/**
 * Check if a user can create tasks
 */
export const canCreateTask = (user: User): boolean => {
    return hasPermission(user, RESOURCES.TASK, ACTIONS.CREATE);
};

/**
 * Check if a user can edit tasks
 */
export const canEditTask = (user: User): boolean => {
    return hasPermission(user, RESOURCES.TASK, ACTIONS.UPDATE);
};

/**
 * Check if a user can delete tasks
 */
export const canDeleteTask = (user: User): boolean => {
    return hasPermission(user, RESOURCES.TASK, ACTIONS.DELETE);
};

/**
 * Check if a user can view all tasks (not just their own)
 */
export const canViewAllTasks = (user: User): boolean => {
    return hasPermission(user, RESOURCES.TASK, ACTIONS.VIEW_ALL);
};

/**
 * Check if a user can comment on tasks
 */
export const canCommentOnTask = (user: User): boolean => {
    return hasPermission(user, RESOURCES.COMMENT, ACTIONS.CREATE);
};

/**
 * Check if a user can mention other users in comments
 */
export const canMentionUsers = (user: User): boolean => {
    return hasPermission(user, RESOURCES.COMMENT, ACTIONS.CREATE);
};

/**
 * Get all permissions for a user role
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
    return role.permissions || [];
};

/**
 * Check if a role has a specific permission
 */
export const roleHasPermission = (
    role: UserRole,
    resource: string,
    action: string
): boolean => {
    return role.permissions.some(permission =>
        permission.resource === resource && permission.action === action
    );
};

/**
 * Validate user role data
 */
export const validateUserRole = (role: UserRole): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!role.id || typeof role.id !== 'string') {
        errors.push('Role ID is required and must be a string');
    }

    if (!role.name || typeof role.name !== 'string') {
        errors.push('Role name is required and must be a string');
    }

    if (!role.description || typeof role.description !== 'string') {
        errors.push('Role description is required and must be a string');
    }

    if (!Array.isArray(role.permissions)) {
        errors.push('Role permissions must be an array');
    } else {
        role.permissions.forEach((permission, index) => {
            const permissionValidation = validatePermission(permission);
            if (!permissionValidation.isValid) {
                errors.push(`Permission at index ${index}: ${permissionValidation.errors.join(', ')}`);
            }
        });
    }

    if (typeof role.canDelegate !== 'boolean') {
        errors.push('canDelegate must be a boolean');
    }

    if (typeof role.canReceiveDelegations !== 'boolean') {
        errors.push('canReceiveDelegations must be a boolean');
    }

    if (typeof role.canManageTeam !== 'boolean') {
        errors.push('canManageTeam must be a boolean');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate permission data
 */
export const validatePermission = (permission: Permission): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!permission.id || typeof permission.id !== 'string') {
        errors.push('Permission ID is required and must be a string');
    }

    if (!permission.name || typeof permission.name !== 'string') {
        errors.push('Permission name is required and must be a string');
    }

    if (!permission.resource || typeof permission.resource !== 'string') {
        errors.push('Permission resource is required and must be a string');
    }

    if (!permission.action || typeof permission.action !== 'string') {
        errors.push('Permission action is required and must be a string');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate user data
 */
export const validateUser = (user: User): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!user.id || typeof user.id !== 'string') {
        errors.push('User ID is required and must be a string');
    }

    if (!user.name || typeof user.name !== 'string') {
        errors.push('User name is required and must be a string');
    }

    if (!user.email || typeof user.email !== 'string') {
        errors.push('User email is required and must be a string');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (user.email && !emailRegex.test(user.email)) {
        errors.push('User email must be a valid email address');
    }

    if (!user.role) {
        errors.push('User role is required');
    } else {
        const roleValidation = validateUserRole(user.role);
        if (!roleValidation.isValid) {
            errors.push(`User role validation failed: ${roleValidation.errors.join(', ')}`);
        }
    }

    if (!Array.isArray(user.permissions)) {
        errors.push('User permissions must be an array');
    } else {
        user.permissions.forEach((permission, index) => {
            const permissionValidation = validatePermission(permission);
            if (!permissionValidation.isValid) {
                errors.push(`User permission at index ${index}: ${permissionValidation.errors.join(', ')}`);
            }
        });
    }

    if (!user.createdAt || typeof user.createdAt !== 'string') {
        errors.push('User createdAt is required and must be a string');
    }

    if (typeof user.isActive !== 'boolean') {
        errors.push('User isActive must be a boolean');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Get permission summary for a user
 */
export const getUserPermissionSummary = (user: User) => {
    return {
        canDelegate: canDelegateTask(user),
        canReceiveDelegations: canReceiveDelegation(user),
        canManageTeam: canManageTeam(user),
        canCreateTasks: canCreateTask(user),
        canEditTasks: canEditTask(user),
        canDeleteTasks: canDeleteTask(user),
        canViewAllTasks: canViewAllTasks(user),
        canComment: canCommentOnTask(user),
        canMention: canMentionUsers(user),
        totalPermissions: user.permissions?.length || 0,
        roleName: user.role?.name || 'Unknown'
    };
};

/**
 * Check if user can perform delegation-related actions
 */
export const getDelegationPermissions = (user: User) => {
    return {
        canDelegate: canDelegateTask(user),
        canReceive: canReceiveDelegation(user),
        canRevoke: canDelegateTask(user) || canManageTeam(user),
        canComplete: canReceiveDelegation(user),
        canViewAll: canViewAllTasks(user) || canManageTeam(user)
    };
};

/**
 * Check if user can perform collaboration actions
 */
export const getCollaborationPermissions = (user: User) => {
    return {
        canComment: canCommentOnTask(user),
        canMention: canMentionUsers(user),
        canDelegate: canDelegateTask(user),
        canReceiveDelegations: canReceiveDelegation(user),
        canManageTeam: canManageTeam(user),
        canViewTeamTasks: canViewAllTasks(user)
    };
};