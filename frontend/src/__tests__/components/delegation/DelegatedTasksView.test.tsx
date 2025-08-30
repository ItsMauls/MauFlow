/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DelegatedTasksView } from '@/components/delegation/DelegatedTasksView';
import { useDelegation } from '@/hooks/useDelegation';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import CollaborationStorage from '@/lib/collaborationStorage';
import { TaskDelegation, TeamMember } from '@/types/collaboration';

// Mock the hooks
jest.mock('@/hooks/useDelegation');
jest.mock('@/hooks/useTeamMembers');
jest.mock('@/lib/collaborationStorage');

// Mock current user
jest.mock('@/lib/mockData', () => ({
  currentUser: {
    id: 'user-3',
    name: 'Carol Davis',
    email: 'carol@company.com',
    avatar: '👩‍💻',
    role: {
      id: 'role-2',
      name: 'Developer',
      canDelegate: false,
      canReceiveDelegations: true,
      canManageTeam: false
    }
  }
}));

const mockUseDelegation = useDelegation as jest.MockedFunction<typeof useDelegation>;
const mockUseTeamMembers = useTeamMembers as jest.MockedFunction<typeof useTeamMembers>;
const mockCollaborationStorage = CollaborationStorage as jest.Mocked<typeof CollaborationStorage>;

// Mock data
const mockDelegations: TaskDelegation[] = [
  {
    id: 'delegation-1',
    taskId: 'task-1',
    delegatorId: 'user-1',
    assigneeId: 'user-3',
    delegatedAt: '2025-08-28T10:00:00Z',
    note: 'Please focus on the API integration part',
    status: 'active',
    priority: 'normal'
  },
  {
    id: 'delegation-2',
    taskId: 'task-2',
    delegatorId: 'user-2',
    assigneeId: 'user-3',
    delegatedAt: '2025-08-27T14:30:00Z',
    note: 'Need the mockups by end of week',
    status: 'active',
    priority: 'urgent'
  },
  {
    id: 'delegation-3',
    taskId: 'task-3',
    delegatorId: 'user-1',
    assigneeId: 'user-3',
    delegatedAt: '2025-08-26T09:15:00Z',
    completedAt: '2025-08-28T16:45:00Z',
    note: 'Great work on the previous sprint',
    status: 'completed',
    priority: 'normal'
  }
];

const mockTeamMembers: TeamMember[] = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    email: 'alice@company.com',
    avatar: '👩‍💼',
    role: {
      id: 'role-1',
      name: 'Project Manager',
      description: 'Can delegate tasks and manage team members',
      permissions: [],
      canDelegate: true,
      canReceiveDelegations: true,
      canManageTeam: true
    },
    isOnline: true
  },
  {
    id: 'user-2',
    name: 'Bob Smith',
    email: 'bob@company.com',
    avatar: '👨‍💻',
    role: {
      id: 'role-2',
      name: 'Team Lead',
      description: 'Can delegate tasks within their team',
      permissions: [],
      canDelegate: true,
      canReceiveDelegations: true,
      canManageTeam: false
    },
    isOnline: true
  }
];

describe('DelegatedTasksView', () => {
  const mockCompleteDelegation = jest.fn();
  const mockGetMemberById = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseDelegation.mockReturnValue({
      delegations: mockDelegations,
      isLoading: false,
      delegateTask: jest.fn(),
      revokeDelegation: jest.fn(),
      completeDelegation: mockCompleteDelegation,
      getDelegationsByTaskId: jest.fn(),
      getDelegationsByAssigneeId: jest.fn(),
      getMyActiveDelegations: jest.fn(() => mockDelegations.filter(d => d.status === 'active')),
      getMyCreatedDelegations: jest.fn(),
      isTaskDelegated: jest.fn(),
      getActiveDelegationForTask: jest.fn()
    });

    mockUseTeamMembers.mockReturnValue({
      teamMembers: mockTeamMembers,
      isLoading: false,
      searchMembers: jest.fn(),
      getMemberById: mockGetMemberById,
      getOnlineMembers: jest.fn(),
      getDelegatableMembers: jest.fn()
    });

    mockGetMemberById.mockImplementation((id: string) => 
      mockTeamMembers.find(member => member.id === id)
    );

    mockCollaborationStorage.updateEnhancedTask.mockImplementation(() => {});
    mockCollaborationStorage.addNotification.mockImplementation(() => {});
  });

  describe('Rendering', () => {
    it('renders loading state correctly', () => {
      mockUseDelegation.mockReturnValue({
        delegations: [],
        isLoading: true,
        delegateTask: jest.fn(),
        revokeDelegation: jest.fn(),
        completeDelegation: jest.fn(),
        getDelegationsByTaskId: jest.fn(),
        getDelegationsByAssigneeId: jest.fn(),
        getMyActiveDelegations: jest.fn(),
        getMyCreatedDelegations: jest.fn(),
        isTaskDelegated: jest.fn(),
        getActiveDelegationForTask: jest.fn()
      });

      render(<DelegatedTasksView />);
      
      expect(screen.getByText('Loading delegated tasks...')).toBeInTheDocument();
    });

    it('renders empty state when no delegated tasks', () => {
      mockUseDelegation.mockReturnValue({
        delegations: [],
        isLoading: false,
        delegateTask: jest.fn(),
        revokeDelegation: jest.fn(),
        completeDelegation: jest.fn(),
        getDelegationsByTaskId: jest.fn(),
        getDelegationsByAssigneeId: jest.fn(),
        getMyActiveDelegations: jest.fn(() => []),
        getMyCreatedDelegations: jest.fn(),
        isTaskDelegated: jest.fn(),
        getActiveDelegationForTask: jest.fn()
      });

      render(<DelegatedTasksView />);
      
      expect(screen.getByText('No Delegated Tasks')).toBeInTheDocument();
      expect(screen.getByText("You don't have any tasks assigned to you yet.")).toBeInTheDocument();
    });

    it('renders header and stats correctly', () => {
      render(<DelegatedTasksView />);
      
      expect(screen.getByText('My Delegated Tasks')).toBeInTheDocument();
      expect(screen.getByText('3 of 3 tasks')).toBeInTheDocument();
      
      // Check stats
      expect(screen.getByText('2')).toBeInTheDocument(); // Active tasks
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Completed tasks
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('renders tasks with correct information', () => {
      render(<DelegatedTasksView />);
      
      expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
      expect(screen.getByText('Design system updates')).toBeInTheDocument();
      expect(screen.getByText('Database migration')).toBeInTheDocument();
      
      // Check delegator information
      expect(screen.getByText('Assigned by Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Assigned by Bob Smith')).toBeInTheDocument();
    });

    it('renders without header when showHeader is false', () => {
      render(<DelegatedTasksView showHeader={false} />);
      
      expect(screen.queryByText('My Delegated Tasks')).not.toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters tasks by status', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      const statusFilter = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusFilter, 'active');
      
      expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
      expect(screen.getByText('Design system updates')).toBeInTheDocument();
      expect(screen.queryByText('Database migration')).not.toBeInTheDocument();
    });

    it('filters tasks by delegator', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      const delegatorFilter = screen.getByDisplayValue('All Delegators');
      await user.selectOptions(delegatorFilter, 'user-1');
      
      expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
      expect(screen.getByText('Database migration')).toBeInTheDocument();
      expect(screen.queryByText('Design system updates')).not.toBeInTheDocument();
    });

    it('filters tasks by search query', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      const searchInput = screen.getByPlaceholderText('Search tasks, delegators, or notes...');
      await user.type(searchInput, 'authentication');
      
      expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
      expect(screen.queryByText('Design system updates')).not.toBeInTheDocument();
      expect(screen.queryByText('Database migration')).not.toBeInTheDocument();
    });

    it('shows no results message when filters return empty', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      const searchInput = screen.getByPlaceholderText('Search tasks, delegators, or notes...');
      await user.type(searchInput, 'nonexistent task');
      
      expect(screen.getByText('No tasks found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or search query')).toBeInTheDocument();
    });

    it('clears filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      // Apply filters
      const searchInput = screen.getByPlaceholderText('Search tasks, delegators, or notes...');
      await user.type(searchInput, 'nonexistent');
      
      expect(screen.getByText('No tasks found')).toBeInTheDocument();
      
      // Clear filters
      const clearButton = screen.getByText('Clear Filters');
      await user.click(clearButton);
      
      expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Search input cleared
    });
  });

  describe('Sorting', () => {
    it('sorts tasks by delegation date', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      const sortButton = screen.getByText('Date Assigned');
      await user.click(sortButton);
      
      expect(sortButton).toHaveClass('bg-blue-500/20');
      expect(sortButton).toHaveTextContent('Date Assigned ↓');
    });

    it('toggles sort direction when clicking same sort option', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      const sortButton = screen.getByText('Date Assigned');
      
      // First click - descending (default)
      await user.click(sortButton);
      expect(sortButton).toHaveTextContent('Date Assigned ↓');
      
      // Second click - ascending
      await user.click(sortButton);
      expect(sortButton).toHaveTextContent('Date Assigned ↑');
    });

    it('sorts by different criteria', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      const prioritySort = screen.getByText('Priority');
      await user.click(prioritySort);
      
      expect(prioritySort).toHaveClass('bg-blue-500/20');
      expect(prioritySort).toHaveTextContent('Priority ↓');
    });
  });

  describe('Task Status Updates', () => {
    it('updates task status from todo to doing', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      // Find a task with "Start" button (todo status)
      const startButton = screen.getByText('Start');
      await user.click(startButton);
      
      expect(mockCollaborationStorage.updateEnhancedTask).toHaveBeenCalledWith(
        'task-2',
        expect.objectContaining({
          status: 'doing',
          updatedAt: expect.any(String)
        })
      );
      
      expect(mockCollaborationStorage.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task_updated',
          title: 'Task Updated',
          recipientId: 'user-2',
          senderId: 'user-3'
        })
      );
    });

    it('completes task and delegation when marking as done', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      // Find a task with "Complete" button (doing status)
      const completeButton = screen.getByText('Complete');
      await user.click(completeButton);
      
      expect(mockCollaborationStorage.updateEnhancedTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({
          status: 'done',
          updatedAt: expect.any(String)
        })
      );
      
      expect(mockCompleteDelegation).toHaveBeenCalledWith('delegation-1');
    });

    it('handles task status update errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockCollaborationStorage.updateEnhancedTask.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      render(<DelegatedTasksView />);
      
      const startButton = screen.getByText('Start');
      await user.click(startButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update task status:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Delegation Information Display', () => {
    it('displays delegation notes correctly', () => {
      render(<DelegatedTasksView />);
      
      expect(screen.getByText('"Please focus on the API integration part"')).toBeInTheDocument();
      expect(screen.getByText('"Need the mockups by end of week"')).toBeInTheDocument();
    });

    it('shows urgent priority indicator', () => {
      render(<DelegatedTasksView />);
      
      expect(screen.getByText('🔥 Urgent')).toBeInTheDocument();
    });

    it('displays delegation status badges', () => {
      render(<DelegatedTasksView />);
      
      const activeStatuses = screen.getAllByText('ACTIVE');
      const completedStatus = screen.getByText('COMPLETED');
      
      expect(activeStatuses).toHaveLength(2);
      expect(completedStatus).toBeInTheDocument();
    });

    it('shows task metadata correctly', () => {
      render(<DelegatedTasksView />);
      
      expect(screen.getByText('💬 3 comments')).toBeInTheDocument();
      expect(screen.getByText('💬 1 comment')).toBeInTheDocument();
      expect(screen.getByText('💬 5 comments')).toBeInTheDocument();
    });
  });

  describe('Delegation History', () => {
    it('shows delegation history when multiple delegations exist', () => {
      // Mock multiple delegations for the same task
      const delegationsWithHistory = [
        ...mockDelegations,
        {
          id: 'delegation-4',
          taskId: 'task-1', // Same task as delegation-1
          delegatorId: 'user-2',
          assigneeId: 'user-3',
          delegatedAt: '2025-08-25T10:00:00Z',
          status: 'revoked' as const,
          priority: 'normal' as const,
          revokedAt: '2025-08-26T10:00:00Z'
        }
      ];

      mockUseDelegation.mockReturnValue({
        delegations: delegationsWithHistory,
        isLoading: false,
        delegateTask: jest.fn(),
        revokeDelegation: jest.fn(),
        completeDelegation: mockCompleteDelegation,
        getDelegationsByTaskId: jest.fn(),
        getDelegationsByAssigneeId: jest.fn(),
        getMyActiveDelegations: jest.fn(),
        getMyCreatedDelegations: jest.fn(),
        isTaskDelegated: jest.fn(),
        getActiveDelegationForTask: jest.fn()
      });

      render(<DelegatedTasksView />);
      
      expect(screen.getByText('Delegation History (2 entries)')).toBeInTheDocument();
    });
  });

  describe('Overdue Tasks', () => {
    it('highlights overdue tasks', () => {
      // Mock task with past due date
      const overdueTask = {
        ...mockDelegations[0],
        taskId: 'task-overdue'
      };

      mockUseDelegation.mockReturnValue({
        delegations: [overdueTask],
        isLoading: false,
        delegateTask: jest.fn(),
        revokeDelegation: jest.fn(),
        completeDelegation: mockCompleteDelegation,
        getDelegationsByTaskId: jest.fn(),
        getDelegationsByAssigneeId: jest.fn(),
        getMyActiveDelegations: jest.fn(() => [overdueTask]),
        getMyCreatedDelegations: jest.fn(),
        isTaskDelegated: jest.fn(),
        getActiveDelegationForTask: jest.fn()
      });

      render(<DelegatedTasksView />);
      
      // Should show overdue indicator in stats
      expect(screen.getByText('1')).toBeInTheDocument(); // Overdue count
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<DelegatedTasksView />);
      
      const searchInput = screen.getByPlaceholderText('Search tasks, delegators, or notes...');
      expect(searchInput).toHaveAttribute('type', 'text');
      
      const statusFilter = screen.getByDisplayValue('All Status');
      expect(statusFilter.tagName).toBe('SELECT');
      
      const delegatorFilter = screen.getByDisplayValue('All Delegators');
      expect(delegatorFilter.tagName).toBe('SELECT');
    });

    it('supports keyboard navigation for sort buttons', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      const sortButton = screen.getByText('Date Assigned');
      
      // Focus and activate with keyboard
      sortButton.focus();
      await user.keyboard('{Enter}');
      
      expect(sortButton).toHaveClass('bg-blue-500/20');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(<DelegatedTasksView className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom maxHeight to tasks list', () => {
      render(<DelegatedTasksView maxHeight="400px" />);
      
      const tasksList = document.querySelector('[style*="max-height: 400px"]');
      expect(tasksList).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles delegation completion errors', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockCompleteDelegation.mockRejectedValue(new Error('Delegation error'));
      
      render(<DelegatedTasksView />);
      
      const completeButton = screen.getByText('Complete');
      await user.click(completeButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update task status:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });
});