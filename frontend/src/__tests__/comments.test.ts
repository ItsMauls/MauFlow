import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  generateCommentId,
  createComment,
  updateComment,
  sortCommentsByDate,
  getCommentsForTask,
  validateCommentContent,
  formatRelativeTime,
  sanitizeCommentContent,
  canEditComment,
  getCommentStats
} from '@/lib/comments';
import { TaskComment } from '@/types/comments';

describe('Comment Utilities', () => {
  let mockComments: TaskComment[];

  beforeEach(() => {
    mockComments = [
      {
        id: 'comment1',
        taskId: 'task1',
        content: 'First comment',
        author: 'User 1',
        createdAt: '2024-01-01T10:00:00Z',
      },
      {
        id: 'comment2',
        taskId: 'task1',
        content: 'Second comment',
        author: 'User 2',
        createdAt: '2024-01-01T11:00:00Z',
      },
      {
        id: 'comment3',
        taskId: 'task2',
        content: 'Comment on different task',
        author: 'User 1',
        createdAt: '2024-01-01T12:00:00Z',
      },
    ];
  });

  describe('generateCommentId', () => {
    it('should generate unique comment IDs', () => {
      const id1 = generateCommentId();
      const id2 = generateCommentId();
      
      expect(id1).toMatch(/^comment_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^comment_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('createComment', () => {
    it('should create a new comment with required fields', () => {
      const comment = createComment('task1', 'Test comment', 'Test User');
      
      expect(comment.id).toMatch(/^comment_\d+_[a-z0-9]+$/);
      expect(comment.taskId).toBe('task1');
      expect(comment.content).toBe('Test comment');
      expect(comment.author).toBe('Test User');
      expect(comment.createdAt).toBeDefined();
      expect(comment.updatedAt).toBeUndefined();
    });

    it('should use default author when not provided', () => {
      const comment = createComment('task1', 'Test comment');
      expect(comment.author).toBe('Current User');
    });

    it('should trim whitespace from content', () => {
      const comment = createComment('task1', '  Test comment  ');
      expect(comment.content).toBe('Test comment');
    });
  });

  describe('updateComment', () => {
    it('should update comment content and add updatedAt timestamp', () => {
      const originalComment = mockComments[0];
      const updatedComment = updateComment(originalComment, 'Updated content');
      
      expect(updatedComment.id).toBe(originalComment.id);
      expect(updatedComment.taskId).toBe(originalComment.taskId);
      expect(updatedComment.author).toBe(originalComment.author);
      expect(updatedComment.createdAt).toBe(originalComment.createdAt);
      expect(updatedComment.content).toBe('Updated content');
      expect(updatedComment.updatedAt).toBeDefined();
    });
  });

  describe('sortCommentsByDate', () => {
    it('should sort comments by date in descending order by default', () => {
      const sorted = sortCommentsByDate(mockComments);
      
      expect(sorted[0].id).toBe('comment3');
      expect(sorted[1].id).toBe('comment2');
      expect(sorted[2].id).toBe('comment1');
    });

    it('should sort comments by date in ascending order when specified', () => {
      const sorted = sortCommentsByDate(mockComments, 'asc');
      
      expect(sorted[0].id).toBe('comment1');
      expect(sorted[1].id).toBe('comment2');
      expect(sorted[2].id).toBe('comment3');
    });
  });

  describe('getCommentsForTask', () => {
    it('should return only comments for the specified task', () => {
      const task1Comments = getCommentsForTask(mockComments, 'task1');
      const task2Comments = getCommentsForTask(mockComments, 'task2');
      
      expect(task1Comments).toHaveLength(2);
      expect(task1Comments.every(c => c.taskId === 'task1')).toBe(true);
      
      expect(task2Comments).toHaveLength(1);
      expect(task2Comments[0].taskId).toBe('task2');
    });

    it('should return empty array for non-existent task', () => {
      const comments = getCommentsForTask(mockComments, 'nonexistent');
      expect(comments).toHaveLength(0);
    });
  });

  describe('validateCommentContent', () => {
    it('should validate valid comment content', () => {
      const result = validateCommentContent('Valid comment');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty content', () => {
      const result = validateCommentContent('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment cannot be empty');
    });

    it('should reject content that is too short', () => {
      const result = validateCommentContent('a');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment must be at least 2 characters long');
    });

    it('should reject content that is too long', () => {
      const longContent = 'a'.repeat(501);
      const result = validateCommentContent(longContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment cannot exceed 500 characters');
    });

    it('should reject content with script tags', () => {
      const result = validateCommentContent('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment contains invalid content');
    });

    it('should reject content with javascript protocol', () => {
      const result = validateCommentContent('javascript:alert("xss")');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment contains invalid content');
    });

    it('should reject content with event handlers', () => {
      const result = validateCommentContent('onclick="alert(1)"');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment contains invalid content');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format recent timestamps correctly', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      
      expect(formatRelativeTime(now.toISOString())).toBe('Just now');
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1m ago');
      expect(formatRelativeTime(oneHourAgo)).toBe('1h ago');
      expect(formatRelativeTime(oneDayAgo)).toBe('1d ago');
    });
  });
});  desc
ribe('sanitizeCommentContent', () => {
    it('should sanitize HTML characters', () => {
      const input = '<script>alert("test")</script>';
      const result = sanitizeCommentContent(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;test&quot;)&lt;&#x2F;script&gt;');
    });

    it('should sanitize quotes and apostrophes', () => {
      const input = `He said "Hello" and she said 'Hi'`;
      const result = sanitizeCommentContent(input);
      expect(result).toBe('He said &quot;Hello&quot; and she said &#x27;Hi&#x27;');
    });
  });

  describe('canEditComment', () => {
    it('should allow editing within time limit', () => {
      const recentComment: TaskComment = {
        id: 'comment1',
        taskId: 'task1',
        content: 'Recent comment',
        author: 'User 1',
        createdAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      };
      
      expect(canEditComment(recentComment, 300000)).toBe(true); // 5 minute limit
    });

    it('should not allow editing after time limit', () => {
      const oldComment: TaskComment = {
        id: 'comment1',
        taskId: 'task1',
        content: 'Old comment',
        author: 'User 1',
        createdAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
      };
      
      expect(canEditComment(oldComment, 300000)).toBe(false); // 5 minute limit
    });
  });

  describe('getCommentStats', () => {
    it('should return correct statistics', () => {
      const stats = getCommentStats(mockComments);
      
      expect(stats.total).toBe(3);
      expect(stats.authors).toEqual(['User 1', 'User 2']);
      expect(stats.lastActivity).toBe('2024-01-01T12:00:00Z');
    });

    it('should handle empty comments array', () => {
      const stats = getCommentStats([]);
      
      expect(stats.total).toBe(0);
      expect(stats.authors).toEqual([]);
      expect(stats.lastActivity).toBeNull();
    });
  });