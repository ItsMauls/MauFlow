/**
 * TeamMemberList Component
 * Displays a list of team members with their status, role, and activity information
 */

import React, { useState, useMemo } from 'react';
import { TeamMember } from '@/types/collaboration';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { GlassCard } from '@/components/ui/GlassCard';

interface TeamMemberListProps {
  className?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showOnlineStatus?: boolean;
  showRoles?: boolean;
  showLastSeen?: boolean;
  maxHeight?: string;
  onMemberClick?: (member: TeamMember) => void;
  filterByRole?: string[];
  excludeUsers?: string[];
}

type SortOption = 'name' | 'role' | 'status' | 'lastSeen';
type FilterOption = 'all' | 'online' | 'offline' | 'recent';

export const TeamMemberList: React.FC<TeamMemberListProps> = ({
  className = "",
  showSearch = true,
  showFilters = true,
  showOnlineStatus = true,
  showRoles = true,
  showLastSeen = true,
  maxHeight = "400px",
  onMemberClick,
  filterByRole = [],
  excludeUsers = []
}) => {
  const { teamMembers, isLoading, searchMembers } = useTeamMembers();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Filter and sort team members
  const filteredAndSortedMembers = useMemo(() => {
    let members = teamMembers;

    // Apply search filter
    if (searchQuery.trim()) {
      members = searchMembers(searchQuery);
    }

    // Exclude specified users
    if (excludeUsers.length > 0) {
      members = members.filter(member => !excludeUsers.includes(member.id));
    }

    // Filter by roles if specified
    if (filterByRole.length > 0) {
      members = members.filter(member => 
        filterByRole.includes(member.role.name)
      );
    }

    // Apply status filter
    switch (filterBy) {
      case 'online':
        members = members.filter(member => member.isOnline);
        break;
      case 'offline':
        members = members.filter(member => !member.isOnline);
        break;
      case 'recent':
        members = members.filter(member => {
          if (member.isOnline) return true;
          if (!member.lastSeen) return false;
          
          const lastSeenDate = new Date(member.lastSeen);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return lastSeenDate > oneHourAgo;
        });
        break;
    }

    // Sort members
    members.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'role':
          return a.role.name.localeCompare(b.role.name);
        case 'status':
          if (a.isOnline !== b.isOnline) {
            return a.isOnline ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        case 'lastSeen':
          if (a.isOnline && b.isOnline) return a.name.localeCompare(b.name);
          if (a.isOnline) return -1;
          if (b.isOnline) return 1;
          
          const aLastSeen = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
          const bLastSeen = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
          return bLastSeen - aLastSeen;
        default:
          return 0;
      }
    });

    return members;
  }, [teamMembers, searchQuery, sortBy, filterBy, filterByRole, excludeUsers, searchMembers]);

  const getStatusIndicator = (member: TeamMember) => {
    if (member.isOnline) {
      return (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-400">Online</span>
        </div>
      );
    }
    
    if (member.lastSeen) {
      const lastSeenDate = new Date(member.lastSeen);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        return (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            <span className="text-xs text-yellow-400">Recently active</span>
          </div>
        );
      }
    }
    
    return (
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
        <span className="text-xs text-gray-400">Offline</span>
      </div>
    );
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getRoleColor = (roleName: string) => {
    const colors = {
      'Project Manager': 'text-purple-400',
      'Team Lead': 'text-blue-400',
      'Developer': 'text-green-400',
      'Designer': 'text-pink-400',
    };
    return colors[roleName as keyof typeof colors] || 'text-gray-400';
  };

  const getStats = () => {
    const total = filteredAndSortedMembers.length;
    const online = filteredAndSortedMembers.filter(m => m.isOnline).length;
    const offline = total - online;
    
    return { total, online, offline };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <GlassCard className={className}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/20 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/20 rounded w-3/4"></div>
                    <div className="h-2 bg-white/20 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Team Members</h3>
            <p className="text-sm text-white/60">
              {stats.total} members • {stats.online} online • {stats.offline} offline
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        {(showSearch || showFilters) && (
          <div className="space-y-4 mb-6">
            {showSearch && (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search team members..."
                  className="w-full px-4 py-2 pl-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            )}

            {showFilters && (
              <div className="flex flex-wrap gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  <option value="name">Sort by Name</option>
                  <option value="role">Sort by Role</option>
                  <option value="status">Sort by Status</option>
                  <option value="lastSeen">Sort by Activity</option>
                </select>

                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                  className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  <option value="all">All Members</option>
                  <option value="online">Online Only</option>
                  <option value="offline">Offline Only</option>
                  <option value="recent">Recently Active</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Member List */}
        <div 
          className="space-y-3 overflow-y-auto"
          style={{ maxHeight }}
        >
          {filteredAndSortedMembers.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              {searchQuery ? 'No team members found matching your search.' : 'No team members available.'}
            </div>
          ) : (
            filteredAndSortedMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => onMemberClick?.(member)}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                  onMemberClick 
                    ? 'hover:bg-white/10 cursor-pointer hover:scale-[1.02]' 
                    : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {member.avatar ? (
                    <span className="text-3xl">{member.avatar}</span>
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-white font-medium truncate">
                      {member.name}
                    </h4>
                    {showOnlineStatus && getStatusIndicator(member)}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    {showRoles && (
                      <span className={`font-medium ${getRoleColor(member.role.name)}`}>
                        {member.role.name}
                      </span>
                    )}
                    
                    {showLastSeen && !member.isOnline && (
                      <>
                        {showRoles && <span className="text-white/40">•</span>}
                        <span className="text-white/60">
                          Last seen {formatLastSeen(member.lastSeen)}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="text-xs text-white/50 mt-1">
                    {member.email}
                  </div>
                </div>

                {/* Role Permissions Indicator */}
                <div className="flex-shrink-0 flex space-x-1">
                  {member.role.canDelegate && (
                    <div 
                      className="w-2 h-2 bg-blue-400 rounded-full" 
                      title="Can delegate tasks"
                    />
                  )}
                  {member.role.canManageTeam && (
                    <div 
                      className="w-2 h-2 bg-purple-400 rounded-full" 
                      title="Can manage team"
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default TeamMemberList;