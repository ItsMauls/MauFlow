/**
 * NotificationBadge Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import { useNotifications } from '@/hooks/useNotifications';

// Mock the useNotifications hook
jest.mock('@/hooks/useNotifications');
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

const mockUseNotificationsReturn = {
  notifications: [],
  unreadCount: 5,
  isLoading: false,
  error: null,
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  clearOldNotifications: jest.fn(),
  refreshNotifications: jest.fn()
};

describe('NotificationBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotifications.mockReturnValue(mockUseNotificationsReturn);
  });

  it('renders badge with unread count', () => {
    render(<NotificationBadge />);
    
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', '5 unread notifications');
  });

  it('does not render when no unread notifications and showZero is false', () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      unreadCount: 0
    });

    const { container } = render(<NotificationBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders with zero count when showZero is true', () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      unreadCount: 0
    });

    render(<NotificationBadge showZero />);
    
    const badge = screen.getByText('0');
    expect(badge).toBeInTheDocument();
  });

  it('does not render while loading', () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      isLoading: true
    });

    const { container } = render(<NotificationBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('displays 99+ for counts over 99', () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      unreadCount: 150
    });

    render(<NotificationBadge />);
    
    const badge = screen.getByText('99+');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<NotificationBadge size="sm" />);
    let badge = screen.getByText('5');
    expect(badge).toHaveClass('min-w-[14px]', 'h-[14px]', 'text-[10px]');

    rerender(<NotificationBadge size="md" />);
    badge = screen.getByText('5');
    expect(badge).toHaveClass('min-w-[18px]', 'h-[18px]', 'text-xs');

    rerender(<NotificationBadge size="lg" />);
    badge = screen.getByText('5');
    expect(badge).toHaveClass('min-w-[22px]', 'h-[22px]', 'text-sm');
  });

  it('applies animate-pulse class when there are unread notifications', () => {
    render(<NotificationBadge />);
    
    const badge = screen.getByText('5');
    expect(badge).toHaveClass('animate-pulse');
  });

  it('does not apply animate-pulse class when no unread notifications', () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      unreadCount: 0
    });

    render(<NotificationBadge showZero />);
    
    const badge = screen.getByText('0');
    expect(badge).not.toHaveClass('animate-pulse');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(<NotificationBadge onClick={mockOnClick} />);
    
    const badge = screen.getByText('5');
    await user.click(badge);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(<NotificationBadge onClick={mockOnClick} />);
    
    const badge = screen.getByText('5');
    badge.focus();
    await user.keyboard('{Enter}');
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Space key is pressed', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(<NotificationBadge onClick={mockOnClick} />);
    
    const badge = screen.getByText('5');
    badge.focus();
    await user.keyboard(' ');
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes when clickable', () => {
    const mockOnClick = jest.fn();
    render(<NotificationBadge onClick={mockOnClick} />);
    
    const badge = screen.getByText('5');
    expect(badge).toHaveAttribute('role', 'button');
    expect(badge).toHaveAttribute('tabIndex', '0');
    expect(badge).toHaveClass('cursor-pointer');
  });

  it('does not have button attributes when not clickable', () => {
    render(<NotificationBadge />);
    
    const badge = screen.getByText('5');
    expect(badge).not.toHaveAttribute('role', 'button');
    expect(badge).not.toHaveAttribute('tabIndex');
    expect(badge).not.toHaveClass('cursor-pointer');
  });

  it('applies custom className', () => {
    render(<NotificationBadge className="custom-class" />);
    
    const badge = screen.getByText('5');
    expect(badge).toHaveClass('custom-class');
  });

  it('applies hover styles when clickable', () => {
    const mockOnClick = jest.fn();
    render(<NotificationBadge onClick={mockOnClick} />);
    
    const badge = screen.getByText('5');
    expect(badge).toHaveClass('hover:bg-red-600');
  });

  it('does not apply hover styles when not clickable', () => {
    render(<NotificationBadge />);
    
    const badge = screen.getByText('5');
    expect(badge).not.toHaveClass('hover:bg-red-600');
  });

  it('handles edge case of exactly 99 notifications', () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      unreadCount: 99
    });

    render(<NotificationBadge />);
    
    const badge = screen.getByText('99');
    expect(badge).toBeInTheDocument();
  });

  it('handles edge case of exactly 100 notifications', () => {
    mockUseNotifications.mockReturnValue({
      ...mockUseNotificationsReturn,
      unreadCount: 100
    });

    render(<NotificationBadge />);
    
    const badge = screen.getByText('99+');
    expect(badge).toBeInTheDocument();
  });
});