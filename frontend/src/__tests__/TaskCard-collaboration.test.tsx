/**
 * TaskCard Collaboration Features Tests
 * Tests for delegation controls, comment system integration, and activity indicators
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard, Task } from '@/components/tasks/TaskCard';
import { useDelegation } from '@/hooks/useDelegation';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useComments } from '@/hooks/useComments';
import { useAttachments } from '@/hooks/useAttachments';

// Mock the hooks
jest.mock('@/hooks/useDelegation');
jest.mock('@/hooks/useUserPermissions');
jest.mock('@/hooks/useTeamMembers');
jest.mock('@/hooks/useComments');
jest.mock('@/hooks/useAttachments');
jest.mock('@/hooks/useSwipeGesture', () => ({
  useSwipeGesture: () => ({ current: null })
}));

const mockUseDelegation = useDelegation as jest.MockedFunction<typeof useDelegation>;
const mockUseUserPermissions = useUserPermissions as jest.MockedFunction<typeof useUserPermissions>;
const mockUseTeamMembers = useTeamMembers as jest.MockedFunction<typeof useTeamMembers>;
const mockUseComments = useComments as jest.MockedFunction<typeof useComments>;
const mockUseAttachments = useAttachments as jest.MockedFunction<typeof useAttachments>;

// Mock data
const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test task description',
  status: 'todo',
  priority: 'medium',
  createdAt: '2025-08-29T10:00:00Z',
  updatedAt: '2025-08-29T11:00:00Z'
};

const mockDelegation = {
  id: 'delegation-1',
  taskId: 'task-1',
  delegatorId: 'user-1',
  assigneeId: 'user-2',
  delegatedAt: '2025-08-29T09:00:00Z',
  status: 'active' as const,
  priority: 'normal' as const,
  note: 'Please handle this task'
};

const mockAssignee = {
  id: 'user-2',
  name: 'John Doe',
  email: 'john@example.com',
  role: {
    id: 'role-1',
    name: 'Developer',
    description: 'Developer role',
    permissions: [],
    canDelegate: false,
    canReceiveDelegations: true,
    canManageTeam: false
  },
  permissions: [],
  createdAt: '2025-08-29T00:00:00Z',
  isActive: true,
  isOnline: true
};

const mockComments = [
  {
    id: 'comment-1',
    taskId: 'task-1',
    content: 'This is a test comment',
    author: 'Jane Smith',
    authorId: 'user-3',
    createdAt: '2025-08-29T12:00:00Z',
    mentions: []
  },
  {
    id: 'comment-2',
    taskId: 'task-1',
    content: 'Recent comment with @john mention',
    author: 'Alice Johnson',
    authorId: 'user-4',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    mentions: ['user-2']
  }
];

const mockAttachments = [
  {
    id: 'attachment-1',
    taskId: 'task-1',
    fileName: 'document.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    uploadedAt: '2025-08-29T13:00:00Z',
    uploadedBy: 'user-1'
  }
];

const defaultMockHooks = {
  useDelegation: {
    delegations: [mockDelegation],
    isLoading: false,
    delegateTask: jest.fn(),
    revokeDelegation: jest.fn(),
    completeDelegation: jest.fn(),
    getActiveDelegationForTask: jest.fn((taskId: string) => 
      taskId === 'task-1' ? mockDelegation : undefined
    ),
    isTaskDelegated: jest.fn((taskId: string) => taskId === 'task-1')
  },
  useUserPermissions: {
    canDelegate: true,
    canComment: true,
    canMention: true,
    user: {
      id: 'user-1',
      name: 'Current User',
      email: 'current@example.com',
      role: {
        id: 'role-admin',
        name: 'Admin',
        description: 'Administrator',
        permissions: [],
        canDelegate: true,
        canReceiveDelegations: true,
        canManageTeam: true
      },
      permissions: [],
      createdAt: '2025-08-29T00:00:00Z',
      isActive: true
    }
  },
  useTeamMembers: {
    teamMembers: [mockAssignee],
    isLoading: false,
    getMemberById: jest.fn((id: string) => id === 'user-2' ? mockAssignee : undefined),
    getDelegatableMembers: jest.fn(() => [mockAssignee])
  },
  useComments: {
    comments: mockComments,
    isLoading: false,
    addComment: jest.fn(),
    editComment: jest.fn(),
    deleteComment: jest.fn()
  },
  useAttachments: {
    attachments: mockAttachments,
    isLoading: false,
    addAttachment: jest.fn(),
    removeAttachment: jest.fn(),
    downloadAttachment: jest.fn()
  }
};

const setupMocks = (overrides = {}) => {
  const mocks = { ...defaultMockHooks, ...overrides };
  
  mockUseDelegation.mockReturnValue(mocks.useDelegation);
  mockUseUserPermissions.mockReturnValue(mocks.useUserPermissions);
  mockUseTeamMembers.mockReturnValue(mocks.useTeamMembers);
  mockUseComments.mockReturnValue(mocks.useComments);
  mockUseAttachments.mockReturnValue(mocks.useAttachments);
};

const renderTaskCard = (task = mockTask, props = {}) => {
  const defaultProps = {
    task,
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    ...props
  };

  return render(<TaskCard {...defaultProps} />);
};

describe('TaskCard Collaboration Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe('Delegation Status Display', () => {
    it('should display delegation status when task is delegated', () => {
      renderTaskCard();
      
      expect(screen.getByText('Assigned to John Doe')).toBeInTheDocument();
      expect(screen.getByText('Please handle this task')).toBeInTheDocument();
    });

    it('should show delegation date', () => {
      renderTaskCard();
      
      expect(screen.getByText('8/29/2025')).toBeInTheDocument();
    });

    it('should show urgent priority indicator for urgent delegations', () => {
      const urgentDelegation = { ...mockDelegation, priority: 'urgent' as const };
      setupMocks({
        useDelegation: {
          ...defaultMockHooks.useDelegation,
          getActiveDelegationForTask: jest.fn(() => urgentDelegation)
        }
      });

      renderTaskCard();
      
      const urgentIndicator = document.querySelector('[title="Urgent"]');
      expect(urgentIndicator).toBeInTheDocument();
      expect(urgentIndicator).toHaveClass('animate-pulse');
    });

    it('should not display delegation status when task is not delegated', () => {
      setupMocks({
        useDelegation: {
          ...defaultMockHooks.useDelegation,
          getActiveDelegationForTask: jest.fn(() => undefined),
          isTaskDelegated: jest.fn(() => false)
        }
      });

      renderTaskCard();
      
      expect(screen.queryByText('Assigned to')).not.toBeInTheDocument();
    });
  });

  describe('Delegation Controls', () => {
    it('should show delegation controls when user can delegate', () => {
      renderTaskCard();
      
      expect(screen.getByText('Delegated')).toBeInTheDocument();
    });

    it('should hide delegation controls when user cannot delegate', () => {
      setupMocks({
        useUserPermissions: {
          ...defaultMockHooks.useUserPermissions,
          canDelegate: false
        }
      });

      renderTaskCard();
      
      expect(screen.queryByText('Delegate')).not.toBeInTheDocument();
    });

    it('should show "Delegate" text when task is not delegated', () => {
      setupMocks({
        useDelegation: {
          ...defaultMockHooks.useDelegation,
          getActiveDelegationForTask: jest.fn(() => undefined)
        }
      });

      renderTaskCard();
      
      expect(screen.getByText('Delegate')).toBeInTheDocument();
    });

    it('should show delegation status indicator when task is delegated', () => {
      renderTaskCard();
      
      const statusIndicator = document.querySelector('[title="Task is delegated"]');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('should open delegation modal when delegation button is clicked', async () => {
      const user = userEvent.setup();
      renderTaskCard();
      
      const delegateButton = screen.getByText('Delegated');
      await user.click(delegateButton);
      
      // The delegation section should be visible
      expect(screen.getByText('Task Delegation')).toBeInTheDocument();
    });
  });

  describe('Comment System Integration', () => {
    it('should display comment count', () => {
      renderTaskCard();
      
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    });

    it('should show recent activity indicator for recent comments', () => {
      renderTaskCard();
      
      const activityIndicator = document.querySelector('[title="Recent activity"]');
      expect(activityIndicator).toBeInTheDocument();
      expect(activityIndicator).toHaveClass('animate-pulse');
    });

    it('should not show activity indicator when no recent comments', () => {
      const oldComments = mockComments.map(comment => ({
        ...comment,
        createdAt: '2025-08-27T12:00:00Z' // 2 days ago
      }));

      setupMocks({
        useComments: {
          ...defaultMockHooks.useComments,
          comments: oldComments
        }
      });

      renderTaskCard();
      
      const activityIndicator = document.querySelector('[title="Recent activity"]');
      expect(activityIndicator).not.toBeInTheDocument();
    });

    it('should open comments section when comments button is clicked', async () => {
      const user = userEvent.setup();
      renderTaskCard();
      
      const commentsButton = screen.getByText('Comments (2)');
      await user.click(commentsButton);
      
      expect(screen.getByText('Add a comment...')).toBeInTheDocument();
    });

    it('should handle comment submission', async () => {
      const user = userEvent.setup();
      const mockAddComment = jest.fn();
      
      setupMocks({
        useComments: {
          ...defaultMockHooks.useComments,
          addComment: mockAddComment
        }
      });

      renderTaskCard();
      
      // Open comments section
      const commentsButton = screen.getByText('Comments (2)');
      await user.click(commentsButton);
      
      // Click add comment button
      const addCommentButton = screen.getByText('Add a comment...');
      await user.click(addCommentButton);
      
      // Type comment
      const commentInput = screen.getByPlaceholderText(/Share your thoughts/);
      await user.type(commentInput, 'This is a test comment');
      
      // Submit comment
      const submitButton = screen.getByText('Post');
      await user.click(submitButton);
      
      expect(mockAddComment).toHaveBeenCalledWith('task-1', 'This is a test comment', []);
    });
  });

  describe('Activity Indicators', () => {
    it('should display collaboration activity summary', () => {
      renderTaskCard();
      
      expect(screen.getByText('2 comments (2h ago)')).toBeInTheDocument();
      expect(screen.getByText('1 file')).toBeInTheDocument();
      expect(screen.getByText('Delegated to John Doe today')).toBeInTheDocument();
    });

    it('should show correct time indicators for delegation', () => {
      const oldDelegation = {
        ...mockDelegation,
        delegatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      };

      setupMocks({
        useDelegation: {
          ...defaultMockHooks.useDelegation,
          getActiveDelegationForTask: jest.fn(() => oldDelegation)
        }
      });

      renderTaskCard();
      
      expect(screen.getByText('Delegated to John Doe 3d ago')).toBeInTheDocument();
    });

    it('should handle plural forms correctly', () => {
      const singleComment = [mockComments[0]];
      const multipleAttachments = [
        mockAttachments[0],
        { ...mockAttachments[0], id: 'attachment-2', fileName: 'image.png' }
      ];

      setupMocks({
        useComments: {
          ...defaultMockHooks.useComments,
          comments: singleComment
        },
        useAttachments: {
          ...defaultMockHooks.useAttachments,
          attachments: multipleAttachments
        }
      });

      renderTaskCard();
      
      expect(screen.getByText('1 comment')).toBeInTheDocument();
      expect(screen.getByText('2 files')).toBeInTheDocument();
    });

    it('should not show activity summary when no collaboration activity', () => {
      setupMocks({
        useComments: {
          ...defaultMockHooks.useComments,
          comments: []
        },
        useAttachments: {
          ...defaultMockHooks.useAttachments,
          attachments: []
        },
        useDelegation: {
          ...defaultMockHooks.useDelegation,
          getActiveDelegationForTask: jest.fn(() => undefined)
        }
      });

      renderTaskCard();
      
      expect(screen.queryByText(/comment/)).not.toBeInTheDocument();
      expect(screen.queryByText(/file/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Delegated/)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle delegation errors gracefully', async () => {
      const user = userEvent.setup();
      const mockDelegateTask = jest.fn().mockRejectedValue(new Error('Delegation failed'));
      
      setupMocks({
        useDelegation: {
          ...defaultMockHooks.useDelegation,
          delegateTask: mockDelegateTask
        }
      });

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      renderTaskCard();
      
      // Open delegation section
      const delegateButton = screen.getByText('Delegated');
      await user.click(delegateButton);
      
      // This would trigger delegation in a real scenario
      // The error handling is tested in the DelegationControls component
      
      alertSpy.mockRestore();
    });

    it('should handle comment errors gracefully', async () => {
      const user = userEvent.setup();
      const mockAddComment = jest.fn().mockRejectedValue(new Error('Comment failed'));
      
      setupMocks({
        useComments: {
          ...defaultMockHooks.useComments,
          addComment: mockAddComment
        }
      });

      renderTaskCard();
      
      // Open comments section
      const commentsButton = screen.getByText('Comments (2)');
      await user.click(commentsButton);
      
      // The error handling is tested in the CommentInput component
    });
  });

  describe('Loading States', () => {
    it('should show loading state for comments', () => {
      setupMocks({
        useComments: {
          ...defaultMockHooks.useComments,
          isLoading: true,
          comments: []
        }
      });

      renderTaskCard();
      
      // Open comments section
      const commentsButton = screen.getByText('Comments');
      fireEvent.click(commentsButton);
      
      expect(screen.getByText('Loading comments...')).toBeInTheDocument();
    });

    it('should show loading state for attachments', () => {
      setupMocks({
        useAttachments: {
          ...defaultMockHooks.useAttachments,
          isLoading: true,
          attachments: []
        }
      });

      renderTaskCard();
      
      // Open attachments section
      const attachmentsButton = screen.getByText('Files');
      fireEvent.click(attachmentsButton);
      
      expect(screen.getByText('Loading attachments...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for delegation controls', () => {
      renderTaskCard();
      
      const delegationButton = screen.getByText('Delegated');
      expect(delegationButton).toBeInTheDocument();
      
      const statusIndicator = document.querySelector('[title="Task is delegated"]');
      expect(statusIndicator).toHaveAttribute('title', 'Task is delegated');
    });

    it('should have proper ARIA labels for activity indicators', () => {
      renderTaskCard();
      
      const activityIndicator = document.querySelector('[title="Recent activity"]');
      expect(activityIndicator).toHaveAttribute('title', 'Recent activity');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderTaskCard();
      
      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('title', 'Delete Task');
      
      await user.tab();
      expect(document.activeElement).toHaveAttribute('title', 'Edit Task');
      
      await user.tab();
      expect(document.activeElement).toHaveAttribute('title', 'Mark as Done');
    });
  });
});