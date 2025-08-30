/**
 * Accessibility tests for collaboration components
 * Tests keyboard navigation, ARIA attributes, screen reader support, and mobile accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { DelegationControls } from '@/components/delegation/DelegationControls';
import { TeamMemberSelector } from '@/components/team/TeamMemberSelector';
import { CommentInput } from '@/components/tasks/CommentInput';
import { MentionDropdown } from '@/components/tasks/MentionDropdown';
import { 
  keyboardNavigation, 
  ariaAttributes, 
  screenReader, 
  mobileAccessibility,
  colorContrast,
  motionAccessibility,
  runAccessibilityTests
} from '@/tests/utils/accessibility';

// Mock hooks and dependencies
jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: '1',
        type: 'task_delegated',
        title: 'Task delegated to you',
        message: 'John assigned you a new task',
        isRead: false,
        createdAt: '2025-08-29T10:00:00Z',
        resourceId: 'task-1',
        resourceType: 'task'
      },
      {
        id: '2',
        type: 'comment_mention',
        title: 'You were mentioned',
        message: 'Sarah mentioned you in a comment',
        isRead: true,
        createdAt: '2025-08-29T09:00:00Z',
        resourceId: 'comment-1',
        resourceType: 'comment'
      }
    ],
    unreadCount: 1,
    isLoading: false,
    error: null,
    connectionStatus: 'connected',
    markAsRead: jest.fn(),
    markAsUnread: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    clearOldNotifications: jest.fn(),
    archiveOldNotifications: jest.fn(),
    bulkMarkAsRead: jest.fn(),
    bulkDeleteNotifications: jest.fn()
  })
}));

jest.mock('@/hooks/useTeamMembers', () => ({
  useTeamMembers: () => ({
    teamMembers: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: { name: 'Developer', id: '1' },
        isOnline: true,
        avatar: '👨‍💻'
      },
      {
        id: '2',
        name: 'Sarah Smith',
        email: 'sarah@example.com',
        role: { name: 'Designer', id: '2' },
        isOnline: false,
        lastSeen: '2025-08-29T08:00:00Z',
        avatar: '👩‍🎨'
      }
    ],
    isLoading: false,
    searchMembers: jest.fn((query) => [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: { name: 'Developer', id: '1' },
        isOnline: true,
        avatar: '👨‍💻'
      }
    ])
  })
}));

jest.mock('@/hooks/useDelegation', () => ({
  useDelegation: () => ({
    delegateTask: jest.fn(),
    getActiveDelegationForTask: jest.fn(() => null),
    delegations: []
  })
}));

jest.mock('@/hooks/useUserPermissions', () => ({
  useUserPermissions: () => ({
    user: { id: 'current-user', name: 'Current User' }
  })
}));

jest.mock('@/hooks/useErrorHandling', () => ({
  useDelegationErrorHandling: () => ({
    errorState: { error: null },
    clearError: jest.fn(),
    executeDelegationOperation: jest.fn((operation) => operation())
  })
}));

describe('NotificationCenter Accessibility', () => {
  const mockProps = {};

  beforeEach(() => {
    // Reset any global state
    document.body.innerHTML = '';
  });

  test('has proper ARIA attributes', () => {
    render(<NotificationCenter {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    ariaAttributes.testNotificationCenter(button.parentElement!);
  });

  test('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    
    // Test opening with Enter
    await user.click(button);
    await user.keyboard('{Enter}');
    
    // Should open dropdown
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /notifications/i })).toBeInTheDocument();
    });
    
    // Test closing with Escape
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /notifications/i })).not.toBeInTheDocument();
    });
  });

  test('announces state changes to screen readers', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);
    
    // Check for live region announcements
    await screenReader.testLiveRegionAnnouncement('Notifications panel opened');
  });

  test('supports mobile touch targets', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 640,
    });

    render(<NotificationCenter {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    mobileAccessibility.testTouchTargetSize(button);
  });

  test('respects reduced motion preferences', () => {
    render(<NotificationCenter {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    motionAccessibility.testReducedMotion(button);
  });
});

describe('NotificationItem Accessibility', () => {
  const mockNotification = {
    id: '1',
    type: 'task_delegated' as const,
    title: 'Task delegated to you',
    message: 'John assigned you a new task',
    isRead: false,
    createdAt: '2025-08-29T10:00:00Z',
    resourceId: 'task-1',
    resourceType: 'task' as const
  };

  const mockProps = {
    notification: mockNotification,
    onClick: jest.fn(),
    onDelete: jest.fn(),
    onMarkAsRead: jest.fn(),
    onMarkAsUnread: jest.fn()
  };

  test('has proper ARIA attributes', () => {
    render(<NotificationItem {...mockProps} />);
    
    const item = screen.getByRole('listitem');
    ariaAttributes.testNotificationItem(item);
  });

  test('supports keyboard activation', async () => {
    const user = userEvent.setup();
    render(<NotificationItem {...mockProps} />);
    
    const item = screen.getByRole('listitem');
    await keyboardNavigation.testKeyActivation(item, mockProps.onClick);
  });

  test('supports keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(<NotificationItem {...mockProps} />);
    
    const item = screen.getByRole('listitem');
    item.focus();
    
    // Test Ctrl+R for mark as read
    await user.keyboard('{Control>}r{/Control}');
    expect(mockProps.onMarkAsRead).toHaveBeenCalled();
    
    // Test Ctrl+D for delete
    await user.keyboard('{Control>}d{/Control}');
    expect(mockProps.onDelete).toHaveBeenCalled();
  });

  test('provides proper time information', () => {
    render(<NotificationItem {...mockProps} />);
    
    const timeElement = screen.getByText(/ago/i);
    expect(timeElement).toHaveAttribute('dateTime');
    expect(timeElement).toHaveAttribute('title');
  });

  test('runs comprehensive accessibility tests', async () => {
    render(<NotificationItem {...mockProps} />);
    
    const item = screen.getByRole('listitem');
    await runAccessibilityTests.notificationItem(item, mockProps.onClick);
  });
});

describe('DelegationControls Accessibility', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test task description',
    status: 'todo' as const,
    priority: 'medium' as const,
    createdAt: '2025-08-29T10:00:00Z'
  };

  const mockProps = {
    task: mockTask,
    onDelegate: jest.fn(),
    canDelegate: true
  };

  test('has proper ARIA attributes for delegation button', () => {
    render(<DelegationControls {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /delegate/i });
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('aria-describedby');
  });

  test('modal has proper ARIA attributes', async () => {
    const user = userEvent.setup();
    render(<DelegationControls {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /delegate/i });
    await user.click(button);
    
    const modal = screen.getByRole('dialog');
    ariaAttributes.testDelegationModal(modal);
  });

  test('supports focus trapping in modal', async () => {
    const user = userEvent.setup();
    render(<DelegationControls {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /delegate/i });
    await user.click(button);
    
    const modal = screen.getByRole('dialog');
    await runAccessibilityTests.delegationModal(modal);
  });

  test('closes modal with Escape key', async () => {
    const user = userEvent.setup();
    render(<DelegationControls {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /delegate/i });
    await user.click(button);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('announces delegation success', async () => {
    const user = userEvent.setup();
    render(<DelegationControls {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /delegate/i });
    await user.click(button);
    
    // Mock successful delegation
    const delegateButton = screen.getByRole('button', { name: /delegate$/i });
    await user.click(delegateButton);
    
    await screenReader.testLiveRegionAnnouncement('Task "Test Task" successfully delegated');
  });
});

describe('TeamMemberSelector Accessibility', () => {
  const mockProps = {
    onSelect: jest.fn(),
    excludeUsers: [],
    filterByRole: [],
    searchable: true
  };

  test('has proper combobox ARIA attributes', () => {
    render(<TeamMemberSelector {...mockProps} />);
    
    const combobox = screen.getByRole('combobox');
    ariaAttributes.testTeamMemberSelector(combobox.parentElement!);
  });

  test('supports arrow key navigation', async () => {
    const user = userEvent.setup();
    render(<TeamMemberSelector {...mockProps} />);
    
    const input = screen.getByRole('combobox');
    await user.click(input);
    
    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    const options = screen.getAllByRole('option');
    await keyboardNavigation.testArrowKeyNavigation(input, options);
  });

  test('supports Home and End keys', async () => {
    const user = userEvent.setup();
    render(<TeamMemberSelector {...mockProps} />);
    
    const input = screen.getByRole('combobox');
    await user.click(input);
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    // Test Home key
    await user.keyboard('{Home}');
    const firstOption = screen.getAllByRole('option')[0];
    expect(firstOption).toHaveAttribute('aria-selected', 'true');
    
    // Test End key
    await user.keyboard('{End}');
    const options = screen.getAllByRole('option');
    const lastOption = options[options.length - 1];
    expect(lastOption).toHaveAttribute('aria-selected', 'true');
  });

  test('announces selection changes', async () => {
    const user = userEvent.setup();
    render(<TeamMemberSelector {...mockProps} />);
    
    const input = screen.getByRole('combobox');
    await user.click(input);
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    const firstOption = screen.getAllByRole('option')[0];
    await user.click(firstOption);
    
    await screenReader.testLiveRegionAnnouncement('Selected John Doe, Developer');
  });

  test('runs comprehensive accessibility tests', async () => {
    render(<TeamMemberSelector {...mockProps} />);
    
    const input = screen.getByRole('combobox');
    await user.click(input);
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    const options = screen.getAllByRole('option');
    await runAccessibilityTests.teamMemberSelector(input, options);
  });
});

describe('CommentInput Accessibility', () => {
  const mockProps = {
    onSubmit: jest.fn(),
    placeholder: 'Add a comment...',
    enableMentions: true
  };

  test('has proper textbox ARIA attributes', () => {
    render(<CommentInput {...mockProps} />);
    
    const textbox = screen.getByRole('textbox');
    ariaAttributes.testCommentInput(textbox);
  });

  test('provides proper descriptions', () => {
    render(<CommentInput {...mockProps} />);
    
    const textbox = screen.getByRole('textbox');
    const describedBy = textbox.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    
    if (describedBy) {
      screenReader.testAriaDescribedBy(textbox, describedBy.split(' ')[0]);
    }
  });

  test('supports keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(<CommentInput {...mockProps} isEditing={true} />);
    
    const textbox = screen.getByRole('textbox');
    await user.type(textbox, 'Test comment');
    
    // Test Ctrl+S for save
    await user.keyboard('{Control>}s{/Control}');
    expect(mockProps.onSubmit).toHaveBeenCalled();
  });

  test('announces character limit warnings', async () => {
    const user = userEvent.setup();
    render(<CommentInput {...mockProps} />);
    
    const textbox = screen.getByRole('textbox');
    const longText = 'a'.repeat(501); // Exceeds 500 character limit
    
    await user.type(textbox, longText);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('supports mobile touch targets', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 640,
    });

    render(<CommentInput {...mockProps} isMobile={true} />);
    
    const textbox = screen.getByRole('textbox');
    mobileAccessibility.testTouchTargetSize(textbox);
  });
});

describe('MentionDropdown Accessibility', () => {
  const mockUsers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Developer',
      avatar: '👨‍💻'
    },
    {
      id: '2',
      name: 'Sarah Smith',
      email: 'sarah@example.com',
      role: 'Designer',
      avatar: '👩‍🎨'
    }
  ];

  const mockProps = {
    users: mockUsers,
    onSelect: jest.fn(),
    onClose: jest.fn(),
    position: { top: 100, left: 50 },
    query: 'jo'
  };

  test('has proper listbox ARIA attributes', () => {
    render(<MentionDropdown {...mockProps} />);
    
    const listbox = screen.getByRole('listbox');
    ariaAttributes.testMentionDropdown(listbox);
  });

  test('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<MentionDropdown {...mockProps} />);
    
    // Test arrow key navigation
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });

  test('supports Home and End navigation', async () => {
    render(<MentionDropdown {...mockProps} />);
    
    // Test Home key
    fireEvent.keyDown(document, { key: 'Home' });
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    
    // Test End key
    fireEvent.keyDown(document, { key: 'End' });
    expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');
  });

  test('closes with Escape key', async () => {
    render(<MentionDropdown {...mockProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('selects with Enter key', async () => {
    render(<MentionDropdown {...mockProps} />);
    
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(mockProps.onSelect).toHaveBeenCalledWith(mockUsers[0]);
  });
});

describe('Color Contrast and Visual Accessibility', () => {
  test('notification components have adequate contrast', () => {
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    colorContrast.testContrastRatio(button);
  });

  test('supports high contrast mode', () => {
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    colorContrast.testHighContrastMode(button);
  });
});

describe('Mobile Accessibility', () => {
  beforeEach(() => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 640,
    });
  });

  test('components have mobile-friendly touch targets', () => {
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    mobileAccessibility.testTouchTargetSize(button);
  });

  test('text is readable on mobile', () => {
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    mobileAccessibility.testResponsiveFontSize(button, 'mobile');
  });

  test('spacing is adequate for touch interaction', () => {
    render(<NotificationCenter />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    mobileAccessibility.testMobileSpacing(button);
  });
});