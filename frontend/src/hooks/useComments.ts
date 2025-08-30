'use client';

import { useState, useEffect, useCallback } from 'react';
import { TaskComment } from '@/types/comments';
import { 
  createComment, 
  updateComment, 
  validateCommentContent,
  sortCommentsByDate,
  getCommentsForTask 
} from '@/lib/comments';
import { currentUser } from '@/lib/mockData';

interface UseCommentsReturn {
  comments: TaskComment[];
  isLoading: boolean;
  error: string | null;
  addComment: (taskId: string, content: string, mentions?: string[]) => Promise<void>;
  editComment: (commentId: string, content: string, mentions?: string[]) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  clearError: () => void;
  refetch: () => void;
}

interface CommentOperation {
  type: 'add' | 'edit' | 'delete';
  commentId?: string;
  taskId?: string;
  content?: string;
  mentions?: string[];
  timestamp: number;
}

const STORAGE_KEY = 'mauflow_comments';
const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

/**
 * Custom hook for managing task comments with persistence and optimistic updates
 */
export const useComments = (taskId: string): UseCommentsReturn => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingOperations, setPendingOperations] = useState<CommentOperation[]>([]);

  // Load comments from localStorage
  const loadComments = useCallback(() => {
    try {
      setIsLoading(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      const allComments: TaskComment[] = stored ? JSON.parse(stored) : [];
      const taskComments = getCommentsForTask(allComments, taskId);
      const sortedComments = sortCommentsByDate(taskComments, 'desc');
      setComments(sortedComments);
      setError(null);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Failed to load comments');
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  // Save comments to localStorage
  const saveComments = useCallback(async (updatedComments: TaskComment[]) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allComments: TaskComment[] = stored ? JSON.parse(stored) : [];
      
      // Remove existing comments for this task
      const otherComments = allComments.filter(comment => comment.taskId !== taskId);
      
      // Add updated comments for this task
      const newAllComments = [...otherComments, ...updatedComments];
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAllComments));
      return true;
    } catch (err) {
      console.error('Failed to save comments:', err);
      throw new Error('Failed to save comments');
    }
  }, [taskId]);

  // Retry failed operations
  const retryOperation = useCallback(async (operation: CommentOperation, retryCount = 0): Promise<void> => {
    if (retryCount >= MAX_RETRIES) {
      throw new Error(`Failed to ${operation.type} comment after ${MAX_RETRIES} retries`);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      
      // Re-execute the operation
      switch (operation.type) {
        case 'add':
          if (operation.taskId && operation.content) {
            await addCommentInternal(operation.taskId, operation.content, operation.mentions, false);
          }
          break;
        case 'edit':
          if (operation.commentId && operation.content) {
            await editCommentInternal(operation.commentId, operation.content, operation.mentions, false);
          }
          break;
        case 'delete':
          if (operation.commentId) {
            await deleteCommentInternal(operation.commentId, false);
          }
          break;
      }
    } catch (err) {
      await retryOperation(operation, retryCount + 1);
    }
  }, []);

  // Internal add comment function
  const addCommentInternal = useCallback(async (
    taskId: string, 
    content: string, 
    mentions: string[] = [],
    optimistic = true
  ): Promise<void> => {
    const validation = validateCommentContent(content);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const newComment = createComment(taskId, content, currentUser.name, currentUser.id, mentions);

    if (optimistic) {
      // Optimistic update
      setComments(prev => [newComment, ...prev]);
    }

    try {
      const updatedComments = optimistic ? [newComment, ...comments] : comments;
      await saveComments(updatedComments);
      
      if (!optimistic) {
        // Update state after successful save
        setComments(prev => [newComment, ...prev]);
      }
    } catch (err) {
      if (optimistic) {
        // Revert optimistic update
        setComments(prev => prev.filter(c => c.id !== newComment.id));
      }
      
      // Add to pending operations for retry
      const operation: CommentOperation = {
        type: 'add',
        taskId,
        content,
        mentions,
        timestamp: Date.now()
      };
      setPendingOperations(prev => [...prev, operation]);
      
      // Retry in background
      setTimeout(() => retryOperation(operation), RETRY_DELAY);
      
      throw err;
    }
  }, [comments, saveComments, retryOperation]);

  // Internal edit comment function
  const editCommentInternal = useCallback(async (
    commentId: string, 
    content: string, 
    mentions: string[] = [],
    optimistic = true
  ): Promise<void> => {
    const validation = validateCommentContent(content);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const existingComment = comments.find(c => c.id === commentId);
    if (!existingComment) {
      throw new Error('Comment not found');
    }

    const updatedComment = updateComment(existingComment, content, mentions);
    let previousComments: TaskComment[] = [];

    if (optimistic) {
      // Store previous state for rollback
      previousComments = [...comments];
      
      // Optimistic update
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
    }

    try {
      const updatedComments = optimistic 
        ? comments.map(c => c.id === commentId ? updatedComment : c)
        : comments;
      await saveComments(updatedComments);
      
      if (!optimistic) {
        // Update state after successful save
        setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
      }
    } catch (err) {
      if (optimistic) {
        // Revert optimistic update
        setComments(previousComments);
      }
      
      // Add to pending operations for retry
      const operation: CommentOperation = {
        type: 'edit',
        commentId,
        content,
        mentions,
        timestamp: Date.now()
      };
      setPendingOperations(prev => [...prev, operation]);
      
      // Retry in background
      setTimeout(() => retryOperation(operation), RETRY_DELAY);
      
      throw err;
    }
  }, [comments, saveComments, retryOperation]);

  // Internal delete comment function
  const deleteCommentInternal = useCallback(async (
    commentId: string, 
    optimistic = true
  ): Promise<void> => {
    const existingComment = comments.find(c => c.id === commentId);
    if (!existingComment) {
      throw new Error('Comment not found');
    }

    let previousComments: TaskComment[] = [];

    if (optimistic) {
      // Store previous state for rollback
      previousComments = [...comments];
      
      // Optimistic update
      setComments(prev => prev.filter(c => c.id !== commentId));
    }

    try {
      const updatedComments = optimistic 
        ? comments.filter(c => c.id !== commentId)
        : comments;
      await saveComments(updatedComments);
      
      if (!optimistic) {
        // Update state after successful save
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      if (optimistic) {
        // Revert optimistic update
        setComments(previousComments);
      }
      
      // Add to pending operations for retry
      const operation: CommentOperation = {
        type: 'delete',
        commentId,
        timestamp: Date.now()
      };
      setPendingOperations(prev => [...prev, operation]);
      
      // Retry in background
      setTimeout(() => retryOperation(operation), RETRY_DELAY);
      
      throw err;
    }
  }, [comments, saveComments, retryOperation]);

  // Public API functions
  const addComment = useCallback(async (taskId: string, content: string, mentions: string[] = []): Promise<void> => {
    try {
      setError(null);
      await addCommentInternal(taskId, content, mentions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      setError(errorMessage);
      throw err;
    }
  }, [addCommentInternal]);

  const editComment = useCallback(async (commentId: string, content: string, mentions: string[] = []): Promise<void> => {
    try {
      setError(null);
      await editCommentInternal(commentId, content, mentions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit comment';
      setError(errorMessage);
      throw err;
    }
  }, [editCommentInternal]);

  const deleteComment = useCallback(async (commentId: string): Promise<void> => {
    try {
      setError(null);
      await deleteCommentInternal(commentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete comment';
      setError(errorMessage);
      throw err;
    }
  }, [deleteCommentInternal]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refetch = useCallback(() => {
    loadComments();
  }, [loadComments]);

  // Load comments on mount and when taskId changes
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Clean up old pending operations
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      setPendingOperations(prev => 
        prev.filter(op => now - op.timestamp < 60000) // Keep operations for 1 minute
      );
    };

    const interval = setInterval(cleanup, 30000); // Clean up every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return {
    comments,
    isLoading,
    error,
    addComment,
    editComment,
    deleteComment,
    clearError,
    refetch
  };
};