/**
 * Real-time Notification Integration Tests
 * Tests simulated real-time notification delivery, connection status, and offline queuing
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notificationService } from '@/services/NotificationService';
import { useNotifications, useConnectionStatus, useNotificationSimulation } from '@/hooks/useNotifications';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import ConnectionStatus from '@/components/notifications/ConnectionStatus';
import RealTimeIndicator from '@/components/notifications/RealTimeIndicator';
import NotificationSimulator from '@/components/notifications/NotificationSimulator';
import * as mockData from '@/lib/mockData';

// Mock the notification service
jest.mock('@/services/NotificationService');
jest.mock('@/lib/mockData');

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;
const mockDataModule = mockData as jest.Mocked<typeof mockData>;

// Test component that uses real-time hooks
const TestRealTimeComponent: React.FC = () => {
  const { notifications, unreadCount, connectionStatus } = useNotifications();
  const { isConnected, isConnecting, isDisconnected } = useConnectionStatus();
  const { simulateNotification, startSimulation, stopSimulation, isSimulating } = useNotificationSimulation();

  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="connection-status">{connectionStatus}</div>
      <div data-testid="is-connected">{isConnected.toString()}</div>
      <div data-testid="is-connecting">{isConnecting.toString()}</div>
      <div data-testid="is-disconnected">{isDisconnected.toString()}</div>
      <div data-testid="is-simulating">{isSimulating.toString()}</div>
      
      <button 
        data-testid="simulate-delegation"
        onClick={() => simulateNotification('task_delegated')}
      >
        Simulate Delegation
      </button>
      
      <button 
        data-testid="simulate-mention"
        onClick={() => simulateNotification('comment_mention')}
      >
        Simulate Mention
      </button>
      
      <button 
        data-testid="start-simulation"
        onClick={() => startSimulation()}
      >
        Start Simulation
      </button>
      
      <button 
        data-testid="stop-simulation"
        onClick={() => stopSimulation()}
      >
        Stop Simulation
      </button>
    </div>
  );
};

describe('Real-time Notification Integration', () => {
  const mockCurrentUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: {
      id: 'role-1',
      name: 'Developer',
      canDelegate: true,
      canReceiveDelegations: true,
      canManageTeam: false
    }
  };

  const mockNotifications = [
    {
      id: 'notif-1',
      type: 'task_delegated' as const,
      title: 'New Task Assigned',
      message: 'You have been assigned a new task',
      recipientId: 'user-1',
      senderId: 'user-2',
      isRead: false,
      createdAt: '2025-08-29T10:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default mocks
    mockDataModule.currentUser = mockCurrentUser;
    mockNotificationService.getNotifications.mockReturnValue(mockNotifications);
    mockNotificationService.getUnreadCount.mockReturnValue(1);
    mockNotificationService.getConnectionStatus.mockReturnValue('connected');
    mockNotificationService.subscribe.mockImplementation((callback) => {
      callback(mockNotifications);
      return jest.fn();
    });
    mockNotificationService.subscribeToConnection.mockImplementation((callback) => {
      callback('connected');
      return jest.fn();
    });
    mockNotificationService.simulateRealTimeNotification.mockImplementation(() => {});
    mockNotificationService.startNotificationSimulation.mockImplementation(() => {});
    mockNotificationService.stopNotificationSimulation.mockImplementation(() => {});
    mockNotificationService.broadcastToMultipleUsers.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Connection Status Integration', () => {
    it('should display connection status correctly', () => {
      render(<ConnectionStatus showText />);
      
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(mockNotificationService.subscribeToConnection).toHaveBeenCalled();
    });

    it('should handle connection status changes', async () => {
      let connectionCallback: (status: any) => void = () => {};
      mockNotificationService.subscribeToConnection.mockImplementation((callback) => {
        connectionCallback = callback;
        callback('connected');
        return jest.fn();
      });

      render(<TestRealTimeComponent />);
      
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      expect(screen.getByTestId('is-connected')).toHaveTextContent('true');

      // Simulate connection loss
      act(() => {
        connectionCallback('disconnected');
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
        expect(screen.getByTestId('is-disconnected')).toHaveTextContent('true');
      });
    });

    it('should show connecting state', async () => {
      let connectionCallback: (status: any) => void = () => {};
      mockNotificationService.subscribeToConnection.mockImplementation((callback) => {
        connectionCallback = callback;
        callback('connecting');
        return jest.fn();
      });

      render(<TestRealTimeComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connecting');
        expect(screen.getByTestId('is-connecting')).toHaveTextContent('true');
      });
    });
  });

  describe('Real-time Indicator Integration', () => {
    it('should show real-time indicator when connected', () => {
      mockNotificationService.subscribeToConnection.mockImplementation((callback) => {
        callback('connected');
        return jest.fn();
      });

      render(<RealTimeIndicator />);
      
      // Should show the live indicator (green dot)
      const indicator = document.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should hide indicator when disconnected', () => {
      mockNotificationService.subscribeToConnection.mockImplementation((callback) => {
        callback('disconnected');
        return jest.fn();
      });

      render(<RealTimeIndicator />);
      
      // Component should not render when disconnected
      const indicator = document.querySelector('.bg-green-500');
      expect(indicator).not.toBeInTheDocument();
    });

    it('should show activity animation on real-time events', async () => {
      mockNotificationService.subscribeToConnection.mockImplementation((callback) => {
        callback('connected');
        return jest.fn();
      });

      render(<RealTimeIndicator />);
      
      // Simulate real-time notification event
      const event = new CustomEvent('realtime-notification', {
        detail: {
          notification: mockNotifications[0],
          timestamp: new Date().toISOString()
        }
      });

      act(() => {
        window.dispatchEvent(event);
      });

      // Should show activity indicators (bouncing dots)
      await waitFor(() => {
        const activityDots = document.querySelectorAll('.animate-bounce');
        expect(activityDots.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Notification Simulation Integration', () => {
    it('should simulate single notifications', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<TestRealTimeComponent />);
      
      await user.click(screen.getByTestId('simulate-delegation'));
      
      expect(mockNotificationService.simulateRealTimeNotification).toHaveBeenCalledWith(
        'task_delegated',
        'user-1',
        500
      );
    });

    it('should start and stop automatic simulation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<TestRealTimeComponent />);
      
      // Start simulation
      await user.click(screen.getByTestId('start-simulation'));
      
      expect(mockNotificationService.startNotificationSimulation).toHaveBeenCalledWith('user-1', undefined);
      expect(screen.getByTestId('is-simulating')).toHaveTextContent('true');
      
      // Stop simulation
      await user.click(screen.getByTestId('stop-simulation'));
      
      expect(mockNotificationService.stopNotificationSimulation).toHaveBeenCalled();
      expect(screen.getByTestId('is-simulating')).toHaveTextContent('false');
    });

    it('should handle notification simulator component', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<NotificationSimulator userId="user-1" />);
      
      // Should render simulation controls
      expect(screen.getByText('Notification Simulator')).toBeInTheDocument();
      expect(screen.getByText('Simulate Delegation')).toBeInTheDocument();
      expect(screen.getByText('Simulate Mention')).toBeInTheDocument();
      
      // Test single notification simulation
      await user.click(screen.getByText('Simulate Delegation'));
      
      expect(mockNotificationService.simulateRealTimeNotification).toHaveBeenCalledWith(
        'task_delegated',
        'user-1',
        500
      );
    });
  });

  describe('NotificationCenter Real-time Integration', () => {
    it('should show connection status in notification center', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<NotificationCenter />);
      
      // Open notification center
      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);
      
      // Should show connection status
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });

    it('should show offline mode indicator when disconnected', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      mockNotificationService.subscribeToConnection.mockImplementation((callback) => {
        callback('disconnected');
        return jest.fn();
      });
      
      render(<NotificationCenter />);
      
      // Open notification center
      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);
      
      // Should show offline mode
      await waitFor(() => {
        expect(screen.getByText('Offline mode')).toBeInTheDocument();
      });
    });

    it('should show real-time indicator in notification center', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<NotificationCenter />);
      
      // Open notification center
      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);
      
      // Should show real-time indicator
      await waitFor(() => {
        const indicator = document.querySelector('.bg-green-500');
        expect(indicator).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Event Handling', () => {
    it('should handle real-time notification events', async () => {
      const mockLoadNotifications = jest.fn();
      
      // Mock the useNotifications hook to track calls
      const originalUseNotifications = require('@/hooks/useNotifications').useNotifications;
      jest.spyOn(require('@/hooks/useNotifications'), 'useNotifications').mockImplementation(() => ({
        ...originalUseNotifications(),
        refreshNotifications: mockLoadNotifications
      }));

      render(<TestRealTimeComponent />);
      
      // Simulate real-time notification event
      const event = new CustomEvent('realtime-notification', {
        detail: {
          notification: {
            ...mockNotifications[0],
            recipientId: 'user-1'
          },
          timestamp: new Date().toISOString()
        }
      });

      act(() => {
        window.dispatchEvent(event);
      });

      // Should trigger notification refresh after delay
      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(mockLoadNotifications).toHaveBeenCalled();
      });
    });

    it('should ignore real-time events for other users', async () => {
      const mockLoadNotifications = jest.fn();
      
      // Mock the useNotifications hook
      const originalUseNotifications = require('@/hooks/useNotifications').useNotifications;
      jest.spyOn(require('@/hooks/useNotifications'), 'useNotifications').mockImplementation(() => ({
        ...originalUseNotifications(),
        refreshNotifications: mockLoadNotifications
      }));

      render(<TestRealTimeComponent />);
      
      // Simulate real-time notification event for different user
      const event = new CustomEvent('realtime-notification', {
        detail: {
          notification: {
            ...mockNotifications[0],
            recipientId: 'user-2' // Different user
          },
          timestamp: new Date().toISOString()
        }
      });

      act(() => {
        window.dispatchEvent(event);
      });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      // Should not trigger notification refresh
      expect(mockLoadNotifications).not.toHaveBeenCalled();
    });
  });

  describe('Broadcast Functionality', () => {
    it('should broadcast notifications to multiple users', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<NotificationSimulator />);
      
      // Select multiple users for broadcast
      const userButtons = screen.getAllByRole('button');
      const userButton = userButtons.find(btn => btn.textContent?.includes('Jane'));
      
      if (userButton) {
        await user.click(userButton);
      }
      
      // Trigger broadcast
      const broadcastButton = screen.getByText('Broadcast Delegation');
      await user.click(broadcastButton);
      
      expect(mockNotificationService.broadcastToMultipleUsers).toHaveBeenCalled();
    });
  });

  describe('Performance and Cleanup', () => {
    it('should cleanup intervals on unmount', () => {
      const { unmount } = render(<TestRealTimeComponent />);
      
      // Start simulation
      act(() => {
        screen.getByTestId('start-simulation').click();
      });
      
      // Unmount component
      unmount();
      
      // Should call cleanup
      expect(mockNotificationService.stopNotificationSimulation).toHaveBeenCalled();
    });

    it('should handle rapid notification events efficiently', async () => {
      render(<RealTimeIndicator />);
      
      // Simulate multiple rapid events
      for (let i = 0; i < 10; i++) {
        const event = new CustomEvent('realtime-notification', {
          detail: {
            notification: mockNotifications[0],
            timestamp: new Date().toISOString()
          }
        });
        
        act(() => {
          window.dispatchEvent(event);
        });
      }
      
      // Should handle all events without errors
      const activityDots = document.querySelectorAll('.animate-bounce');
      expect(activityDots.length).toBeGreaterThan(0);
    });
  });
});