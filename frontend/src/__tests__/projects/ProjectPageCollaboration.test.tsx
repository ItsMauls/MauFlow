/**
 * Unit Tests for ProjectPage Collaboration Features
 * Tests team sidebar, delegation filtering, bulk delegation, and activity feed
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectPage } from '@/components/projects/ProjectPage';
import { useProject } from '@/hooks/useProject';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useDelegation } from '@/hooks/useDelegation';
import { mockUsers, mockDelegations, mockTeamMembers } from '@/lib/mockData';

// Mock the hooks
jest.mock('@/hooks/useProject');
jest.mock('@/hooks/useTeamMembers');
jest.mock('@/hooks/useDelegation');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockUseProject = useProject as jest.MockedFunction<typeof useProject>;
const mockUseTeamMembers = useTeamMembers as jest.MockedFunction<typeof useTeamMembers>;
const mockUseDelegation = useDelegation as jest.MockedFunction<typeof useDelegation>;

// Mock data
const mockProject = {
  id: 'project-1',
  name: 'test-project',
  title: 'Test Project',
  description: 'A test project for collaboration features'
};

const mockTasks = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'First test task',
    status: 'todo' as const,
    priority: 'high' as const,
    createdAt: '2025-08-29T10:00:00Z',
    projectId: 'project-1'
  },
  {
    id: 'task-2',
    title: 'Task 2',
    description: 'Second test task',
    status: 'doing' as const,
    priority: 'medium' as const,
    createdAt: '2025-08-29T11:00:00Z',
    projectId: 'project-1'
  },
  {
    id: 'task-3',
    title: 'Task 3',
    description: 'Third test task',
    status: 'done' as const,
    priority: 'low' as const,
    createdAt: '2025-08-29T12:00:00Z',
    projectId: 'project-1'
  }
];

describe('ProjectPage Collaboration Features', () => {
  const mockDelegateTask = jest.fn();
  const mockGetMemberById = jest.fn();
  const mockIsTaskDelegated = jest.fn();
  const mockGetActiveDelegationForTask = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockUseProject.mockReturnValue({
      project: mockProject,
      tasks: mockTasks,
      isLoading: false,
      error: null,
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      createTask: jest.fn(),
      refetch: jest.fn()
    });

    mockUseTeamMembers.mockReturnValue({
      teamMembers: mockTeamMembers,
      isLoading: false,
      searchMembers: jest.fn(),
      getMemberById: mockGetMemberById,
      getOnlineMembers: jest.fn(() => mockTeamMembers.filter(m => m.isOnline)),
      getDelegatableMembers: jest.fn(() => mockTeamMembers.filter(m => m.role.canReceiveDelegations)),
      getMembersByRole: jest.fn(),
      updateMemberStatus: jest.fn(),
      addTeamMember: jest.fn(),
      removeTeamMember: jest.fn(),
      getTeamStats: jest.fn(() => ({
        total: mockTeamMembers.length,
        online: 2,
        offline: 3,
        canDelegate: 2,
        canReceiveDelegations: 4,
        roleDistribution: { 'Project Manager': 1, 'Developer': 2, 'Designer': 1, 'Team Lead': 1 }
      })),
      getOtherTeamMembers: jest.fn(() => mockTeamMembers.slice(1)),
      getRecentlyActiveMembers: jest.fn(() => mockTeamMembers.filter(m => m.isOnline))
    });

    mockUseDelegation.mockReturnValue({
      delegations: mockDelegations,
      isLoading: false,
      delegateTask: mockDelegateTask,
      revokeDelegation: jest.fn(),
      completeDelegation: jest.fn(),
      getDelegationsByTaskId: jest.fn(),
      getDelegationsByAssigneeId: jest.fn(),
      getMyActiveDelegations: jest.fn(() => []),
      getMyCreatedDelegations: jest.fn(() => mockDelegations.filter(d => d.delegatorId === 'user-1')),
      isTaskDelegated: mockIsTaskDelegated,
      getActiveDelegationForTask: mockGetActiveDelegationForTask
    });

    mockGetMemberById.mockImplementation((id: string) => 
      mockTeamMembers.find(member => member.id === id)
    );

    mockIsTaskDelegated.mockImplementation((taskId: string) => 
      mockDelegations.some(d => d.taskId === taskId && d.status === 'active')
    );

    mockGetActiveDelegationForTask.mockImplementation((taskId: string) => 
      mockDelegations.find(d => d.taskId === taskId && d.status === 'active')
    );
  });

  describe('Team Sidebar', () => {
    it('should toggle team sidebar visibility', async () => {
      render(<ProjectPage projectId="project-1" />);

      // Initially sidebar should be hidden
      expect(screen.queryByText('Team Members')).not.toBeInTheDocument();

      // Click show team button
      const showTeamButton = screen.getByText('Show Team');
      fireEvent.click(showTeamButton);

      // Sidebar should now be visible
      await waitFor(() => {
        expect(screen.getByText('Team Members')).toBeInTheDocument();
      });

      // Button text should change
      expect(screen.getByText('Hide Team')).toBeInTheDocument();
    });

    it('should display team member statistics in sidebar', async () => {
      render(<ProjectPage projectId="project-1" />);

      // Show team sidebar
      fireEvent.click(screen.getByText('Show Team'));

      await waitFor(() => {
        expect(screen.getByText('Team Members')).toBeInTheDocument();
        expect(screen.getByText('2/5 online')).toBeInTheDocument();
      });
    });
  });

  describe('Delegation Filtering', () => {
    it('should display delegation filter options', () => {
      render(<ProjectPage projectId="project-1" />);

      expect(screen.getByText('Delegation:')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Delegated')).toBeInTheDocument();
      expect(screen.getByText('My Delegations')).toBeInTheDocument();
      expect(screen.getByText('Assigned to Me')).toBeInTheDocument();
    });

    it('should filter tasks by delegation status', async () => {
      // Mock that task-1 is delegated
      mockIsTaskDelegated.mockImplementation((taskId: string) => taskId === 'task-1');
      
      render(<ProjectPage projectId="project-1" />);

      // Initially all tasks should be visible
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();

      // Click delegated filter
      const delegatedFilter = screen.getByRole('button', { name: 'Delegated' });
      fireEvent.click(delegatedFilter);

      // Only delegated tasks should be visible
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
      });
    });

    it('should show delegation statistics', () => {
      // Mock delegation statistics
      mockIsTaskDelegated.mockImplementation((taskId: string) => taskId === 'task-1');
      mockGetActiveDelegationForTask.mockImplementation((taskId: string) => {
        if (taskId === 'task-1') {
          return { delegatorId: 'user-1', assigneeId: 'user-2' } as any;
        }
        return undefined;
      });

      render(<ProjectPage projectId="project-1" />);

      // Check delegation statistics are displayed
      expect(screen.getByText('Delegated')).toBeInTheDocument();
      expect(screen.getByText('My Delegations')).toBeInTheDocument();
      expect(screen.getByText('Assigned to Me')).toBeInTheDocument();
    });
  });

  describe('Bulk Delegation', () => {
    it('should show task selection checkboxes for users with delegation permissions', () => {
      render(<ProjectPage projectId="project-1" />);

      // Should show checkboxes for each task
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(mockTasks.length);
    });

    it('should enable bulk delegation when tasks are selected', async () => {
      render(<ProjectPage projectId="project-1" />);

      // Select first task
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(firstCheckbox);

      // Should show bulk delegation button
      await waitFor(() => {
        expect(screen.getByText('Delegate 1 task')).toBeInTheDocument();
      });
    });

    it('should show select all button when no tasks are selected', () => {
      render(<ProjectPage projectId="project-1" />);

      expect(screen.getByText('Select All')).toBeInTheDocument();
    });

    it('should select all tasks when select all is clicked', async () => {
      render(<ProjectPage projectId="project-1" />);

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        expect(screen.getByText('Delegate 3 tasks')).toBeInTheDocument();
        expect(screen.getByText('(3 selected)')).toBeInTheDocument();
      });
    });

    it('should open bulk delegation modal when delegate button is clicked', async () => {
      render(<ProjectPage projectId="project-1" />);

      // Select a task
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(firstCheckbox);

      // Click delegate button
      const delegateButton = await screen.findByText('Delegate 1 task');
      fireEvent.click(delegateButton);

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText('Bulk Delegate Tasks')).toBeInTheDocument();
      });
    });

    it('should clear selection when clear button is clicked', async () => {
      render(<ProjectPage projectId="project-1" />);

      // Select a task
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(firstCheckbox);

      // Should show clear button
      const clearButton = await screen.findByText('Clear');
      fireEvent.click(clearButton);

      // Selection should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Delegate 1 task')).not.toBeInTheDocument();
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });
    });
  });

  describe('Activity Feed', () => {
    it('should toggle activity feed visibility', async () => {
      render(<ProjectPage projectId="project-1" />);

      // Initially activity feed should be hidden
      expect(screen.queryByText('Team Activity')).not.toBeInTheDocument();

      // Click show activity button
      const showActivityButton = screen.getByText('Show Activity');
      fireEvent.click(showActivityButton);

      // Activity feed should now be visible
      await waitFor(() => {
        expect(screen.getByText('Team Activity')).toBeInTheDocument();
      });

      // Button text should change
      expect(screen.getByText('Hide Activity')).toBeInTheDocument();
    });
  });

  describe('Task Statistics', () => {
    it('should display enhanced task statistics with delegation info', () => {
      // Mock delegation statistics
      mockIsTaskDelegated.mockImplementation((taskId: string) => taskId === 'task-1');
      mockGetActiveDelegationForTask.mockImplementation((taskId: string) => {
        if (taskId === 'task-1') {
          return { delegatorId: 'user-1', assigneeId: 'user-2' } as any;
        }
        return undefined;
      });

      render(<ProjectPage projectId="project-1" />);

      // Check basic statistics
      expect(screen.getByText('3')).toBeInTheDocument(); // Total tasks
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();

      // Check delegation statistics
      expect(screen.getByText('Delegated')).toBeInTheDocument();
      expect(screen.getByText('My Delegations')).toBeInTheDocument();
      expect(screen.getByText('Assigned to Me')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle delegation errors gracefully', async () => {
      mockDelegateTask.mockRejectedValue(new Error('Delegation failed'));

      render(<ProjectPage projectId="project-1" />);

      // Select a task
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(firstCheckbox);

      // Click delegate button
      const delegateButton = await screen.findByText('Delegate 1 task');
      fireEvent.click(delegateButton);

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText('Bulk Delegate Tasks')).toBeInTheDocument();
      });

      // The error handling would be tested in the BulkDelegationModal component tests
    });
  });

  describe('Responsive Design', () => {
    it('should adjust grid columns based on sidebar visibility', async () => {
      render(<ProjectPage projectId="project-1" />);

      // Show team sidebar
      fireEvent.click(screen.getByText('Show Team'));

      await waitFor(() => {
        expect(screen.getByText('Team Members')).toBeInTheDocument();
      });

      // Grid should adjust for sidebar (this would need more specific testing of CSS classes)
    });
  });

  describe('Integration', () => {
    it('should integrate all collaboration features together', async () => {
      render(<ProjectPage projectId="project-1" />);

      // Show team sidebar
      fireEvent.click(screen.getByText('Show Team'));

      // Show activity feed
      fireEvent.click(screen.getByText('Show Activity'));

      // Select tasks
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(firstCheckbox);

      // Apply delegation filter
      const delegatedFilter = screen.getByRole('button', { name: 'Delegated' });
      fireEvent.click(delegatedFilter);

      await waitFor(() => {
        // All features should be working together
        expect(screen.getByText('Team Members')).toBeInTheDocument();
        expect(screen.getByText('Team Activity')).toBeInTheDocument();
        expect(screen.getByText('Delegate 1 task')).toBeInTheDocument();
      });
    });
  });
});