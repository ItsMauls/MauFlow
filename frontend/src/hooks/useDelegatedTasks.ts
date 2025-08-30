/**
 * useDelegatedTasks Hook
 * Manages delegated tasks state, filtering, sorting, and status updates
 */

import { useState, useMemo, useCallback } from 'react';
import { useDelegation } from './useDelegation';
import { useTeamMembers } from './useTeamMembers';
import { EnhancedTask, TaskDelegation } from '@/types/collaboration';
import { currentUser } from '@/lib/mockData';
import CollaborationStorage from '@/lib/collaborationStorage';

// Mock enhanced tasks for demonstration
const mockEnhancedTasks: EnhancedTask[] = [
  {
    id: 'task-1',
    title: 'Implement user authentication',
    description: 'Set up JWT authentication with login/logout functionality',
    status: 'doing',
    priority: 'high',
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
    watchers: ['user-1', 'user-2']
  },
  {
    id: 'task-2',
    title: 'Design system updates',
    description: 'Update color palette and component styles',
    status: 'todo',
    priority: 'medium',
    createdAt: '2025-08-25T11:00:00Z',
    dueDate: '2025-08-31T17:00:00Z',
    assigneeId: 'user-4',
    delegatorId: 'user-2',
    delegatedAt: '2025-08-27T14:30:00Z',
    delegationNote: 'Need the mockups by end of week',
    collaborators: ['user-2', 'user-4'],
    commentCount: 1,
    lastCommentAt: '2025-08-27T15:00:00Z',
    watchers: ['user-2']
  },
  {
    id: 'task-3',
    title: 'Database migration',
    description: 'Migrate user data to new schema',
    status: 'done',
    priority: 'high',
    createdAt: '2025-08-24T08:00:00Z',
    updatedAt: '2025-08-28T16:45:00Z',
    assigneeId: 'user-5',
    delegatorId: 'user-1',
    delegatedAt: '2025-08-26T09:15:00Z',
    delegationNote: 'Great work on the previous sprint',
    collaborators: ['user-1', 'user-5'],
    commentCount: 5,
    lastCommentAt: '2025-08-28T16:30:00Z',
    watchers: ['user-1', 'user-3']
  }
];

type SortOption = 'delegatedAt' | 'dueDate' | 'priority' | 'status' | 'title';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'completed' | 'overdue';

export interface DelegatedTaskWithInfo extends EnhancedTask {
  delegation: TaskDelegation;
  delegator: ReturnType<typeof useTeamMembers>['getMemberById'];
}

export interface UseDelegatedTasksReturn {
  // Data
  delegatedTasks: DelegatedTaskWithInfo[];
  filteredAndSortedTasks: DelegatedTaskWithInfo[];
  isLoading: boolean;
  
  // Filters and sorting
  sortBy: SortOption;
  sortDirection: SortDirection;
  filterStatus: FilterStatus;
  filterDelegator: string;
  searchQuery: string;
  
  // Filter actions
  setSortBy: (sortBy: SortOption) => void;
  setSortDirection: (direction: SortDirection) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setFilterDelegator: (delegatorId: string) => void;
  setSearchQuery: (query: string) => void;
  handleSortChange: (sortBy: SortOption) => void;
  clearFilters: () => void;
  
  // Task actions
  handleTaskStatusUpdate: (taskId: string, newStatus: EnhancedTask['status']) => Promise<void>;
  getDelegationHistory: (taskId: string) => TaskDelegation[];
  
  // Utility data
  uniqueDelegators: ReturnType<typeof useTeamMembers>['getMemberById'][];
  stats: {
    total: number;
    active: number;
    completed: number;
    overdue: number;
  };
  
  // Helper functions
  getMemberById: ReturnType<typeof useTeamMembers>['getMemberById'];
}

export const useDelegatedTasks = (): UseDelegatedTasksReturn => {
  const { 
    delegations, 
    isLoading: delegationsLoading,
    completeDelegation 
  } = useDelegation();
  
  const { getMemberById } = useTeamMembers();

  // Filter and sort state
  const [sortBy, setSortBy] = useState<SortOption>('delegatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterDelegator, setFilterDelegator] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get delegated tasks for current user
  const myDelegations = useMemo(() => {
    return delegations.filter(d => d.assigneeId === currentUser.id);
  }, [delegations]);

  // Get enhanced tasks with delegation info
  const delegatedTasks = useMemo(() => {
    return myDelegations.map(delegation => {
      // Find corresponding task (using mock data for now)
      const task = mockEnhancedTasks.find(t => t.id === delegation.taskId);
      if (!task) return null;

      return {
        ...task,
        delegation,
        delegator: getMemberById(delegation.delegatorId)
      };
    }).filter(Boolean) as DelegatedTaskWithInfo[];
  }, [myDelegations, getMemberById]);

  // Apply filters and sorting
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = delegatedTasks;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => {
        switch (filterStatus) {
          case 'active':
            return task.delegation.status === 'active';
          case 'completed':
            return task.delegation.status === 'completed';
          case 'overdue':
            return task.dueDate && 
                   new Date(task.dueDate) < new Date() && 
                   task.status !== 'done';
          default:
            return true;
        }
      });
    }

    // Apply delegator filter
    if (filterDelegator !== 'all') {
      filtered = filtered.filter(task => task.delegation.delegatorId === filterDelegator);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.delegator?.name.toLowerCase().includes(query) ||
        task.delegation.note?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'delegatedAt':
          aValue = new Date(a.delegation.delegatedAt);
          bValue = new Date(b.delegation.delegatedAt);
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { todo: 1, doing: 2, done: 3 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [delegatedTasks, filterStatus, filterDelegator, searchQuery, sortBy, sortDirection]);

  // Get unique delegators for filter dropdown
  const uniqueDelegators = useMemo(() => {
    const delegatorIds = [...new Set(myDelegations.map(d => d.delegatorId))];
    return delegatorIds.map(id => getMemberById(id)).filter(Boolean);
  }, [myDelegations, getMemberById]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = delegatedTasks.length;
    const active = delegatedTasks.filter(t => t.delegation.status === 'active').length;
    const completed = delegatedTasks.filter(t => t.delegation.status === 'completed').length;
    const overdue = delegatedTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;

    return { total, active, completed, overdue };
  }, [delegatedTasks]);

  // Handle task status update
  const handleTaskStatusUpdate = useCallback(async (
    taskId: string, 
    newStatus: EnhancedTask['status']
  ) => {
    try {
      // Update task status in storage
      CollaborationStorage.updateEnhancedTask(taskId, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // If task is completed, complete the delegation
      if (newStatus === 'done') {
        const delegation = myDelegations.find(d => d.taskId === taskId);
        if (delegation && delegation.status === 'active') {
          await completeDelegation(delegation.id);
        }
      }

      // Create notification for delegator
      const delegation = myDelegations.find(d => d.taskId === taskId);
      if (delegation) {
        const task = delegatedTasks.find(t => t.id === taskId);
        const notification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: 'task_updated' as const,
          title: 'Task Updated',
          message: `${currentUser.name} updated the status of a delegated task`,
          recipientId: delegation.delegatorId,
          senderId: currentUser.id,
          resourceId: taskId,
          resourceType: 'task' as const,
          isRead: false,
          createdAt: new Date().toISOString(),
          metadata: {
            taskTitle: task?.title,
            updaterName: currentUser.name,
            statusChange: `${task?.status} -> ${newStatus}`
          }
        };

        CollaborationStorage.addNotification(notification);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      throw error;
    }
  }, [myDelegations, completeDelegation, delegatedTasks]);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterDelegator('all');
  }, []);

  // Get delegation history for a task
  const getDelegationHistory = useCallback((taskId: string) => {
    return delegations
      .filter(d => d.taskId === taskId)
      .sort((a, b) => new Date(b.delegatedAt).getTime() - new Date(a.delegatedAt).getTime());
  }, [delegations]);

  return {
    // Data
    delegatedTasks,
    filteredAndSortedTasks,
    isLoading: delegationsLoading,
    
    // Filters and sorting
    sortBy,
    sortDirection,
    filterStatus,
    filterDelegator,
    searchQuery,
    
    // Filter actions
    setSortBy,
    setSortDirection,
    setFilterStatus,
    setFilterDelegator,
    setSearchQuery,
    handleSortChange,
    clearFilters,
    
    // Task actions
    handleTaskStatusUpdate,
    getDelegationHistory,
    
    // Utility data
    uniqueDelegators,
    stats,
    
    // Helper functions
    getMemberById
  };
};