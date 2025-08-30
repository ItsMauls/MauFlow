/**
 * useDelegation Hook
 * Manages task delegation state and operations using mock data and local storage
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  TaskDelegation, 
  UseDelegationReturn 
} from '@/types/collaboration';
import CollaborationStorage from '@/lib/collaborationStorage';
import { 
  mockDelegations, 
  currentUser, 
  generateMockDelegation,
  generateMockNotification,
  getUserById 
} from '@/lib/mockData';

export const useDelegation = (): UseDelegationReturn => {
  const [delegations, setDelegations] = useState<TaskDelegation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize delegations from storage or mock data
  useEffect(() => {
    const initializeDelegations = () => {
      setIsLoading(true);
      
      try {
        // Get delegations from storage
        let storedDelegations = CollaborationStorage.getDelegations();
        
        // If no stored delegations, initialize with mock data
        if (storedDelegations.length === 0) {
          storedDelegations = mockDelegations;
          CollaborationStorage.saveDelegations(storedDelegations);
        }
        
        // Sort by delegation date (newest first)
        storedDelegations.sort((a, b) => 
          new Date(b.delegatedAt).getTime() - new Date(a.delegatedAt).getTime()
        );
        
        setDelegations(storedDelegations);
      } catch (error) {
        console.error('Failed to initialize delegations:', error);
        setDelegations([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDelegations();
  }, []);

  // Delegate a task
  const delegateTask = useCallback(async (
    taskId: string, 
    assigneeId: string, 
    note?: string
  ): Promise<void> => {
    try {
      // Check if user has delegation permissions
      if (!currentUser.role.canDelegate) {
        throw new Error('User does not have delegation permissions');
      }

      // Check if assignee exists and can receive delegations
      const assignee = getUserById(assigneeId);
      if (!assignee) {
        throw new Error('Assignee not found');
      }
      
      if (!assignee.role.canReceiveDelegations) {
        throw new Error('Assignee cannot receive delegations');
      }

      // Create new delegation
      const newDelegation = generateMockDelegation({
        taskId,
        delegatorId: currentUser.id,
        assigneeId,
        note,
        priority: 'normal'
      });

      // Save to storage
      CollaborationStorage.addDelegation(newDelegation);
      
      // Update local state
      setDelegations(prev => [newDelegation, ...prev]);

      // Create notification for assignee
      const notification = generateMockNotification('task_delegated', assigneeId, {
        title: 'New Task Assigned',
        message: `${currentUser.name} assigned you a task`,
        senderId: currentUser.id,
        resourceId: taskId,
        resourceType: 'task',
        metadata: {
          taskId,
          delegatorName: currentUser.name,
          delegationNote: note
        }
      });

      CollaborationStorage.addNotification(notification);

      console.log(`Task ${taskId} delegated to ${assignee.name}`);
    } catch (error) {
      console.error('Failed to delegate task:', error);
      throw error;
    }
  }, []);

  // Revoke a delegation
  const revokeDelegation = useCallback(async (delegationId: string): Promise<void> => {
    try {
      const delegation = delegations.find(d => d.id === delegationId);
      if (!delegation) {
        throw new Error('Delegation not found');
      }

      // Check if user can revoke this delegation
      if (delegation.delegatorId !== currentUser.id && !currentUser.role.canManageTeam) {
        throw new Error('User cannot revoke this delegation');
      }

      // Update delegation status
      const updatedDelegation = {
        ...delegation,
        status: 'revoked' as const,
        revokedAt: new Date().toISOString()
      };

      // Update in storage
      CollaborationStorage.updateDelegation(delegationId, {
        status: 'revoked',
        revokedAt: updatedDelegation.revokedAt
      });

      // Update local state
      setDelegations(prev => 
        prev.map(d => d.id === delegationId ? updatedDelegation : d)
      );

      // Create notification for assignee
      const assignee = getUserById(delegation.assigneeId);
      if (assignee) {
        const notification = generateMockNotification('delegation_revoked', assignee.id, {
          title: 'Delegation Revoked',
          message: `${currentUser.name} revoked a task delegation`,
          senderId: currentUser.id,
          resourceId: delegation.taskId,
          resourceType: 'task',
          metadata: {
            taskId: delegation.taskId,
            delegatorName: currentUser.name,
            originalNote: delegation.note
          }
        });

        CollaborationStorage.addNotification(notification);
      }

      console.log(`Delegation ${delegationId} revoked`);
    } catch (error) {
      console.error('Failed to revoke delegation:', error);
      throw error;
    }
  }, [delegations]);

  // Complete a delegation
  const completeDelegation = useCallback(async (delegationId: string): Promise<void> => {
    try {
      const delegation = delegations.find(d => d.id === delegationId);
      if (!delegation) {
        throw new Error('Delegation not found');
      }

      // Check if user can complete this delegation
      if (delegation.assigneeId !== currentUser.id && !currentUser.role.canManageTeam) {
        throw new Error('User cannot complete this delegation');
      }

      // Update delegation status
      const updatedDelegation = {
        ...delegation,
        status: 'completed' as const,
        completedAt: new Date().toISOString()
      };

      // Update in storage
      CollaborationStorage.updateDelegation(delegationId, {
        status: 'completed',
        completedAt: updatedDelegation.completedAt
      });

      // Update local state
      setDelegations(prev => 
        prev.map(d => d.id === delegationId ? updatedDelegation : d)
      );

      // Create notification for delegator
      const delegator = getUserById(delegation.delegatorId);
      if (delegator) {
        const notification = generateMockNotification('task_completed', delegator.id, {
          title: 'Task Completed',
          message: `${currentUser.name} completed a delegated task`,
          senderId: currentUser.id,
          resourceId: delegation.taskId,
          resourceType: 'task',
          metadata: {
            taskId: delegation.taskId,
            assigneeName: currentUser.name,
            completedAt: updatedDelegation.completedAt
          }
        });

        CollaborationStorage.addNotification(notification);
      }

      console.log(`Delegation ${delegationId} completed`);
    } catch (error) {
      console.error('Failed to complete delegation:', error);
      throw error;
    }
  }, [delegations]);

  // Get delegations by task ID
  const getDelegationsByTaskId = useCallback((taskId: string): TaskDelegation[] => {
    return delegations.filter(d => d.taskId === taskId);
  }, [delegations]);

  // Get delegations by assignee ID
  const getDelegationsByAssigneeId = useCallback((assigneeId: string): TaskDelegation[] => {
    return delegations.filter(d => d.assigneeId === assigneeId);
  }, [delegations]);

  // Get active delegations for current user
  const getMyActiveDelegations = useCallback((): TaskDelegation[] => {
    return delegations.filter(d => 
      d.assigneeId === currentUser.id && d.status === 'active'
    );
  }, [delegations]);

  // Get delegations created by current user
  const getMyCreatedDelegations = useCallback((): TaskDelegation[] => {
    return delegations.filter(d => d.delegatorId === currentUser.id);
  }, [delegations]);

  // Check if a task is delegated
  const isTaskDelegated = useCallback((taskId: string): boolean => {
    return delegations.some(d => d.taskId === taskId && d.status === 'active');
  }, [delegations]);

  // Get active delegation for a task
  const getActiveDelegationForTask = useCallback((taskId: string): TaskDelegation | undefined => {
    return delegations.find(d => d.taskId === taskId && d.status === 'active');
  }, [delegations]);

  return {
    delegations,
    isLoading,
    delegateTask,
    revokeDelegation,
    completeDelegation,
    // Additional utility methods
    getDelegationsByTaskId,
    getDelegationsByAssigneeId,
    getMyActiveDelegations,
    getMyCreatedDelegations,
    isTaskDelegated,
    getActiveDelegationForTask
  };
};