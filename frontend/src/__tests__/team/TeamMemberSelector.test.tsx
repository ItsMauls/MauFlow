/**
 * TeamMemberSelector Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamMemberSelector } from '@/components/team/TeamMemberSelector';
import { useTeamMembers } from '@/hooks/useTeamMembers';

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
];

// Mock the useTeamMembers hook
jest.mock('@/hooks/useTeamMembers');
const mockUseTeamMembers = useTeamMembers as jest.MockedFunction<typeof useTeamMembers>;

// Mock GlassCard component
jest.mock('@/components/ui/GlassCard', () => ({
  GlassCard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`glass-card ${className}`}>{children}</div>
  )
}));

describe('TeamMemberSelector', () => {
  const mockOnSelect = jest.fn();
  
  const defaultHookReturn = {
    teamMembers: mockTeamMembers,
    isLoading: false,
    searchMembers: jest.fn((query: string) => 
      mockTeamMembers.filter(member => 
        member.name.toLowerCase().includes(query.toLowerCase())
      )
    ),
    getMemberById: jest.fn(),
    getOnlineMembers: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeamMembers.mockReturnValue(defaultHookReturn as any);
  });

  it('renders with default placeholder', () => {
    render(<TeamMemberSelector onSelect={mockOnSelect} />);
    
    expect(screen.getByPlaceholderText('Select team member...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <TeamMemberSelector 
        onSelect={mockOnSelect} 
        placeholder="Choose assignee..." 
      />
    );
    
    expect(screen.getByPlaceholderText('Choose assignee...')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    mockUseTeamMembers.mockReturnValue({
      ...defaultHookReturn,
      isLoading: true
    } as any);

    render(<TeamMemberSelector onSelect={mockOnSelect} />);
    
    expect(screen.getByText('Loading team members...')).toBeInTheDocument();
  });

  it('opens dropdown when input is focused', async () => {
    render(<TeamMemberSelector onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Select team member...');
    fireEvent.focus(input);
    
    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });

  it('filters team members based on search query', async () => {
    const user = userEvent.setup();
    render(<TeamMemberSelector onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Select team member...');
    await user.type(input, 'Alice');
    
    await waitFor(() => {
      expect(defaultHookReturn.searchMembers).toHaveBeenCalledWith('Alice');
    });
  });

  it('excludes specified users from the list', () => {
    render(
      <TeamMemberSelector 
        onSelect={mockOnSelect} 
        excludeUsers={['user-1']} 
      />
    );
    
    const input = screen.getByPlaceholderText('Select team member...');
    fireEvent.focus(input);
    
    // Alice Johnson (user-1) should not be in the list
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('filters by role when filterByRole is provided', () => {
    render(
      <TeamMemberSelector 
        onSelect={mockOnSelect} 
        filterByRole={['Developer']} 
      />
    );
    
    const input = screen.getByPlaceholderText('Select team member...');
    fireEvent.focus(input);
    
    // Only developers should be shown
    expect(screen.getByText('Carol Davis')).toBeInTheDocument();
    expect(screen.getByText('Eva Martinez')).toBeInTheDocument();
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument(); // Project Manager
  });

  it('calls onSelect when a team member is clicked', async () => {
    render(<TeamMemberSelector onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Select team member...');
    fireEvent.focus(input);
    
    await waitFor(() => {
      const aliceOption = screen.getByText('Alice Johnson');
      fireEvent.click(aliceOption);
    });
    
    expect(mockOnSelect).toHaveBeenCalledWith('user-1');
  });

  it('handles keyboard navigation', async () => {
    render(<TeamMemberSelector onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Select team member...');
    
    // Open dropdown with Enter key
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
    
    // Navigate with arrow keys
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    // Select with Enter
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOnSelect).toHaveBeenCalled();
  });

  it('closes dropdown when Escape is pressed', async () => {
    render(<TeamMemberSelector onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Select team member...');
    fireEvent.focus(input);
    
    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
    
    fireEvent.keyDown(input, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });
  });

  it('shows online status indicators', () => {
    render(<TeamMemberSelector onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Select team member...');
    fireEvent.focus(input);
    
    // Check for online indicators (green dots)
    const onlineIndicators = screen.getAllByTitle('Online');
    expect(onlineIndicators.length).toBeGreaterThan(0);
  });

  it('displays role information for each member', () => {
    render(<TeamMemberSelector onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Select team member...');
    fireEvent.focus(input);
    
    expect(screen.getByText('Project Manager')).toBeInTheDocument();
    expect(screen.getByText('Team Lead')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('shows "No team members found" when search returns empty results', async () => {
    const user = userEvent.setup();
    mockUseTeamMembers.mockReturnValue({
      ...defaultHookReturn,
      searchMembers: jest.fn(() => [])
    } as any);

    render(<TeamMemberSelector onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Select team member...');
    await user.type(input, 'NonexistentUser');
    
    await waitFor(() => {
      expect(screen.getByText('No team members found')).toBeInTheDocument();
    });
  });

  it('sorts members by online status first, then by name', () => {
    render(<TeamMemberSelector onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Select team member...');
    fireEvent.focus(input);
    
    const memberButtons = screen.getAllByRole('button');
    const memberNames = memberButtons.map(button => 
      button.querySelector('p')?.textContent
    ).filter(Boolean);
    
    // Online members should appear first
    const onlineMembers = mockTeamMembers.filter(m => m.isOnline);
    const offlineMembers = mockTeamMembers.filter(m => !m.isOnline);
    
    expect(memberNames.slice(0, onlineMembers.length)).toEqual(
      onlineMembers.sort((a, b) => a.name.localeCompare(b.name)).map(m => m.name)
    );
  });

  it('handles non-searchable mode', () => {
    render(
      <TeamMemberSelector 
        onSelect={mockOnSelect} 
        searchable={false} 
      />
    );
    
    const input = screen.getByPlaceholderText('Select team member...') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
  });

  it('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <TeamMemberSelector onSelect={mockOnSelect} />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const input = screen.getByPlaceholderText('Select team member...');
    fireEvent.focus(input);
    
    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
    
    const outsideElement = screen.getByTestId('outside');
    fireEvent.mouseDown(outsideElement);
    
    await waitFor(() => {
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });
  });
});