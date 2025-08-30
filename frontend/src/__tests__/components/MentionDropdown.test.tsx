/**
 * Unit Tests for MentionDropdown Component
 * Tests mention dropdown functionality, keyboard navigation, and user selection
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MentionDropdown } from '@/components/tasks/MentionDropdown';
import { MentionUser } from '@/types/comments';

// Mock users for testing
const mockUsers: MentionUser[] = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    avatar: '👩‍💼',
    role: 'Project Manager',
    email: 'alice@company.com'
  },
  {
    id: 'user-2',
    name: 'Bob Smith',
    avatar: '👨‍💻',
    role: 'Developer',
    email: 'bob@company.com'
  },
  {
    id: 'user-3',
    name: 'Carol Davis',
    avatar: '👩‍💻',
    role: 'Designer',
    email: 'carol@company.com'
  }
];

const defaultProps = {
  users: mockUsers,
  onSelect: jest.fn(),
  onClose: jest.fn(),
  position: { top: 100, left: 50 },
  query: 'test'
};

describe('MentionDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render user list', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Carol Davis')).toBeInTheDocument();
    });

    it('should display user roles', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      expect(screen.getByText('Project Manager')).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
      expect(screen.getByText('Designer')).toBeInTheDocument();
    });

    it('should display user emails', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      expect(screen.getByText('alice@company.com')).toBeInTheDocument();
      expect(screen.getByText('bob@company.com')).toBeInTheDocument();
      expect(screen.getByText('carol@company.com')).toBeInTheDocument();
    });

    it('should display mention preview', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      expect(screen.getByText('@AliceJohnson')).toBeInTheDocument();
      expect(screen.getByText('@BobSmith')).toBeInTheDocument();
      expect(screen.getByText('@CarolDavis')).toBeInTheDocument();
    });

    it('should display user avatars', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      expect(screen.getByText('👩‍💼')).toBeInTheDocument();
      expect(screen.getByText('👨‍💻')).toBeInTheDocument();
      expect(screen.getByText('👩‍💻')).toBeInTheDocument();
    });

    it('should display initials when no avatar', () => {
      const usersWithoutAvatars = mockUsers.map(user => ({ ...user, avatar: undefined }));
      render(<MentionDropdown {...defaultProps} users={usersWithoutAvatars} />);
      
      expect(screen.getByText('A')).toBeInTheDocument(); // Alice
      expect(screen.getByText('B')).toBeInTheDocument(); // Bob
      expect(screen.getByText('C')).toBeInTheDocument(); // Carol
    });

    it('should show navigation hint', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      expect(screen.getByText('↑↓ Navigate • Enter Select • Esc Close')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show no users found message', () => {
      render(<MentionDropdown {...defaultProps} users={[]} query="nonexistent" />);
      
      expect(screen.getByText('No users found for "nonexistent"')).toBeInTheDocument();
    });

    it('should not show navigation hint when no users', () => {
      render(<MentionDropdown {...defaultProps} users={[]} />);
      
      expect(screen.queryByText('↑↓ Navigate • Enter Select • Esc Close')).not.toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should call onSelect when user is clicked', async () => {
      const user = userEvent.setup();
      render(<MentionDropdown {...defaultProps} />);
      
      await user.click(screen.getByText('Alice Johnson'));
      
      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('should call onClose when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <MentionDropdown {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );
      
      await user.click(screen.getByTestId('outside'));
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should highlight user on hover', async () => {
      const user = userEvent.setup();
      render(<MentionDropdown {...defaultProps} />);
      
      const aliceButton = screen.getByText('Alice Johnson').closest('button');
      await user.hover(aliceButton!);
      
      expect(aliceButton).toHaveClass('bg-white/15');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate down with arrow key', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      // Second item should be selected (index 1)
      const bobButton = screen.getByText('Bob Smith').closest('button');
      expect(bobButton).toHaveClass('bg-white/15');
    });

    it('should navigate up with arrow key', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      // Navigate down first, then up
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowUp' });
      
      // First item should be selected again (index 0)
      const aliceButton = screen.getByText('Alice Johnson').closest('button');
      expect(aliceButton).toHaveClass('bg-white/15');
    });

    it('should wrap around when navigating past end', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      // Navigate to last item and then one more
      fireEvent.keyDown(document, { key: 'ArrowDown' }); // index 1
      fireEvent.keyDown(document, { key: 'ArrowDown' }); // index 2
      fireEvent.keyDown(document, { key: 'ArrowDown' }); // should wrap to index 0
      
      const aliceButton = screen.getByText('Alice Johnson').closest('button');
      expect(aliceButton).toHaveClass('bg-white/15');
    });

    it('should wrap around when navigating past beginning', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      // Navigate up from first item
      fireEvent.keyDown(document, { key: 'ArrowUp' });
      
      // Should wrap to last item (index 2)
      const carolButton = screen.getByText('Carol Davis').closest('button');
      expect(carolButton).toHaveClass('bg-white/15');
    });

    it('should select user with Enter key', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      
      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('should close dropdown with Escape key', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should select correct user after navigation', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      // Navigate to second user and select
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'Enter' });
      
      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockUsers[1]);
    });
  });

  describe('Positioning', () => {
    it('should apply correct position styles', () => {
      const position = { top: 150, left: 75 };
      render(<MentionDropdown {...defaultProps} position={position} />);
      
      const dropdown = screen.getByRole('button', { name: /Alice Johnson/ }).closest('div')?.parentElement;
      expect(dropdown).toHaveStyle({
        position: 'absolute',
        top: '150px',
        left: '75px'
      });
    });

    it('should have high z-index for proper layering', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      const dropdown = screen.getByRole('button', { name: /Alice Johnson/ }).closest('div')?.parentElement;
      expect(dropdown).toHaveStyle({ zIndex: '1000' });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3); // One for each user
    });

    it('should have focus management', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      const firstButton = screen.getByText('Alice Johnson').closest('button');
      expect(firstButton).toHaveClass('focus:bg-white/15');
    });

    it('should support keyboard navigation', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      // Test that keyboard events are handled
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'Enter' });
      
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });
  });

  describe('Scrolling', () => {
    it('should be scrollable when many users', () => {
      const manyUsers = Array.from({ length: 15 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        role: 'Developer',
        email: `user${i}@company.com`
      }));
      
      render(<MentionDropdown {...defaultProps} users={manyUsers} />);
      
      const dropdown = screen.getByText('User 0').closest('div')?.parentElement;
      expect(dropdown).toHaveClass('overflow-y-auto');
      expect(dropdown).toHaveClass('max-h-[240px]');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<MentionDropdown {...defaultProps} className="custom-class" />);
      
      const dropdown = screen.getByText('Alice Johnson').closest('div')?.parentElement;
      expect(dropdown).toHaveClass('custom-class');
    });

    it('should have glass morphism styling', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      const dropdown = screen.getByText('Alice Johnson').closest('div')?.parentElement;
      expect(dropdown).toHaveClass('backdrop-blur-xl');
      expect(dropdown).toHaveClass('bg-white/10');
      expect(dropdown).toHaveClass('border-white/20');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<MentionDropdown {...defaultProps} />);
      
      // Re-render with same props
      rerender(<MentionDropdown {...defaultProps} />);
      
      // Should still show all users
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Carol Davis')).toBeInTheDocument();
    });

    it('should handle rapid keyboard navigation', () => {
      render(<MentionDropdown {...defaultProps} />);
      
      // Rapid navigation
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(document, { key: 'ArrowDown' });
      }
      
      // Should still work correctly
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });
  });
});