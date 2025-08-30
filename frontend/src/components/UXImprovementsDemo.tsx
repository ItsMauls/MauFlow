'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from './ui/GlassCard';
import { CompactFilters } from './ui/CompactFilters';
import { NotificationCenter } from './notifications/NotificationCenter';
import { DelegationControls } from './delegation/DelegationControls';
import { TaskCard, Task } from './tasks/TaskCard';

export const UXImprovementsDemo: React.FC = () => {
  const [currentSort, setCurrentSort] = useState('recent');
  const [currentView, setCurrentView] = useState('grid');
  const [currentStatus, setCurrentStatus] = useState('all');

  // Mock task data
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Implement new UI design',
      description: 'Create responsive components with improved UX',
      status: 'doing',
      priority: 'high',
      dueDate: '2025-09-05',
      createdAt: '2025-08-28T10:00:00Z',
      aiScore: 92
    },
    {
      id: '2',
      title: 'Optimize performance',
      description: 'Reduce bundle size and improve loading times',
      status: 'todo',
      priority: 'medium',
      createdAt: '2025-08-29T14:30:00Z',
      aiScore: 85
    },
    {
      id: '3',
      title: 'Write documentation',
      status: 'done',
      priority: 'low',
      createdAt: '2025-08-27T09:15:00Z',
      aiScore: 78
    }
  ]);

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleDelegate = (taskId: string, assigneeId: string, note?: string) => {
    console.log(`Task ${taskId} delegated to ${assigneeId}`, { note });
  };

  // Mock team members for delegation
  const teamMembers = [
    { id: '1', name: 'Alice Johnson', avatar: 'AJ' },
    { id: '2', name: 'Bob Smith', avatar: 'BS' },
    { id: '3', name: 'Carol Davis', avatar: 'CD' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                UX Improvements Demo
              </h1>
              <p className="text-white/70 text-sm">
                Compact, minimal scroll design with improved filters and delegation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-white/60">Notifications:</div>
              <NotificationCenter />
            </div>
          </div>
        </GlassCard>

        {/* Compact Filters Demo */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Compact Filters</h2>
            <CompactFilters
              currentSort={currentSort}
              currentView={currentView}
              currentStatus={currentStatus}
              onSortChange={setCurrentSort}
              onViewChange={setCurrentView}
              onStatusChange={setCurrentStatus}
            />
          </div>
          <div className="text-sm text-white/60">
            All filters are now single-line select dropdowns for minimal space usage
          </div>
        </GlassCard>

        {/* Delegation Demo */}
        <GlassCard className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Compact Delegation</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-white/70 text-sm">Delegate Button:</span>
              <DelegationControls
                task={tasks[0]}
                onDelegate={handleDelegate}
                canDelegate={true}
              />
            </div>
            <div className="text-sm text-white/60">
              • Removed text, now just a rounded + icon<br/>
              • No quick delegate buttons<br/>
              • Shows delegated members as rounded avatars with initials<br/>
              • Multi-delegate support with avatar display
            </div>
          </div>
        </GlassCard>

        {/* Team Contributors Demo */}
        <GlassCard className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Team Contributors (Jira Style)</h2>
          <div className="space-y-3">
            <div className="text-xs text-white/60">Contributors (8)</div>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="relative group"
                  title={`${member.name}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-xs font-medium text-white border-2 border-white/20 hover:border-white/40 transition-all duration-200">
                    {member.avatar}
                  </div>
                  {index < 2 && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  )}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-xs text-white/60">
                +5
              </div>
            </div>
            <div className="text-sm text-white/60">
              Shows contributors with rounded avatars, online status indicators, and overflow count
            </div>
          </div>
        </GlassCard>

        {/* Compact Task Cards */}
        <GlassCard className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Compact Task Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDelete}
                className="transform-none hover:transform-none" // Disable hover effects for demo
              />
            ))}
          </div>
          <div className="mt-4 text-sm text-white/60">
            • Reduced padding and spacing<br/>
            • Smaller traffic light buttons<br/>
            • Compact status and priority controls<br/>
            • Minimal action buttons with icons only<br/>
            • Single-line layouts where possible
          </div>
        </GlassCard>

        {/* Layout Improvements */}
        <GlassCard className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Layout Improvements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-medium mb-2">Sidebar Changes</h3>
              <ul className="text-sm text-white/60 space-y-1">
                <li>• Internal scrolling instead of page scroll</li>
                <li>• Reduced gaps between menu items</li>
                <li>• Compact navigation sections</li>
                <li>• Removed verbose project stats</li>
                <li>• Information moved to dedicated button</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">Header Changes</h3>
              <ul className="text-sm text-white/60 space-y-1">
                <li>• Removed navbar, moved to header</li>
                <li>• Notification button in header</li>
                <li>• Compact notification bell</li>
                <li>• Reduced header height</li>
                <li>• Minimal padding throughout</li>
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* Before/After Comparison */}
        <GlassCard className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Key Improvements Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-green-400 font-medium">✅ Implemented</h3>
              <ul className="text-sm text-white/60 space-y-1">
                <li>• Minimal scroll design</li>
                <li>• Compact filter selects (1 line)</li>
                <li>• Rounded + icon for delegation</li>
                <li>• Avatar-based delegate display</li>
                <li>• Notification in header (no navbar)</li>
                <li>• Jira-style team contributors</li>
                <li>• Sidebar internal scrolling</li>
                <li>• Reduced spacing throughout</li>
                <li>• Information button for stats</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-blue-400 font-medium">🎯 Benefits</h3>
              <ul className="text-sm text-white/60 space-y-1">
                <li>• Less scrolling required</li>
                <li>• More content visible at once</li>
                <li>• Cleaner, modern interface</li>
                <li>• Better space utilization</li>
                <li>• Improved workflow efficiency</li>
                <li>• Consistent with modern UX patterns</li>
                <li>• Mobile-friendly design</li>
                <li>• Reduced cognitive load</li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default UXImprovementsDemo;