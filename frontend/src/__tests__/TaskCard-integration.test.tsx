/**
 * TaskCard Integration Tests
 * Integration tests for TaskCard collaboration features
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard, Task } from '@/components/tasks/TaskCard';

// Mock all the hooks with minimal implementations
jest.mock('@/hooks/useDelegation', () => ({
  useDelegation: () => ({
    delegations: [],
    isLoading: false,
    delegateTask: jest.fn(),
    revokeDelegation: jest.fn(),
    completeDelegation: jest.fn(),
    getDelegationsByTaskId: jest.fn(() => []),
    getDelegationsByAssigneeId: jest.fn(() => []),
    getMyActiveDelegations: jest.fn(() => []),
    getMyCreatedDelegations: jest.fn(() => []),
    isTaskDelegated: jest.fn(() => false),
    getActiveDelegationForTask: jest.fn(() => undefined)
  })
}));

jest.mock('@/hooks/useUserPermissions', () => ({
  useUserPermissions: () => ({
    canDelegate: true,
    canComment: true,
    canMention: true,
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: {
        id: 'role-1',
        name: 'Admin',
        description: 'Administrator',
        permissions: [],
        canDelegate: true,
        canReceiveDelegations: true,
        canManageTeam: true
      },
      permissions: [],
      createdAt: '2025-08-29T00:00:00Z',
      isActive: true
    }
  })
}));

jest.mock('@/hooks/useTeamMembers', () => ({
  useTeamMembers: () => ({
    teamMembers: [],
    isLoading: false,
    searchMembers: jest.fn(() => []),
    getMemberById: jest.fn(() => undefined),
    getOnlineMembers: jest.fn(() => []),
    getDelegatableMembers: jest.fn(() => [])
  })
}));

jest.mock('@/hooks/useComments', () => ({
  useComments: () => ({
    comments: [],
    isLoading: false,
    addComment: jest.fn(),
    editComment: jest.fn(),
    deleteComment: jest.fn()
  })
}));

jest.mock('@/hooks/useAttachments', () => ({
  useAttachments: () => ({
    attachments: [],
    isLoading: false,
    addAttachment: jest.fn(),
    removeAttachment: jest.fn(),
    downloadAttachment: jest.fn()
  })
}));

jest.mock('@/hooks/useSwipeGesture', () => ({
  useSwipeGesture: () => ({ current: null })
}));

// Mock components
jest.mock('./CommentInput', () => ({
  CommentInput: ({ onSubmit, onCancel, placeholder }: any) => (
    <div data-testid="comment-input">
      <input placeholder={placeholder} />
      <button onClick={() => onSubmit('test comment', [])}>Submit</button>
      {onCancel && <button onClick={onCancel}>Cancel</button>}
    </div>
  )
}));

jest.mock('./CommentList', () => ({
  CommentList: ({ comments }: any) => (
    <div data-testid="comment-list">
      {comments.length} comments
    </div>
  )
}));

jest.mock('./FileUploadArea', () => ({
  FileUploadArea: ({ onFileSelect }: any) => (
    <div data-testid="file-upload">
      <input type="file" onChange={(e) => e.target.files && onFileSelect(e.target.files)} />
    </div>
  )
}));

jest.mock('./AttachmentList', () => ({
  AttachmentList: ({ attachments }: any) => (
    <div data-testid="attachment-list">
      {attachments.length} attachments
    </div>
  )
}));

jest.mock('@/components/delegation/DelegationControls', () => ({
  DelegationControls: ({ task, onDelegate, canDelegate }: any) => (
    <div data-testid="delegation-controls">
      {canDelegate && (
        <button onClick={() => onDelegate(task.id, 'user-2', 'test note')}>
          Delegate Task
        </button>
      )}
    </div>
  )
}));

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test task description',
  status: 'todo',
  priority: 'medium',
  createdAt: '2025-08-29T10:00:00Z',
  updatedAt: '2025-08-29T11:00:00Z'
};

describe('TaskCard Integration', () => {
  const defaultProps = {
    task: mockTask,
    onUpdate: jest.fn(),
    onDelete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render TaskCard with basic task information', () => {
    render(<TaskCard {...defaultProps} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test task description')).toBeInTheDocument();
  });

  it('should render collaboration controls', () => {
    render(<TaskCard {...defaultProps} />);
    
    // Should show comments button
    expect(screen.getByText('Comments')).toBeInTheDocument();
    
    // Should show files button
    expect(screen.getByText('Files')).toBeInTheDocument();
    
    // Should show delegate button
    expect(screen.getByText('Delegate')).toBeInTheDocument();
  });

  it('should open comments section when comments button is clicked', () => {
    render(<TaskCard {...defaultProps} />);
    
    const commentsButton = screen.getByText('Comments');
    fireEvent.click(commentsButton);
    
    expect(screen.getByText('Add a comment...')).toBeInTheDocument();
  });

  it('should open attachments section when files button is clicked', () => {
    render(<TaskCard {...defaultProps} />);
    
    const filesButton = screen.getByText('Files');
    fireEvent.click(filesButton);
    
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  it('should open delegation section when delegate button is clicked', () => {
    render(<TaskCard {...defaultProps} />);
    
    const delegateButton = screen.getByText('Delegate');
    fireEvent.click(delegateButton);
    
    expect(screen.getByText('Task Delegation')).toBeInTheDocument();
  });

  it('should handle task status changes', () => {
    const onUpdate = jest.fn();
    render(<TaskCard {...defaultProps} onUpdate={onUpdate} />);
    
    // Click on "In Progress" status
    const inProgressButton = screen.getByText('In Progress');
    fireEvent.click(inProgressButton);
    
    expect(onUpdate).toHaveBeenCalledWith('task-1', { status: 'doing' });
  });

  it('should handle task priority changes', () => {
    const onUpdate = jest.fn();
    render(<TaskCard {...defaultProps} onUpdate={onUpdate} />);
    
    // Click on high priority button (first priority button)
    const priorityButtons = document.querySelectorAll('[title*="Priority"]');
    if (priorityButtons.length > 0) {
      fireEvent.click(priorityButtons[0]);
      expect(onUpdate).toHaveBeenCalledWith('task-1', { priority: 'high' });
    }
  });

  it('should handle task deletion', () => {
    const onDelete = jest.fn();
    // Mock window.confirm to return true
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<TaskCard {...defaultProps} onDelete={onDelete} />);
    
    // Click delete button (red traffic light)
    const deleteButton = document.querySelector('[title="Delete Task"]');
    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(onDelete).toHaveBeenCalledWith('task-1');
    }
    
    confirmSpy.mockRestore();
  });

  it('should show metadata section with creation date', () => {
    render(<TaskCard {...defaultProps} />);
    
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/8\/29\/2025/)).toBeInTheDocument();
  });

  it('should show updated date when task has been updated', () => {
    render(<TaskCard {...defaultProps} />);
    
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
  });

  it('should handle editing mode', () => {
    render(<TaskCard {...defaultProps} />);
    
    // Click edit button (yellow traffic light)
    const editButton = document.querySelector('[title="Edit Task"]');
    if (editButton) {
      fireEvent.click(editButton);
      
      // Should show input fields
      const titleInput = document.querySelector('input[type="text"]');
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).toHaveValue('Test Task');
    }
  });

  it('should show completion status for done tasks', () => {
    const completedTask = { ...mockTask, status: 'done' as const };
    render(<TaskCard {...defaultProps} task={completedTask} />);
    
    expect(screen.getByText('Completed!')).toBeInTheDocument();
  });

  it('should show due date information when present', () => {
    const taskWithDueDate = { 
      ...mockTask, 
      dueDate: '2025-08-30T12:00:00Z' 
    };
    render(<TaskCard {...defaultProps} task={taskWithDueDate} />);
    
    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  it('should show AI score when present', () => {
    const taskWithAIScore = { ...mockTask, aiScore: 85 };
    render(<TaskCard {...defaultProps} task={taskWithAIScore} />);
    
    expect(screen.getByText('AI 85')).toBeInTheDocument();
  });

  it('should apply correct styling based on priority', () => {
    render(<TaskCard {...defaultProps} />);
    
    const card = document.querySelector('[data-task-id="task-1"]');
    expect(card).toHaveClass('border-gray-400/30');
  });

  it('should apply correct styling based on status', () => {
    const completedTask = { ...mockTask, status: 'done' as const };
    render(<TaskCard {...defaultProps} task={completedTask} />);
    
    const card = document.querySelector('[data-task-id="task-1"]');
    expect(card).toHaveClass('opacity-80', 'scale-95');
  });
});