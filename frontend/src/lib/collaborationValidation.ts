/**
 * Collaboration Feature Validation Utilities
 * Provides comprehensive client-side validation for delegation, comments, and mentions
 */

import { User, TaskDelegation, TaskCommentWithMentions, TeamMember } from '@/types/collaboration';
import { 
  validateDelegationData, 
  validateCommentData, 
  validateUserPermissions,
  ValidationResult,
  createCollaborationError
} from '@/lib/errorHandling';

// Validation configuration
export interface ValidationConfig {
  maxCommentLength: number;
  maxDelegationNoteLength: number;
  maxMentionsPerComment: number;
  allowSelfMention: boolean;
  requireDelegationNote: boolean;
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxCommentLength: 1000,
  maxDelegationNoteLength: 500,
  maxMentionsPerComment: 10,
  allowSelfMention: false,
  requireDelegationNote: false
};

/**
 * Comprehensive delegation validation
 */
export function validateTaskDelegation(
  taskId: string,
  assigneeId: string,
  delegator: User,
  assignee: User | null,
  existingDelegations: TaskDelegation[],
  note?: string,
  config: Partial<ValidationConfig> = {}
): ValidationResult {
  const finalConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic data validation
  const basicValidation = validateDelegationData(taskId, assigneeId, delegator.id, note);
  errors.push(...basicValidation.errors);
  if (basicValidation.warnings) {
    warnings.push(...basicValidation.warnings);
  }

  // Permission validation
  const delegatorPermissions = validateUserPermissions(delegator, 'delegate');
  if (!delegatorPermissions.isValid) {
    errors.push(...delegatorPermissions.errors);
  }

  // Assignee validation
  if (!assignee) {
    errors.push('Selected assignee not found');
  } else {
    const assigneePermissions = validateUserPermissions(assignee, 'receive_delegation');
    if (!assigneePermissions.isValid) {
      errors.push(`${assignee.name} cannot receive task delegations`);
    }

    // Check if assignee is active
    if (!assignee.isActive) {
      errors.push(`${assignee.name} is not an active user`);
    }
  }

  // Check for existing active delegation
  const existingDelegation = existingDelegations.find(
    d => d.taskId === taskId && d.status === 'active'
  );
  if (existingDelegation) {
    if (existingDelegation.assigneeId === assigneeId) {
      errors.push('Task is already delegated to this user');
    } else {
      warnings.push('Task is currently delegated to another user and will be reassigned');
    }
  }

  // Note validation
  if (note && note.length > finalConfig.maxDelegationNoteLength) {
    errors.push(`Delegation note cannot exceed ${finalConfig.maxDelegationNoteLength} characters`);
  }

  if (finalConfig.requireDelegationNote && (!note || note.trim().length === 0)) {
    errors.push('Delegation note is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Comprehensive comment validation with mention support
 */
export function validateTaskComment(
  content: string,
  mentions: string[],
  author: User,
  availableUsers: User[],
  config: Partial<ValidationConfig> = {}
): ValidationResult {
  const finalConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic content validation
  const basicValidation = validateCommentData(content, mentions, finalConfig.maxCommentLength);
  errors.push(...basicValidation.errors);
  if (basicValidation.warnings) {
    warnings.push(...basicValidation.warnings);
  }

  // Author permission validation
  const authorPermissions = validateUserPermissions(author, 'comment');
  if (!authorPermissions.isValid) {
    errors.push(...authorPermissions.errors);
  }

  // Mention validation
  if (mentions.length > 0) {
    const mentionPermissions = validateUserPermissions(author, 'mention');
    if (!mentionPermissions.isValid) {
      errors.push('You do not have permission to mention other users');
    }

    // Check mention limits
    if (mentions.length > finalConfig.maxMentionsPerComment) {
      errors.push(`Cannot mention more than ${finalConfig.maxMentionsPerComment} users in a single comment`);
    }

    // Validate each mentioned user
    const mentionedUsers = new Set<string>();
    mentions.forEach((mentionId, index) => {
      // Check for duplicates
      if (mentionedUsers.has(mentionId)) {
        warnings.push(`Duplicate mention of user at position ${index + 1}`);
        return;
      }
      mentionedUsers.add(mentionId);

      // Check if user exists
      const mentionedUser = availableUsers.find(u => u.id === mentionId);
      if (!mentionedUser) {
        errors.push(`Mentioned user at position ${index + 1} not found`);
        return;
      }

      // Check if user is active
      if (!mentionedUser.isActive) {
        warnings.push(`${mentionedUser.name} is not an active user`);
      }

      // Check self-mention
      if (mentionId === author.id && !finalConfig.allowSelfMention) {
        warnings.push('You mentioned yourself in the comment');
      }
    });
  }

  // Content analysis
  if (content.trim().length > 0) {
    // Check for potential spam patterns
    const repeatedChars = /(.)\1{10,}/g;
    if (repeatedChars.test(content)) {
      warnings.push('Comment contains repeated characters that may be considered spam');
    }

    // Check for excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 20) {
      warnings.push('Comment contains excessive capitalization');
    }

    // Check for potential mention syntax errors
    const mentionPattern = /@\w+/g;
    const textMentions = content.match(mentionPattern) || [];
    if (textMentions.length !== mentions.length) {
      warnings.push('Mention syntax in text may not match selected mentions');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate mention syntax in comment content
 */
export function validateMentionSyntax(
  content: string,
  mentions: string[],
  availableUsers: User[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Extract @mentions from content
  const mentionPattern = /@(\w+)/g;
  const textMentions: string[] = [];
  let match;
  
  while ((match = mentionPattern.exec(content)) !== null) {
    textMentions.push(match[1]);
  }

  // Create user lookup map
  const userMap = new Map(availableUsers.map(u => [u.name.toLowerCase(), u.id]));
  const userIdMap = new Map(availableUsers.map(u => [u.id, u.name]));

  // Validate text mentions
  textMentions.forEach((mentionText, index) => {
    const userId = userMap.get(mentionText.toLowerCase());
    if (!userId) {
      errors.push(`@${mentionText} does not match any available user`);
    } else if (!mentions.includes(userId)) {
      warnings.push(`@${mentionText} found in text but not in mentions list`);
    }
  });

  // Validate mentions list
  mentions.forEach((mentionId, index) => {
    const userName = userIdMap.get(mentionId);
    if (!userName) {
      errors.push(`Mention at position ${index + 1} references unknown user`);
    } else {
      const mentionInText = textMentions.some(tm => 
        tm.toLowerCase() === userName.toLowerCase()
      );
      if (!mentionInText) {
        warnings.push(`${userName} is in mentions list but not found in comment text`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate team member selection for delegation
 */
export function validateTeamMemberSelection(
  selectedMembers: string[],
  availableMembers: TeamMember[],
  currentUser: User,
  maxSelections: number = 1
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check selection count
  if (selectedMembers.length === 0) {
    errors.push('At least one team member must be selected');
  }

  if (selectedMembers.length > maxSelections) {
    errors.push(`Cannot select more than ${maxSelections} team member(s)`);
  }

  // Validate each selected member
  selectedMembers.forEach((memberId, index) => {
    const member = availableMembers.find(m => m.id === memberId);
    
    if (!member) {
      errors.push(`Selected team member at position ${index + 1} not found`);
      return;
    }

    // Check if member can receive delegations
    if (!member.role.canReceiveDelegations) {
      errors.push(`${member.name} cannot receive task delegations`);
    }

    // Check if member is active
    if (!member.isOnline && member.lastSeen) {
      const lastSeenDate = new Date(member.lastSeen);
      const daysSinceLastSeen = Math.floor(
        (Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastSeen > 7) {
        warnings.push(`${member.name} has been offline for ${daysSinceLastSeen} days`);
      }
    }

    // Check for self-selection
    if (memberId === currentUser.id) {
      errors.push('Cannot select yourself for delegation');
    }
  });

  // Check for duplicates
  const uniqueMembers = new Set(selectedMembers);
  if (uniqueMembers.size !== selectedMembers.length) {
    errors.push('Duplicate team member selections detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate bulk operations
 */
export function validateBulkDelegation(
  taskIds: string[],
  assigneeId: string,
  delegator: User,
  assignee: User | null,
  existingDelegations: TaskDelegation[],
  maxBulkSize: number = 10
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check bulk size limit
  if (taskIds.length === 0) {
    errors.push('No tasks selected for bulk delegation');
  }

  if (taskIds.length > maxBulkSize) {
    errors.push(`Cannot delegate more than ${maxBulkSize} tasks at once`);
  }

  // Basic delegation validation
  const basicValidation = validateTaskDelegation(
    'bulk', assigneeId, delegator, assignee, existingDelegations
  );
  
  // Only include permission and user-related errors
  const relevantErrors = basicValidation.errors.filter(error => 
    !error.includes('Task ID') && !error.includes('already delegated')
  );
  errors.push(...relevantErrors);

  // Check for already delegated tasks
  const alreadyDelegated = taskIds.filter(taskId =>
    existingDelegations.some(d => d.taskId === taskId && d.status === 'active')
  );

  if (alreadyDelegated.length > 0) {
    warnings.push(`${alreadyDelegated.length} task(s) are already delegated and will be reassigned`);
  }

  // Check for duplicate task IDs
  const uniqueTaskIds = new Set(taskIds);
  if (uniqueTaskIds.size !== taskIds.length) {
    warnings.push('Duplicate task IDs detected in selection');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Real-time validation for form inputs
 */
export class CollaborationValidator {
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  }

  // Validate comment content as user types
  validateCommentInput(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (content.length > this.config.maxCommentLength) {
      errors.push(`Comment cannot exceed ${this.config.maxCommentLength} characters`);
    }

    if (content.length > this.config.maxCommentLength * 0.9) {
      warnings.push(`Approaching character limit (${content.length}/${this.config.maxCommentLength})`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // Validate delegation note as user types
  validateDelegationNoteInput(note: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (note.length > this.config.maxDelegationNoteLength) {
      errors.push(`Note cannot exceed ${this.config.maxDelegationNoteLength} characters`);
    }

    if (note.length > this.config.maxDelegationNoteLength * 0.9) {
      warnings.push(`Approaching character limit (${note.length}/${this.config.maxDelegationNoteLength})`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // Validate mention input as user types
  validateMentionInput(input: string, availableUsers: User[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (input.length < 2) {
      return { isValid: true, errors, warnings };
    }

    const matchingUsers = availableUsers.filter(user =>
      user.name.toLowerCase().includes(input.toLowerCase())
    );

    if (matchingUsers.length === 0) {
      warnings.push('No matching users found');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}

/**
 * Create validation error for UI display
 */
export function createValidationError(
  field: string,
  validation: ValidationResult
): Error | null {
  if (validation.isValid) return null;

  return createCollaborationError(
    'validation_error',
    'INVALID_DELEGATION_DATA',
    `${field}: ${validation.errors.join(', ')}`,
    { field, errors: validation.errors, warnings: validation.warnings }
  );
}