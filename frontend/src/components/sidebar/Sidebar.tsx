'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { GlassButton } from '../ui/GlassButton';
import { EditableTitleIcon } from '../icons/EditableTitleIcon';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useDelegation } from '@/hooks/useDelegation';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { TeamMember } from '@/types/collaboration';
import { currentUser } from '@/lib/mockData';

interface Project {
  id: string;
  name: string;
  title: string;
  taskCount: number;
  createdAt: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeSection: 'dashboard' | 'search' | 'projects' | 'team' | 'notifications';
  onSectionChange: (section: 'dashboard' | 'search' | 'projects' | 'team' | 'notifications') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  activeSection,
  onSectionChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  
  // Collaboration hooks
  const teamMembersHook = useTeamMembers();
  const delegationHook = useDelegation();
  const notificationsHook = useNotifications();
  
  const { teamMembers, getOnlineMembers } = teamMembersHook;
  const { getMyActiveDelegations, getMyCreatedDelegations } = delegationHook;
  const { notifications, unreadCount } = notificationsHook;
  
  // Get collaboration data
  const onlineMembers = getOnlineMembers();
  const delegatableMembers = (teamMembersHook as any).getDelegatableMembers();
  const myActiveDelegations = getMyActiveDelegations();
  const myCreatedDelegations = getMyCreatedDelegations();
  const teamStats = (teamMembersHook as any).getTeamStats();
  const recentNotifications = notifications.slice(0, 3); // Show only 3 most recent

  // Mock projects data
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'website-redesign',
      title: 'Website Redesign Project',
      taskCount: 8,
      createdAt: '2025-08-25T10:00:00Z'
    },
    {
      id: '2',
      name: 'mobile-app',
      title: 'Mobile App Development',
      taskCount: 12,
      createdAt: '2025-08-20T14:30:00Z'
    },
    {
      id: '3',
      name: 'marketing-campaign',
      title: 'Q4 Marketing Campaign',
      taskCount: 5,
      createdAt: '2025-08-28T09:15:00Z'
    }
  ]);

  const handleCreateProject = () => {
    if (!newProjectName.trim() || !newProjectTitle.trim()) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName.toLowerCase().replace(/\s+/g, '-'),
      title: newProjectTitle,
      taskCount: 0,
      createdAt: new Date().toISOString()
    };

    setProjects(prev => [newProject, ...prev]);
    setNewProjectName('');
    setNewProjectTitle('');
    setShowCreateProject(false);
  };

  const sidebarSections = [
    {
      key: 'dashboard' as const,
      label: 'Dashboard',
      description: 'Overview & quick tasks'
    },
    {
      key: 'search' as const,
      label: 'Search',
      description: 'Find tasks & projects'
    },
    {
      key: 'projects' as const,
      label: 'Projects',
      description: 'Organized task collections'
    },
    {
      key: 'team' as const,
      label: 'Team',
      description: `${teamStats.online}/${teamStats.total} members online`
    },
    {
      key: 'notifications' as const,
      label: 'Notifications',
      description: unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'
    }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed left-4 top-4 bottom-4 w-72 z-50 transform transition-transform duration-300 ease-in-out flex flex-col',
        'border border-blue-400/20 bg-gradient-to-br from-blue-500/15 via-purple-500/8 to-blue-500/5 backdrop-blur-xl shadow-2xl shadow-blue-500/20 rounded-3xl',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:relative lg:left-0 lg:top-0 lg:bottom-0 lg:translate-x-0'
      )}>
        {/* Subtle glowing border effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/10 via-purple-400/5 to-blue-400/10 blur-sm -z-10" />
        
        {/* Header */}
        <div className="p-4 border-b border-blue-400/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white via-gray-100 to-slate-100 bg-clip-text text-transparent">
                MauFlow
              </h2>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
            >
              ×
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-1 flex-shrink-0">
          {sidebarSections.map((section) => (
            <button
              key={section.key}
              onClick={() => onSectionChange(section.key)}
              className={cn(
                'w-full p-3 text-left transition-all duration-300 group relative',
                activeSection === section.key
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/10 border border-blue-400/30'
                  : 'hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/5 border border-transparent hover:border-blue-400/20'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white text-sm">{section.label}</div>
                  <div className="text-xs text-white/60">{section.description}</div>
                </div>
                
                {/* Section-specific badges */}
                {section.key === 'team' && onlineMembers.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-300 font-medium">{onlineMembers.length}</span>
                  </div>
                )}
                
                {section.key === 'notifications' && unreadCount > 0 && (
                  <div className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Content Area with Internal Scroll */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white">Quick Actions</h3>
              
              <div className="space-y-2">
                <button className="w-full p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-400/20 hover:from-blue-500/15 hover:to-purple-500/10 transition-all duration-200 text-left">
                  <div className="font-medium text-white text-sm">Today's Focus</div>
                  <div className="text-white/60 text-xs">3 high priority tasks</div>
                </button>

                <button className="w-full p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-blue-500/5 border border-green-400/20 hover:from-green-500/15 hover:to-blue-500/10 transition-all duration-200 text-left">
                  <div className="font-medium text-white text-sm">Progress</div>
                  <div className="text-white/60 text-xs">67% completed this week</div>
                </button>

                <button className="w-full p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-400/20 hover:from-purple-500/15 hover:to-blue-500/10 transition-all duration-200 text-left">
                  <div className="font-medium text-white text-sm">Upcoming</div>
                  <div className="text-white/60 text-xs">2 tasks due tomorrow</div>
                </button>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    onClick={() => onSectionChange('team')}
                    className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-blue-500/5 border border-green-400/20 hover:from-green-500/15 hover:to-blue-500/10 transition-all duration-200"
                  >
                    <div className="text-lg font-bold text-white">{teamStats.online}</div>
                    <div className="text-xs text-white/60">Online</div>
                  </button>
                  
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => onSectionChange('notifications')}
                      className="p-2 rounded-lg bg-gradient-to-br from-red-500/10 to-pink-500/5 border border-red-400/20 hover:from-red-500/15 hover:to-pink-500/10 transition-all duration-200"
                    >
                      <div className="text-lg font-bold text-white">{unreadCount}</div>
                      <div className="text-xs text-white/60">Unread</div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search Section */}
          {activeSection === 'search' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white mb-4">Search Tasks & Projects</h3>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search everything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500/15 to-purple-500/10 border border-blue-400/30 text-white placeholder-white/50 backdrop-blur-sm hover:from-blue-500/20 hover:to-purple-500/15 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200"
                />
              </div>

              {searchQuery && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white/80">Search Results</h4>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/15 to-purple-500/10 border border-blue-400/20 hover:from-blue-500/20 hover:to-purple-500/15 transition-all duration-200 cursor-pointer">
                      <div className="font-medium text-white text-sm">Complete project proposal</div>
                      <div className="text-xs text-white/60">Task • High Priority</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/15 to-blue-500/10 border border-purple-400/20 hover:from-purple-500/20 hover:to-blue-500/15 transition-all duration-200 cursor-pointer">
                      <div className="font-medium text-white text-sm">Website Redesign Project</div>
                      <div className="text-xs text-white/60">Project • 8 tasks</div>
                    </div>
                  </div>
                </div>
              )}

              {!searchQuery && (
                <div className="text-center py-8">
                  <p className="text-white/60 text-sm">Start typing to search tasks and projects</p>
                </div>
              )}
            </div>
          )}

          {/* Projects Section */}
          {activeSection === 'projects' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Projects</h3>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="w-6 h-6 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => window.location.href = `/projects/${project.name}`}
                    className="w-full group rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-400/20 p-3 hover:from-blue-500/15 hover:to-purple-500/10 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">
                          {project.title}
                        </h4>
                        <p className="text-xs text-white/60 font-mono truncate">{project.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">{project.taskCount}</span>
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-400/30 to-purple-400/30 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white/40 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {projects.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-white/60 text-sm mb-3">No projects yet</p>
                  <button
                    onClick={() => setShowCreateProject(true)}
                    className="text-xs text-blue-300 hover:text-blue-200 underline"
                  >
                    Create Your First Project
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Team Section */}
          {activeSection === 'team' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Team</h3>
                <button
                  className="text-xs text-blue-300 hover:text-blue-200 underline"
                  onClick={() => {
                    // Navigate to full team page
                    console.log('Navigate to team page');
                  }}
                >
                  View All
                </button>
              </div>

              {/* Team Contributors - Jira Style */}
              <div className="space-y-2">
                <div className="text-xs text-white/60 mb-2">Contributors ({teamMembers.length})</div>
                <div className="flex flex-wrap gap-2">
                  {teamMembers.slice(0, 8).map((member) => (
                    <div
                      key={member.id}
                      className="relative group"
                      title={`${member.name} - ${member.role.name}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-xs font-medium text-white border-2 border-white/20 hover:border-white/40 transition-all duration-200">
                        {member.avatar || member.name.charAt(0).toUpperCase()}
                      </div>
                      {member.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                      )}
                    </div>
                  ))}
                  {teamMembers.length > 8 && (
                    <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-xs text-white/60">
                      +{teamMembers.length - 8}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-blue-500/5 border border-green-400/20">
                  <div className="text-lg font-bold text-white">{teamStats.online}</div>
                  <div className="text-xs text-white/60">Online</div>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-400/20">
                  <div className="text-lg font-bold text-white">{myActiveDelegations.length}</div>
                  <div className="text-xs text-white/60">My Tasks</div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full border border-red-500/30">
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* Recent Activity Summary */}
              <div className="space-y-2">
                {recentNotifications.length > 0 ? (
                  <div className="space-y-1">
                    {recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-2 rounded-lg border transition-all duration-200 cursor-pointer',
                          notification.isRead
                            ? 'bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-400/10 hover:from-blue-500/10 hover:to-purple-500/10'
                            : 'bg-gradient-to-r from-blue-500/15 to-purple-500/10 border-blue-400/30 hover:from-blue-500/20 hover:to-purple-500/15'
                        )}
                        onClick={() => {
                          console.log(`Navigate to notification: ${notification.id}`);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div className={cn(
                            'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                            notification.isRead ? 'bg-white/30' : 'bg-blue-400'
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white truncate">
                              {notification.title}
                            </div>
                            <div className="text-xs text-white/50 truncate">
                              {new Date(notification.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-2xl mb-2">📭</div>
                    <p className="text-white/60 text-xs">All caught up!</p>
                  </div>
                )}

                {notifications.length > 3 && (
                  <button
                    onClick={() => {
                      console.log('Navigate to all notifications');
                    }}
                    className="w-full text-xs text-blue-300 hover:text-blue-200 transition-colors duration-200 text-center py-2 border border-blue-400/20 rounded-lg hover:bg-blue-500/10"
                  >
                    View all {notifications.length}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Create Project Modal */}
        {showCreateProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Create New Project</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g., website-redesign"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Project Title</label>
                  <input
                    type="text"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="e.g., Website Redesign Project"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateProject(false)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || !newProjectTitle.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500/30 border border-blue-400/50 rounded-lg text-white hover:bg-blue-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};