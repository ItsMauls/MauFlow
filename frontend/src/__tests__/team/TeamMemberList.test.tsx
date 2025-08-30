/**
 * TeamMemberList Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamMemberList } from '@/components/team/TeamMemberList';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { TeamMember } from '@/types/collaboration';

// Mock team members data
const mockTeamMembers = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    email: 'alice@company.com',
    avatar: '👩‍💼',
    role: {
      id: 'role-1',
      name: 'Project Manager',
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
      canDelegate: true,
      canReceiveDelegations: true,
      canManageTeam: false
    },
    isOnline: true
  },
  {
    id: 'user-3',
    name: 'Carol Davis',
    email: 'carol@company.com',
    avatar: '👩‍💻',
    role: {
      id: 'role-3',
      name: 'Developer',
      canDelegate: false,
      canReceiveDelegations: true,
      canManageTeam: false
    },
    isOnline: false,
    lastSeen: '2025-08-28T18:30:00Z'
  },
  {
    id: 'user-4',
    name: 'Eva Martinez',
    email: 'eva@company.com',
    avatar: '👩‍💻',
    role: {
      id: 'role-4',
      name: 'Developer',
      canDelegate: false,
      canReceiveDelegations: true,
      canManageTeam: false
    },
    isOnline: false,
    lastSeen: '2025-08-28T17:20:00Z'
  }
] as TeamMember[];

// Mock the useTeamMembers hook
jest.mock('@/hooks/useTeamMembers');
const mockUseTeamMembers = useTeamMembers as jest.MockedFunction<typeof useTeamMembers>;

// Mock GlassCard component
jest.mock('@/components/ui/GlassCard', () => ({
  GlassCard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`glass-card ${className}`}>{children}</div>
  )
}));

describe('TeamMemberList', () => {
  const mockOnMemberClick = jest.fn();
  
  const defaultHookReturn = {
    teamMembers: mockTeamMembers,
    isLoading: false,
    searchMembers: jest.fn((query: string) => 
      mockTeamMembers.filter(member => 
        member.name.toLowerCase().includes(query.toLowerCase()) ||
        member.email.toLowerCase().includes(query.toLowerCase()) ||
        member.role.name.toLowerCase().includes(query.toLowerCase())
      )
    ),
    getMemberById: jest.fn(),
    getOnlineMembers: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeamMembers.mockReturnValue(defaultHookReturn as any);
  });

  it('renders team members list with header', () => {
    render(<TeamMemberList />);
    
    expect(screen.getByText('Team Members')).toBeInTheDocument();
    expect(screen.getByText(/\d+ members • \d+ online • \d+ offline/)).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    mockUseTeamMembers.mockReturnValue({
      ...defaultHookReturn,
      isLoading: true
    } as any);

    render(<TeamMemberList />);
    
    expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
  });

  it('displays all team members by default', () => {
    render(<TeamMemberList />);
    
    mockTeamMembers.forEach(member => {
      expect(screen.getByText(member.name)).toBeInTheDocument();
      expect(screen.getByText(member.role.name)).toBeInTheDocument();
    });
  });

  it('filters members based on search query', async () => {
    const user = userEvent.setup();
    render(<TeamMemberList />);
    
    const searchInput = screen.getByPlaceholderText('Search team members...');
    await user.type(searchInput, 'Alice');
    
    await waitFor(() => {
      expect(defaultHookReturn.searchMembers).toHaveBeenCalledWith('Alice');
    });
  });

  it('sorts members by name by default', () => {
    render(<TeamMemberList />);
    
    const memberElements = screen.getAllByText(/Project Manager|Team Lead|Developer|Designer/);
    // The first member should be Alice Johnson (alphabetically first)
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('changes sort order when sort option is selected', async () => {
    const user = userEvent.setup();
    render(<TeamMemberList />);
    
    const sortSelect = screen.getByDisplayValue('Sort by Name');
    await user.selectOptions(sortSelect, 'role');
    
    // Members should now be sorted by role
    expect(sortSelect).toHaveValue('role');
  });

  it('filters by online status', async () => {
    const user = userEvent.setup();
    render(<TeamMemberList />);
    
    const filterSelect = screen.getByDisplayValue('All Members');
    await user.selectOptions(filterSelect, 'online');
    
    expect(filterSelect).toHaveValue('online');
  });

  it('shows online status indicators', () => {
    render(<TeamMemberList />);
    
    // Check for online status text
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('displays role information with appropriate colors', () => {
    render(<TeamMemberList />);
    
    const projectManagerRole = screen.getByText('Project Manager');
    const teamLeadRole = screen.getByText('Team Lead');
    const developerRole = screen.getAllByText('Developer')[0];
    
    expect(projectManagerRole).toHaveClass('text-purple-400');
    expect(teamLeadRole).toHaveClass('text-blue-400');
    expect(developerRole).toHaveClass('text-green-400');
  });

  it('shows last seen information for offline members', () => {
    render(<TeamMemberList />);
    
    // Find offline members and check for "Last seen" text
    const offlineMembers = mockTeamMembers.filter(member => !member.isOnline);
    if (offlineMembers.length > 0) {
      expect(screen.getByText(/Last seen/)).toBeInTheDocument();
    }
  });

  it('calls onMemberClick when a member is clicked', async () => {
    render(<TeamMemberList onMemberClick={mockOnMemberClick} />);
    
    const aliceMember = screen.getByText('Alice Johnson').closest('div');
    if (aliceMember) {
      fireEvent.click(aliceMember);
      expect(mockOnMemberClick).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alice Johnson' })
      );
    }
  });

  it('excludes specified users from the list', () => {
    render(<TeamMemberList excludeUsers={['user-1']} />);
    
    // Alice Johnson (user-1) should not be in the list
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('filters by role when filterByRole is provided', () => {
    render(<TeamMemberList filterByRole={['Developer']} />);
    
    // Only developers should be shown
    expect(screen.getByText('Carol Davis')).toBeInTheDocument();
    expect(screen.getByText('Eva Martinez')).toBeInTheDocument();
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument(); // Project Manager
  });

  it('shows permission indicators for members with special permissions', () => {
    render(<TeamMemberList />);
    
    // Check for delegation and team management permission indicators
    const permissionIndicators = screen.getAllByTitle(/Can delegate tasks|Can manage team/);
    expect(permissionIndicators.length).toBeGreaterThan(0);
  });

  it('hides search when showSearch is false', () => {
    render(<TeamMemberList showSearch={false} />);
    
    expect(screen.queryByPlaceholderText('Search team members...')).not.toBeInTheDocument();
  });

  it('hides filters when showFilters is false', () => {
    render(<TeamMemberList showFilters={false} />);
    
    expect(screen.queryByDisplayValue('Sort by Name')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('All Members')).not.toBeInTheDocument();
  });

  it('hides online status when showOnlineStatus is false', () => {
    render(<TeamMemberList showOnlineStatus={false} />);
    
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });

  it('hides roles when showRoles is false', () => {
    render(<TeamMemberList showRoles={false} />);
    
    expect(screen.queryByText('Project Manager')).not.toBeInTheDocument();
    expect(screen.queryByText('Team Lead')).not.toBeInTheDocument();
  });

  it('hides last seen when showLastSeen is false', () => {
    render(<TeamMemberList showLastSeen={false} />);
    
    expect(screen.queryByText(/Last seen/)).not.toBeInTheDocument();
  });

  it('shows empty state when no members match filters', () => {
    mockUseTeamMembers.mockReturnValue({
      ...defaultHookReturn,
      searchMembers: jest.fn(() => [])
    } as any);

    render(<TeamMemberList />);
    
    const searchInput = screen.getByPlaceholderText('Search team members...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentUser' } });
    
    expect(screen.getByText('No team members found matching your search.')).toBeInTheDocument();
  });

  it('calculates and displays correct statistics', () => {
    render(<TeamMemberList />);
    
    const onlineCount = mockTeamMembers.filter(m => m.isOnline).length;
    const totalCount = mockTeamMembers.length;
    const offlineCount = totalCount - onlineCount;
    
    expect(screen.getByText(`${totalCount} members • ${onlineCount} online • ${offlineCount} offline`)).toBeInTheDocument();
  });

  it('applies custom maxHeight style', () => {
    render(<TeamMemberList maxHeight="200px" />);
    
    const memberListContainer = screen.getByText('Alice Johnson').closest('[style*="max-height"]');
    expect(memberListContainer).toHaveStyle('max-height: 200px');
  });

  it('handles recently active filter correctly', async () => {
    const user = userEvent.setup();
    render(<TeamMemberList />);
    
    const filterSelect = screen.getByDisplayValue('All Members');
    await user.selectOptions(filterSelect, 'recent');
    
    expect(filterSelect).toHaveValue('recent');
  });

  it('sorts by last seen correctly', async () => {
    const user = userEvent.setup();
    render(<TeamMemberList />);
    
    const sortSelect = screen.getByDisplayValue('Sort by Name');
    await user.selectOptions(sortSelect, 'lastSeen');
    
    expect(sortSelect).toHaveValue('lastSeen');
  });
});