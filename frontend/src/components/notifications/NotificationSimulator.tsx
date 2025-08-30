/**
 * NotificationSimulator Component
 * Provides controls for simulating real-time notifications (demo/testing purposes)
 */

import React, { useState } from 'react';
import { useNotificationSimulation } from '@/hooks/useNotifications';
import { mockUsers } from '@/lib/mockData';
import { Button } from '@/components/ui/Button';

interface NotificationSimulatorProps {
  className?: string;
  userId?: string;
}

const NotificationSimulator: React.FC<NotificationSimulatorProps> = ({ 
  className = '',
  userId 
}) => {
  const { 
    simulateNotification, 
    startSimulation, 
    stopSimulation, 
    broadcastToUsers,
    isSimulating 
  } = useNotificationSimulation();
  
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [simulationInterval, setSimulationInterval] = useState(10000); // 10 seconds

  const handleSimulateNotification = (type: 'task_delegated' | 'comment_mention') => {
    simulateNotification(type, userId, 500);
  };

  const handleBroadcast = (type: 'delegation' | 'mention' | 'task_update' | 'comment_reply') => {
    const recipients = selectedUsers.length > 0 ? selectedUsers : [userId || 'user-1'];
    const payload = {
      senderId: 'user-2',
      taskId: 'demo-task',
      taskTitle: 'Demo Task',
      commentId: 'demo-comment'
    };
    
    broadcastToUsers(type, payload, recipients);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleStartSimulation = () => {
    startSimulation(userId, simulationInterval);
  };

  const handleStopSimulation = () => {
    stopSimulation();
  };

  return (
    <div className={`p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Notification Simulator
      </h3>
      
      {/* Single Notification Simulation */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Single Notifications
        </h4>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => handleSimulateNotification('task_delegated')}
            variant="outline"
            size="sm"
          >
            Simulate Delegation
          </Button>
          <Button
            onClick={() => handleSimulateNotification('comment_mention')}
            variant="outline"
            size="sm"
          >
            Simulate Mention
          </Button>
        </div>
      </div>

      {/* Broadcast Simulation */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Broadcast to Multiple Users
        </h4>
        
        {/* User Selection */}
        <div className="mb-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Select recipients (leave empty for current user):
          </p>
          <div className="flex gap-2 flex-wrap">
            {mockUsers.slice(0, 4).map(user => (
              <button
                key={user.id}
                onClick={() => toggleUserSelection(user.id)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  selectedUsers.includes(user.id)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white/50 text-gray-700 border-gray-300 hover:bg-white/70'
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => handleBroadcast('delegation')}
            variant="outline"
            size="sm"
          >
            Broadcast Delegation
          </Button>
          <Button
            onClick={() => handleBroadcast('mention')}
            variant="outline"
            size="sm"
          >
            Broadcast Mention
          </Button>
          <Button
            onClick={() => handleBroadcast('task_update')}
            variant="outline"
            size="sm"
          >
            Broadcast Update
          </Button>
        </div>
      </div>

      {/* Automatic Simulation */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Automatic Simulation
        </h4>
        
        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Interval (ms):
          </label>
          <input
            type="number"
            value={simulationInterval}
            onChange={(e) => setSimulationInterval(Number(e.target.value))}
            min="5000"
            max="60000"
            step="1000"
            className="px-2 py-1 text-xs border rounded w-20 bg-white/50"
          />
        </div>
        
        <div className="flex gap-2">
          {!isSimulating ? (
            <Button
              onClick={handleStartSimulation}
              variant="outline"
              size="sm"
              className="bg-green-500/20 border-green-500/50 text-green-700 hover:bg-green-500/30"
            >
              Start Auto Simulation
            </Button>
          ) : (
            <Button
              onClick={handleStopSimulation}
              variant="outline"
              size="sm"
              className="bg-red-500/20 border-red-500/50 text-red-700 hover:bg-red-500/30"
            >
              Stop Auto Simulation
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Status: {isSimulating ? 'Auto simulation running' : 'Manual mode'}
        {selectedUsers.length > 0 && (
          <span className="ml-2">
            • Broadcasting to {selectedUsers.length} user(s)
          </span>
        )}
      </div>
    </div>
  );
};

export default NotificationSimulator;