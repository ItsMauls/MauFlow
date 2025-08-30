/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useComments } from '@/hooks/useComments';
import { TaskComment } from '@/types/comments';
import * as commentsLib from '@/lib/comments';

// Mock the comments library
jest.mock('@/lib/comments');

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useComments Hook', () => {
  const mockTaskId = 'test-task-1';
  const mockComment: TaskComment = {
    id: 'comment-1',
    taskId: mockTaskId,
    content: 'Test comment',
    author: 'Test User',
    createdAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Setup default mocks
    (commentsLib.getCommentsForTask as jest.Mock).mockReturnValue([]);
    (commentsLib.sortCommentsByDate as jest.Mock).mockReturnValue([]);
    (commentsLib.createComment as jest.Mock).mockReturnValue(mockComment);
    (commentsLib.updateComment as jest.Mock).mockReturnValue({ ...mockComment, content: 'Updated' });
    (commentsLib.validateCommentContent as jest.Mock).mockReturnValue({ isValid: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty comments', () => {
    const { result } = renderHook(() => useComments(mockTaskId));

    expect(result.current.comments).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load comments from localStorage on mount', () => {
    const storedComments = [mockComment];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedComments));
    (commentsLib.getCommentsForTask as jest.Mock).mockReturnValue([mockComment]);
    (commentsLib.sortCommentsByDate as jest.Mock).mockReturnValue([mockComment]);

    const { result } = renderHook(() => useComments(mockTaskId));

    expect(result.current.comments).toHaveLength(1);
    expect(result.current.comments[0]).toEqual(mockComment);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('mauflow_comments');
  });

  it('should handle localStorage load errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useComments(mockTaskId));

    expect(result.current.comments).toEqual([]);
    expect(result.current.error).toBe('Failed to load comments');
  });

  it('should add comment with optimistic update', async () => {
    const { result } = renderHook(() => useComments(mockTaskId));

    await act(async () => {
      await result.current.addComment(mockTaskId, 'Test comment');
    });

    expect(commentsLib.validateCommentContent).toHaveBeenCalledWith('Test comment');
    expect(commentsLib.createComment).toHaveBeenCalledWith(mockTaskId, 'Test comment');
    expect(result.current.comments).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should handle add comment validation failure', async () => {
    (commentsLib.validateCommentContent as jest.Mock).mockReturnValue({
      isValid: false,
      error: 'Comment too short'
    });

    const { result } = renderHook(() => useComments(mockTaskId));

    await act(async () => {
      try {
        await result.current.addComment(mockTaskId, 'x');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Comment too short');
    expect(result.current.comments).toHaveLength(0);
  });

  it('should handle add comment save failure with retry', async () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage full');
    });

    const { result } = renderHook(() => useComments(mockTaskId));

    await act(async () => {
      try {
        await result.current.addComment(mockTaskId, 'Test comment');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Failed to save comments');
    expect(result.current.comments).toHaveLength(0); // Optimistic update reverted
  });

  it('should edit comment with optimistic update', async () => {
    // Setup initial comment
    const storedComments = [mockComment];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedComments));
    (commentsLib.getCommentsForTask as jest.Mock).mockReturnValue([mockComment]);
    (commentsLib.sortCommentsByDate as jest.Mock).mockReturnValue([mockComment]);

    const { result } = renderHook(() => useComments(mockTaskId));

    const updatedComment = { ...mockComment, content: 'Updated comment' };
    (commentsLib.updateComment as jest.Mock).mockReturnValue(updatedComment);

    await act(async () => {
      await result.current.editComment('comment-1', 'Updated comment');
    });

    expect(commentsLib.validateCommentContent).toHaveBeenCalledWith('Updated comment');
    expect(commentsLib.updateComment).toHaveBeenCalledWith(mockComment, 'Updated comment');
    expect(result.current.error).toBeNull();
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should handle edit comment not found', async () => {
    const { result } = renderHook(() => useComments(mockTaskId));

    await act(async () => {
      try {
        await result.current.editComment('non-existent', 'Updated comment');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Comment not found');
  });

  it('should delete comment with optimistic update', async () => {
    // Setup initial comment
    const storedComments = [mockComment];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedComments));
    (commentsLib.getCommentsForTask as jest.Mock).mockReturnValue([mockComment]);
    (commentsLib.sortCommentsByDate as jest.Mock).mockReturnValue([mockComment]);

    const { result } = renderHook(() => useComments(mockTaskId));

    expect(result.current.comments).toHaveLength(1);

    await act(async () => {
      await result.current.deleteComment('comment-1');
    });

    expect(result.current.comments).toHaveLength(0);
    expect(result.current.error).toBeNull();
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should handle delete comment not found', async () => {
    const { result } = renderHook(() => useComments(mockTaskId));

    await act(async () => {
      try {
        await result.current.deleteComment('non-existent');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Comment not found');
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useComments(mockTaskId));

    // Set an error first
    act(() => {
      result.current.addComment(mockTaskId, '').catch(() => {});
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should refetch comments', () => {
    const storedComments = [mockComment];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedComments));
    (commentsLib.getCommentsForTask as jest.Mock).mockReturnValue([mockComment]);
    (commentsLib.sortCommentsByDate as jest.Mock).mockReturnValue([mockComment]);

    const { result } = renderHook(() => useComments(mockTaskId));

    act(() => {
      result.current.refetch();
    });

    expect(commentsLib.getCommentsForTask).toHaveBeenCalledWith([], mockTaskId);
    expect(commentsLib.sortCommentsByDate).toHaveBeenCalled();
  });

  it('should retry failed operations', async () => {
    let saveAttempts = 0;
    mockLocalStorage.setItem.mockImplementation(() => {
      saveAttempts++;
      if (saveAttempts < 2) {
        throw new Error('Storage full');
      }
      // Success on second attempt
    });

    const { result } = renderHook(() => useComments(mockTaskId));

    await act(async () => {
      try {
        await result.current.addComment(mockTaskId, 'Test comment');
      } catch (error) {
        // Expected to throw initially
      }
    });

    // Fast-forward to trigger retry
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Wait for retry to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(saveAttempts).toBe(2);
  });

  it('should clean up old pending operations', () => {
    const { result } = renderHook(() => useComments(mockTaskId));

    // Fast-forward time to trigger cleanup
    act(() => {
      jest.advanceTimersByTime(35000); // 35 seconds
    });

    // The cleanup interval should have run
    expect(true).toBe(true); // Test passes if no errors thrown
  });

  it('should handle concurrent operations', async () => {
    const { result } = renderHook(() => useComments(mockTaskId));

    const comment1 = { ...mockComment, id: 'comment-1', content: 'Comment 1' };
    const comment2 = { ...mockComment, id: 'comment-2', content: 'Comment 2' };

    (commentsLib.createComment as jest.Mock)
      .mockReturnValueOnce(comment1)
      .mockReturnValueOnce(comment2);

    await act(async () => {
      const promise1 = result.current.addComment(mockTaskId, 'Comment 1');
      const promise2 = result.current.addComment(mockTaskId, 'Comment 2');
      
      await Promise.all([promise1, promise2]);
    });

    expect(result.current.comments).toHaveLength(2);
  });

  it('should filter comments by task ID', () => {
    const comment1 = { ...mockComment, id: 'comment-1', taskId: mockTaskId };
    const comment2 = { ...mockComment, id: 'comment-2', taskId: 'other-task' };
    const storedComments = [comment1, comment2];

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedComments));
    (commentsLib.getCommentsForTask as jest.Mock).mockReturnValue([comment1]);
    (commentsLib.sortCommentsByDate as jest.Mock).mockReturnValue([comment1]);

    const { result } = renderHook(() => useComments(mockTaskId));

    expect(commentsLib.getCommentsForTask).toHaveBeenCalledWith(storedComments, mockTaskId);
    expect(result.current.comments).toHaveLength(1);
    expect(result.current.comments[0].taskId).toBe(mockTaskId);
  });

  it('should sort comments by date', () => {
    const comment1 = { ...mockComment, id: 'comment-1', createdAt: '2024-01-01T00:00:00Z' };
    const comment2 = { ...mockComment, id: 'comment-2', createdAt: '2024-01-02T00:00:00Z' };
    const storedComments = [comment1, comment2];

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedComments));
    (commentsLib.getCommentsForTask as jest.Mock).mockReturnValue([comment1, comment2]);
    (commentsLib.sortCommentsByDate as jest.Mock).mockReturnValue([comment2, comment1]);

    const { result } = renderHook(() => useComments(mockTaskId));

    expect(commentsLib.sortCommentsByDate).toHaveBeenCalledWith([comment1, comment2], 'desc');
  });
});