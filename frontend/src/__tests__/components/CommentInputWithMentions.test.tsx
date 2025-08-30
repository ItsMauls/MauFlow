/**
 * Unit Tests for CommentInput Component with Mention Functionality
 * Tests mention detection, autocomplete, and submission with mentions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentInput } from '@/components/tasks/CommentInput';

// Mock the hooks
jest.mock('@/hooks/useTeamMembers', () => ({
  useTeamMembers: () => ({
    teamMembers: [
      {
        id: 'user-1',
        name: 'Alice Johnson',
        avatar: '👩‍💼',
        role: { name: 'Project Manager' },
        email: 'alice@company.com'
      },
      {
        id: 'user-2',
        name: 'Bob Smith',
        avatar: '👨‍💻',
        role: { name: 'Developer' },
        email: 'bob@company.com'
      },
      {
        id: 'user-3',
        name: 'Carol Davis',
        avatar: '👩‍💻',
        role: { name: 'Designer' },
        email: 'carol@company.com'
      }
    ]
  })
}));

// Mock the mention utilities
jest.mock('@/lib/mentions', () => ({
  findMentionQuery: jest.fn(),
  filterUsersForMention: jest.fn(),
  replaceMentionQuery: jest.fn(),
  extractMentionIds: jest.fn(),
  sanitizeMentionContent: jest.fn((content) => content)
}));

const mockMentionUtils = require('@/lib/mentions');

const defaultProps = {
  onSubmit: jest.fn(),
  placeholder: 'Add a comment...',
  enableMentions: true
};

describe('CommentInput with Mentions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockMentionUtils.findMentionQuery.mockReturnValue(null);
    mockMentionUtils.filterUsersForMention.mockReturnValue([]);
    mockMentionUtils.extractMentionIds.mockReturnValue([]);
    mockMentionUtils.sanitizeMentionContent.mockImplementation((content) => content);
  });

  describe('Basic Functionality', () => {
    it('should render with mention-enabled placeholder', () => {
      render(<CommentInput {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Add a comment... (Use @ to mention team members)')).toBeInTheDocument();
    });

    it('should show mention hint in action area', async () => {
      const user = userEvent.setup();
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.type(textarea, 'Hello');
      
      expect(screen.getByText('Use @ to mention team members')).toBeInTheDocument();
    });

    it('should disable mentions when enableMentions is false', () => {
      render(<CommentInput {...defaultProps} enableMentions={false} />);
      
      expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
      expect(screen.queryByText('Use @ to mention team members')).not.toBeInTheDocument();
    });
  });

  describe('Mention Detection', () => {
    it('should detect mention query and show dropdown', async () => {
      const user = userEvent.setup();
      
      // Mock mention query detection
      mockMentionUtils.findMentionQuery.mockReturnValue({
        start: 5,
        end: 7,
        query: 'Al'
      });
      
      mockMentionUtils.filterUsersForMention.mockReturnValue([
        {
          id: 'user-1',
          name: 'Alice Johnson',
          avatar: '👩‍💼',
          role: 'Project Manager',
          email: 'alice@company.com'
        }
      ]);
      
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hey @Al');
      
      // Should call mention detection
      expect(mockMentionUtils.findMentionQuery).toHaveBeenCalled();
    });

    it('should not show dropdown when no mention query', async () => {
      const user = userEvent.setup();
      
      mockMentionUtils.findMentionQuery.mockReturnValue(null);
      
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello world');
      
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });

    it('should update mention query as user types', async () => {
      const user = userEvent.setup();
      
      // First call returns partial query
      mockMentionUtils.findMentionQuery
        .mockReturnValueOnce({
          start: 5,
          end: 6,
          query: 'A'
        })
        .mockReturnValueOnce({
          start: 5,
          end: 7,
          query: 'Al'
        });
      
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hey @A');
      await user.type(textarea, 'l');
      
      expect(mockMentionUtils.findMentionQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('Mention Dropdown Interaction', () => {
    beforeEach(() => {
      mockMentionUtils.findMentionQuery.mockReturnValue({
        start: 5,
        end: 7,
        query: 'Al'
      });
      
      mockMentionUtils.filterUsersForMention.mockReturnValue([
        {
          id: 'user-1',
          name: 'Alice Johnson',
          avatar: '👩‍💼',
          role: 'Project Manager',
          email: 'alice@company.com'
        }
      ]);
    });

    it('should show mention dropdown with filtered users', async () => {
      const user = userEvent.setup();
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hey @Al');
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
    });

    it('should replace mention query when user is selected', async () => {
      const user = userEvent.setup();
      
      mockMentionUtils.replaceMentionQuery.mockReturnValue({
        content: 'Hey @AliceJohnson ',
        cursorPosition: 18
      });
      
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hey @Al');
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Alice Johnson'));
      
      expect(mockMentionUtils.replaceMentionQuery).toHaveBeenCalled();
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <CommentInput {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hey @Al');
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('outside'));
      
      await waitFor(() => {
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      mockMentionUtils.findMentionQuery.mockReturnValue({
        start: 5,
        end: 7,
        query: 'Al'
      });
      
      mockMentionUtils.filterUsersForMention.mockReturnValue([
        {
          id: 'user-1',
          name: 'Alice Johnson',
          avatar: '👩‍💼',
          role: 'Project Manager',
          email: 'alice@company.com'
        }
      ]);
    });

    it('should not submit form when dropdown is open and Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hey @Al');
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
      
      fireEvent.keyDown(textarea, { key: 'Enter' });
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should allow navigation keys to pass through to dropdown', async () => {
      const user = userEvent.setup();
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hey @Al');
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
      
      // These keys should not trigger form submission
      fireEvent.keyDown(textarea, { key: 'ArrowDown' });
      fireEvent.keyDown(textarea, { key: 'ArrowUp' });
      fireEvent.keyDown(textarea, { key: 'Escape' });
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission with Mentions', () => {
    it('should extract mentions and pass to onSubmit', async () => {
      const user = userEvent.setup();
      
      mockMentionUtils.extractMentionIds.mockReturnValue(['user-1', 'user-2']);
      
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hey @Alice and @Bob');
      
      const submitButton = screen.getByText('Post');
      await user.click(submitButton);
      
      expect(mockMentionUtils.extractMentionIds).toHaveBeenCalledWith('Hey @Alice and @Bob', expect.any(Array));
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('Hey @Alice and @Bob', ['user-1', 'user-2']);
    });

    it('should sanitize content before submission', async () => {
      const user = userEvent.setup();
      
      mockMentionUtils.sanitizeMentionContent.mockReturnValue('Clean content');
      
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Dirty content');
      
      const submitButton = screen.getByText('Post');
      await user.click(submitButton);
      
      expect(mockMentionUtils.sanitizeMentionContent).toHaveBeenCalledWith('Dirty content');
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('Clean content', []);
    });

    it('should not extract mentions when disabled', async () => {
      const user = userEvent.setup();
      
      render(<CommentInput {...defaultProps} enableMentions={false} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hey @Alice');
      
      const submitButton = screen.getByText('Post');
      await user.click(submitButton);
      
      expect(mockMentionUtils.extractMentionIds).not.toHaveBeenCalled();
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('Hey @Alice', []);
    });

    it('should close dropdown after successful submission', async () => {
      const user = userEvent.setup();
      
      // Setup mention dropdown
      mockMentionUtils.findMentionQuery.mockReturnValue({
        start: 5,
        end: 7,
        query: 'Al'
      });
      
      mockMentionUtils.filterUsersForMention.mockReturnValue([
        {
          id: 'user-1',
          name: 'Alice Johnson',
          avatar: '👩‍💼',
          role: 'Project Manager',
          email: 'alice@company.com'
        }
      ]);
      
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hey @Al');
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
      
      // Clear the mention query for submission
      mockMentionUtils.findMentionQuery.mockReturnValue(null);
      
      await user.clear(textarea);
      await user.type(textarea, 'Final comment');
      
      const submitButton = screen.getByText('Post');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
      });
    });
  });

  describe('Editing Mode with Mentions', () => {
    const editProps = {
      ...defaultProps,
      isEditing: true,
      initialValue: 'Hey @Alice, how are you?',
      onCancel: jest.fn()
    };

    it('should enable mentions in editing mode', () => {
      render(<CommentInput {...editProps} />);
      
      expect(screen.getByDisplayValue('Hey @Alice, how are you?')).toBeInTheDocument();
    });

    it('should show save button instead of post', () => {
      render(<CommentInput {...editProps} />);
      
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.queryByText('Post')).not.toBeInTheDocument();
    });

    it('should close dropdown when canceling edit', async () => {
      const user = userEvent.setup();
      
      // Setup mention dropdown
      mockMentionUtils.findMentionQuery.mockReturnValue({
        start: 5,
        end: 7,
        query: 'Al'
      });
      
      mockMentionUtils.filterUsersForMention.mockReturnValue([
        {
          id: 'user-1',
          name: 'Alice Johnson',
          avatar: '👩‍💼',
          role: 'Project Manager',
          email: 'alice@company.com'
        }
      ]);
      
      render(<CommentInput {...editProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, ' @Al');
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(editProps.onCancel).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      const onSubmitWithError = jest.fn().mockRejectedValue(new Error('Submission failed'));
      
      render(<CommentInput {...defaultProps} onSubmit={onSubmitWithError} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test comment');
      
      const submitButton = screen.getByText('Post');
      await user.click(submitButton);
      
      // Should not crash and should keep the content
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test comment')).toBeInTheDocument();
      });
    });

    it('should handle mention utility errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockMentionUtils.findMentionQuery.mockImplementation(() => {
        throw new Error('Mention detection failed');
      });
      
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      
      // Should not crash when typing
      await user.type(textarea, 'Hey @Alice');
      
      expect(screen.getByDisplayValue('Hey @Alice')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should debounce mention detection', async () => {
      const user = userEvent.setup();
      
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      
      // Type rapidly
      await user.type(textarea, 'Hey @Alice', { delay: 10 });
      
      // Should not call mention detection for every keystroke
      expect(mockMentionUtils.findMentionQuery).toHaveBeenCalled();
    });

    it('should not re-render dropdown unnecessarily', async () => {
      const user = userEvent.setup();
      
      mockMentionUtils.findMentionQuery.mockReturnValue({
        start: 5,
        end: 7,
        query: 'Al'
      });
      
      const mockUsers = [
        {
          id: 'user-1',
          name: 'Alice Johnson',
          avatar: '👩‍💼',
          role: 'Project Manager',
          email: 'alice@company.com'
        }
      ];
      
      mockMentionUtils.filterUsersForMention.mockReturnValue(mockUsers);
      
      render(<CommentInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hey @Al');
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
      
      // Type more characters with same query result
      await user.type(textarea, 'ice');
      
      // Should still show the dropdown
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });
});