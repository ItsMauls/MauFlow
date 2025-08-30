/**
 * Integration Tests for Sidebar Collaboration Features
 * Simplified tests focusing on key collaboration functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Sidebar } from '@/components/sidebar/Sidebar';

// Mock the collaboration hooks with simple implementations
jest.mock('@/hooks/useTeamMembers', () => ({
  useTeamMembers: () => ({
    teamMembers: [
      { id: '1', name: 'Alice Johnson', role: { name: 'Manager', canDelegate: true, canReceiveDelegations: true }, isOnline: true },
      { id: '2', name: 'Bob Smith', role: { name: 'Developer', canDelegate: false, canReceiveDelegations: true }, isOnline: false }
    ],
    isLoading: false,
    getOnlineMembers: () => [
      { id: '1', name: 'Alice Johnson', role: { name: 'Manager', canDelegate: true, canReceiveDelegations: true }, isOnline: true }
    ],
    getDelegatableMembers: () => [
      { id: '2', name: 'Bob Smith', role: { name: 'Developer', canDelegate: false, canReceiveDelegations: true }, isOnline: false }
    ],
    getTeamStats: () => ({
      total: 2,
      online: 1,
      offline: 1,
      canDelegate: 1,
      canReceiveDelegations: 2,
      roleDistribution: { 'Manager': 1, 'Developer': 1 }
    })
  })
}));

jest.mock('@/hooks/useDelegation', () => ({
  useDelegation: () => ({
    delegations: [],
    isLoading: false,
    getMyActiveDelegations: () => [
      { id: '1', taskId: 'task-1', assigneeId: 'user-1', status: 'active' }
    ],
    getMyCreatedDelegations: () => [
      { id: '2', taskId: 'task-2', delegatorId: 'user-1', status: 'active' }
    ]
  })
}));

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [
      { id: '1', title: 'Test Notification', message: 'Test message', isRead: false, createdAt: new Date().toISOString() },
      { id: '2', title: 'Read Notification', message: 'Read message', isRead: true, createdAt: new Date().toISOString() }
    ],
    unreadCount: 1,
    isLoading: false,
    error: null,
    connectionStatus: 'connected'
  })
}));

// Mock the NotificationCenter component
jest.mock('@/components/notifications/NotificationCenter', () => ({
  NotificationCenter: () => <div data-testid="notification-center">Notification Center</div>
}));

// Mock current user
jest.mock('@/lib/mockData', () => ({
  currentUser: {
    id: 'user-1',
    name: 'Current User',
    role: { canDelegate: true }
  }
}));

describe('Sidebar Collaboration Integration', () => {
  const defaultProps = {
    isOpen: true,
    onToggle: jest.fn(),
    activeSection: 'team' as const,
    onSectionChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Team Section Integration', () => {
    it('should render team section with collaboration data', () => {
      render(<Sidebar {...defaultProps} activeSection="team" />);

      // Check for team section elements
      expect(screen.getByText('Team Members')).toBeInTheDocument();
      expect(screen.getByText('Online Members')).toBeInTheDocument();
      expect(screen.getByText('My Delegations')).toBeInTheDocument();
    });

    it('should display team stats correctly', () => {
      render(<Sidebar {...defaultProps} activeSection="team" />);

      // Should show online count
      expect(screen.getByText('1')).toBeInTheDocument(); // Online count
      expect(screen.getByText('Online Now')).toBeInTheDocument();
      
      // Should show delegation count
      expect(screen.getByText('Assigned to Me')).toBeInTheDocument();
    });

    it('should show online team members', () => {
      render(<Sidebar {...defaultProps} activeSection="team" />);

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
    });

    it('should show quick delegation shortcuts for users with permissions', () => {
      render(<Sidebar {...defaultProps} activeSection="team" />);

      expect(screen.getByText('Quick Delegate To')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
    });
  });

  describe('Notifications Section Integration', () => {
    it('should render notifications section with data', () => {
      render(<Sidebar {...defaultProps} activeSection="notifications" />);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('1 unread')).toBeInTheDocument();
    });

    it('should display recent notifications', () => {
      render(<Sidebar {...defaultProps} activeSection="notifications" />);

      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Read Notification')).toBeInTheDocument();
    });

    it('should show notification stats', () => {
      render(<Sidebar {...defaultProps} activeSection="notifications" />);

      expect(screen.getByText('2')).toBeInTheDocument(); // Total notifications
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Unread count
      expect(screen.getByText('Unread')).toBeInTheDocument();
    });

    it('should include NotificationCenter component', () => {
      render(<Sidebar {...defaultProps} activeSection="notifications" />);

      expect(screen.getByTestId('notification-center')).toBeInTheDocument();
    });
  });

  describe('Navigation Section Badges', () => {
    it('should show collaboration indicators in navigation', () => {
      render(<Sidebar {...defaultProps} activeSection="dashboard" />);

      // Should show team and notifications sections
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      
      // Should show online member count and unread notifications
      expect(screen.getByText('1/2 members online')).toBeInTheDocument();
      expect(screen.getByText('1 unread')).toBeInTheDocument();
    });
  });

  describe('Dashboard Collaboration Integration', () => {
    it('should show collaboration quick stats in dashboard', () => {
      render(<Sidebar {...defaultProps} activeSection="dashboard" />);

      expect(screen.getByText('Team & Collaboration')).toBeInTheDocument();
      expect(screen.getByText('Team Status')).toBeInTheDocument();
      expect(screen.getByText('1/2 members online')).toBeInTheDocument();
    });

    it('should show delegation stats when user has active delegations', () => {
      render(<Sidebar {...defaultProps} activeSection="dashboard" />);

      expect(screen.getByText('My Tasks')).toBeInTheDocument();
      expect(screen.getByText('1 delegated to me')).toBeInTheDocument();
    });

    it('should show notification stats when there are unread notifications', () => {
      render(<Sidebar {...defaultProps} activeSection="dashboard" />);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('1 unread messages')).toBeInTheDocument();
    });

    it('should handle section navigation clicks', () => {
      const onSectionChange = jest.fn();
      render(<Sidebar {...defaultProps} onSectionChange={onSectionChange} activeSection="dashboard" />);

      // Click on team status should navigate to team section
      const teamStatusElement = screen.getByText('Team Status').closest('div');
      if (teamStatusElement) {
        fireEvent.click(teamStatusElement);
        expect(onSectionChange).toHaveBeenCalledWith('team');
      }
    });
  });

  describe('Section Switching', () => {
    it('should switch between different sections', () => {
      const onSectionChange = jest.fn();
      const { rerender } = render(
        <Sidebar {...defaultProps} onSectionChange={onSectionChange} activeSection="dashboard" />
      );

      // Should show dashboard content
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();

      // Switch to team section
      rerender(
        <Sidebar {...defaultProps} onSectionChange={onSectionChange} activeSection="team" />
      );

      // Should show team content
      expect(screen.getByText('Team Members')).toBeInTheDocument();

      // Switch to notifications section
      rerender(
        <Sidebar {...defaultProps} onSectionChange={onSectionChange} activeSection="notifications" />
      );

      // Should show notifications content
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle mobile toggle functionality', () => {
      const onToggle = jest.fn();
      render(<Sidebar {...defaultProps} onToggle={onToggle} />);

      // Find and click the close button (×)
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(onToggle).toHaveBeenCalled();
    });
  });
});