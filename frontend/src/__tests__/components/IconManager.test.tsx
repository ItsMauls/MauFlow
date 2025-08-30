/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IconManager } from '@/components/icons/IconManager';
import { IconSelector } from '@/components/icons/IconSelector';
import { EditableTitleIcon } from '@/components/icons/EditableTitleIcon';
import { IconConfig } from '@/components/icons/types';

// Mock icons for testing
const mockIcons: IconConfig[] = [
  {
    id: 'star',
    name: 'Star',
    component: () => <span data-testid="star-icon">⭐</span>,
    category: 'general'
  },
  {
    id: 'heart',
    name: 'Heart',
    component: () => <span data-testid="heart-icon">❤️</span>,
    category: 'general'
  },
  {
    id: 'high',
    name: 'High Priority',
    component: () => <span data-testid="high-icon">🔴</span>,
    category: 'priority'
  }
];

describe('IconManager Component', () => {
  const defaultProps = {
    availableIcons: mockIcons,
    onIconSelect: jest.fn(),
    editable: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default icon when no current icon is selected', () => {
    render(<IconManager {...defaultProps} />);
    
    expect(screen.getByText('Select Icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with current icon when provided', () => {
    render(<IconManager {...defaultProps} currentIcon="star" />);
    
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
  });

  it('opens icon selector when button is clicked', () => {
    render(<IconManager {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Select an Icon')).toBeInTheDocument();
  });

  it('calls onIconSelect when icon is selected', () => {
    const onIconSelect = jest.fn();
    render(<IconManager {...defaultProps} onIconSelect={onIconSelect} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const heartIcon = screen.getByTestId('heart-icon');
    fireEvent.click(heartIcon);
    
    expect(onIconSelect).toHaveBeenCalledWith('heart');
  });

  it('closes selector when icon is selected', async () => {
    render(<IconManager {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Select an Icon')).toBeInTheDocument();
    
    const heartIcon = screen.getByTestId('heart-icon');
    fireEvent.click(heartIcon);
    
    await waitFor(() => {
      expect(screen.queryByText('Select an Icon')).not.toBeInTheDocument();
    });
  });

  it('does not show edit button when not editable', () => {
    render(<IconManager {...defaultProps} editable={false} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows current icon even when not editable', () => {
    render(<IconManager {...defaultProps} currentIcon="star" editable={false} />);
    
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
  });
});

describe('IconSelector Component', () => {
  const defaultProps = {
    availableIcons: mockIcons,
    onIconSelect: jest.fn(),
    onClose: jest.fn(),
    isOpen: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all available icons', () => {
    render(<IconSelector {...defaultProps} />);
    
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    expect(screen.getByTestId('high-icon')).toBeInTheDocument();
  });

  it('groups icons by category', () => {
    render(<IconSelector {...defaultProps} />);
    
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
  });

  it('calls onIconSelect when icon is clicked', () => {
    const onIconSelect = jest.fn();
    render(<IconSelector {...defaultProps} onIconSelect={onIconSelect} />);
    
    const starIcon = screen.getByTestId('star-icon');
    fireEvent.click(starIcon);
    
    expect(onIconSelect).toHaveBeenCalledWith('star');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<IconSelector {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    render(<IconSelector {...defaultProps} onClose={onClose} />);
    
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when modal content is clicked', () => {
    const onClose = jest.fn();
    render(<IconSelector {...defaultProps} onClose={onClose} />);
    
    const modalContent = screen.getByTestId('modal-content');
    fireEvent.click(modalContent);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('filters icons by search term', () => {
    render(<IconSelector {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search icons...');
    fireEvent.change(searchInput, { target: { value: 'star' } });
    
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('heart-icon')).not.toBeInTheDocument();
  });

  it('shows no results message when search yields no results', () => {
    render(<IconSelector {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search icons...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No icons found')).toBeInTheDocument();
  });

  it('highlights selected icon', () => {
    render(<IconSelector {...defaultProps} selectedIcon="star" />);
    
    const starButton = screen.getByTestId('star-icon').closest('button');
    expect(starButton).toHaveClass('ring-2');
  });

  it('handles keyboard navigation', () => {
    render(<IconSelector {...defaultProps} />);
    
    const modal = screen.getByRole('dialog');
    fireEvent.keyDown(modal, { key: 'Escape' });
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not render when not open', () => {
    render(<IconSelector {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Select an Icon')).not.toBeInTheDocument();
  });
});

describe('EditableTitleIcon Component', () => {
  const defaultProps = {
    currentIcon: 'star',
    availableIcons: mockIcons,
    onIconChange: jest.fn(),
    editable: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders current icon', () => {
    render(<EditableTitleIcon {...defaultProps} />);
    
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
  });

  it('shows edit button when editable', () => {
    render(<EditableTitleIcon {...defaultProps} />);
    
    expect(screen.getByLabelText('Edit icon')).toBeInTheDocument();
  });

  it('does not show edit button when not editable', () => {
    render(<EditableTitleIcon {...defaultProps} editable={false} />);
    
    expect(screen.queryByLabelText('Edit icon')).not.toBeInTheDocument();
  });

  it('opens icon selector when edit button is clicked', () => {
    render(<EditableTitleIcon {...defaultProps} />);
    
    const editButton = screen.getByLabelText('Edit icon');
    fireEvent.click(editButton);
    
    expect(screen.getByText('Select an Icon')).toBeInTheDocument();
  });

  it('calls onIconChange when new icon is selected', () => {
    const onIconChange = jest.fn();
    render(<EditableTitleIcon {...defaultProps} onIconChange={onIconChange} />);
    
    const editButton = screen.getByLabelText('Edit icon');
    fireEvent.click(editButton);
    
    const heartIcon = screen.getByTestId('heart-icon');
    fireEvent.click(heartIcon);
    
    expect(onIconChange).toHaveBeenCalledWith('heart');
  });

  it('renders default icon when current icon is not found', () => {
    render(<EditableTitleIcon {...defaultProps} currentIcon="nonexistent" />);
    
    // Should render first available icon as fallback
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
  });

  it('handles missing availableIcons gracefully', () => {
    render(<EditableTitleIcon {...defaultProps} availableIcons={[]} />);
    
    expect(screen.getByText('No icon')).toBeInTheDocument();
  });

  it('supports custom className', () => {
    render(<EditableTitleIcon {...defaultProps} className="custom-class" />);
    
    const container = screen.getByTestId('star-icon').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('supports custom size', () => {
    render(<EditableTitleIcon {...defaultProps} size="lg" />);
    
    const icon = screen.getByTestId('star-icon');
    expect(icon).toHaveClass('text-2xl');
  });

  it('shows tooltip on hover', async () => {
    render(<EditableTitleIcon {...defaultProps} />);
    
    const iconContainer = screen.getByTestId('star-icon').closest('div');
    fireEvent.mouseEnter(iconContainer!);
    
    await waitFor(() => {
      expect(screen.getByText('Star')).toBeInTheDocument();
    });
  });

  it('handles icon change with animation', async () => {
    const { rerender } = render(<EditableTitleIcon {...defaultProps} />);
    
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    
    rerender(<EditableTitleIcon {...defaultProps} currentIcon="heart" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    });
  });
});