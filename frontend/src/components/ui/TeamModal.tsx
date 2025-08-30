'use client';

import React from 'react';
import { GlassButton } from './GlassButton';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: 'online' | 'offline' | 'away';
  tasksAssigned?: number;
  tasksCompleted?: number;
}

export interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  teamMembers?: TeamMember[];
  onMemberSelect?: (memberId: string) => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  projectId,
  teamMembers = [],
  onMemberSelect
}) => {
  if (!isOpen) return null;

  const handleMemberClick = (memberId: string) => {
    onMemberSelect?.(memberId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="max-w-2xl w-full max-h-[80vh] transform animate-in zoom-in-95 duration-300">
        <div className="relative rounded-3xl border border-white/30 bg-gradient-to-br from-white/25 via-white/15 to-white/10 backdrop-blur-2xl shadow-2xl shadow-purple-500/20 overflow-hidden">
          {/* Subtle glowing border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-sm -z-10" />
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div>
              <h2 className="text-2xl font-bold text-white">Team Members</h2>
              <p className="text-white/70 text-sm">Project collaboration team</p>
            </div>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </GlassButton>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Team Members</h3>
                <p className="text-white/70">No team members found for this project.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => handleMemberClick(member.id)}
                    className="group relative rounded-2xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 p-4 hover:bg-white/15 hover:border-white/30 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            member.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* Status indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white/20`} />
                      </div>

                      {/* Member info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">{member.name}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70">
                            {member.role}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm truncate">{member.email}</p>
                        
                        {/* Task stats */}
                        {(member.tasksAssigned !== undefined || member.tasksCompleted !== undefined) && (
                          <div className="flex gap-4 mt-2 text-xs text-white/70">
                            {member.tasksAssigned !== undefined && (
                              <span>Assigned: {member.tasksAssigned}</span>
                            )}
                            {member.tasksCompleted !== undefined && (
                              <span>Completed: {member.tasksCompleted}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status text */}
                      <div className="text-right">
                        <span className={`text-xs font-medium ${
                          member.status === 'online' ? 'text-green-400' :
                          member.status === 'away' ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-white/20">
            <GlassButton
              variant="secondary"
              onClick={onClose}
            >
              Close
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};