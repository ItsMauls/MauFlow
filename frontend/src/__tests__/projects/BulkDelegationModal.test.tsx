/**
 * Unit Tests for BulkDelegationModal Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkDelegationModal } from '@/components/projects/BulkDelegationModal';

// Mock the TeamMemberSelector component
jest.mock('@/components/team/TeamMemberSelector', () => ({
  TeamMemberSelector: ({ onSelect, placeholder }: any) => (
    <div data-testid="team-member-selector">
      <input
        placeholder={placeholder}
        onChange={(e) => onSelect(e.target.value)}
        data-testid="member-selector-input"
      />
    </div>
  )
}));

const mockTasks = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'First test task',
    status: 'todo' as const,
    priority: 'high' as const,
    createdAt: '2025-08-29T10:00:00Z',
    projectId: 'project-1',
    dueDate: '2025-09-01T10:00:00Z'
  },
  {
    id: 'task-2',
    title: 'Task 2',
    description: 'Second test task',
    status: 'doing' as const,
    priority: 'medium' as const,
    createdAt: '2025-08-29T11:00:00Z',
    projectId: 'project-1'
  }
];

describe('BulkDelegationModal', () => {
  const mockOnDelegate = jest.fn();
  const mockOnClose = jest.fn();
  const selectedTasks = ['task-1', 'task-2'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal with correct title and task count', () => {
    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Bulk Delegate Tasks')).toBeInTheDocument();
    expect(screen.getByText('Selected Tasks (2)')).toBeInTheDocument();
  });

  it('should display selected tasks with their details', () => {
    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('todo')).toBeInTheDocument();
    expect(screen.getByText('doing')).toBeInTheDocument();
  });

  it('should show due date for tasks that have one', () => {
    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Due: 9\/1\/2025/)).toBeInTheDocument();
  });

  it('should render team member selector', () => {
    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('team-member-selector')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search and select team member...')).toBeInTheDocument();
  });

  it('should render delegation note textarea', () => {
    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByPlaceholderText('Add a note for the assignee about these tasks...');
    expect(textarea).toBeInTheDocument();
  });

  it('should disable submit button when no assignee is selected', () => {
    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    const submitButton = screen.getByText('Delegate 2 Tasks');
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when assignee is selected', async () => {
    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    const memberInput = screen.getByTestId('member-selector-input');
    fireEvent.change(memberInput, { target: { value: 'user-2' } });

    await waitFor(() => {
      const submitButton = screen.getByText('Delegate 2 Tasks');
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should call onDelegate with correct parameters when form is submitted', async () => {
    mockOnDelegate.mockResolvedValue(undefined);

    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    // Select assignee
    const memberInput = screen.getByTestId('member-selector-input');
    fireEvent.change(memberInput, { target: { value: 'user-2' } });

    // Add note
    const noteTextarea = screen.getByPlaceholderText('Add a note for the assignee about these tasks...');
    fireEvent.change(noteTextarea, { target: { value: 'Please complete these tasks' } });

    // Submit form
    const submitButton = screen.getByText('Delegate 2 Tasks');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnDelegate).toHaveBeenCalledWith('user-2', 'Please complete these tasks');
    });
  });

  it('should call onDelegate without note when note is empty', async () => {
    mockOnDelegate.mockResolvedValue(undefined);

    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    // Select assignee
    const memberInput = screen.getByTestId('member-selector-input');
    fireEvent.change(memberInput, { target: { value: 'user-2' } });

    // Submit form without note
    const submitButton = screen.getByText('Delegate 2 Tasks');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnDelegate).toHaveBeenCalledWith('user-2', undefined);
    });
  });

  it('should show error message when delegation fails', async () => {
    mockOnDelegate.mockRejectedValue(new Error('Delegation failed'));

    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    // Select assignee
    const memberInput = screen.getByTestId('member-selector-input');
    fireEvent.change(memberInput, { target: { value: 'user-2' } });

    // Submit form
    const submitButton = screen.getByText('Delegate 2 Tasks');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Delegation failed')).toBeInTheDocument();
    });
  });

  it('should show error when no assignee is selected and form is submitted', async () => {
    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    // Try to submit without selecting assignee
    const form = screen.getByRole('form') || screen.getByText('Delegate 2 Tasks').closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText('Please select a team member to delegate to')).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    mockOnDelegate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    // Select assignee
    const memberInput = screen.getByTestId('member-selector-input');
    fireEvent.change(memberInput, { target: { value: 'user-2' } });

    // Submit form
    const submitButton = screen.getByText('Delegate 2 Tasks');
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Delegating...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(mockOnDelegate).toHaveBeenCalled();
    });
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when close button (X) is clicked', () => {
    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when backdrop is clicked', () => {
    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    const backdrop = screen.getByText('Bulk Delegate Tasks').closest('div')?.parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should display delegation information', () => {
    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('About Bulk Delegation')).toBeInTheDocument();
    expect(screen.getByText(/All selected tasks will be assigned to the chosen team member/)).toBeInTheDocument();
    expect(screen.getByText(/The assignee will receive a notification for each delegated task/)).toBeInTheDocument();
  });

  it('should handle single task correctly', () => {
    render(
      <BulkDelegationModal
        selectedTasks={['task-1']}
        tasks={[mockTasks[0]]}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Selected Tasks (1)')).toBeInTheDocument();
    expect(screen.getByText('Delegate 1 Task')).toBeInTheDocument(); // Singular form
  });

  it('should disable buttons during submission', async () => {
    mockOnDelegate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <BulkDelegationModal
        selectedTasks={selectedTasks}
        tasks={mockTasks}
        onDelegate={mockOnDelegate}
        onClose={mockOnClose}
      />
    );

    // Select assignee
    const memberInput = screen.getByTestId('member-selector-input');
    fireEvent.change(memberInput, { target: { value: 'user-2' } });

    // Submit form
    const submitButton = screen.getByText('Delegate 2 Tasks');
    fireEvent.click(submitButton);

    // Both buttons should be disabled during submission
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();

    await waitFor(() => {
      expect(mockOnDelegate).toHaveBeenCalled();
    });
  });
});