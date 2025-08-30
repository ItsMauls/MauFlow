/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DelegatedTasksView } from '@/components/delegation/DelegatedTasksView';
import { useDelegatedTasks } from '@/hooks/useDelegatedTasks';

// Mock the hook
jest.mock('@/hooks/useDelegatedTasks');

const mockUseDelegatedTasks = useDelegatedTasks as jest.MockedFunction<typeof useDelegatedTasks>;

// Mock data
const mockDelegatedTasks = [
  {
    id: 'task-1',
    title: 'Implement user authentication',
    description: 'Set up JWT authentication with login/logout functionality',
    status: 'doing' as const,
    priority: 'high' as const,
    createdAt: '2025-08-26T09:00:00Z',
    updatedAt: '2025-08-28T14:30:00Z',
    dueDate: '2025-08-30T17:00:00Z',
    assigneeId: 'user-3',
    delegatorId: 'user-1',
    delegatedAt: '2025-08-28T10:00:00Z',
    delegationNote: 'Please focus on the API integration part',
    collaborators: ['user-1', 'user-3'],
    commentCount: 3,
    lastCommentAt: '2025-08-28T16:45:00Z',
    watchers: ['user-1', 'user-2'],
    delegation: {
      id: 'delegation-1',
      taskId: 'task-1',
      delegatorId: 'user-1',
      assigneeId: 'user-3',
      delegatedAt: '2025-08-28T10:00:00Z',
      note: 'Please focus on the API integration part',
      status: 'active' as const,
      priority: 'normal' as const
    },
    delegator: {
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
    }
  }
];

describe('DelegatedTasksView Integration', () => {
  const mockHandleTaskStatusUpdate = jest.fn();
  const mockGetDelegationHistory = jest.fn();
  const mockGetMemberById = jest.fn();
  const mockClearFilters = jest.fn();
  const mockHandleSortChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseDelegatedTasks.mockReturnValue({
      delegatedTasks: mockDelegatedTasks,
      filteredAndSortedTasks: mockDelegatedTasks,
      isLoading: false,
      sortBy: 'delegatedAt',
      sortDirection: 'desc',
      filterStatus: 'all',
      filterDelegator: 'all',
      searchQuery: '',
      setSortBy: jest.fn(),
      setSortDirection: jest.fn(),
      setFilterStatus: jest.fn(),
      setFilterDelegator: jest.fn(),
      setSearchQuery: jest.fn(),
      handleSortChange: mockHandleSortChange,
      clearFilters: mockClearFilters,
      handleTaskStatusUpdate: mockHandleTaskStatusUpdate,
      getDelegationHistory: mockGetDelegationHistory,
      uniqueDelegators: [mockDelegatedTasks[0].delegator],
      stats: {
        total: 1,
        active: 1,
        completed: 0,
        overdue: 0
      },
      getMemberById: mockGetMemberById
    });

    mockGetDelegationHistory.mockReturnValue([mockDelegatedTasks[0].delegation]);
    mockGetMemberById.mockReturnValue(mockDelegatedTasks[0].delegator);
  });

  describe('Full Workflow Integration', () => {
    it('renders complete delegated tasks dashboard', () => {
      render(<DelegatedTasksView />);
      
      // Header and stats
      expect(screen.getByText('My Delegated Tasks')).toBeInTheDocument();
      expect(screen.getByText('1 of 1 tasks')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Active count
      
      // Task information
      expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
      expect(screen.getByText('Set up JWT authentication with login/logout functionality')).toBeInTheDocument();
      expect(screen.getByText('Assigned by Alice Johnson')).toBeInTheDocument();
      
      // Filters and controls
      expect(screen.getByPlaceholderText('Search tasks, delegators, or notes...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Delegators')).toBeInTheDocument();
    });

    it('handles task status update workflow', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      const completeButton = screen.getByText('Complete');
      await user.click(completeButton);
      
      expect(mockHandleTaskStatusUpdate).toHaveBeenCalledWith('task-1', 'done');
    });

    it('handles filtering workflow', async () => {
      const user = userEvent.setup();
      const mockSetFilterStatus = jest.fn();
      
      mockUseDelegatedTasks.mockReturnValue({
        ...mockUseDelegatedTasks(),
        setFilterStatus: mockSetFilterStatus
      });
      
      render(<DelegatedTasksView />);
      
      const statusFilter = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusFilter, 'active');
      
      expect(mockSetFilterStatus).toHaveBeenCalledWith('active');
    });

    it('handles sorting workflow', async () => {
      const user = userEvent.setup();
      render(<DelegatedTasksView />);
      
      const prioritySort = screen.getByText('Priority');
      await user.click(prioritySort);
      
      expect(mockHandleSortChange).toHaveBeenCalledWith('priority');
    });

    it('handles search workflow', async () => {
      const user = userEvent.setup();
      const mockSetSearchQuery = jest.fn();
      
      mockUseDelegatedTasks.mockReturnValue({
        ...mockUseDelegatedTasks(),
        setSearchQuery: mockSetSearchQuery
      });
      
      render(<DelegatedTasksView />);
      
      const searchInput = screen.getByPlaceholderText('Search tasks, delegators, or notes...');
      await user.type(searchInput, 'authentication');
      
      expect(mockSetSearchQuery).toHaveBeenCalledWith('authentication');
    });

    it('handles clear filters workflow', async () => {
      const user = userEvent.setup();
      
      // Mock empty results to show clear filters button
      mockUseDelegatedTasks.mockReturnValue({
        ...mockUseDelegatedTasks(),
        filteredAndSortedTasks: [],
        searchQuery: 'test'
      });
      
      render(<DelegatedTasksView />);
      
      const clearButton = screen.getByText('Clear Filters');
      await user.click(clearButton);
      
      expect(mockClearFilters).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('handles task status update errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockHandleTaskStatusUpdate.mockRejectedValue(new Error('Update failed'));
      
      render(<DelegatedTasksView />);
      
      const completeButton = screen.getByText('Complete');
      await user.click(completeButton);
      
      // Component should not crash and error should be handled
      expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design Integration', () => {
    it('adapts to different screen sizes', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<DelegatedTasksView />);
      
      // Should still render all essential elements
      expect(screen.getByText('My Delegated Tasks')).toBeInTheDocument();
      expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains accessibility standards', () => {
      render(<DelegatedTasksView />);
      
      // Form controls should be properly labeled
      const searchInput = screen.getByPlaceholderText('Search tasks, delegators, or notes...');
      expect(searchInput).toHaveAttribute('type', 'text');
      
      const statusFilter = screen.getByDisplayValue('All Status');
      expect(statusFilter.tagName).toBe('SELECT');
      
      // Buttons should be focusable
      const sortButtons = screen.getAllByRole('button');
      sortButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Performance Integration', () => {
    it('handles large datasets efficiently', () => {
      // Mock large dataset
      const largeDelegatedTasks = Array.from({ length: 100 }, (_, i) => ({
        ...mockDelegatedTasks[0],
        id: `task-${i}`,
        title: `Task ${i}`,
        delegation: {
          ...mockDelegatedTasks[0].delegation,
          id: `delegation-${i}`,
          taskId: `task-${i}`
        }
      }));

      mockUseDelegatedTasks.mockReturnValue({
        ...mockUseDelegatedTasks(),
        delegatedTasks: largeDelegatedTasks,
        filteredAndSortedTasks: largeDelegatedTasks.slice(0, 10), // Simulate pagination
        stats: {
          total: 100,
          active: 80,
          completed: 20,
          overdue: 5
        }
      });

      const startTime = performance.now();
      render(<DelegatedTasksView />);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should show correct stats
      expect(screen.getByText('80')).toBeInTheDocument(); // Active count
      expect(screen.getByText('20')).toBeInTheDocument(); // Completed count
    });
  });
});