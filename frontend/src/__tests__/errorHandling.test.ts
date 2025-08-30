/**
 * Error Handling Tests
 * Tests for collaboration error handling utilities and validation
 */

import {
  createCollaborationError,
  isRetryableError,
  withRetry,
  validateDelegationData,
  validateCommentData,
  validateUserPermissions,
  handleStorageError,
  handleNetworkError,
  ERROR_CODES,
  ERROR_MESSAGES,
  DEFAULT_RETRY_CONFIG
} from '@/lib/errorHandling';

import {
  validateTaskDelegation,
  validateTaskComment,
  validateMentionSyntax,
  validateTeamMemberSelection,
  validateBulkDelegation,
  CollaborationValidator
} from '@/lib/collaborationValidation';

import { User, UserRole, Permission, TaskDelegation } from '@/types/collaboration';

// Mock data
const mockPermission: Permission = {
  id: 'perm-1',
  name: 'Delegate Tasks',
  resource: 'task',
  action: 'delegate'
};

const mockRole: UserRole = {
  id: 'role-1',
  name: 'Project Manager',
  description: 'Can manage projects and delegate tasks',
  permissions: [mockPermission],
  canDelegate: true,
  canReceiveDelegations: true,
  canManageTeam: true
};

const mockUser: User = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  role: mockRole,
  permissions: [mockPermission],
  createdAt: '2025-01-01T00:00:00Z',
  isActive: true
};

const mockAssignee: User = {
  id: 'user-2',
  name: 'Jane Smith',
  email: 'jane@example.com',
  role: mockRole,
  permissions: [mockPermission],
  createdAt: '2025-01-01T00:00:00Z',
  isActive: true
};

describe('Error Handling Utilities', () => {
  describe('createCollaborationError', () => {
    it('should create error with correct properties', () => {
      const error = createCollaborationError(
        'permission_denied',
        'DELEGATION_PERMISSION_DENIED',
        'Custom message',
        { userId: 'user-1' }
      );

      expect(error.type).toBe('permission_denied');
      expect(error.code).toBe(ERROR_CODES.DELEGATION_PERMISSION_DENIED);
      expect(error.message).toBe('Custom message');
      expect(error.userMessage).toBe('Custom message');
      expect(error.details).toEqual({ userId: 'user-1' });
      expect(error.retryable).toBe(false);
    });

    it('should use default message when none provided', () => {
      const error = createCollaborationError(
        'user_not_found',
        'USER_NOT_FOUND'
      );

      expect(error.userMessage).toBe(ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND]);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable error types', () => {
      expect(isRetryableError('network_error', 'NETWORK_UNAVAILABLE')).toBe(true);
      expect(isRetryableError('timeout_error', 'REQUEST_TIMEOUT')).toBe(true);
      expect(isRetryableError('storage_error', 'STORAGE_QUOTA_EXCEEDED')).toBe(true);
    });

    it('should identify non-retryable error types', () => {
      expect(isRetryableError('permission_denied', 'DELEGATION_PERMISSION_DENIED')).toBe(false);
      expect(isRetryableError('user_not_found', 'USER_NOT_FOUND')).toBe(false);
      expect(isRetryableError('validation_error', 'EMPTY_COMMENT')).toBe(false);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const retryableError = createCollaborationError(
        'network_error',
        'NETWORK_UNAVAILABLE'
      );
      
      const operation = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');
      
      const result = await withRetry(operation, { maxRetries: 3, baseDelay: 10 });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = createCollaborationError(
        'permission_denied',
        'DELEGATION_PERMISSION_DENIED'
      );
      
      const operation = jest.fn().mockRejectedValue(nonRetryableError);
      
      await expect(withRetry(operation)).rejects.toThrow(nonRetryableError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries limit', async () => {
      const retryableError = createCollaborationError(
        'network_error',
        'NETWORK_UNAVAILABLE'
      );
      
      const operation = jest.fn().mockRejectedValue(retryableError);
      
      await expect(withRetry(operation, { maxRetries: 2, baseDelay: 10 }))
        .rejects.toThrow(retryableError);
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('validateDelegationData', () => {
    it('should validate correct delegation data', () => {
      const result = validateDelegationData('task-1', 'user-2', 'user-1', 'Test note');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject self-delegation', () => {
      const result = validateDelegationData('task-1', 'user-1', 'user-1');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot delegate task to yourself');
    });

    it('should reject empty task ID', () => {
      const result = validateDelegationData('', 'user-2', 'user-1');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task ID is required and must be a string');
    });

    it('should reject long notes', () => {
      const longNote = 'a'.repeat(501);
      const result = validateDelegationData('task-1', 'user-2', 'user-1', longNote);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Delegation note cannot exceed 500 characters');
    });

    it('should warn about empty notes', () => {
      const result = validateDelegationData('task-1', 'user-2', 'user-1', '');
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Consider adding a note to provide context for the delegation');
    });
  });

  describe('validateCommentData', () => {
    it('should validate correct comment data', () => {
      const result = validateCommentData('This is a test comment', ['user-1', 'user-2']);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty comments', () => {
      const result = validateCommentData('', []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Comment cannot be empty');
    });

    it('should reject comments that are too long', () => {
      const longComment = 'a'.repeat(1001);
      const result = validateCommentData(longComment, []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Comment cannot exceed 1000 characters');
    });

    it('should warn about duplicate mentions', () => {
      const result = validateCommentData('Test comment', ['user-1', 'user-1']);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Duplicate mentions detected');
    });

    it('should warn about excessive mentions', () => {
      const mentions = Array.from({ length: 11 }, (_, i) => `user-${i}`);
      const result = validateCommentData('Test comment', mentions);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Consider limiting mentions to avoid notification spam');
    });
  });

  describe('validateUserPermissions', () => {
    it('should validate delegation permissions', () => {
      const result = validateUserPermissions(mockUser, 'delegate');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject user without delegation permissions', () => {
      const userWithoutPermissions = {
        ...mockUser,
        role: { ...mockRole, canDelegate: false }
      };
      
      const result = validateUserPermissions(userWithoutPermissions, 'delegate');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User does not have delegation permissions');
    });

    it('should reject user without role', () => {
      const userWithoutRole = { ...mockUser, role: null as any };
      
      const result = validateUserPermissions(userWithoutRole, 'delegate');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User role is required');
    });
  });

  describe('handleStorageError', () => {
    it('should handle quota exceeded error', () => {
      const quotaError = new Error('Storage quota exceeded');
      quotaError.name = 'QuotaExceededError';
      
      const result = handleStorageError(quotaError);
      
      expect(result.type).toBe('storage_error');
      expect(result.code).toBe(ERROR_CODES.STORAGE_QUOTA_EXCEEDED);
    });

    it('should handle access denied error', () => {
      const accessError = new Error('Storage access denied');
      
      const result = handleStorageError(accessError);
      
      expect(result.type).toBe('storage_error');
      expect(result.code).toBe(ERROR_CODES.STORAGE_ACCESS_DENIED);
    });

    it('should handle generic storage error', () => {
      const genericError = new Error('Unknown storage error');
      
      const result = handleStorageError(genericError);
      
      expect(result.type).toBe('storage_error');
      expect(result.code).toBe(ERROR_CODES.STORAGE_CORRUPTION);
    });
  });

  describe('handleNetworkError', () => {
    it('should handle timeout error', () => {
      const timeoutError = new Error('Request timeout');
      
      const result = handleNetworkError(timeoutError);
      
      expect(result.type).toBe('timeout_error');
      expect(result.code).toBe(ERROR_CODES.REQUEST_TIMEOUT);
    });

    it('should handle network error', () => {
      const networkError = new Error('Network unavailable');
      
      const result = handleNetworkError(networkError);
      
      expect(result.type).toBe('network_error');
      expect(result.code).toBe(ERROR_CODES.NETWORK_UNAVAILABLE);
    });

    it('should handle generic network error', () => {
      const genericError = new Error('Unknown error');
      
      const result = handleNetworkError(genericError);
      
      expect(result.type).toBe('network_error');
      expect(result.code).toBe(ERROR_CODES.SERVER_ERROR);
    });
  });
});

describe('Collaboration Validation', () => {
  const mockDelegations: TaskDelegation[] = [
    {
      id: 'del-1',
      taskId: 'task-1',
      delegatorId: 'user-1',
      assigneeId: 'user-2',
      delegatedAt: '2025-01-01T00:00:00Z',
      status: 'active',
      priority: 'normal'
    }
  ];

  describe('validateTaskDelegation', () => {
    it('should validate correct delegation', () => {
      const result = validateTaskDelegation(
        'task-2',
        'user-2',
        mockUser,
        mockAssignee,
        mockDelegations
      );
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject delegation to inactive user', () => {
      const inactiveAssignee = { ...mockAssignee, isActive: false };
      
      const result = validateTaskDelegation(
        'task-2',
        'user-2',
        mockUser,
        inactiveAssignee,
        mockDelegations
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Jane Smith is not an active user');
    });

    it('should warn about existing delegation', () => {
      const result = validateTaskDelegation(
        'task-1',
        'user-3',
        mockUser,
        mockAssignee,
        mockDelegations
      );
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Task is currently delegated to another user and will be reassigned');
    });

    it('should reject duplicate delegation', () => {
      const result = validateTaskDelegation(
        'task-1',
        'user-2',
        mockUser,
        mockAssignee,
        mockDelegations
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task is already delegated to this user');
    });
  });

  describe('validateTaskComment', () => {
    const availableUsers = [mockUser, mockAssignee];

    it('should validate correct comment', () => {
      const result = validateTaskComment(
        'This is a test comment @Jane',
        ['user-2'],
        mockUser,
        availableUsers
      );
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject comment with unknown mentioned user', () => {
      const result = validateTaskComment(
        'Test comment',
        ['unknown-user'],
        mockUser,
        availableUsers
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mentioned user at position 1 not found');
    });

    it('should warn about self-mention', () => {
      const result = validateTaskComment(
        'Test comment @John',
        ['user-1'],
        mockUser,
        availableUsers
      );
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('You mentioned yourself in the comment');
    });

    it('should warn about excessive capitalization', () => {
      const result = validateTaskComment(
        'THIS IS A VERY LOUD COMMENT WITH LOTS OF CAPS',
        [],
        mockUser,
        availableUsers
      );
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Comment contains excessive capitalization');
    });
  });

  describe('validateMentionSyntax', () => {
    const availableUsers = [mockUser, mockAssignee];

    it('should validate correct mention syntax', () => {
      const result = validateMentionSyntax(
        'Hello @John and @Jane',
        ['user-1', 'user-2'],
        availableUsers
      );
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unknown mentions in text', () => {
      const result = validateMentionSyntax(
        'Hello @Unknown',
        [],
        availableUsers
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('@Unknown does not match any available user');
    });

    it('should warn about mentions not in text', () => {
      const result = validateMentionSyntax(
        'Hello there',
        ['user-1'],
        availableUsers
      );
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('John Doe is in mentions list but not found in comment text');
    });
  });

  describe('CollaborationValidator', () => {
    const validator = new CollaborationValidator();

    it('should validate comment input', () => {
      const result = validator.validateCommentInput('Test comment');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject comment input that is too long', () => {
      const longComment = 'a'.repeat(1001);
      const result = validator.validateCommentInput(longComment);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Comment cannot exceed 1000 characters');
    });

    it('should warn about approaching character limit', () => {
      const nearLimitComment = 'a'.repeat(950);
      const result = validator.validateCommentInput(nearLimitComment);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Approaching character limit (950/1000)');
    });

    it('should validate delegation note input', () => {
      const result = validator.validateDelegationNoteInput('Test note');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate mention input', () => {
      const result = validator.validateMentionInput('jo', [mockUser, mockAssignee]);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about no matching users', () => {
      const result = validator.validateMentionInput('xyz', [mockUser, mockAssignee]);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('No matching users found');
    });
  });
});