/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskCardWithComments } from '@/components/tasks/TaskCardWithComments';
import { EnhancedTaskCard } from '@/components/tasks/EnhancedTaskCard';
import { Task } from '@/components/tasks/TaskCard';
import { TaskComment } from '@/types/comments';
import { TaskAttachment } from '@/types/attachments';

// Mock hooks
jest.mock('@/hooks/useComments');
jest.mock('@/hooks/useAttachments');

const mockUseComments = require('@/hooks/useComments');
const mockUseAttachments = require('@/hooks/useAttachments');

// Mock file upload
Object.defineProperty(global, 'File', {
  value: class MockFile {
    constructor(public parts: any[], public name: string, public options: any = {}) {
      this.type = options.type || '';
      this.size = parts.reduce((acc, part) => acc + part.length, 0);
    }
    type: string;
    size: number;
  }
});

// Mock URL.createObjectURL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn()
  }
});

// Mock data
const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  status: 'todo',
  priority: 'high',
  createdAt: '2024-01-01T00:00:00Z',
  description: 'A test task for integration testing'
};

const mockComments: TaskComment[] = [
  {
    id: 'comment-1',
    taskId: 'task-1',
    content: 'First comment',
    author: 'User 1',
    createdAt: '2024-01-01T10:00:00Z'
  },
  {
    id: 'comment-2',
    taskId: 'task-1',
    content: 'Second comment',
    author: 'User 2',
    createdAt: '2024-01-01T11:00:00Z'
  }
];

const mockAttachments: TaskAttachment[] = [
  {
    id: 'att-1',
    taskId: 'task-1',
    fileName: 'document.pdf',
    fileSize: 1024000,
    fileType: 'application/pdf',
    uploadedAt: '2024-01-01T09:00:00Z',
    downloadUrl: 'https://example.com/document.pdf',
    isSecure: false,
    downloadCount: 0
  },
  {
    id: 'att-2',
    taskId: 'task-1',
    fileName: 'image.jpg',
    fileSize: 512000,
    fileType: 'image/jpeg',
    uploadedAt: '2024-01-01T09:30:00Z',
    downloadUrl: 'https://example.com/image.jpg',
    previewUrl: 'https://example.com/image-preview.jpg',
    isSecure: false,
    downloadCount: 2
  }
];

describe('Task Enhancement Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockUseComments.useComments.mockReturnValue({
      comments: mockComments,
      isLoading: false,
      error: null,
      addComment: jest.fn().mockResolvedValue(undefined),
      editComment: jest.fn().mockResolvedValue(undefined),
      deleteComment: jest.fn().mockResolvedValue(undefined),
      clearError: jest.fn(),
      refetch: jest.fn()
    });

    mockUseAttachments.useAttachments.mockReturnValue({
      attachments: mockAttachments,
      addAttachment: jest.fn().mockResolvedValue(undefined),
      removeAttachment: jest.fn().mockResolvedValue(undefined),
      downloadAttachment: jest.fn().mockResolvedValue(undefined),
      isLoading: false,
      error: null
    });
  });

  it('should display task with comments and attachments', () => {
    render(<EnhancedTaskCard task={mockTask} />);

    // Task basic info
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('A test task for integration testing')).toBeInTheDocument();

    // Comments section
    expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('Second comment')).toBeInTheDocument();

    // Attachments section
    expect(screen.getByText('Attachments (2)')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
  });

  it('should handle comment addition workflow', async () => {
    const mockAddComment = jest.fn().mockResolvedValue(undefined);
    mockUseComments.useComments.mockReturnValue({
      ...mockUseComments.useComments(),
      addComment: mockAddComment
    });

    render(<EnhancedTaskCard task={mockTask} />);

    // Find comment input
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    const submitButton = screen.getByText('Submit');

    // Type comment
    fireEvent.change(commentInput, { target: { value: 'New test comment' } });
    
    // Submit comment
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAddComment).toHaveBeenCalledWith('task-1', 'New test comment');
    });
  });

  it('should handle comment editing workflow', async () => {
    const mockEditComment = jest.fn().mockResolvedValue(undefined);
    mockUseComments.useComments.mockReturnValue({
      ...mockUseComments.useComments(),
      editComment: mockEditComment
    });

    render(<EnhancedTaskCard task={mockTask} />);

    // Find edit button for first comment
    const editButtons = screen.getAllByLabelText('Edit comment');
    fireEvent.click(editButtons[0]);

    // Should show edit input
    const editInput = screen.getByDisplayValue('First comment');
    fireEvent.change(editInput, { target: { value: 'Edited first comment' } });

    // Save edit
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockEditComment).toHaveBeenCalledWith('comment-1', 'Edited first comment');
    });
  });

  it('should handle comment deletion workflow', async () => {
    const mockDeleteComment = jest.fn().mockResolvedValue(undefined);
    mockUseComments.useComments.mockReturnValue({
      ...mockUseComments.useComments(),
      deleteComment: mockDeleteComment
    });

    render(<EnhancedTaskCard task={mockTask} />);

    // Find delete button for first comment
    const deleteButtons = screen.getAllByLabelText('Delete comment');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteComment).toHaveBeenCalledWith('comment-1');
    });
  });

  it('should handle file upload workflow', async () => {
    const mockAddAttachment = jest.fn().mockResolvedValue(undefined);
    mockUseAttachments.useAttachments.mockReturnValue({
      ...mockUseAttachments.useAttachments(),
      addAttachment: mockAddAttachment
    });

    render(<EnhancedTaskCard task={mockTask} />);

    // Find file upload area
    const uploadArea = screen.getByText('Drop files here or click to browse');
    const fileInput = screen.getByLabelText('File upload');

    // Create mock file
    const mockFile = new File(['file content'], 'test.txt', { type: 'text/plain' });

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(mockAddAttachment).toHaveBeenCalledWith('task-1', mockFile);
    });
  });

  it('should handle file download workflow', async () => {
    const mockDownloadAttachment = jest.fn().mockResolvedValue(undefined);
    mockUseAttachments.useAttachments.mockReturnValue({
      ...mockUseAttachments.useAttachments(),
      downloadAttachment: mockDownloadAttachment
    });

    render(<EnhancedTaskCard task={mockTask} />);

    // Find download button for first attachment
    const downloadButtons = screen.getAllByLabelText('Download');
    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(mockDownloadAttachment).toHaveBeenCalledWith(mockAttachments[0]);
    });
  });

  it('should handle file removal workflow', async () => {
    const mockRemoveAttachment = jest.fn().mockResolvedValue(undefined);
    mockUseAttachments.useAttachments.mockReturnValue({
      ...mockUseAttachments.useAttachments(),
      removeAttachment: mockRemoveAttachment
    });

    render(<EnhancedTaskCard task={mockTask} />);

    // Find remove button for first attachment
    const removeButtons = screen.getAllByLabelText('Remove');
    fireEvent.click(removeButtons[0]);

    // Confirm removal
    const confirmButton = screen.getByText('Remove');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockRemoveAttachment).toHaveBeenCalledWith('att-1');
    });
  });

  it('should handle drag and drop file upload', async () => {
    const mockAddAttachment = jest.fn().mockResolvedValue(undefined);
    mockUseAttachments.useAttachments.mockReturnValue({
      ...mockUseAttachments.useAttachments(),
      addAttachment: mockAddAttachment
    });

    render(<EnhancedTaskCard task={mockTask} />);

    const uploadArea = screen.getByText('Drop files here or click to browse');
    const mockFile = new File(['content'], 'dropped.txt', { type: 'text/plain' });

    // Simulate drag and drop
    fireEvent.dragEnter(uploadArea);
    fireEvent.dragOver(uploadArea);
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [mockFile]
      }
    });

    await waitFor(() => {
      expect(mockAddAttachment).toHaveBeenCalledWith('task-1', mockFile);
    });
  });

  it('should show loading states during operations', async () => {
    mockUseComments.useComments.mockReturnValue({
      ...mockUseComments.useComments(),
      isLoading: true
    });

    mockUseAttachments.useAttachments.mockReturnValue({
      ...mockUseAttachments.useAttachments(),
      isLoading: true
    });

    render(<EnhancedTaskCard task={mockTask} />);

    expect(screen.getByText('Loading comments...')).toBeInTheDocument();
    expect(screen.getByText('Loading attachments...')).toBeInTheDocument();
  });

  it('should handle error states gracefully', () => {
    mockUseComments.useComments.mockReturnValue({
      ...mockUseComments.useComments(),
      error: 'Failed to load comments'
    });

    mockUseAttachments.useAttachments.mockReturnValue({
      ...mockUseAttachments.useAttachments(),
      error: 'Failed to load attachments'
    });

    render(<EnhancedTaskCard task={mockTask} />);

    expect(screen.getByText('Failed to load comments')).toBeInTheDocument();
    expect(screen.getByText('Failed to load attachments')).toBeInTheDocument();
    expect(screen.getAllByText('Try Again')).toHaveLength(2);
  });

  it('should handle retry operations', async () => {
    const mockRefetch = jest.fn();
    const mockClearError = jest.fn();

    mockUseComments.useComments.mockReturnValue({
      ...mockUseComments.useComments(),
      error: 'Failed to load comments',
      refetch: mockRefetch,
      clearError: mockClearError
    });

    render(<EnhancedTaskCard task={mockTask} />);

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    expect(mockClearError).toHaveBeenCalled();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle expandable sections', () => {
    render(<EnhancedTaskCard task={mockTask} />);

    // Comments section should be expandable
    const commentsHeader = screen.getByText('Comments (2)');
    fireEvent.click(commentsHeader);

    // Should toggle visibility
    expect(screen.queryByText('First comment')).not.toBeInTheDocument();

    // Click again to expand
    fireEvent.click(commentsHeader);
    expect(screen.getByText('First comment')).toBeInTheDocument();
  });

  it('should show visual indicators for tasks with enhancements', () => {
    render(<EnhancedTaskCard task={mockTask} />);

    // Should show comment indicator
    expect(screen.getByTestId('comment-indicator')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Comment count

    // Should show attachment indicator
    expect(screen.getByTestId('attachment-indicator')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Attachment count
  });

  it('should handle file preview functionality', async () => {
    render(<EnhancedTaskCard task={mockTask} />);

    // Find preview button for image attachment
    const previewButtons = screen.getAllByLabelText('Preview');
    fireEvent.click(previewButtons[1]); // Image attachment

    await waitFor(() => {
      expect(screen.getByTestId('file-preview-modal')).toBeInTheDocument();
      expect(screen.getByAltText('image.jpg')).toBeInTheDocument();
    });

    // Close preview
    const closeButton = screen.getByLabelText('Close preview');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('file-preview-modal')).not.toBeInTheDocument();
    });
  });

  it('should validate file uploads', async () => {
    const mockAddAttachment = jest.fn().mockRejectedValue(new Error('File too large'));
    mockUseAttachments.useAttachments.mockReturnValue({
      ...mockUseAttachments.useAttachments(),
      addAttachment: mockAddAttachment,
      error: 'File too large'
    });

    render(<EnhancedTaskCard task={mockTask} />);

    const fileInput = screen.getByLabelText('File upload');
    const largeFile = new File(['x'.repeat(10000000)], 'large.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText('File too large')).toBeInTheDocument();
    });
  });

  it('should handle optimistic updates', async () => {
    const mockAddComment = jest.fn().mockImplementation(async () => {
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    mockUseComments.useComments.mockReturnValue({
      ...mockUseComments.useComments(),
      addComment: mockAddComment
    });

    render(<EnhancedTaskCard task={mockTask} />);

    const commentInput = screen.getByPlaceholderText('Add a comment...');
    const submitButton = screen.getByText('Submit');

    fireEvent.change(commentInput, { target: { value: 'Optimistic comment' } });
    fireEvent.click(submitButton);

    // Should show optimistic update immediately
    expect(screen.getByText('Optimistic comment')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockAddComment).toHaveBeenCalled();
    });
  });
});