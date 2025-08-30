/**
 * TeamMemberDemo Component
 * Demonstrates the team member management components
 */
'use client'

import React, { useState } from 'react';
import { TeamMemberSelector } from './TeamMemberSelector';
import { TeamMemberList } from './TeamMemberList';
import { TeamMember } from '@/types/collaboration';
import { GlassCard } from '@/components/ui/GlassCard';

export const TeamMemberDemo: React.FC = () => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [clickedMember, setClickedMember] = useState<TeamMember | null>(null);

  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    console.log('Selected member ID:', memberId);
  };

  const handleMemberClick = (member: TeamMember) => {
    setClickedMember(member);
    console.log('Clicked member:', member);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Team Member Management Demo
          </h1>
          <p className="text-white/70 text-lg">
            Demonstrating team member selection and list components with mock data
          </p>
        </div>

        {/* Team Member Selector Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard className="p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Team Member Selector
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Basic Selector
                </label>
                <TeamMemberSelector
                  onSelect={handleMemberSelect}
                  placeholder="Select a team member..."
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Developers Only
                </label>
                <TeamMemberSelector
                  onSelect={handleMemberSelect}
                  filterByRole={['Developer']}
                  placeholder="Select a developer..."
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Exclude Alice Johnson
                </label>
                <TeamMemberSelector
                  onSelect={handleMemberSelect}
                  excludeUsers={['user-1']}
                  placeholder="Select team member (excluding Alice)..."
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Non-searchable
                </label>
                <TeamMemberSelector
                  onSelect={handleMemberSelect}
                  searchable={false}
                  placeholder="Click to select..."
                />
              </div>

              {selectedMemberId && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                  <p className="text-green-300 text-sm">
                    Selected Member ID: <span className="font-mono">{selectedMemberId}</span>
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Team Member List
            </h2>
            <TeamMemberList
              onMemberClick={handleMemberClick}
              maxHeight="400px"
            />

            {clickedMember && (
              <div className="mt-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                <p className="text-blue-300 text-sm mb-2">
                  Clicked Member:
                </p>
                <div className="text-white text-sm space-y-1">
                  <p><span className="text-blue-300">Name:</span> {clickedMember.name}</p>
                  <p><span className="text-blue-300">Role:</span> {clickedMember.role.name}</p>
                  <p><span className="text-blue-300">Email:</span> {clickedMember.email}</p>
                  <p><span className="text-blue-300">Status:</span> {clickedMember.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Team Member List Variations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard className="p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Compact List (No Search/Filters)
            </h2>
            <TeamMemberList
              showSearch={false}
              showFilters={false}
              maxHeight="300px"
            />
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Minimal List (Names Only)
            </h2>
            <TeamMemberList
              showOnlineStatus={false}
              showRoles={false}
              showLastSeen={false}
              maxHeight="300px"
            />
          </GlassCard>
        </div>

        {/* Feature Highlights */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Features Demonstrated
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">Team Member Selector</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Searchable dropdown</li>
                <li>• Keyboard navigation</li>
                <li>• Role-based filtering</li>
                <li>• User exclusion</li>
                <li>• Online status indicators</li>
                <li>• Custom placeholders</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">Team Member List</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Search functionality</li>
                <li>• Multiple sort options</li>
                <li>• Status filtering</li>
                <li>• Role information</li>
                <li>• Last seen timestamps</li>
                <li>• Permission indicators</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">Integration Features</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Local storage persistence</li>
                <li>• Mock data support</li>
                <li>• Real-time status updates</li>
                <li>• Responsive design</li>
                <li>• Glass morphism UI</li>
                <li>• Accessibility support</li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default TeamMemberDemo;