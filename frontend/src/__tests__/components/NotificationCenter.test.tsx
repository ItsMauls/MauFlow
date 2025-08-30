/**
 * NotificationCenter Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/collaboration';

// Mock the useNotifications hook
jest.mock('@/hooks/useNotifications');
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'task_delegated',
    title: 'Task Delegated',
    message: 'You have been assigned a new task',
    recipientId: 'user-1',
    senderId: 'user-2',
    resourceId: 'task-1',
    resourceType: 'task',
    isRead: false,
    createdAt: '2025-08-29T10:00:00Z',
    metadata: {}
  },
  {
    id: 'notif-2',
    type: 'comment_mention',
    title: 'Mentioned in Comment',
    message: 'You were mentioned in a comment',
    recipientId: 'user-1',
    senderId: 'user-3',
    resourceId: 'comment-1',
    resourceType: 'comment',
    isRead: true,
    createdAt: '2025-08-29T09:00:00Z',
    metadata: {}
  }
];

const mockUseNotificationsReturn = {
  notifications: mockNotifications,
  unreadCount: 1,
  isLoading: false,
  error: null,
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  clearOldNotifications: jest.fn(),
  refreshNotifications: jest.fn()
};

describe('NotificationCenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotifications.mockReturnValue(mockUseNotificationsReturn);
  });

  it('renders notification button with unread count badge', () => {
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications.*1 unread/i });
    expect(button).toBeInTheDocument();
    
    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('animate-pulse');
  });

  it('does not show badge when no unread notifications', () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      unreadCount: 0
    });

    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toBeInTheDocument();
    
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows 99+ for counts over 99', () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      unreadCount: 150
    });

    render(<NotificationCenter />);
    
    const badge = screen.getByText('99+');
    expect(badge).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('1 unread notification')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <NotificationCenter />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    // Click outside
    const outside = screen.getByTestId('outside');
    await user.click(outside);
    
    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });

  it('closes dropdown when pressing escape', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    // Press escape
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });

  it('displays notifications in dropdown', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    
    expect(screen.getByText('Task Delegated')).toBeInTheDocument();
    expect(screen.getByText('Mentioned in Comment')).toBeInTheDocument();
  });

  it('shows loading state', async () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      isLoading: true
    });

    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      error: 'Failed to load'
    });

    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    
    expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', async () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      notifications: [],
      unreadCount: 0
    });

    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    
    expect(screen.getByText('No notifications')).toBeInTheDocument();
    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
  });

  it('calls markAllAsRead when "Mark all read" is clicked', async () => {
    const user = userEvent.setup();
    const mockMarkAllAsRead = jest.fn();
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      markAllAsRead: mockMarkAllAsRead
    });

    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    
    const markAllButton = screen.getByText('Mark all read');
    await user.click(markAllButton);
    
    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('does not show "Mark all read" when no unread notifications', async () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      unreadCount: 0
    });

    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    
    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
  });

  it('shows "View all notifications" link when notifications exist', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    
    expect(screen.getByText('View all notifications')).toBeInTheDocument();
  });

  it('handles notification click and marks as read', async () => {
    const user = userEvent.setup();
    const mockMarkAsRead = jest.fn();
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      markAsRead: mockMarkAsRead
    });

    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    
    // Click on the first notification
    const notification = screen.getByText('Task Delegated');
    await user.click(notification);
    
    expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('handles notification deletion', async () => {
    const user = userEvent.setup();
    const mockDeleteNotification = jest.fn();
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      deleteNotification: mockDeleteNotification
    });

    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    
    // Find and click delete button for first notification
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    
    expect(mockDeleteNotification).toHaveBeenCalledWith('notif-1');
  });

  it('has proper accessibility attributes', () => {
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
  });

  it('updates aria-expanded when dropdown opens', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('applies custom className', () => {
    const { container } = render(<NotificationCenter className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});