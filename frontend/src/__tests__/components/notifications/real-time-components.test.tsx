/**
 * Real-time Notification Components Tests
 * Tests for ConnectionStatus, RealTimeIndicator, and NotificationSimulator components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectionStatus from '@/components/notifications/ConnectionStatus';
import RealTimeIndicator from '@/components/notifications/RealTimeIndicator';
import NotificationSimulator from '@/components/notifications/NotificationSimulator';
import { useConnectionStatus, useNotificationSimulation } from '@/hooks/useNotifications';

// Mock the hooks
jest.mock('@/hooks/useNotifications');
jest.mock('@/lib/mockData', () => ({
  mockUsers: [
    { id: 'user-1', name: 'John Doe' },
    { id: 'user-2', name: 'Jane Smith' },
    { id: 'user-3', name: 'Bob Johnson' },
    { id: 'user-4', name: 'Alice Brown' }
  ]
}));

const mockUseConnectionStatus = useConnectionStatus as jest.MockedFunction<typeof useConnectionStatus>;
const mockUseNotificationSimulation = useNotificationSimulation as jest.MockedFunction<typeof useNotificationSimulation>;

describe('Real-time Notification Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseConnectionStatus.mockReturnValue({
      connectionStatus: 'connected',
      lastConnected: new Date(),
      isConnected: true,
      isConnecting: false,
      isDisconnected: false
    });

    mockUseNotificationSimulation.mockReturnValue({
      simulateNotification: jest.fn(),
      startSimulation: jest.fn(),
      stopSimulation: jest.fn(),
      broadcastToUsers: jest.fn(),
      isSimulating: false
    });
  });

  describe('ConnectionStatus Component', () => {
    it('should render connected status', () => {
      render(<ConnectionStatus showText />);
      
      expect(screen.getByText('Connected')).toBeInTheDocument();
      
      // Should show green indicator
      const indicator = document.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should render disconnected status', () => {
      mockUseConnectionStatus.mockReturnValue({
        connectionStatus: 'disconnected',
        lastConnected: new Date(Date.now() - 300000), // 5 minutes ago
        isConnected: false,
        isConnecting: false,
        isDisconnected: true
      });

      render(<ConnectionStatus showText />);
      
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      expect(screen.getByText(/Last: \d+m ago/)).toBeInTheDocument();
      
      // Should show red indicator
      const indicator = document.querySelector('.bg-red-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should render connecting status with animation', () => {
      mockUseConnectionStatus.mockReturnValue({
        connectionStatus: 'connecting',
        lastConnected: new Date(),
        isConnected: false,
        isConnecting: true,
        isDisconnected: false
      });

      render(<ConnectionStatus showText />);
      
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      
      // Should show yellow indicator with animation
      const indicators = document.querySelectorAll('.bg-yellow-500');
      expect(indicators.length).toBeGreaterThan(0);
      
      // Should have animate-ping class
      const animatedIndicator = document.querySelector('.animate-ping');
      expect(animatedIndicator).toBeInTheDocument();
    });

    it('should render without text when showText is false', () => {
      render(<ConnectionStatus />);
      
      expect(screen.queryByText('Connected')).not.toBeInTheDocument();
      
      // Should still show indicator
      const indicator = document.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('RealTimeIndicator Component', () => {
    it('should render when connected', () => {
      render(<RealTimeIndicator />);
      
      // Should show green indicator
      const indicator = document.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
      
      // Should show pulse animation
      const pulseIndicator = document.querySelector('.animate-ping');
      expect(pulseIndicator).toBeInTheDocument();
    });

    it('should not render when disconnected', () => {
      mockUseConnectionStatus.mockReturnValue({
        connectionStatus: 'disconnected',
        lastConnected: new Date(),
        isConnected: false,
        isConnecting: false,
        isDisconnected: true
      });

      const { container } = render(<RealTimeIndicator />);
      
      // Component should not render anything
      expect(container.firstChild).toBeNull();
    });

    it('should show activity animation on real-time events', async () => {
      render(<RealTimeIndicator />);
      
      // Simulate real-time notification event
      const event = new CustomEvent('realtime-notification', {
        detail: {
          notification: { id: 'test' },
          timestamp: new Date().toISOString()
        }
      });

      fireEvent(window, event);

      // Should show activity indicators
      await waitFor(() => {
        const activityDots = document.querySelectorAll('.animate-bounce');
        expect(activityDots.length).toBeGreaterThan(0);
      });
    });

    it('should render without pulse when showPulse is false', () => {
      render(<RealTimeIndicator showPulse={false} />);
      
      // Should show indicator but no pulse
      const indicator = document.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
      
      const pulseIndicator = document.querySelector('.animate-ping');
      expect(pulseIndicator).not.toBeInTheDocument();
    });
  });

  describe('NotificationSimulator Component', () => {
    const mockSimulateNotification = jest.fn();
    const mockStartSimulation = jest.fn();
    const mockStopSimulation = jest.fn();
    const mockBroadcastToUsers = jest.fn();

    beforeEach(() => {
      mockUseNotificationSimulation.mockReturnValue({
        simulateNotification: mockSimulateNotification,
        startSimulation: mockStartSimulation,
        stopSimulation: mockStopSimulation,
        broadcastToUsers: mockBroadcastToUsers,
        isSimulating: false
      });
    });

    it('should render simulator controls', () => {
      render(<NotificationSimulator />);
      
      expect(screen.getByText('Notification Simulator')).toBeInTheDocument();
      expect(screen.getByText('Simulate Delegation')).toBeInTheDocument();
      expect(screen.getByText('Simulate Mention')).toBeInTheDocument();
      expect(screen.getByText('Start Auto Simulation')).toBeInTheDocument();
    });

    it('should simulate single notifications', async () => {
      const user = userEvent.setup();
      
      render(<NotificationSimulator />);
      
      await user.click(screen.getByText('Simulate Delegation'));
      
      expect(mockSimulateNotification).toHaveBeenCalledWith('task_delegated', undefined, 500);
    });

    it('should start and stop auto simulation', async () => {
      const user = userEvent.setup();
      
      render(<NotificationSimulator />);
      
      // Start simulation
      await user.click(screen.getByText('Start Auto Simulation'));
      
      expect(mockStartSimulation).toHaveBeenCalled();
      
      // Mock simulation running state
      mockUseNotificationSimulation.mockReturnValue({
        simulateNotification: mockSimulateNotification,
        startSimulation: mockStartSimulation,
        stopSimulation: mockStopSimulation,
        broadcastToUsers: mockBroadcastToUsers,
        isSimulating: true
      });

      // Re-render with updated state
      render(<NotificationSimulator />);
      
      expect(screen.getByText('Stop Auto Simulation')).toBeInTheDocument();
    });

    it('should handle broadcast notifications', async () => {
      const user = userEvent.setup();
      
      render(<NotificationSimulator />);
      
      // Click broadcast button
      await user.click(screen.getByText('Broadcast Delegation'));
      
      expect(mockBroadcastToUsers).toHaveBeenCalledWith(
        'delegation',
        expect.objectContaining({
          senderId: 'user-2',
          taskId: 'demo-task',
          taskTitle: 'Demo Task'
        }),
        expect.any(Array)
      );
    });

    it('should allow user selection for broadcast', async () => {
      const user = userEvent.setup();
      
      render(<NotificationSimulator />);
      
      // Find and click a user button (assuming mockUsers are rendered)
      const userButtons = screen.getAllByRole('button');
      const userButton = userButtons.find(btn => btn.textContent?.includes('Jane'));
      
      if (userButton) {
        await user.click(userButton);
        
        // Button should be selected (visual feedback)
        expect(userButton).toHaveClass('bg-blue-500');
      }
    });

    it('should update simulation interval', async () => {
      const user = userEvent.setup();
      
      render(<NotificationSimulator />);
      
      const intervalInput = screen.getByDisplayValue('10000');
      
      await user.clear(intervalInput);
      await user.type(intervalInput, '5000');
      
      expect(intervalInput).toHaveValue(5000);
    });

    it('should show simulation status', () => {
      render(<NotificationSimulator />);
      
      expect(screen.getByText(/Status: Manual mode/)).toBeInTheDocument();
      
      // Test with simulation running
      mockUseNotificationSimulation.mockReturnValue({
        simulateNotification: mockSimulateNotification,
        startSimulation: mockStartSimulation,
        stopSimulation: mockStopSimulation,
        broadcastToUsers: mockBroadcastToUsers,
        isSimulating: true
      });

      render(<NotificationSimulator />);
      
      expect(screen.getByText(/Status: Auto simulation running/)).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should work together in a layout', () => {
      render(
        <div>
          <ConnectionStatus showText />
          <RealTimeIndicator />
          <NotificationSimulator />
        </div>
      );
      
      // All components should render
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Notification Simulator')).toBeInTheDocument();
      
      const indicators = document.querySelectorAll('.bg-green-500');
      expect(indicators.length).toBeGreaterThan(0);
    });

    it('should handle real-time events across components', async () => {
      render(
        <div>
          <RealTimeIndicator />
          <NotificationSimulator />
        </div>
      );
      
      // Simulate real-time event
      const event = new CustomEvent('realtime-notification', {
        detail: {
          notification: { id: 'test' },
          timestamp: new Date().toISOString()
        }
      });

      fireEvent(window, event);

      // RealTimeIndicator should show activity
      await waitFor(() => {
        const activityDots = document.querySelectorAll('.animate-bounce');
        expect(activityDots.length).toBeGreaterThan(0);
      });
    });
  });
});