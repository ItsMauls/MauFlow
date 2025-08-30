/**
 * NotificationItem Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Notification } from '@/types/collaboration';

const mockNotification: Notification = {
  id: 'notif-1',
  type: 'task_delegated',
  title: 'Task Delegated',
  message: 'You have been assigned a new task by John Doe',
  recipientId: 'user-1',
  senderId: 'user-2',
  resourceId: 'task-1',
  resourceType: 'task',
  isRead: false,
  createdAt: '2025-08-29T10:00:00Z',
  metadata: {}
};

const mockReadNotification: Notification = {
  ...mockNotification,
  id: 'notif-2',
  isRead: true,
  createdAt: '2025-08-29T08:00:00Z'
};

const defaultProps = {
  onClick: jest.fn(),
  onDelete: jest.fn(),
  onMarkAsRead: jest.fn()
};

describe('NotificationItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() for consistent time calculations
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-08-29T10:30:00Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders notification content correctly', () => {
    render(<NotificationItem notification={mockNotification} {...defaultProps} />);
    
    expect(screen.getByText('Task Delegated')).toBeInTheDocument();
    expect(screen.getByText('You have been assigned a new task by John Doe')).toBeInTheDocument();
    expect(screen.getByText('Task Delegated')).toBeInTheDocument(); // Type display
    expect(screen.getByText('task')).toBeInTheDocument(); // Resource type
  });

  it('displays correct icon for notification type', () => {
    render(<NotificationItem notification={mockNotification} {...defaultProps} />);
    
    const icon = screen.getByRole('img', { name: /task delegated/i });
    expect(icon).toBeInTheDocument();
  });

  it('shows unread indicator for unread notifications', () => {
    render(<NotificationItem notification={mockNotification} {...defaultProps} />);
    
    const unreadIndicator = screen.getByLabelText('Unread');
    expect(unreadIndicator).toBeInTheDocument();
    expect(unreadIndicator).toHaveClass('bg-blue-400');
  });

  it('does not show unread indicator for read notifications', () => {
    render(<NotificationItem notification={mockReadNotification} {...defaultProps} />);
    
    expect(screen.queryByLabelText('Unread')).not.toBeInTheDocument();
  });

  it('applies different styling for read vs unread notifications', () => {
    const { rerender } = render(<NotificationItem notification={mockNotification} {...defaultProps} />);
    
    // Unread notification should have blue background
    const unreadContainer = screen.getByRole('button');
    expect(unreadContainer).toHaveClass('bg-blue-500/10', 'border-l-blue-400');
    
    // Read notification should not have blue background
    rerender(<NotificationItem notification={mockReadNotification} {...defaultProps} />);
    const readContainer = screen.getByRole('button');
    expect(readContainer).not.toHaveClass('bg-blue-500/10', 'border-l-blue-400');
  });

  it('formats time ago correctly', () => {
    render(<NotificationItem notification={mockNotification} {...defaultProps} />);
    
    // Should show "30m ago" based on our mocked time
    expect(screen.getByText('30m ago')).toBeInTheDocument();
  });

  it('calls onClick when notification is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(<NotificationItem notification={mockNotification} {...defaultProps} onClick={mockOnClick} />);
    
    const notification = screen.getByRole('button');
    await user.click(notification);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(<NotificationItem notification={mockNotification} {...defaultProps} onClick={mockOnClick} />);
    
    const notification = screen.getByRole('button');
    notification.focus();
    await user.keyboard('{Enter}');
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Space key is pressed', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(<NotificationItem notification={mockNotification} {...defaultProps} onClick={mockOnClick} />);
    
    const notification = screen.getByRole('button');
    notification.focus();
    await user.keyboard(' ');
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('shows mark as read button for unread notifications', () => {
    render(<NotificationItem notification={mockNotification} {...defaultProps} />);
    
    expect(screen.getByText('Mark read')).toBeInTheDocument();
  });

  it('does not show mark as read button for read notifications', () => {
    render(<NotificationItem notification={mockReadNotification} {...defaultProps} />);
    
    expect(screen.queryByText('Mark read')).not.toBeInTheDocument();
  });

  it('calls onMarkAsRead when mark as read button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnMarkAsRead = jest.fn();
    
    render(<NotificationItem notification={mockNotification} {...defaultProps} onMarkAsRead={mockOnMarkAsRead} />);
    
    const markReadButton = screen.getByText('Mark read');
    await user.click(markReadButton);
    
    expect(mockOnMarkAsRead).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnDelete = jest.fn();
    
    render(<NotificationItem notification={mockNotification} {...defaultProps} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('prevents event propagation when action buttons are clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    const mockOnDelete = jest.fn();
    
    render(<NotificationItem notification={mockNotification} {...defaultProps} onClick={mockOnClick} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);
    
    // onClick should not be called when delete button is clicked
    expect(mockOnClick).not.toHaveBeenCalled();
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('displays different icons for different notification types', () => {
    const commentNotification: Notification = {
      ...mockNotification,
      type: 'comment_mention',
      id: 'notif-comment'
    };

    const { rerender } = render(<NotificationItem notification={mockNotification} {...defaultProps} />);
    expect(screen.getByRole('img', { name: /task delegated/i })).toBeInTheDocument();

    rerender(<NotificationItem notification={commentNotification} {...defaultProps} />);
    expect(screen.getByRole('img', { name: /comment mention/i })).toBeInTheDocument();
  });

  it('handles notifications without resource type', () => {
    const notificationWithoutResource: Notification = {
      ...mockNotification,
      resourceType: undefined
    };

    render(<NotificationItem notification={notificationWithoutResource} {...defaultProps} />);
    
    expect(screen.getByText('Task Delegated')).toBeInTheDocument();
    expect(screen.queryByText('task')).not.toBeInTheDocument();
  });

  it('truncates long messages appropriately', () => {
    const longMessageNotification: Notification = {
      ...mockNotification,
      message: 'This is a very long notification message that should be truncated when displayed in the notification item component to prevent layout issues and maintain readability'
    };

    render(<NotificationItem notification={longMessageNotification} {...defaultProps} />);
    
    const messageElement = screen.getByText(/This is a very long notification message/);
    expect(messageElement).toHaveClass('line-clamp-2');
  });

  it('has proper accessibility attributes', () => {
    render(<NotificationItem notification={mockNotification} {...defaultProps} />);
    
    const notification = screen.getByRole('button');
    expect(notification).toHaveAttribute('tabIndex', '0');
    expect(notification).toHaveAttribute('aria-label', expect.stringContaining('Notification: Task Delegated'));
    expect(notification).toHaveAttribute('aria-label', expect.stringContaining('Unread'));
  });

  it('applies custom className', () => {
    render(<NotificationItem notification={mockNotification} {...defaultProps} className="custom-class" />);
    
    const notification = screen.getByRole('button');
    expect(notification).toHaveClass('custom-class');
  });

  it('formats different time periods correctly', () => {
    const testCases = [
      { createdAt: '2025-08-29T10:29:30Z', expected: 'Just now' },
      { createdAt: '2025-08-29T10:25:00Z', expected: '5m ago' },
      { createdAt: '2025-08-29T08:30:00Z', expected: '2h ago' },
      { createdAt: '2025-08-28T10:30:00Z', expected: '1d ago' },
      { createdAt: '2025-08-20T10:30:00Z', expected: '8/20/2025' }
    ];

    testCases.forEach(({ createdAt, expected }) => {
      const testNotification = { ...mockNotification, createdAt };
      const { rerender } = render(<NotificationItem notification={testNotification} {...defaultProps} />);
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      
      // Clean up for next iteration
      rerender(<div />);
    });
  });
});