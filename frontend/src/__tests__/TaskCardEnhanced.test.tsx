import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskCardEnhanced } from '@/components/tasks/TaskCardEnhanced';
import { Task } from '@/components/tasks/TaskCard';
import { useComments } from '@/hooks/useComments';
import { useAttachments } from '@/hooks/useAttachments';

// Mock the hooks
jest.mock('@/hooks/useComments');
jest.mock('@/hooks/useAttachments');

const mockUseComments = useComments as jest.MockedFunction<typeof useComments>;
const mockUseAttachments = useAttachments as jest.MockedFunction<typeof useAttachments>;

describe('TaskCardEnhanced', () => {
  const mockTask: Task = {
    id: 'test-task-1',
    title: 'Test Task',
    description: 'Test task description',
    status: 'todo',
    priority: 'medium',
    createdAt: '2024-01-01T00:00:00Z',
    projectId: 'project-1'
  };

  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseComments.mockReturnValue({
      comments: [],
      isLoading: false,
      error: null,
      addComment: jest.fn(),
      editComment: jest.fn(),
      deleteComment: jest.fn(),
      clearError: jest.fn()
    });

    mockUseAttachments.mockReturnValue({
      attachments: [],
      isLoading: false,
      error: null,
      addAttachment: jest.fn(),
      removeAttachment: jest.fn(),
      downloadAttachment: jest.fn()
    });
  });

  it('renders the basic task card', () => {
    render(
      <TaskCardEnhanced
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test task description')).toBeInTheDocument();
  });

  it('shows visual indicators when task has comments', () => {
    const mockComments = [
      {
        id: 'comment-1',
        taskId: 'test-task-1',
        content: 'Test comment',
        author: 'John Doe',
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];

    mockUseComments.mockReturnValue({
      comments: mockComments,
      isLoading: false,
      error: null,
      addComment: jest.fn(),
      editComment: jest.fn(),
      deleteComment: jest.fn(),
      clearError: jest.fn()
    });

    render(
      <TaskCardEnhanced
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Should show comment indicator badge
    expect(screen.getByTitle('1 comment')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows visual indicators when task has attachments', () => {
    const mockAttachments = [
      {
        id: 'attachment-1',
        taskId: 'test-task-1',
        fileName: 'test.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        uploadedAt: '2024-01-01T00:00:00Z',
        downloadUrl: 'http://example.com/test.pdf'
      }
    ];

    mockUseAttachments.mockReturnValue({
      attachments: mockAttachments,
      isLoading: false,
      error: null,
      addAttachment: jest.fn(),
      removeAttachment: jest.fn(),
      downloadAttachment: jest.fn()
    });

    render(
      <TaskCardEnhanced
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Should show attachment indicator badge
    expect(screen.getByTitle('1 attachment')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('expands comments section when clicked', async () => {
    render(
      <TaskCardEnhanced
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const commentsButton = screen.getByRole('button', { name: /comments/i });
    fireEvent.click(commentsButton);

    // Should show expanded comments section
    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
    });
  });

  it('expands attachments section when clicked', async () => {
    render(
      <TaskCardEnhanced
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const attachmentsButton = screen.getByRole('button', { name: /attachments/i });
    fireEvent.click(attachmentsButton);

    // Should show expanded attachments section
    await waitFor(() => {
      expect(screen.getByText('Attachments')).toBeInTheDocument();
    });
  });

  it('shows expand all button when both sections are collapsed and have content', () => {
    const mockComments = [
      {
        id: 'comment-1',
        taskId: 'test-task-1',
        content: 'Test comment',
        author: 'John Doe',
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];

    const mockAttachments = [
      {
        id: 'attachment-1',
        taskId: 'test-task-1',
        fileName: 'test.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        uploadedAt: '2024-01-01T00:00:00Z',
        downloadUrl: 'http://example.com/test.pdf'
      }
    ];

    mockUseComments.mockReturnValue({
      comments: mockComments,
      isLoading: false,
      error: null,
      addComment: jest.fn(),
      editComment: jest.fn(),
      deleteComment: jest.fn(),
      clearError: jest.fn()
    });

    mockUseAttachments.mockReturnValue({
      attachments: mockAttachments,
      isLoading: false,
      error: null,
      addAttachment: jest.fn(),
      removeAttachment: jest.fn(),
      downloadAttachment: jest.fn()
    });

    render(
      <TaskCardEnhanced
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Expand all')).toBeInTheDocument();
  });

  it('can be used without enhanced features', () => {
    render(
      <TaskCardEnhanced
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        showEnhancements={false}
      />
    );

    // Should only show the basic task card
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText('Comments')).not.toBeInTheDocument();
    expect(screen.queryByText('Attachments')).not.toBeInTheDocument();
  });

  it('handles loading states correctly', () => {
    mockUseComments.mockReturnValue({
      comments: [],
      isLoading: true,
      error: null,
      addComment: jest.fn(),
      editComment: jest.fn(),
      deleteComment: jest.fn(),
      clearError: jest.fn()
    });

    mockUseAttachments.mockReturnValue({
      attachments: [],
      isLoading: true,
      error: null,
      addAttachment: jest.fn(),
      removeAttachment: jest.fn(),
      downloadAttachment: jest.fn()
    });

    render(
      <TaskCardEnhanced
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Should show loading indicators
    const loadingSpinners = screen.getAllByRole('status', { hidden: true });
    expect(loadingSpinners.length).toBeGreaterThan(0);
  });

  it('displays attachment error messages', () => {
    mockUseAttachments.mockReturnValue({
      attachments: [],
      isLoading: false,
      error: 'Failed to load attachments',
      addAttachment: jest.fn(),
      removeAttachment: jest.fn(),
      downloadAttachment: jest.fn()
    });

    render(
      <TaskCardEnhanced
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Expand attachments to see error
    const attachmentsButton = screen.getByRole('button', { name: /attachments/i });
    fireEvent.click(attachmentsButton);

    expect(screen.getByText('Failed to load attachments')).toBeInTheDocument();
  });

  it('shows correct file size formatting in preview', () => {
    const mockAttachments = [
      {
        id: 'attachment-1',
        taskId: 'test-task-1',
        fileName: 'small.txt',
        fileSize: 512, // 512 bytes
        fileType: 'text/plain',
        uploadedAt: '2024-01-01T00:00:00Z',
        downloadUrl: 'http://example.com/small.txt'
      },
      {
        id: 'attachment-2',
        taskId: 'test-task-1',
        fileName: 'large.pdf',
        fileSize: 2 * 1024 * 1024, // 2MB
        fileType: 'application/pdf',
        uploadedAt: '2024-01-01T00:00:00Z',
        downloadUrl: 'http://example.com/large.pdf'
      }
    ];

    mockUseAttachments.mockReturnValue({
      attachments: mockAttachments,
      isLoading: false,
      error: null,
      addAttachment: jest.fn(),
      removeAttachment: jest.fn(),
      downloadAttachment: jest.fn()
    });

    render(
      <TaskCardEnhanced
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Should show MB formatting for large files
    expect(screen.getByText('2.0MB')).toBeInTheDocument();
  });
});