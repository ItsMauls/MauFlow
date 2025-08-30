/**
 * Unit Tests for TeamMemberSidebar Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamMemberSidebar } from '@/components/projects/TeamMemberSidebar';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useDelegation } from '@/hooks/useDelegation';
import { mockTeamMembers, mockDelegations } from '@/lib/mockData';

jest.mock('@/hooks/useTeamMembers');
jest.mock('@/hooks/useDelegation');

const mockUseTeamMembers = useTeamMembers as jest.MockedFunction<typeof useTeamMembers>;
const mockUseDelegation = useDelegation as jest.MockedFunction<typeof useDelegation>;

describe('TeamMemberSidebar', () => {
  const mockOnMemberSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTeamMembers.mockReturnValue({
      teamMembers: mockTeamMembers,
      isLoading: false,
      searchMembers: jest.fn(),
      getMemberById: jest.fn(),
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
      delegateTask: jest.fn(),
      revokeDelegation: jest.fn(),
      completeDelegation: jest.fn(),
      getDelegationsByTaskId: jest.fn(),
      getDelegationsByAssigneeId: jest.fn(),
      getMyActiveDelegations: jest.fn(() => [mockDelegations[0]]),
      getMyCreatedDelegations: jest.fn(() => [mockDelegations[1]]),
      isTaskDelegated: jest.fn(),
      getActiveDelegationForTask: jest.fn()
    });
  });

  it('should render team member sidebar with header', () => {
    render(<TeamMemberSidebar projectId="project-1" onMemberSelect={mockOnMemberSelect} />);

    expect(screen.getByText('Team Members')).toBeInTheDocument();
    expect(screen.getByText('2/5 online')).toBeInTheDocument();
  });

  it('should display delegation statistics', () => {
    render(<TeamMemberSidebar projectId="project-1" onMemberSelect={mockOnMemberSelect} />);

    expect(screen.getByText('1')).toBeInTheDocument(); // Assigned to Me
    expect(screen.getByText('Assigned to Me')).toBeInTheDocument();
    expect(screen.getByText('My Delegations')).toBeInTheDocument();
  });

  it('should render filter tabs', () => {
    render(<TeamMemberSidebar projectId="project-1" onMemberSelect={mockOnMemberSelect} />);

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Can Delegate')).toBeInTheDocument();
  });

  it('should filter team members by online status', async () => {
    render(<TeamMemberSidebar projectId="project-1" onMemberSelect={mockOnMemberSelect} />);

    const onlineTab = screen.getByText('Online');
    fireEvent.click(onlineTab);

    // Should only show online members (excluding current user)
    await waitFor(() => {
      const onlineMembers = mockTeamMembers.filter(m => m.isOnline && m.id !== 'user-1');
      expect(screen.getAllByText(/Online|Just now|m ago/)).toHaveLength(onlineMembers.length);
    });
  });

  it('should display team member information correctly', () => {
    render(<TeamMemberSidebar projectId="project-1" onMemberSelect={mockOnMemberSelect} />);

    // Check if team member names are displayed (excluding current user)
    const otherMembers = mockTeamMembers.filter(m => m.id !== 'user-1');
    otherMembers.forEach(member => {
      expect(screen.getByText(member.name)).toBeInTheDocument();
      expect(screen.getByText(member.role.name)).toBeInTheDocument();
    });
  });

  it('should show online status indicators', () => {
    render(<TeamMemberSidebar projectId="project-1" onMemberSelect={mockOnMemberSelect} />);

    // Should show online indicators for online members
    expect(screen.getAllByText('Online')).toHaveLength(
      mockTeamMembers.filter(m => m.isOnline && m.id !== 'user-1').length
    );
  });

  it('should call onMemberSelect when member is clicked', async () => {
    render(<TeamMemberSidebar projectId="project-1" onMemberSelect={mockOnMemberSelect} />);

    const memberElement = screen.getByText('Bob Smith');
    fireEvent.click(memberElement.closest('div')!);

    expect(mockOnMemberSelect).toHaveBeenCalledWith('user-2');
  });

  it('should show delegate button for members who can receive delegations', () => {
    render(<TeamMemberSidebar projectId="project-1" onMemberSelect={mockOnMemberSelect} />);

    // Should show "Can receive tasks" for members who can receive delegations
    const canReceiveElements = screen.getAllByText('Can receive tasks');
    expect(canReceiveElements.length).toBeGreaterThan(0);
  });

  it('should display role distribution', () => {
    render(<TeamMemberSidebar projectId="project-1" onMemberSelect={mockOnMemberSelect} />);

    expect(screen.getByText('Role Distribution')).toBeInTheDocument();
    expect(screen.getByText('Project Manager')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Designer')).toBeInTheDocument();
    expect(screen.getByText('Team Lead')).toBeInTheDocument();
  });

  it('should handle empty team members list', () => {
    mockUseTeamMembers.mockReturnValue({
      teamMembers: [],
      isLoading: false,
      searchMembers: jest.fn(),
      getMemberById: jest.fn(),
      getOnlineMembers: jest.fn(() => []),
      getDelegatableMembers: jest.fn(() => []),
      getMembersByRole: jest.fn(),
      updateMemberStatus: jest.fn(),
      addTeamMember: jest.fn(),
      removeTeamMember: jest.fn(),
      getTeamStats: jest.fn(() => ({
        total: 0,
        online: 0,
        offline: 0,
        canDelegate: 0,
        canReceiveDelegations: 0,
        roleDistribution: {}
      })),
      getOtherTeamMembers: jest.fn(() => []),
      getRecentlyActiveMembers: jest.fn(() => [])
    });

    render(<TeamMemberSidebar projectId="project-1" onMemberSelect={mockOnMemberSelect} />);

    expect(screen.getByText('No team members found')).toBeInTheDocument();
  });

  it('should show correct counts in filter tabs', () => {
    render(<TeamMemberSidebar projectId="project-1" onMemberSelect={mockOnMemberSelect} />);

    // Check that counts are displayed in parentheses
    expect(screen.getByText('(4)')).toBeInTheDocument(); // All members minus current user
    expect(screen.getByText('(2)')).toBeInTheDocument(); // Online members
    expect(screen.getByText('(4)')).toBeInTheDocument(); // Can delegate members
  });
});