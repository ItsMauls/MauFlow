/**
 * RealTimeIndicator Component
 * Shows real-time activity indicators for notifications
 */

import React, { useState, useEffect } from 'react';
import { useConnectionStatus } from '@/hooks/useNotifications';

interface RealTimeIndicatorProps {
  className?: string;
  showPulse?: boolean;
}

const RealTimeIndicator: React.FC<RealTimeIndicatorProps> = ({ 
  className = '',
  showPulse = true
}) => {
  const { isConnected } = useConnectionStatus();
  const [recentActivity, setRecentActivity] = useState(false);
  const [activityCount, setActivityCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRealTimeNotification = () => {
      setRecentActivity(true);
      setActivityCount(prev => prev + 1);
      
      // Reset activity indicator after 3 seconds
      setTimeout(() => {
        setRecentActivity(false);
      }, 3000);
    };

    window.addEventListener('realtime-notification', handleRealTimeNotification);

    return () => {
      window.removeEventListener('realtime-notification', handleRealTimeNotification);
    };
  }, []);

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Live indicator */}
      <div className="relative">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        {showPulse && (
          <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-ping opacity-75" />
        )}
      </div>
      
      {/* Activity indicator */}
      {recentActivity && (
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      )}
      
      {/* Activity count (for debugging) */}
      {process.env.NODE_ENV === 'development' && activityCount > 0 && (
        <span className="text-xs text-gray-500 ml-1">
          {activityCount}
        </span>
      )}
    </div>
  );
};

export default RealTimeIndicator;