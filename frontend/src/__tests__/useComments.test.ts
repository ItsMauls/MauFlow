import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComments } from '@/hooks/useComments';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useComments Hook', () => {
  const taskId = 'test-task-1';
  const mockComments = [
    {
      id: 'comment1',
      taskId: 'test-task-1',
      content: 'First comment',
      author: 'User 1',
      createdAt: '2024-01-01T10:00:00Z',
    },
    {
      id: 'comment2',
      taskId: 'test-task-1',
      content: 'Second comment',
      author: 'User 2',
      createdAt: '2024-01-01T11:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockComments));
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('initialization', () => {
    it('should load comments from localStorage on mount', async () => {
      const { result } = renderHook(() => useComments(taskId));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(2);
      expect(result.current.error).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('mauflow_comments');
    });

    it('should handle empty localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useComments(taskId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });

    it('should handle localStorage parsing errors', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useComments(taskId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(0);
      expect(result.current.error).toBe('Failed to load comments');
    });
  });

  describe('addComment', () => {
    it('should add a comment with optimistic updates', async () => {
      const { result } = renderHook(() => useComments(taskId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addComment(taskId, 'New comment');
      });

      expect(result.current.comments).toHaveLength(3);
      expect(result.current.comments[0].content).toBe('New comment');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should validate comment content', async () => {
      const { result } = renderHook(() => useComments(taskId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.addComment(taskId, '');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe('Comment cannot be empty');
    });

    it('should handle localStorage save errors with retry', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const { result } = renderHook(() => useComments(taskId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.addComment(taskId, 'New comment');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe('Failed to save comments');
    });
  });

  describe('editComment', () => {
    it('should edit a comment with optimistic updates', async () => {
      const { result } = renderHook(() => useComments(taskId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.editComment('comment1', 'Updated comment');
      });

      const updatedComment = result.current.comments.find(c => c.id === 'comment1');
      expect(updatedComment?.content).toBe('Updated comment');
      expect(updatedComment?.updatedAt).toBeDefined();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle non-existent comment', async () => {
      const { result } = renderHook(() => useComments(taskId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.editComment('non-existent', 'Updated comment');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe('Comment not found');
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment with optimistic updates', async () => {
      const { result } = renderHook(() => useComments(taskId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteComment('comment1');
      });

      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments.find(c => c.id === 'comment1')).toBeUndefined();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle non-existent comment', async () => {
      const { result } = renderHook(() => useComments(taskId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.deleteComment('non-existent');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe('Comment not found');
    });
  });

  describe('error handling', () => {
    it('should clear errors', async () => {
      const { result } = renderHook(() => useComments(taskId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger an error
      await act(async () => {
        try {
          await result.current.addComment(taskId, '');
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.error).toBeTruthy();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('refetch', () => {
    it('should reload comments from localStorage', async () => {
      const { result } = renderHook(() => useComments(taskId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update localStorage mock
      const newComments = [...mockComments, {
        id: 'comment3',
        taskId: 'test-task-1',
        content: 'Third comment',
        author: 'User 3',
        createdAt: '2024-01-01T12:00:00Z',
      }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(newComments));

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.comments).toHaveLength(3);
      });
    });
  });
});