/**
 * Unit Tests for Sidebar Collaboration Features
 * Tests team members section, delegation dashboard, notification summary, and quick delegation shortcuts
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useDelegation } from '@/hooks/useDelegation';
import { useNotifications } from '@/hooks/useNotifications';
import { mockTeamMembers, mockDelegations, mockNotifications, currentUser } from '@/lib/mockData';

// Mock console.log to avoid test output noise
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

// Mock the collaboration hooks
jest.mock('@/hooks/useTeamMembers');
jest.mock('@/hooks/useDelegation');
jest.mock('@/hooks/useNotifications');

// Mock the NotificationCenter component
jest.mock('@/components/notifications/NotificationCenter', () => ({
  NotificationCenter: () => <div data-testid="notification-center">Notification Center</div>
}));

const mockUseTeamMembers = useTeamMembers as jest.MockedFunction<typeof useTeamMembers>;
const mockUseDelegation = useDelegation as jest.MockedFunction<typeof useDelegation>;
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

describe('Sidebar Collaboration Features', () => {
  const defaultProps = {
    isOpen: true,
    onToggle: jest.fn(),
    activeSection: 'team' as const,
    onSectionChange: jest.fn()
  };

  const mockTeamMembersReturn = {
    teamMembers: mockTeamMembers,
    isLoading: false,
    searchMembers: jest.fn(),
    getMemberById: jest.fn(),
    getOnlineMembers: jest.fn(() => mockTeamMembers.filter(m => m.isOnline)),
    getDelegatableMembers: jest.fn(() => mockTeamMembers.filter(m => m.role.canReceiveDelegations && m.id !== currentUser.id)),
    getTeamStats: jest.fn(() => ({
      total: mockTeamMembers.length,
      online: mockTeamMembers.filter(m => m.isOnline).length,
      offline: mockTeamMembers.filter(m => !m.isOnline).length,
      canDelegate: mockTeamMembers.filter(m => m.role.canDelegate).length,
      canReceiveDelegations: mockTeamMembers.filter(m => m.role.canReceiveDelegations).length,
      roleDistribution: {}
    })),
    getMembersByRole: jest.fn(),
    updateMemberStatus: jest.fn(),
    addTeamMember: jest.fn(),
    removeTeamMember: jest.fn(),
    getOtherTeamMembers: jest.fn(),
    getRecentlyActiveMembers: jest.fn()
  };

  const mockDelegationReturn = {
    delegations: mockDelegations,
    isLoading: false,
    delegateTask: jest.fn(),
    revokeDelegation: jest.fn(),
    completeDelegation: jest.fn(),
    getDelegationsByTaskId: jest.fn(),
    getDelegationsByAssigneeId: jest.fn(),
    getMyActiveDelegations: jest.fn(() => mockDelegations.filter(d => d.assigneeId === currentUser.id && d.status === 'active')),
    getMyCreatedDelegations: jest.fn(() => mockDelegations.filter(d => d.delegatorId === currentUser.id)),
    isTaskDelegated: jest.fn(),
    getActiveDelegationForTask: jest.fn()
  };

  const mockNotificationsReturn = {
    notifications: mockNotifications,
    unreadCount: mockNotifications.filter(n => !n.isRead).length,
    isLoading: false,
    error: null,
    connectionStatus: 'connected' as const,
    markAsRead: jest.fn(),
    markAsUnread: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    clearOldNotifications: jest.fn(),
    archiveOldNotifications: jest.fn(),
    bulkMarkAsRead: jest.fn(),
    bulkDeleteNotifications: jest.fn(),
    getArchivedNotifications: jest.fn(),
    refreshNotifications: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeamMembers.mockReturnValue(mockTeamMembersReturn);
    mockUseDelegation.mockReturnValue(mockDelegationReturn);
    mockUseNotifications.mockReturnValue(mockNotificationsReturn);
  });

  describe('Team Section', () => {
    it('should display team stats correctly', () => {
      render(<Sidebar {...defaultProps} activeSection="team" />);

      const onlineCount = mockTeamMembers.filter(m => m.isOnline).length;
      const activeDelegations = mockDelegations.filter(d => d.assigneeId === currentUser.id && d.status === 'active').length;

      expect(screen.getByText(onlineCount.toString())).toBeInTheDocument();
      expect(screen.getByText('Online Now')).toBeInTheDocument();
      expect(screen.getByText(activeDelegations.toString())).toBeInTheDocument();
      expect(screen.getByText('Assigned to Me')).toBeInTheDocument();
    });

    it('should display online team members with status indicators', () => {
      render(<Sidebar {...defaultProps} activeSection="team" />);

      const onlineMembers = mockTeamMembers.filter(m => m.isOnline);
      
      expect(screen.getByText('Online Members')).toBeInTheDocument();
      
      onlineMembers.slice(0, 5).forEach(member => {
        expect(screen.getByText(member.name)).toBeInTheDocument();
        expect(screen.getByText(member.role.name)).toBeInTheDocument();
      });
    });

    it('should show quick delegation shortcuts for users with delegation permissions', () => {
      render(<Sidebar {...defaultProps} activeSection="team" />);

      if (currentUser.role.canDelegate) {
        expect(screen.getByText('Quick Delegate To')).toBeInTheDocument();
        
        const delegatableMembers = mockTeamMembers.filter(m => 
          m.role.canReceiveDelegations && m.id !== currentUser.id
        );
        
        delegatableMembers.slice(0, 3).forEach(member => {
          expect(screen.getByText(member.name)).toBeInTheDocument();
        });
      }
    });

    it('should handle quick delegation clicks', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<Sidebar {...defaultProps} activeSection="team" />);

      if (currentUser.role.canDelegate) {
        const delegatableMembers = mockTeamMembers.filter(m => 
          m.role.canReceiveDelegations && m.id !== currentUser.id
        );
        
        if (delegatableMembers.length > 0) {
          const firstMember = delegatableMembers[0];
          const quickDelegateButton = screen.getByText(firstMember.name).closest('button');
          
          if (quickDelegateButton) {
            fireEvent.click(quickDelegateButton);
            expect(consoleSpy).toHaveBeenCalledWith(`Quick delegate to ${firstMember.name}`);
          }
        }
      }

      consoleSpy.mockRestore();
    });

    it('should display delegation dashboard summary', () => {
      render(<Sidebar {...defaultProps} activeSection="team" />);

      expect(screen.getByText('My Delegations')).toBeInTheDocument();
      expect(screen.getByText('Tasks Assigned to Me')).toBeInTheDocument();
      expect(screen.getByText('Active delegations')).toBeInTheDocument();

      if (currentUser.role.canDelegate) {
        expect(screen.getByText('Tasks I Delegated')).toBeInTheDocument();
        expect(screen.getByText('Created delegations')).toBeInTheDocument();
      }
    });

    it('should show correct delegation counts', () => {
      render(<Sidebar {...defaultProps} activeSection="team" />);

      const myActiveDelegations = mockDelegations.filter(d => 
        d.assigneeId === currentUser.id && d.status === 'active'
      );
      const myCreatedDelegations = mockDelegations.filter(d => 
        d.delegatorId === currentUser.id
      );

      expect(screen.getByText(myActiveDelegations.length.toString())).toBeInTheDocument();
      
      if (currentUser.role.canDelegate) {
        expect(screen.getByText(myCreatedDelegations.length.toString())).toBeInTheDocument();
      }
    });
  });

  describe('Notifications Section', () => {
    it('should display notification summary correctly', () => {
      render(<Sidebar {...defaultProps} activeSection="notifications" />);

      const unreadCount = mockNotifications.filter(n => !n.isRead).length;

      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      
      if (unreadCount > 0) {
        expect(screen.getByText(`${unreadCount} unread`)).toBeInTheDocument();
      }
    });

    it('should display recent notifications', () => {
      render(<Sidebar {...defaultProps} activeSection="notifications" />);

      const recentNotifications = mockNotifications.slice(0, 3);
      
      recentNotifications.forEach(notification => {
        expect(screen.getByText(notification.title)).toBeInTheDocument();
        expect(screen.getByText(notification.message)).toBeInTheDocument();
      });
    });

    it('should show notification stats', () => {
      render(<Sidebar {...defaultProps} activeSection="notifications" />);

      const totalNotifications = mockNotifications.length;
      const unreadCount = mockNotifications.filter(n => !n.isRead).length;

      expect(screen.getByText(totalNotifications.toString())).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText(unreadCount.toString())).toBeInTheDocument();
      expect(screen.getByText('Unread')).toBeInTheDocument();
    });

    it('should handle notification clicks', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<Sidebar {...defaultProps} activeSection="notifications" />);

      const firstNotification = mockNotifications[0];
      const notificationElement = screen.getByText(firstNotification.title).closest('div');
      
      if (notificationElement) {
        fireEvent.click(notificationElement);
        expect(consoleSpy).toHaveBeenCalledWith(`Navigate to notification: ${firstNotification.id}`);
      }

      consoleSpy.mockRestore();
    });

    it('should show "View all notifications" button when there are more than 3 notifications', () => {
      render(<Sidebar {...defaultProps} activeSection="notifications" />);

      if (mockNotifications.length > 3) {
        expect(screen.getByText(`View all ${mockNotifications.length} notifications`)).toBeInTheDocument();
      }
    });

    it('should include NotificationCenter component', () => {
      render(<Sidebar {...defaultProps} activeSection="notifications" />);

      expect(screen.getByTestId('notification-center')).toBeInTheDocument();
    });
  });

  describe('Navigation Section Badges', () => {
    it('should show online member count badge for team section', () => {
      render(<Sidebar {...defaultProps} activeSection="dashboard" />);

      const onlineCount = mockTeamMembers.filter(m => m.isOnline).length;
      
      if (onlineCount > 0) {
        // Check for the green dot and count in the team section button
        const teamSection = screen.getByText('Team').closest('button');
        expect(teamSection).toBeInTheDocument();
        
        // The online count should be displayed
        expect(screen.getByText(onlineCount.toString())).toBeInTheDocument();
      }
    });

    it('should show unread notification badge for notifications section', () => {
      render(<Sidebar {...defaultProps} activeSection="dashboard" />);

      const unreadCount = mockNotifications.filter(n => !n.isRead).length;
      
      if (unreadCount > 0) {
        // Check for the notification badge
        const notificationSection = screen.getByText('Notifications').closest('button');
        expect(notificationSection).toBeInTheDocument();
        
        // The unread count should be displayed
        const badgeText = unreadCount > 99 ? '99+' : unreadCount.toString();
        expect(screen.getByText(badgeText)).toBeInTheDocument();
      }
    });
  });

  describe('Dashboard Collaboration Integration', () => {
    it('should show collaboration quick stats in dashboard', () => {
      render(<Sidebar {...defaultProps} activeSection="dashboard" />);

      expect(screen.getByText('Team & Collaboration')).toBeInTheDocument();
      expect(screen.getByText('Team Status')).toBeInTheDocument();
      
      const onlineCount = mockTeamMembers.filter(m => m.isOnline).length;
      const totalCount = mockTeamMembers.length;
      expect(screen.getByText(`${onlineCount}/${totalCount} members online`)).toBeInTheDocument();
    });

    it('should show delegation quick stats when user has active delegations', () => {
      render(<Sidebar {...defaultProps} activeSection="dashboard" />);

      const myActiveDelegations = mockDelegations.filter(d => 
        d.assigneeId === currentUser.id && d.status === 'active'
      );

      if (myActiveDelegations.length > 0) {
        expect(screen.getByText('My Tasks')).toBeInTheDocument();
        expect(screen.getByText(`${myActiveDelegations.length} delegated to me`)).toBeInTheDocument();
      }
    });

    it('should show notification quick stats when there are unread notifications', () => {
      render(<Sidebar {...defaultProps} activeSection="dashboard" />);

      const unreadCount = mockNotifications.filter(n => !n.isRead).length;

      if (unreadCount > 0) {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(screen.getByText(`${unreadCount} unread messages`)).toBeInTheDocument();
      }
    });

    it('should handle clicks on collaboration quick stats', () => {
      const onSectionChange = jest.fn();
      render(<Sidebar {...defaultProps} onSectionChange={onSectionChange} activeSection="dashboard" />);

      // Click on team status
      const teamStatusElement = screen.getByText('Team Status').closest('div');
      if (teamStatusElement) {
        fireEvent.click(teamStatusElement);
        expect(onSectionChange).toHaveBeenCalledWith('team');
      }
    });
  });

  describe('Loading and Error States', () => {
    it('should handle loading state for team members', () => {
      mockUseTeamMembers.mockReturnValue({
        ...mockTeamMembersReturn,
        isLoading: true,
        teamMembers: []
      });

      render(<Sidebar {...defaultProps} activeSection="team" />);

      // Should still render the section but with loading data
      expect(screen.getByText('Team Members')).toBeInTheDocument();
    });

    it('should handle empty team members list', () => {
      mockUseTeamMembers.mockReturnValue({
        ...mockTeamMembersReturn,
        teamMembers: [],
        getOnlineMembers: jest.fn(() => []),
        getDelegatableMembers: jest.fn(() => []),
        getTeamStats: jest.fn(() => ({
          total: 0,
          online: 0,
          offline: 0,
          canDelegate: 0,
          canReceiveDelegations: 0,
          roleDistribution: {}
        }))
      });

      render(<Sidebar {...defaultProps} activeSection="team" />);

      expect(screen.getByText('No team members online')).toBeInTheDocument();
    });

    it('should handle empty notifications list', () => {
      mockUseNotifications.mockReturnValue({
        ...mockNotificationsReturn,
        notifications: [],
        unreadCount: 0
      });

      render(<Sidebar {...defaultProps} activeSection="notifications" />);

      expect(screen.getByText('No recent notifications')).toBeInTheDocument();
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<Sidebar {...defaultProps} activeSection="team" />);

      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: 'Team Members' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'My Delegations' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<Sidebar {...defaultProps} activeSection="team" />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        // Buttons should be focusable
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });
  });
});