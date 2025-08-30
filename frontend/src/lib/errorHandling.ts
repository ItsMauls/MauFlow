/**
 * Error Handling Utilities for Collaboration Features
 * Provides comprehensive error handling, validation, and retry mechanisms
 */

import { User, TaskDelegation, TaskCommentWithMentions } from '@/types/collaboration';

// Error Types
export interface CollaborationError extends Error {
  type: CollaborationErrorType;
  code: string;
  details?: Record<string, any>;
  retryable: boolean;
  userMessage: string;
}

export type CollaborationErrorType = 
  | 'permission_denied'
  | 'user_not_found'
  | 'delegation_failed'
  | 'notification_failed'
  | 'validation_error'
  | 'storage_error'
  | 'network_error'
  | 'rate_limit_error'
  | 'timeout_error';

// Error Codes
export const ERROR_CODES = {
  // Permission Errors
  DELEGATION_PERMISSION_DENIED: 'DELEGATION_PERMISSION_DENIED',
  RECEIVE_DELEGATION_DENIED: 'RECEIVE_DELEGATION_DENIED',
  MANAGE_TEAM_DENIED: 'MANAGE_TEAM_DENIED',
  COMMENT_PERMISSION_DENIED: 'COMMENT_PERMISSION_DENIED',
  MENTION_PERMISSION_DENIED: 'MENTION_PERMISSION_DENIED',
  
  // User Errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ASSIGNEE_NOT_FOUND: 'ASSIGNEE_NOT_FOUND',
  DELEGATOR_NOT_FOUND: 'DELEGATOR_NOT_FOUND',
  INVALID_USER_DATA: 'INVALID_USER_DATA',
  
  // Delegation Errors
  DELEGATION_NOT_FOUND: 'DELEGATION_NOT_FOUND',
  TASK_ALREADY_DELEGATED: 'TASK_ALREADY_DELEGATED',
  DELEGATION_TO_SELF: 'DELEGATION_TO_SELF',
  INVALID_DELEGATION_DATA: 'INVALID_DELEGATION_DATA',
  DELEGATION_REVOKE_FAILED: 'DELEGATION_REVOKE_FAILED',
  DELEGATION_COMPLETE_FAILED: 'DELEGATION_COMPLETE_FAILED',
  
  // Comment Errors
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  EMPTY_COMMENT: 'EMPTY_COMMENT',
  COMMENT_TOO_LONG: 'COMMENT_TOO_LONG',
  INVALID_MENTION: 'INVALID_MENTION',
  MENTION_USER_NOT_FOUND: 'MENTION_USER_NOT_FOUND',
  
  // Storage Errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED: 'STORAGE_ACCESS_DENIED',
  STORAGE_CORRUPTION: 'STORAGE_CORRUPTION',
  
  // Network Errors
  NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_CODES.DELEGATION_PERMISSION_DENIED]: 'You do not have permission to delegate tasks.',
  [ERROR_CODES.RECEIVE_DELEGATION_DENIED]: 'This user cannot receive task delegations.',
  [ERROR_CODES.MANAGE_TEAM_DENIED]: 'You do not have permission to manage team members.',
  [ERROR_CODES.COMMENT_PERMISSION_DENIED]: 'You do not have permission to comment on tasks.',
  [ERROR_CODES.MENTION_PERMISSION_DENIED]: 'You do not have permission to mention other users.',
  
  [ERROR_CODES.USER_NOT_FOUND]: 'The specified user could not be found.',
  [ERROR_CODES.ASSIGNEE_NOT_FOUND]: 'The selected assignee could not be found.',
  [ERROR_CODES.DELEGATOR_NOT_FOUND]: 'The task delegator could not be found.',
  [ERROR_CODES.INVALID_USER_DATA]: 'Invalid user information provided.',
  
  [ERROR_CODES.DELEGATION_NOT_FOUND]: 'The delegation could not be found.',
  [ERROR_CODES.TASK_ALREADY_DELEGATED]: 'This task is already delegated to another user.',
  [ERROR_CODES.DELEGATION_TO_SELF]: 'You cannot delegate a task to yourself.',
  [ERROR_CODES.INVALID_DELEGATION_DATA]: 'Invalid delegation information provided.',
  [ERROR_CODES.DELEGATION_REVOKE_FAILED]: 'Failed to revoke the task delegation.',
  [ERROR_CODES.DELEGATION_COMPLETE_FAILED]: 'Failed to complete the task delegation.',
  
  [ERROR_CODES.COMMENT_NOT_FOUND]: 'The comment could not be found.',
  [ERROR_CODES.EMPTY_COMMENT]: 'Comment cannot be empty.',
  [ERROR_CODES.COMMENT_TOO_LONG]: 'Comment is too long. Please keep it under 1000 characters.',
  [ERROR_CODES.INVALID_MENTION]: 'Invalid user mention format.',
  [ERROR_CODES.MENTION_USER_NOT_FOUND]: 'One or more mentioned users could not be found.',
  
  [ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: 'Storage limit exceeded. Please clear some data and try again.',
  [ERROR_CODES.STORAGE_ACCESS_DENIED]: 'Unable to access local storage. Please check your browser settings.',
  [ERROR_CODES.STORAGE_CORRUPTION]: 'Data corruption detected. Please refresh the page.',
  
  [ERROR_CODES.NETWORK_UNAVAILABLE]: 'Network connection unavailable. Please check your internet connection.',
  [ERROR_CODES.REQUEST_TIMEOUT]: 'Request timed out. Please try again.',
  [ERROR_CODES.SERVER_ERROR]: 'Server error occurred. Please try again later.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment before trying again.'
} as const;

/**
 * Create a collaboration error with proper typing and user-friendly messages
 */
export function createCollaborationError(
  type: CollaborationErrorType,
  code: keyof typeof ERROR_CODES,
  message?: string,
  details?: Record<string, any>
): CollaborationError {
  const errorCode = ERROR_CODES[code];
  const userMessage = message || ERROR_MESSAGES[errorCode] || 'An unexpected error occurred.';
  
  const error = new Error(userMessage) as CollaborationError;
  error.type = type;
  error.code = errorCode;
  error.details = details;
  error.userMessage = userMessage;
  error.retryable = isRetryableError(type, errorCode);
  
  return error;
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(type: CollaborationErrorType, code: string): boolean {
  const retryableTypes: CollaborationErrorType[] = [
    'network_error',
    'timeout_error',
    'storage_error'
  ];
  
  const retryableCodes = [
    ERROR_CODES.NETWORK_UNAVAILABLE,
    ERROR_CODES.REQUEST_TIMEOUT,
    ERROR_CODES.SERVER_ERROR,
    ERROR_CODES.STORAGE_QUOTA_EXCEEDED
  ];
  
  return retryableTypes.includes(type) || retryableCodes.includes(code);
}

/**
 * Retry mechanism configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: CollaborationError) => boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error) => error.retryable
};

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: CollaborationError;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as CollaborationError;
      
      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === finalConfig.maxRetries || 
          !finalConfig.retryCondition?.(lastError)) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError!;
}

/**
 * Validation utilities
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validate delegation data
 */
export function validateDelegationData(
  taskId: string,
  assigneeId: string,
  delegatorId: string,
  note?: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validation
  if (!taskId || typeof taskId !== 'string') {
    errors.push('Task ID is required and must be a string');
  }
  
  if (!assigneeId || typeof assigneeId !== 'string') {
    errors.push('Assignee ID is required and must be a string');
  }
  
  if (!delegatorId || typeof delegatorId !== 'string') {
    errors.push('Delegator ID is required and must be a string');
  }
  
  // Check for self-delegation
  if (assigneeId === delegatorId) {
    errors.push('Cannot delegate task to yourself');
  }
  
  // Validate note length
  if (note && note.length > 500) {
    errors.push('Delegation note cannot exceed 500 characters');
  }
  
  // Warning for empty note
  if (!note || note.trim().length === 0) {
    warnings.push('Consider adding a note to provide context for the delegation');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate comment content and mentions
 */
export function validateCommentData(
  content: string,
  mentions: string[] = [],
  maxLength: number = 1000
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Content validation
  if (!content || typeof content !== 'string') {
    errors.push('Comment content is required and must be a string');
  } else {
    if (content.trim().length === 0) {
      errors.push('Comment cannot be empty');
    }
    
    if (content.length > maxLength) {
      errors.push(`Comment cannot exceed ${maxLength} characters`);
    }
  }
  
  // Mentions validation
  if (!Array.isArray(mentions)) {
    errors.push('Mentions must be an array');
  } else {
    mentions.forEach((mention, index) => {
      if (!mention || typeof mention !== 'string') {
        errors.push(`Mention at index ${index} must be a non-empty string`);
      }
    });
    
    // Check for duplicate mentions
    const uniqueMentions = new Set(mentions);
    if (uniqueMentions.size !== mentions.length) {
      warnings.push('Duplicate mentions detected');
    }
    
    // Warn about excessive mentions
    if (mentions.length > 10) {
      warnings.push('Consider limiting mentions to avoid notification spam');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate user permissions for specific actions
 */
export function validateUserPermissions(
  user: User,
  action: 'delegate' | 'receive_delegation' | 'comment' | 'mention' | 'manage_team'
): ValidationResult {
  const errors: string[] = [];
  
  if (!user) {
    errors.push('User is required');
    return { isValid: false, errors };
  }
  
  if (!user.role) {
    errors.push('User role is required');
    return { isValid: false, errors };
  }
  
  switch (action) {
    case 'delegate':
      if (!user.role.canDelegate) {
        errors.push('User does not have delegation permissions');
      }
      break;
      
    case 'receive_delegation':
      if (!user.role.canReceiveDelegations) {
        errors.push('User cannot receive delegations');
      }
      break;
      
    case 'manage_team':
      if (!user.role.canManageTeam) {
        errors.push('User does not have team management permissions');
      }
      break;
      
    case 'comment':
    case 'mention':
      // Check if user has comment permissions
      const hasCommentPermission = user.permissions?.some(p => 
        p.resource === 'comment' && p.action === 'create'
      );
      if (!hasCommentPermission) {
        errors.push('User does not have comment permissions');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Storage error handling utilities
 */
export function handleStorageError(error: Error): CollaborationError {
  if (error.name === 'QuotaExceededError') {
    return createCollaborationError(
      'storage_error',
      'STORAGE_QUOTA_EXCEEDED',
      undefined,
      { originalError: error.message }
    );
  }
  
  if (error.message.includes('access denied') || error.message.includes('permission')) {
    return createCollaborationError(
      'storage_error',
      'STORAGE_ACCESS_DENIED',
      undefined,
      { originalError: error.message }
    );
  }
  
  return createCollaborationError(
    'storage_error',
    'STORAGE_CORRUPTION',
    'Failed to access local storage',
    { originalError: error.message }
  );
}

/**
 * Network error handling utilities
 */
export function handleNetworkError(error: Error): CollaborationError {
  if (error.message.includes('timeout')) {
    return createCollaborationError(
      'timeout_error',
      'REQUEST_TIMEOUT',
      undefined,
      { originalError: error.message }
    );
  }
  
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return createCollaborationError(
      'network_error',
      'NETWORK_UNAVAILABLE',
      undefined,
      { originalError: error.message }
    );
  }
  
  return createCollaborationError(
    'network_error',
    'SERVER_ERROR',
    'An unexpected network error occurred',
    { originalError: error.message }
  );
}

/**
 * Error logging utility
 */
export function logCollaborationError(
  error: CollaborationError,
  context?: Record<string, any>
): void {
  const logData = {
    type: error.type,
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    retryable: error.retryable,
    details: error.details,
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack
  };
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Collaboration Error:', logData);
  }
  
  // In production, you would send to error tracking service
  // Example: Sentry, LogRocket, etc.
}

/**
 * Error recovery suggestions
 */
export function getErrorRecoverySuggestions(error: CollaborationError): string[] {
  const suggestions: string[] = [];
  
  switch (error.type) {
    case 'permission_denied':
      suggestions.push('Contact your administrator to request the necessary permissions');
      suggestions.push('Check if you are logged in with the correct account');
      break;
      
    case 'user_not_found':
      suggestions.push('Verify the user exists and is active');
      suggestions.push('Try refreshing the team member list');
      break;
      
    case 'delegation_failed':
      suggestions.push('Check if the task is still available for delegation');
      suggestions.push('Verify the assignee can receive delegations');
      break;
      
    case 'storage_error':
      suggestions.push('Clear browser cache and try again');
      suggestions.push('Free up storage space in your browser');
      break;
      
    case 'network_error':
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
      break;
      
    default:
      suggestions.push('Refresh the page and try again');
      suggestions.push('Contact support if the problem persists');
  }
  
  return suggestions;
}