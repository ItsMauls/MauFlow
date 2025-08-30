/**
 * Notification UI Demo Page
 * Demonstrates the notification UI components
 */

'use client';

import React from 'react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import { NotificationDemo } from '@/components/notifications/NotificationDemo';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useNotificationSimulation } from '@/hooks/useNotifications';

export default function NotificationUIDemo() {
  const { simulateNotification } = useNotificationSimulation();

  const handleSimulateDelegation = () => {
    simulateNotification('task_delegated');
  };

  const handleSimulateMention = () => {
    simulateNotification('comment_mention');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Notification UI Components Demo
          </h1>
          <p className="text-white/80 text-lg">
            Interactive demonstration of the notification system UI components
          </p>
        </div>

        {/* Navigation Bar Demo */}
        <GlassCard>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Navigation Integration
          </h2>
          <p className="text-white/80 mb-6">
            This shows how the notification components integrate into a navigation bar:
          </p>
          
          <div className="bg-white/5 rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-white font-semibold">MauFlow</div>
                <nav className="flex gap-4">
                  <a href="#" className="text-white/70 hover:text-white">Dashboard</a>
                  <a href="#" className="text-white/70 hover:text-white">Projects</a>
                  <a href="#" className="text-white/70 hover:text-white">Tasks</a>
                </nav>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Standalone Badge */}
                <div className="relative">
                  <button className="p-2 text-white/70 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                  <NotificationBadge className="absolute -top-1 -right-1" />
                </div>
                
                {/* Full Notification Center */}
                <NotificationCenter />
                
                <button className="p-2 text-white/70 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Component Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Notification Badge Variants */}
          <GlassCard>
            <h3 className="text-xl font-semibold text-white mb-4">
              Notification Badge Variants
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-white/80 w-20">Small:</span>
                <NotificationBadge size="sm" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/80 w-20">Medium:</span>
                <NotificationBadge size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/80 w-20">Large:</span>
                <NotificationBadge size="lg" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/80 w-20">Show Zero:</span>
                <NotificationBadge showZero />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/80 w-20">Clickable:</span>
                <NotificationBadge 
                  onClick={() => alert('Badge clicked!')} 
                  className="cursor-pointer"
                />
              </div>
            </div>
          </GlassCard>

          {/* Simulation Controls */}
          <GlassCard>
            <h3 className="text-xl font-semibold text-white mb-4">
              Simulation Controls
            </h3>
            <p className="text-white/80 mb-4">
              Test the notification system by simulating different types of notifications:
            </p>
            <div className="space-y-3">
              <GlassButton
                onClick={handleSimulateDelegation}
                className="w-full"
                variant="primary"
              >
                Simulate Task Delegation
              </GlassButton>
              <GlassButton
                onClick={handleSimulateMention}
                className="w-full"
                variant="secondary"
              >
                Simulate Comment Mention
              </GlassButton>
            </div>
          </GlassCard>
        </div>

        {/* Full Notification Demo */}
        <GlassCard>
          <h2 className="text-2xl font-semibold text-white mb-6">
            Complete Notification System
          </h2>
          <NotificationDemo />
        </GlassCard>

        {/* Usage Instructions */}
        <GlassCard>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Usage Instructions
          </h2>
          <div className="space-y-4 text-white/80">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">NotificationCenter</h3>
              <p>
                The main notification dropdown component. Click the bell icon in the navigation 
                to open the notification center. It shows all notifications with options to 
                mark as read, delete, or navigate to related content.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">NotificationBadge</h3>
              <p>
                A standalone badge component that shows the unread notification count. 
                Can be used independently or as part of other UI elements.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">NotificationItem</h3>
              <p>
                Individual notification display component used within the NotificationCenter. 
                Shows notification content, metadata, and action buttons.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Accessibility Features */}
        <GlassCard>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Accessibility Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/80">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Keyboard Navigation</h3>
              <ul className="space-y-1 text-sm">
                <li>• Tab to navigate between elements</li>
                <li>• Enter/Space to activate buttons</li>
                <li>• Escape to close dropdown</li>
                <li>• Arrow keys for list navigation</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Screen Reader Support</h3>
              <ul className="space-y-1 text-sm">
                <li>• Proper ARIA labels and roles</li>
                <li>• Descriptive button text</li>
                <li>• Status announcements</li>
                <li>• Semantic HTML structure</li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}