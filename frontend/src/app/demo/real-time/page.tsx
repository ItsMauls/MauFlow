/**
 * Real-time Notifications Demo Page
 * Demonstrates simulated real-time notification features
 */

'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { 
  NotificationCenter, 
  ConnectionStatus, 
  RealTimeIndicator, 
  NotificationSimulator 
} from '@/components/notifications';
import { useNotifications, useConnectionStatus, useNotificationSimulation } from '@/hooks/useNotifications';

const RealTimeNotificationsDemo: React.FC = () => {
  const [showSimulator, setShowSimulator] = useState(true);
  const { notifications, unreadCount, connectionStatus } = useNotifications();
  const { isConnected, lastConnected } = useConnectionStatus();
  const { simulateNotification, isSimulating } = useNotificationSimulation();

  const handleQuickSimulation = (type: 'task_delegated' | 'comment_mention') => {
    simulateNotification(type, undefined, 1000);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Real-time Notifications Demo
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Experience simulated real-time notification delivery with connection status monitoring,
            offline queuing, and live activity indicators.
          </p>
        </div>

        {/* Status Overview */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Connection Status */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-white/80 mb-2">Connection</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <ConnectionStatus showText />
              </div>
              <p className="text-xs text-white/60">
                {isConnected ? 'Real-time updates active' : `Last connected: ${lastConnected.toLocaleTimeString()}`}
              </p>
            </div>

            {/* Activity Status */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-white/80 mb-2">Activity</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <RealTimeIndicator showPulse />
                <span className="text-sm text-white/70">
                  {isSimulating ? 'Auto simulation' : 'Manual mode'}
                </span>
              </div>
              <p className="text-xs text-white/60">
                Live notification monitoring
              </p>
            </div>

            {/* Notification Count */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-white/80 mb-2">Notifications</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold text-white">{notifications.length}</span>
                <span className="text-sm text-white/70">total</span>
              </div>
              <p className="text-xs text-white/60">
                {unreadCount} unread
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleQuickSimulation('task_delegated')}
              variant="outline"
              className="bg-blue-500/20 border-blue-500/50 text-blue-200 hover:bg-blue-500/30"
            >
              📋 Simulate Task Delegation
            </Button>
            <Button
              onClick={() => handleQuickSimulation('comment_mention')}
              variant="outline"
              className="bg-green-500/20 border-green-500/50 text-green-200 hover:bg-green-500/30"
            >
              💬 Simulate Mention
            </Button>
            <Button
              onClick={() => setShowSimulator(!showSimulator)}
              variant="outline"
              className="bg-purple-500/20 border-purple-500/50 text-purple-200 hover:bg-purple-500/30"
            >
              {showSimulator ? '🔧 Hide Simulator' : '🔧 Show Simulator'}
            </Button>
          </div>
        </GlassCard>

        {/* Notification Simulator */}
        {showSimulator && (
          <NotificationSimulator className="max-w-2xl mx-auto" />
        )}

        {/* Features Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Features */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Real-time Features</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-white">Live Connection Status</h3>
                  <p className="text-xs text-white/60">
                    Monitor connection health with visual indicators
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-white">Simulated Real-time Updates</h3>
                  <p className="text-xs text-white/60">
                    Experience notifications with realistic network delays
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-white">Activity Indicators</h3>
                  <p className="text-xs text-white/60">
                    Visual feedback for live notification activity
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-white">Offline Queue</h3>
                  <p className="text-xs text-white/60">
                    Notifications queued during connection issues
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Simulation Controls */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Simulation Controls</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-white">Single Notifications</h3>
                  <p className="text-xs text-white/60">
                    Trigger individual notification types manually
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-white">Broadcast Simulation</h3>
                  <p className="text-xs text-white/60">
                    Send notifications to multiple users simultaneously
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-white">Auto Simulation</h3>
                  <p className="text-xs text-white/60">
                    Continuous notification generation for testing
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-white">Connection Simulation</h3>
                  <p className="text-xs text-white/60">
                    Simulate connection drops and recovery
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Instructions */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">How to Test</h2>
          <div className="space-y-3 text-white/70">
            <p>
              <strong className="text-white">1. Connection Status:</strong> Watch the connection indicator 
              in the top navigation. It will occasionally simulate connection issues.
            </p>
            <p>
              <strong className="text-white">2. Real-time Notifications:</strong> Use the quick action buttons 
              or the simulator to trigger notifications. Watch for the activity indicators.
            </p>
            <p>
              <strong className="text-white">3. Notification Center:</strong> Click the bell icon in the 
              navigation to see notifications with real-time status indicators.
            </p>
            <p>
              <strong className="text-white">4. Auto Simulation:</strong> Enable automatic simulation 
              to see continuous notification delivery with realistic timing.
            </p>
            <p>
              <strong className="text-white">5. Browser Notifications:</strong> Grant notification 
              permissions to see native browser notifications for real-time events.
            </p>
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
};

export default RealTimeNotificationsDemo;