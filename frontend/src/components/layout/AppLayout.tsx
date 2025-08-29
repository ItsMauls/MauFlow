'use client';

import React, { useState } from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import { GlassButton } from '../ui/GlassButton';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'search' | 'projects'>('dashboard');

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
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <GlassButton
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg"
            >
              Menu
            </GlassButton>
            <h1 className="text-lg font-semibold text-white">
              {activeSection === 'dashboard' && 'Dashboard'}
              {activeSection === 'search' && 'Search'}
              {activeSection === 'projects' && 'Projects'}
            </h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};