'use client';

import React, { useState, useCallback } from 'react';
import { 
  UXEnhancementProvider, 
  KeyboardShortcutsModal, 
  VirtualList, 
  NotificationSystem,
  type Notification,
  GlassCard,
  GlassButton
} from './ui';
import { useKeyboardShortcuts, createCommonShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { useAccessibility } from '@/hooks/useAccessibility';

interface DemoItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export const UXEnhancementsDemo: React.FC = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Generate demo data
  const demoItems: DemoItem[] = Array.from({ length: 1000 }, (_, i) => ({
    id: `item-${i}`,
    title: `Demo Item ${i + 1}`,
    description: `This is a description for demo item ${i + 1}. It demonstrates virtual scrolling performance.`,
    priority: ['high', 'medium', 'low'][i % 3] as 'high' | 'medium' | 'low'
  }));

  // Notification management
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, { ...notification, id }]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleNotificationAction = useCallback((id: string, action: () => void) => {
    action();
    dismissNotification(id);
  }, [dismissNotification]);

  // Keyboard shortcuts
  const shortcuts = createCommonShortcuts({
    onNewTask: () => {
      addNotification({
        type: 'success',
        title: 'New Task Shortcut',
        message: 'Ctrl+N pressed - would create new task',
        duration: 3000
      });
    },
    onSearch: () => {
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      searchInput?.focus();
    },
    onToggleView: () => {
      setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
      addNotification({
        type: 'info',
        title: 'View Mode Changed',
        message: `Switched to ${viewMode === 'grid' ? 'list' : 'grid'} view`,
        duration: 2000
      });
    },
    onHelp: () => {
      setShowShortcuts(true);
    },
    onRefresh: () => {
      addNotification({
        type: 'info',
        title: 'Refreshing Data',
        message: 'Ctrl+R pressed - would refresh data',
        duration: 2000
      });
    }
  });

  useKeyboardShortcuts({ shortcuts });

  // Virtual list item renderer
  const renderItem = useCallback((item: DemoItem, index: number) => (
    <div className="p-4 m-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white">{item.title}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          item.priority === 'high' ? 'bg-red-500/20 text-red-300' :
          item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
          'bg-green-500/20 text-green-300'
        }`}>
          {item.priority}
        </span>
      </div>
      <p className="text-white/70 text-sm">{item.description}</p>
    </div>
  ), []);

  return (
    <UXEnhancementProvider keyboardShortcuts={{
      onNewTask: () => addNotification({
        type: 'success',
        title: 'New Task',
        message: 'Would create a new task',
        duration: 3000
      }),
      onSearch: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
      },
      onToggleView: () => setViewMode(prev => prev === 'grid' ? 'list' : 'grid'),
      onHelp: () => setShowShortcuts(true)
    }}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  UX Enhancements Demo
                </h1>
                <p className="text-white/70">
                  Demonstrating smooth animations, keyboard shortcuts, performance optimizations, and accessibility features
                </p>
              </div>
              <div className="flex gap-3">
                <GlassButton
                  variant="secondary"
                  onClick={() => setShowShortcuts(true)}
                  className="rounded-lg"
                >
                  Keyboard Shortcuts (?)
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={() => addNotification({
                    type: 'success',
                    title: 'Demo Notification',
                    message: 'This is a sample notification with smooth animations',
                    duration: 5000,
                    action: {
                      label: 'Action',
                      onClick: () => alert('Notification action clicked!')
                    }
                  })}
                  className="rounded-lg"
                >
                  Show Notification
                </GlassButton>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="search" className="text-white/80 text-sm font-medium">
                  Search:
                </label>
                <input
                  id="search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try Ctrl+K to focus..."
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white/80 text-sm font-medium">View:</span>
                <div className="flex gap-1 p-1 bg-white/10 rounded-lg border border-white/20">
                  {(['grid', 'list'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 capitalize ${
                        viewMode === mode
                          ? 'bg-white/20 text-white shadow-lg'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => addNotification({
                    type: 'error',
                    title: 'Error Notification',
                    message: 'This is an error notification example',
                    duration: 4000
                  })}
                  className="rounded-lg"
                >
                  Error
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => addNotification({
                    type: 'warning',
                    title: 'Warning Notification',
                    message: 'This is a warning notification example',
                    duration: 4000
                  })}
                  className="rounded-lg"
                >
                  Warning
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => addNotification({
                    type: 'info',
                    title: 'Info Notification',
                    message: 'This is an info notification example',
                    persistent: true
                  })}
                  className="rounded-lg"
                >
                  Persistent
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          {/* Virtual List Demo */}
          <GlassCard className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white mb-2">
                Performance Optimized Virtual List
              </h2>
              <p className="text-white/70 text-sm">
                Rendering 1,000 items efficiently with virtual scrolling. Only visible items are rendered.
              </p>
            </div>

            <VirtualList
              items={demoItems}
              itemHeight={100}
              containerHeight={400}
              renderItem={renderItem}
              className="rounded-lg border border-white/20"
              aria-label="Demo items list with virtual scrolling"
            />
          </GlassCard>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassCard className="p-6 hover-scale">
              <div className="mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Smooth Animations
                </h3>
                <p className="text-white/70 text-sm">
                  Enhanced transitions, micro-interactions, and performance-optimized animations with reduced motion support.
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-6 hover-scale">
              <div className="mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Accessibility First
                </h3>
                <p className="text-white/70 text-sm">
                  ARIA labels, keyboard navigation, screen reader support, and high contrast mode compatibility.
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-6 hover-scale">
              <div className="mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Keyboard Shortcuts
                </h3>
                <p className="text-white/70 text-sm">
                  Comprehensive keyboard navigation with customizable shortcuts for power users.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          shortcuts={shortcuts}
        />

        {/* Notification System */}
        <NotificationSystem
          notifications={notifications}
          onDismiss={dismissNotification}
          onAction={handleNotificationAction}
          position="top-right"
          maxNotifications={5}
        />
      </div>
    </UXEnhancementProvider>
  );
};