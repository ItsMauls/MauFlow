/**
 * Notification UI Integration Tests
 * Tests the integration between NotificationCenter, NotificationItem, and NotificationBadge
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/collaboration';

// Mock the useNotifications hook
jest.mock('@/hooks/useNotifications');
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'task_delegated',
    title: 'Task Delegated to You',
    message: 'John Doe has assigned you a new task: "Complete project documentation"',
    recipientId: 'user-1',
    senderId: 'user-2',
    resourceId: 'task-123',
    resourceType: 'task',
    isRead: false,
    createdAt: '2025-08-29T10:00:00Z',
    metadata: { taskTitle: 'Complete project documentation' }
  },
  {
    id: 'notif-2',
    type: 'comment_mention',
    title: 'Mentioned in Comment',
    message: 'Sarah mentioned you in a comment on task "Review UI designs"',
    recipientId: 'user-1',
    senderId: 'user-3',
    resourceId: 'comment-456',
    resourceType: 'comment',
    isRead: false,
    createdAt: '2025-08-29T09:30:00Z',
    metadata: { commentText: 'Hey @user-1, can you take a look at this?' }
  },
  {
    id: 'notif-3',
    type: 'task_completed',
    title: 'Task Completed',
    message: 'Your delegated task "Update database schema" has been completed',
    recipientId: 'user-1',
    senderId: 'user-4',
    resourceId: 'task-789',
    resourceType: 'task',
    isRead: true,
    createdAt: '2025-08-29T08:00:00Z',
    metadata: { taskTitle: 'Update database schema' }
  }
];

describe('Notification UI Integration', () => {
  const mockMarkAsRead = jest.fn();
  const mockMarkAllAsRead = jest.fn();
  const mockDeleteNotification = jest.fn();

  const mockUseNotificationsReturn = {
    notifications: mockNotifications,
    unreadCount: 2,
    isLoading: false,
    error: null,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    deleteNotification: mockDeleteNotification,
    clearOldNotifications: jest.fn(),
    refreshNotifications: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotifications.mockReturnValue(mockUseNotificationsReturn);
  });

  describe('NotificationCenter and NotificationBadge Integration', () => {
    it('shows consistent unread count between center and badge', () => {
      render(
        <div>
          <NotificationBadge />
          <NotificationCenter />
        </div>
      );

      // Both should show the same unread count
      const badgeCount = screen.getByLabelText('2 unread notifications');
      expect(badgeCount).toBeInTheDocument();

      const centerButton = screen.getByLabelText(/notifications.*2 unread/i);
      expect(centerButton).toBeInTheDocument();
    });

    it('updates both components when notifications change', () => {
      const { rerender } = render(
        <div>
          <NotificationBadge />
          <NotificationCenter />
        </div>
      );

      // Initial state
      expect(screen.getByText('2')).toBeInTheDocument();

      // Update notifications
      mockUseNotifications.mockReturnValue({
        ...mockUseNotificationsReturn,
        unreadCount: 1,
        notifications: mockNotifications.slice(1) // Remove first notification
      });

      rerender(
        <div>
          <NotificationBadge />
          <NotificationCenter />
        </div>
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Full Notification Workflow', () => {
    it('completes full notification interaction workflow', async () => {
      const user = userEvent.setup();
      
      render(<NotificationCenter />);

      // 1. Open notification center
      const centerButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(centerButton);

      // 2. Verify notifications are displayed
      expect(screen.getByText('Task Delegated to You')).toBeInTheDocument();
      expect(screen.getByText('Mentioned in Comment')).toBeInTheDocument();
      expect(screen.getByText('Task Completed')).toBeInTheDocument();

      // 3. Verify unread count display
      expect(screen.getByText('2 unread notifications')).toBeInTheDocument();

      // 4. Click on a notification
      const firstNotification = screen.getByText('Task Delegated to You');
      await user.click(firstNotification);

      // 5. Verify markAsRead was called
      expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('handles mark all as read functionality', async () => {
      const user = userEvent.setup();
      
      render(<NotificationCenter />);

      // Open notification center
      const centerButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(centerButton);

      // Click mark all as read
      const markAllButton = screen.getByText('Mark all read');
      await user.click(markAllButton);

      expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
    });

    it('handles individual notification deletion', async () => {
      const user = userEvent.setup();
      
      render(<NotificationCenter />);

      // Open notification center
      const centerButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(centerButton);

      // Find and click delete button for first notification
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(mockDeleteNotification).toHaveBeenCalledWith('notif-1');
    });

    it('handles individual mark as read', async () => {
      const user = userEvent.setup();
      
      render(<NotificationCenter />);

      // Open notification center
      const centerButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(centerButton);

      // Find and click mark as read button for first notification
      const markReadButtons = screen.getAllByText('Mark read');
      await user.click(markReadButtons[0]);

      expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
    });
  });

  describe('Error Handling Integration', () => {
    it('displays error state consistently across components', async () => {
      mockUseNotifications.mockReturnValue({
        ...mockUseNotificationsReturn,
        error: 'Network connection failed',
        isLoading: false
      });

      const user = userEvent.setup();
      render(<NotificationCenter />);

      const centerButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(centerButton);

      expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('handles loading state consistently', async () => {
      mockUseNotifications.mockReturnValue({
        ...mockUseNotificationsReturn,
        isLoading: true
      });

      const user = userEvent.setup();
      render(
        <div>
          <NotificationBadge />
          <NotificationCenter />
        </div>
      );

      // Badge should not render while loading
      expect(screen.queryByText('2')).not.toBeInTheDocument();

      // Center should show loading state
      const centerButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(centerButton);

      expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
    });
  });

  describe('Empty State Integration', () => {
    it('handles empty state consistently', async () => {
      mockUseNotifications.mockReturnValue({
        ...mockUseNotificationsReturn,
        notifications: [],
        unreadCount: 0
      });

      const user = userEvent.setup();
      render(
        <div>
          <NotificationBadge />
          <NotificationCenter />
        </div>
      );

      // Badge should not render when no notifications
      expect(screen.queryByText('0')).not.toBeInTheDocument();

      // Center should show empty state
      const centerButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(centerButton);

      expect(screen.getByText('No notifications')).toBeInTheDocument();
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains proper focus management', async () => {
      const user = userEvent.setup();
      render(<NotificationCenter />);

      const centerButton = screen.getByRole('button', { name: /notifications/i });
      
      // Open dropdown
      await user.click(centerButton);
      expect(screen.getByText('Notifications')).toBeInTheDocument();

      // Close with escape and verify focus returns to button
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
      });

      expect(centerButton).toHaveFocus();
    });

    it('provides proper ARIA labels and roles', async () => {
      const user = userEvent.setup();
      render(<NotificationCenter />);

      const centerButton = screen.getByRole('button', { name: /notifications.*2 unread/i });
      expect(centerButton).toHaveAttribute('aria-expanded', 'false');
      expect(centerButton).toHaveAttribute('aria-haspopup', 'true');

      await user.click(centerButton);
      expect(centerButton).toHaveAttribute('aria-expanded', 'true');

      // Check notification items have proper accessibility
      const notificationItems = screen.getAllByRole('button', { name: /notification:/i });
      expect(notificationItems).toHaveLength(3);

      notificationItems.forEach(item => {
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Real-time Updates Simulation', () => {
    it('handles dynamic notification updates', () => {
      const { rerender } = render(<NotificationCenter />);

      // Initial state
      expect(mockUseNotifications).toHaveBeenCalledTimes(1);

      // Simulate new notification arriving
      const newNotification: Notification = {
        id: 'notif-new',
        type: 'comment_reply',
        title: 'New Reply',
        message: 'Someone replied to your comment',
        recipientId: 'user-1',
        senderId: 'user-5',
        resourceId: 'comment-new',
        resourceType: 'comment',
        isRead: false,
        createdAt: '2025-08-29T10:15:00Z',
        metadata: {}
      };

      mockUseNotifications.mockReturnValue({
        ...mockUseNotificationsReturn,
        notifications: [newNotification, ...mockNotifications],
        unreadCount: 3
      });

      rerender(<NotificationCenter />);

      // Should reflect updated count
      const centerButton = screen.getByRole('button', { name: /notifications.*3 unread/i });
      expect(centerButton).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('handles large number of notifications efficiently', async () => {
      const manyNotifications = Array.from({ length: 50 }, (_, i) => ({
        ...mockNotifications[0],
        id: `notif-${i}`,
        title: `Notification ${i}`,
        message: `This is notification number ${i}`,
        createdAt: new Date(Date.now() - i * 60000).toISOString()
      }));

      mockUseNotifications.mockReturnValue({
        ...mockUseNotificationsReturn,
        notifications: manyNotifications,
        unreadCount: 50
      });

      const user = userEvent.setup();
      render(<NotificationCenter />);

      const centerButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(centerButton);

      // Should handle scrolling for many notifications
      const dropdown = screen.getByText('Notifications').closest('div');
      expect(dropdown).toHaveClass('max-h-80', 'overflow-y-auto');

      // Should display 99+ for large counts
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });
});