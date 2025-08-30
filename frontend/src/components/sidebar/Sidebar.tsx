'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { GlassButton } from '../ui/GlassButton';
import { ProjectsView } from '../projects/ProjectsView';
import type { Project } from '../projects/ProjectCard';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeSection: 'dashboard' | 'search' | 'projects';
  onSectionChange: (section: 'dashboard' | 'search' | 'projects') => void;
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
        'fixed left-4 top-4 bottom-4 w-80 z-50 transform transition-transform duration-300 ease-in-out',
        'border border-blue-400/20 bg-gradient-to-br from-blue-500/15 via-purple-500/8 to-blue-500/5 backdrop-blur-xl shadow-2xl shadow-blue-500/20',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:relative lg:left-0 lg:top-0 lg:bottom-0 lg:translate-x-0'
      )}>
        {/* Subtle glowing border effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/10 via-purple-400/5 to-blue-400/10 blur-sm -z-10" />
        {/* Header */}
        <div className="p-8 border-b border-blue-400/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-slate-100 bg-clip-text text-transparent">
              MauFlow
            </h2>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-105"
            >
              ×
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-6 space-y-3">
          {sidebarSections.map((section) => (
            <button
              key={section.key}
              onClick={() => onSectionChange(section.key)}
              className={cn(
                'w-full p-4 rounded-2xl text-left transition-all duration-300 group transform hover:scale-[1.02]',
                activeSection === section.key
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/10 border border-blue-400/30 shadow-xl shadow-blue-500/15'
                  : 'hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/5 border border-blue-400/10 hover:border-blue-400/20'
              )}
            >
              <div>
                <div className="font-semibold text-white group-hover:text-white/90 transition-colors">{section.label}</div>
                <div className="text-sm text-white/70 group-hover:text-white/80 transition-colors">{section.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-4">
                <div className="group relative rounded-2xl bg-gradient-to-br from-blue-500/15 to-purple-500/5 border border-blue-400/20 p-4 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/15 transition-all duration-300 cursor-pointer">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="font-medium text-white mb-1">Today's Focus</div>
                    <div className="text-white/70 text-sm">3 high priority tasks</div>
                  </div>
                </div>

                <div className="group relative rounded-2xl bg-gradient-to-br from-blue-500/12 to-purple-500/6 border border-blue-400/25 p-4 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/15 transition-all duration-300 cursor-pointer">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="font-medium text-white mb-1">Progress</div>
                    <div className="text-white/70 text-sm">67% tasks completed this week</div>
                  </div>
                </div>

                <div className="group relative rounded-2xl bg-gradient-to-br from-purple-500/12 to-blue-500/6 border border-purple-400/25 p-4 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/15 transition-all duration-300 cursor-pointer">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="font-medium text-white mb-1">Upcoming</div>
                    <div className="text-white/70 text-sm">2 tasks due tomorrow</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Section */}
          {activeSection === 'search' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Search Tasks & Projects</h3>
              
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Projects</h3>
                <GlassButton
                  size="sm"
                  onClick={() => setShowCreateProject(true)}
                  className="rounded-lg"
                >
                  +
                </GlassButton>
              </div>

              <ProjectsView
                projects={projects}
                onCreateProject={() => setShowCreateProject(true)}
              />
            </div>
          )}
        </div>

        {/* Create Project Modal */}
        {showCreateProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-60 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="max-w-md w-full transform animate-in zoom-in-95 duration-300">
              <div className="relative rounded-3xl border border-blue-400/30 bg-gradient-to-br from-blue-500/25 via-purple-500/15 to-blue-500/10 backdrop-blur-2xl shadow-2xl shadow-blue-500/20 p-8">
                {/* Subtle glowing border effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/10 via-purple-400/5 to-blue-400/10 blur-sm -z-10" />
                <h3 className="text-2xl font-bold text-white mb-6">
                  Create New Project
                </h3>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-medium">
                      Project Name (URL-friendly)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., website-redesign"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200"
                      autoFocus
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-medium">
                      Project Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Website Redesign Project"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                  <GlassButton
                    variant="primary"
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim() || !newProjectTitle.trim()}
                    className="flex-1 rounded-2xl py-4"
                  >
                    Create Project
                  </GlassButton>
                  <GlassButton
                    variant="secondary"
                    onClick={() => setShowCreateProject(false)}
                    className="rounded-2xl px-6"
                  >
                    Cancel
                  </GlassButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};