import { TaskComment } from '@/types/comments';

/**
 * Utility functions for managing task comments
 */

/**
 * Generate a unique comment ID
 */
export const generateCommentId = (): string => {
  return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new comment object
 */
export const createComment = (
  taskId: string,
  content: string,
  author: string = 'Current User',
  authorId?: string,
  mentions?: string[]
): TaskComment => {
  const now = new Date().toISOString();
  return {
    id: generateCommentId(),
    taskId,
    content: content.trim(),
    author,
    authorId,
    mentions: mentions || [],
    createdAt: now,
  };
};

/**
 * Update an existing comment
 */
export const updateComment = (
  comment: TaskComment,
  newContent: string,
  mentions?: string[]
): TaskComment => {
  return {
    ...comment,
    content: newContent.trim(),
    mentions: mentions || comment.mentions || [],
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Sort comments by creation date
 */
export const sortCommentsByDate = (
  comments: TaskComment[],
  order: 'asc' | 'desc' = 'desc'
): TaskComment[] => {
  return [...comments].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

/**
 * Filter comments by task ID
 */
export const getCommentsForTask = (
  comments: TaskComment[],
  taskId: string
): TaskComment[] => {
  return comments.filter(comment => comment.taskId === taskId);
};

/**
 * Validate comment content
 */
export const validateCommentContent = (content: string): {
  isValid: boolean;
  error?: string;
} => {
  const trimmedContent = content.trim();
  
  if (!trimmedContent) {
    return { isValid: false, error: 'Comment cannot be empty' };
  }
  
  if (trimmedContent.length < 2) {
    return { isValid: false, error: 'Comment must be at least 2 characters long' };
  }
  
  if (trimmedContent.length > 500) {
    return { isValid: false, error: 'Comment cannot exceed 500 characters' };
  }
  
  // Check for potentially harmful content
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmedContent)) {
      return { isValid: false, error: 'Comment contains invalid content' };
    }
  }
  
  return { isValid: true };
};

/**
 * Sanitize comment content for safe display
 */
export const sanitizeCommentContent = (content: string): string => {
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Check if comment can be edited (within edit time limit)
 */
export const canEditComment = (comment: TaskComment, editTimeLimit = 300000): boolean => {
  const now = new Date().getTime();
  const createdAt = new Date(comment.createdAt).getTime();
  return (now - createdAt) <= editTimeLimit; // 5 minutes default
};

/**
 * Get comment statistics for a task
 */
export const getCommentStats = (comments: TaskComment[]): {
  total: number;
  authors: string[];
  lastActivity: string | null;
} => {
  const uniqueAuthors = [...new Set(comments.map(c => c.author))];
  const sortedComments = sortCommentsByDate(comments, 'desc');
  const lastActivity = sortedComments.length > 0 ? sortedComments[0].createdAt : null;
  
  return {
    total: comments.length,
    authors: uniqueAuthors,
    lastActivity
  };
};

/**
 * Format relative time for comment timestamps
 */
export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  
  return date.toLocaleDateString();
};

/**
 * Get comments that mention a specific user
 */
export const getCommentsMentioningUser = (
  comments: TaskComment[],
  userId: string
): TaskComment[] => {
  return comments.filter(comment => 
    comment.mentions && comment.mentions.includes(userId)
  );
};

/**
 * Get all users mentioned in comments
 */
export const getAllMentionedUsers = (comments: TaskComment[]): string[] => {
  const mentionedUsers = new Set<string>();
  
  comments.forEach(comment => {
    if (comment.mentions) {
      comment.mentions.forEach(userId => mentionedUsers.add(userId));
    }
  });
  
  return Array.from(mentionedUsers);
};

/**
 * Check if a comment has mentions
 */
export const commentHasMentions = (comment: TaskComment): boolean => {
  return Boolean(comment.mentions && comment.mentions.length > 0);
};

/**
 * Get mention statistics for comments
 */
export const getCommentMentionStats = (comments: TaskComment[]): {
  totalMentions: number;
  commentsWithMentions: number;
  uniqueUsersmentioned: number;
  mostMentionedUsers: Array<{ userId: string; count: number }>;
} => {
  const mentionCounts = new Map<string, number>();
  let totalMentions = 0;
  let commentsWithMentions = 0;
  
  comments.forEach(comment => {
    if (comment.mentions && comment.mentions.length > 0) {
      commentsWithMentions++;
      comment.mentions.forEach(userId => {
        totalMentions++;
        mentionCounts.set(userId, (mentionCounts.get(userId) || 0) + 1);
      });
    }
  });
  
  const mostMentionedUsers = Array.from(mentionCounts.entries())
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 most mentioned users
  
  return {
    totalMentions,
    commentsWithMentions,
    uniqueUsersmentioned: mentionCounts.size,
    mostMentionedUsers
  };
};