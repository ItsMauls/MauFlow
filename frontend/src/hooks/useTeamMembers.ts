/**
 * useTeamMembers Hook
 * Manages team member state and operations using mock data and local storage
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  TeamMember, 
  UseTeamMembersReturn 
} from '@/types/collaboration';
import CollaborationStorage from '@/lib/collaborationStorage';
import { 
  mockTeamMembers, 
  currentUser,
  searchTeamMembers as mockSearchTeamMembers,
  getOnlineTeamMembers as mockGetOnlineTeamMembers 
} from '@/lib/mockData';

export const useTeamMembers = (): UseTeamMembersReturn => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize team members from storage or mock data
  useEffect(() => {
    const initializeTeamMembers = () => {
      setIsLoading(true);
      
      try {
        // Get team members from storage
        let storedTeamMembers = CollaborationStorage.getTeamMembers();
        
        // If no stored team members, initialize with mock data
        if (storedTeamMembers.length === 0) {
          storedTeamMembers = mockTeamMembers;
          CollaborationStorage.saveTeamMembers(storedTeamMembers);
        }
        
        // Sort by name
        storedTeamMembers.sort((a, b) => a.name.localeCompare(b.name));
        
        setTeamMembers(storedTeamMembers);
      } catch (error) {
        console.error('Failed to initialize team members:', error);
        setTeamMembers([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTeamMembers();
  }, []);

  // Search team members
  const searchMembers = useCallback((query: string): TeamMember[] => {
    if (!query.trim()) {
      return teamMembers;
    }

    const lowercaseQuery = query.toLowerCase();
    return teamMembers.filter(member =>
      member.name.toLowerCase().includes(lowercaseQuery) ||
      member.email.toLowerCase().includes(lowercaseQuery) ||
      member.role.name.toLowerCase().includes(lowercaseQuery)
    );
  }, [teamMembers]);

  // Get team member by ID
  const getMemberById = useCallback((id: string): TeamMember | undefined => {
    return teamMembers.find(member => member.id === id);
  }, [teamMembers]);

  // Get online team members
  const getOnlineMembers = useCallback((): TeamMember[] => {
    return teamMembers.filter(member => member.isOnline);
  }, [teamMembers]);

  // Get team members who can receive delegations
  const getDelegatableMembers = useCallback((): TeamMember[] => {
    return teamMembers.filter(member => 
      member.role.canReceiveDelegations && member.id !== currentUser.id
    );
  }, [teamMembers]);

  // Get team members by role
  const getMembersByRole = useCallback((roleName: string): TeamMember[] => {
    return teamMembers.filter(member => 
      member.role.name.toLowerCase() === roleName.toLowerCase()
    );
  }, [teamMembers]);

  // Update team member online status
  const updateMemberStatus = useCallback((memberId: string, isOnline: boolean): void => {
    try {
      const lastSeen = isOnline ? undefined : new Date().toISOString();
      
      // Update in storage
      CollaborationStorage.updateTeamMemberStatus(memberId, isOnline, lastSeen);
      
      // Update local state
      setTeamMembers(prev => 
        prev.map(member => 
          member.id === memberId
            ? { ...member, isOnline, lastSeen }
            : member
        )
      );
    } catch (error) {
      console.error('Failed to update member status:', error);
    }
  }, []);

  // Add new team member (for testing/admin purposes)
  const addTeamMember = useCallback((newMember: TeamMember): void => {
    try {
      // Update local state
      setTeamMembers(prev => {
        const updated = [...prev, newMember];
        updated.sort((a, b) => a.name.localeCompare(b.name));
        return updated;
      });
      
      // Update storage
      const updatedMembers = [...teamMembers, newMember];
      CollaborationStorage.saveTeamMembers(updatedMembers);
    } catch (error) {
      console.error('Failed to add team member:', error);
    }
  }, [teamMembers]);

  // Remove team member (for testing/admin purposes)
  const removeTeamMember = useCallback((memberId: string): void => {
    try {
      // Update local state
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
      
      // Update storage
      const updatedMembers = teamMembers.filter(member => member.id !== memberId);
      CollaborationStorage.saveTeamMembers(updatedMembers);
    } catch (error) {
      console.error('Failed to remove team member:', error);
    }
  }, [teamMembers]);

  // Get team statistics
  const getTeamStats = useCallback(() => {
    const total = teamMembers.length;
    const online = getOnlineMembers().length;
    const offline = total - online;
    const canDelegate = teamMembers.filter(m => m.role.canDelegate).length;
    const canReceiveDelegations = teamMembers.filter(m => m.role.canReceiveDelegations).length;
    
    const roleDistribution = teamMembers.reduce((acc, member) => {
      const roleName = member.role.name;
      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      online,
      offline,
      canDelegate,
      canReceiveDelegations,
      roleDistribution
    };
  }, [teamMembers, getOnlineMembers]);

  // Simulate real-time status updates
  useEffect(() => {
    // Simulate team member status changes every 45 seconds
    const interval = setInterval(() => {
      // Randomly update 1-2 team members' online status
      const membersToUpdate = teamMembers
        .filter(member => member.id !== currentUser.id) // Don't update current user
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 2) + 1);

      membersToUpdate.forEach(member => {
        // 70% chance to stay in current state, 30% chance to toggle
        if (Math.random() < 0.3) {
          updateMemberStatus(member.id, !member.isOnline);
        }
      });
    }, 45000); // 45 seconds

    return () => clearInterval(interval);
  }, [teamMembers, updateMemberStatus]);

  // Filter team members excluding current user
  const getOtherTeamMembers = useCallback((): TeamMember[] => {
    return teamMembers.filter(member => member.id !== currentUser.id);
  }, [teamMembers]);

  // Get recently active members (online or seen within last hour)
  const getRecentlyActiveMembers = useCallback((): TeamMember[] => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    return teamMembers.filter(member => {
      if (member.isOnline) return true;
      if (!member.lastSeen) return false;
      
      return new Date(member.lastSeen) > oneHourAgo;
    });
  }, [teamMembers]);

  return {
    teamMembers,
    isLoading,
    searchMembers,
    getMemberById,
    getOnlineMembers,
    // Additional utility methods
    getDelegatableMembers,
    getMembersByRole,
    updateMemberStatus,
    addTeamMember,
    removeTeamMember,
    getTeamStats,
    getOtherTeamMembers,
    getRecentlyActiveMembers
  } as UseTeamMembersReturn & {
    getDelegatableMembers: () => TeamMember[];
    getMembersByRole: (roleName: string) => TeamMember[];
    updateMemberStatus: (memberId: string, isOnline: boolean) => void;
    addTeamMember: (newMember: TeamMember) => void;
    removeTeamMember: (memberId: string) => void;
    getTeamStats: () => {
      total: number;
      online: number;
      offline: number;
      canDelegate: number;
      canReceiveDelegations: number;
      roleDistribution: Record<string, number>;
    };
    getOtherTeamMembers: () => TeamMember[];
    getRecentlyActiveMembers: () => TeamMember[];
  };
};