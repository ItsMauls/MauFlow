/**
 * ConnectionStatus Component
 * Displays real-time connection status with visual indicators
 */

import React from 'react';
import { useConnectionStatus } from '@/hooks/useNotifications';
import { ConnectionStatus as ConnectionStatusType } from '@/types/collaboration';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className = '', 
  showText = false 
}) => {
  const { connectionStatus, lastConnected, isConnected } = useConnectionStatus();

  const getStatusColor = (status: ConnectionStatusType): string => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ConnectionStatusType): string => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  const formatLastConnected = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Indicator */}
      <div className="relative">
        <div 
          className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus)} transition-colors duration-200`}
        />
        {connectionStatus === 'connecting' && (
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
        )}
        {isConnected && (
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        )}
      </div>

      {/* Status Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {getStatusText(connectionStatus)}
          </span>
          {!isConnected && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last: {formatLastConnected(lastConnected)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;