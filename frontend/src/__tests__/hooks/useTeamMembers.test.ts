/**
 * useTeamMembers Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import CollaborationStorage from '@/lib/collaborationStorage';
import { mockTeamMembers, currentUser } from '@/lib/mockData';

// Mock CollaborationStorage
jest.mock('@/lib/collaborationStorage');
const mockCollaborationStorage = CollaborationStorage as jest.Mocked<typeof CollaborationStorage>;

// Mock mockData
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
      name: 'Developer',
      canDelegate: false,
      canReceiveDelegations: true,
      canManageTeam: false
    },
    isOnline: false,
    lastSeen: '2025-08-28T18:30:00Z'
  }
];

const currentUser = {
  id: 'user-1',
  name: 'Alice Johnson'
};

jest.mock('@/lib/mockData', () => ({
  mockTeamMembers,
  currentUser
}));

describe('useTeamMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Default mock implementations
    mockCollaborationStorage.getTeamMembers.mockReturnValue([]);
    mockCollaborationStorage.saveTeamMembers.mockImplementation(() => {});
    mockCollaborationStorage.updateTeamMemberStatus.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with mock data when no stored data exists', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue([]);
    
    const { result } = renderHook(() => useTeamMembers());
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.teamMembers).toHaveLength(2);
    expect(mockCollaborationStorage.saveTeamMembers).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Alice Johnson' }),
        expect.objectContaining({ name: 'Bob Smith' })
      ])
    );
  });

  it('loads existing team members from storage', async () => {
    const storedMembers = [
      {
        id: 'user-3',
        name: 'Carol Davis',
        email: 'carol@company.com',
        role: { name: 'Designer', canDelegate: false, canReceiveDelegations: true },
        isOnline: true
      }
    ];
    
    mockCollaborationStorage.getTeamMembers.mockReturnValue(storedMembers as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.teamMembers).toEqual(storedMembers);
  });

  it('searches team members correctly', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue(mockTeamMembers as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const searchResults = result.current.searchMembers('Alice');
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].name).toBe('Alice Johnson');
  });

  it('returns empty array for empty search query', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue(mockTeamMembers as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const searchResults = result.current.searchMembers('');
    expect(searchResults).toEqual(result.current.teamMembers);
  });

  it('searches by email and role', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue(mockTeamMembers as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Search by email
    const emailResults = result.current.searchMembers('alice@company.com');
    expect(emailResults).toHaveLength(1);
    expect(emailResults[0].email).toBe('alice@company.com');
    
    // Search by role
    const roleResults = result.current.searchMembers('Developer');
    expect(roleResults).toHaveLength(1);
    expect(roleResults[0].role.name).toBe('Developer');
  });

  it('gets member by ID correctly', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue(mockTeamMembers as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const member = result.current.getMemberById('user-1');
    expect(member?.name).toBe('Alice Johnson');
    
    const nonExistentMember = result.current.getMemberById('user-999');
    expect(nonExistentMember).toBeUndefined();
  });

  it('gets online members correctly', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue(mockTeamMembers as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const onlineMembers = result.current.getOnlineMembers();
    expect(onlineMembers).toHaveLength(1);
    expect(onlineMembers[0].name).toBe('Alice Johnson');
  });

  it('updates member status correctly', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue([...mockTeamMembers] as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    act(() => {
      result.current.updateMemberStatus('user-2', true);
    });
    
    expect(mockCollaborationStorage.updateTeamMemberStatus).toHaveBeenCalledWith(
      'user-2',
      true,
      undefined
    );
    
    // Check that local state is updated
    const updatedMember = result.current.teamMembers.find(m => m.id === 'user-2');
    expect(updatedMember?.isOnline).toBe(true);
  });

  it('adds new team member correctly', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue([...mockTeamMembers] as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const newMember = {
      id: 'user-3',
      name: 'Charlie Brown',
      email: 'charlie@company.com',
      role: { name: 'Designer', canDelegate: false, canReceiveDelegations: true },
      isOnline: false
    };
    
    act(() => {
      result.current.addTeamMember(newMember as any);
    });
    
    expect(result.current.teamMembers).toHaveLength(3);
    expect(result.current.teamMembers.find(m => m.id === 'user-3')).toBeDefined();
    expect(mockCollaborationStorage.saveTeamMembers).toHaveBeenCalled();
  });

  it('removes team member correctly', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue([...mockTeamMembers] as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    act(() => {
      result.current.removeTeamMember('user-2');
    });
    
    expect(result.current.teamMembers).toHaveLength(1);
    expect(result.current.teamMembers.find(m => m.id === 'user-2')).toBeUndefined();
    expect(mockCollaborationStorage.saveTeamMembers).toHaveBeenCalled();
  });

  it('gets delegatable members correctly', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue(mockTeamMembers as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const delegatableMembers = result.current.getDelegatableMembers();
    
    // Should exclude current user and include only those who can receive delegations
    expect(delegatableMembers).toHaveLength(1);
    expect(delegatableMembers[0].name).toBe('Bob Smith');
  });

  it('gets members by role correctly', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue(mockTeamMembers as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const developers = result.current.getMembersByRole('Developer');
    expect(developers).toHaveLength(1);
    expect(developers[0].role.name).toBe('Developer');
    
    const managers = result.current.getMembersByRole('Project Manager');
    expect(managers).toHaveLength(1);
    expect(managers[0].role.name).toBe('Project Manager');
  });

  it('gets team statistics correctly', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue(mockTeamMembers as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const stats = result.current.getTeamStats();
    
    expect(stats.total).toBe(2);
    expect(stats.online).toBe(1);
    expect(stats.offline).toBe(1);
    expect(stats.canDelegate).toBe(1);
    expect(stats.canReceiveDelegations).toBe(2);
    expect(stats.roleDistribution).toEqual({
      'Project Manager': 1,
      'Developer': 1
    });
  });

  it('gets other team members (excluding current user)', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue(mockTeamMembers as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const otherMembers = result.current.getOtherTeamMembers();
    expect(otherMembers).toHaveLength(1);
    expect(otherMembers[0].id).toBe('user-2');
  });

  it('gets recently active members correctly', async () => {
    const recentlyActiveMembers = [
      ...mockTeamMembers,
      {
        id: 'user-3',
        name: 'Charlie Brown',
        email: 'charlie@company.com',
        role: { name: 'Designer' },
        isOnline: false,
        lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      }
    ];
    
    mockCollaborationStorage.getTeamMembers.mockReturnValue(recentlyActiveMembers as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const recentMembers = result.current.getRecentlyActiveMembers();
    
    // Should include online members and those seen within last hour
    expect(recentMembers).toHaveLength(2); // Alice (online) + Charlie (recent)
  });

  it('handles storage errors gracefully', async () => {
    mockCollaborationStorage.getTeamMembers.mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.teamMembers).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize team members:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('simulates real-time status updates', async () => {
    mockCollaborationStorage.getTeamMembers.mockReturnValue([...mockTeamMembers] as any);
    
    const { result } = renderHook(() => useTeamMembers());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Mock Math.random to ensure status update occurs
    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0.2); // Less than 0.3, so update will occur
    
    // Fast-forward time to trigger the interval
    act(() => {
      jest.advanceTimersByTime(45000);
    });
    
    expect(mockCollaborationStorage.updateTeamMemberStatus).toHaveBeenCalled();
    
    Math.random = originalRandom;
  });
});