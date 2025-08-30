'use client';

import React, { useState } from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import { GlassButton } from '../ui/GlassButton';
import { NotificationCenter } from '../notifications/NotificationCenter';
import ConnectionStatus from '../notifications/ConnectionStatus';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'search' | 'projects' | 'team' | 'notifications'>('dashboard');

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Compact Header */}
        {/* <div className="p-3 border-b border-white/20 bg-gradient-to-r from-white/8 to-white/4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GlassButton
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden rounded-lg p-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </GlassButton>
              <h1 className="text-lg font-semibold text-white">
                {activeSection === 'dashboard' && 'Dashboard'}
                {activeSection === 'search' && 'Search'}
                {activeSection === 'projects' && 'Projects'}
                {activeSection === 'team' && 'Team'}
                {activeSection === 'notifications' && 'Notifications'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ConnectionStatus />
              <NotificationCenter />
            </div>
          </div>
        </div> */}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};