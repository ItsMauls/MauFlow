/**
 * NotificationPreferences Component
 * UI for managing user notification preferences and settings
 */

'use client';

import React, { useState } from 'react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { NotificationType } from '@/types/collaboration';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { 
  getNotificationTypeDisplayName, 
  getNotificationTypeDescription 
} from '@/lib/notificationPreferences';

interface NotificationPreferencesProps {
  className?: string;
  onClose?: () => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  className,
  onClose
}) => {
  const {
    preferences,
    isLoading,
    error,
    updatePreference,
    toggleNotificationType,
    summary,
    resetToDefaults
  } = useNotificationPreferences();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const notificationTypes: NotificationType[] = [
    'task_delegated',
    'task_completed', 
    'task_updated',
    'comment_mention',
    'comment_reply',
    'delegation_revoked'
  ];

  const handleQuietHoursToggle = () => {
    updatePreference('quietHours', {
      ...preferences.quietHours,
      enabled: !preferences.quietHours.enabled
    });
  };

  const handleQuietHoursTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    updatePreference('quietHours', {
      ...preferences.quietHours,
      [field]: value
    });
  };

  if (isLoading) {
    return (
      <GlassCard className={cn('p-6', className)}>
        <div className="flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
          <span className="ml-2 text-white/70">Loading preferences...</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={cn('p-6 max-w-2xl', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">
            Notification Preferences
          </h2>
          <p className="text-white/70 text-sm">
            Customize which notifications you receive and when
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close preferences"
          >
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">Notification Types:</span>
          <span className="text-white">
            {summary.totalEnabled} of {summary.totalEnabled + summary.totalDisabled} enabled
          </span>
        </div>
      </div>

      {/* Notification Types */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-medium text-white mb-3">Notification Types</h3>
        
        {notificationTypes.map((type) => (
          <div
            key={type}
            className="flex items-start justify-between p-3 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-white font-medium">
                  {getNotificationTypeDisplayName(type)}
                </h4>
                {preferences[type] && (
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">
                    Enabled
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm">
                {getNotificationTypeDescription(type)}
              </p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={preferences[type]}
                onChange={() => toggleNotificationType(type)}
                className="sr-only peer"
              />
              <div className={cn(
                'relative w-11 h-6 rounded-full transition-colors duration-200',
                'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/50',
                preferences[type] 
                  ? 'bg-blue-500' 
                  : 'bg-white/20'
              )}>
                <div className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200',
                  preferences[type] ? 'translate-x-5' : 'translate-x-0'
                )} />
              </div>
            </label>
          </div>
        ))}
      </div>

      {/* Advanced Settings */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <svg 
            className={cn('w-4 h-4 transition-transform', showAdvanced && 'rotate-90')}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium">Advanced Settings</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 pl-6 border-l-2 border-white/10">
            {/* General Settings */}
            <div className="space-y-3">
              <h4 className="text-white font-medium">General</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white text-sm">Sound Notifications</span>
                  <p className="text-white/60 text-xs">Play sound when notifications arrive</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.soundEnabled}
                    onChange={(e) => updatePreference('soundEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={cn(
                    'relative w-11 h-6 rounded-full transition-colors duration-200',
                    'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/50',
                    preferences.soundEnabled ? 'bg-blue-500' : 'bg-white/20'
                  )}>
                    <div className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200',
                      preferences.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white text-sm">Push Notifications</span>
                  <p className="text-white/60 text-xs">Show browser notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    onChange={(e) => updatePreference('pushNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={cn(
                    'relative w-11 h-6 rounded-full transition-colors duration-200',
                    'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/50',
                    preferences.pushNotifications ? 'bg-blue-500' : 'bg-white/20'
                  )}>
                    <div className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200',
                      preferences.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </div>
                </label>
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="space-y-3">
              <h4 className="text-white font-medium">Quiet Hours</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white text-sm">Enable Quiet Hours</span>
                  <p className="text-white/60 text-xs">Reduce notifications during specified hours</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.quietHours.enabled}
                    onChange={handleQuietHoursToggle}
                    className="sr-only peer"
                  />
                  <div className={cn(
                    'relative w-11 h-6 rounded-full transition-colors duration-200',
                    'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/50',
                    preferences.quietHours.enabled ? 'bg-blue-500' : 'bg-white/20'
                  )}>
                    <div className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200',
                      preferences.quietHours.enabled ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </div>
                </label>
              </div>

              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Start Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.startTime}
                      onChange={(e) => handleQuietHoursTimeChange('startTime', e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg',
                        'bg-white/10 border border-white/20 text-white',
                        'focus:outline-none focus:ring-2 focus:ring-white/50'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">End Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.endTime}
                      onChange={(e) => handleQuietHoursTimeChange('endTime', e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg',
                        'bg-white/10 border border-white/20 text-white',
                        'focus:outline-none focus:ring-2 focus:ring-white/50'
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <button
          onClick={resetToDefaults}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium',
            'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white',
            'border border-white/20 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-white/50'
          )}
        >
          Reset to Defaults
        </button>

        <div className="text-white/60 text-sm">
          Changes are saved automatically
        </div>
      </div>
    </GlassCard>
  );
};