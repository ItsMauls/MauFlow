/**
 * TeamMemberSidebar Component
 * Displays team members with online status and quick delegation options
 */

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useDelegation } from '@/hooks/useDelegation';
import { currentUser } from '@/lib/mockData';

interface TeamMemberSidebarProps {
  projectId: string;
  onMemberSelect?: (memberId: string) => void;
}

export const TeamMemberSidebar: React.FC<TeamMemberSidebarProps> = ({
  projectId,
  onMemberSelect
}) => {
  const { teamMembers, getOnlineMembers, getDelegatableMembers, getTeamStats } = useTeamMembers();
  const { getMyActiveDelegations, getMyCreatedDelegations } = useDelegation();
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'delegatable'>('all');

  const teamStats = getTeamStats();
  const myActiveDelegations = getMyActiveDelegations();
  const myCreatedDelegations = getMyCreatedDelegations();

  const getDisplayMembers = () => {
    switch (activeTab) {
      case 'online':
        return getOnlineMembers();
      case 'delegatable':
        return getDelegatableMembers();
      default:
        return teamMembers.filter(member => member.id !== currentUser.id);
    }
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

  const getStatusIndicator = (member: any) => {
    if (member.isOnline) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs">Online</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
        <span className="text-gray-400 text-xs">{formatLastSeen(member.lastSeen)}</span>
      </div>
    );
  };

  const displayMembers = getDisplayMembers();

  return (
    <GlassCard className="h-fit">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Team Members</h3>
          <div className="text-sm text-white/60">
            {teamStats.online}/{teamStats.total} online
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{myActiveDelegations.length}</div>
            <div className="text-xs text-white/60">Assigned to Me</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{myCreatedDelegations.length}</div>
            <div className="text-xs text-white/60">My Delegations</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 bg-white/10 rounded-lg mb-4">
          {[
            { key: 'all', label: 'All', count: teamMembers.length - 1 },
            { key: 'online', label: 'Online', count: getOnlineMembers().length },
            { key: 'delegatable', label: 'Can Delegate', count: getDelegatableMembers().length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <div>{tab.label}</div>
              <div className="text-xs opacity-60">({tab.count})</div>
            </button>
          ))}
        </div>

        {/* Team Members List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {displayMembers.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <div className="text-sm">No team members found</div>
            </div>
          ) : (
            displayMembers.map(member => (
              <div
                key={member.id}
                className="group relative rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 p-3 transition-all duration-200 cursor-pointer"
                onClick={() => onMemberSelect?.(member.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {member.avatar ? (
                      <span className="text-2xl">{member.avatar}</span>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium text-sm truncate">
                        {member.name}
                      </p>
                      {getStatusIndicator(member)}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-white/60">{member.role.name}</span>
                      {member.role.canReceiveDelegations && (
                        <span className="text-xs text-blue-400">Can receive tasks</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                {currentUser.role.canDelegate && member.role.canReceiveDelegations && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <GlassButton
                      variant="secondary"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMemberSelect?.(member.id);
                      }}
                      className="text-xs"
                    >
                      Delegate
                    </GlassButton>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Role Distribution */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <h4 className="text-sm font-medium text-white mb-3">Role Distribution</h4>
          <div className="space-y-2">
            {Object.entries(teamStats.roleDistribution).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between text-xs">
                <span className="text-white/70">{role}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default TeamMemberSidebar;