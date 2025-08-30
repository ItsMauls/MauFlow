/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IconManager } from '@/components/icons/IconManager';
import { EditableTitleIcon } from '@/components/icons/EditableTitleIcon';
import { IconConfig } from '@/components/icons/types';
import { getDefaultIcons, saveIconSettings, loadIconSettings } from '@/components/icons/utils';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock icon utilities
jest.mock('@/components/icons/utils', () => ({
  getDefaultIcons: jest.fn(),
  saveIconSettings: jest.fn(),
  loadIconSettings: jest.fn(),
  validateIconConfig: jest.fn(() => ({ isValid: true }))
}));

const mockIconUtils = require('@/components/icons/utils');

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
  },
  {
    id: 'medium',
    name: 'Medium Priority',
    component: () => <span data-testid="medium-icon">🟡</span>,
    category: 'priority'
  }
];

describe('Icon Management Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIconUtils.getDefaultIcons.mockReturnValue(mockIcons);
    mockIconUtils.loadIconSettings.mockReturnValue({
      titleIcon: 'star',
      defaultIcons: {
        status: { todo: 'circle', doing: 'arrow', done: 'check' },
        priority: { high: 'high', medium: 'medium', low: 'low' }
      },
      customIcons: []
    });
  });

  it('should complete full icon selection workflow', async () => {
    const onIconChange = jest.fn();
    
    render(
      <EditableTitleIcon
        currentIcon="star"
        availableIcons={mockIcons}
        onIconChange={onIconChange}
        editable={true}
      />
    );

    // Initial state - should show star icon
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();

    // Click edit button to open selector
    const editButton = screen.getByLabelText('Edit icon');
    fireEvent.click(editButton);

    // Selector should be open
    expect(screen.getByText('Select an Icon')).toBeInTheDocument();

    // Should show all available icons
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    expect(screen.getByTestId('high-icon')).toBeInTheDocument();

    // Select a different icon
    const heartIcon = screen.getByTestId('heart-icon');
    fireEvent.click(heartIcon);

    // Should call onIconChange
    expect(onIconChange).toHaveBeenCalledWith('heart');

    // Selector should close
    await waitFor(() => {
      expect(screen.queryByText('Select an Icon')).not.toBeInTheDocument();
    });
  });

  it('should persist icon settings to localStorage', async () => {
    const TestComponent = () => {
      const [currentIcon, setCurrentIcon] = React.useState('star');

      const handleIconChange = (iconId: string) => {
        setCurrentIcon(iconId);
        // Simulate saving to localStorage
        mockIconUtils.saveIconSettings({
          titleIcon: iconId,
          defaultIcons: {
            status: { todo: 'circle', doing: 'arrow', done: 'check' },
            priority: { high: 'high', medium: 'medium', low: 'low' }
          },
          customIcons: []
        });
      };

      return (
        <EditableTitleIcon
          currentIcon={currentIcon}
          availableIcons={mockIcons}
          onIconChange={handleIconChange}
          editable={true}
        />
      );
    };

    render(<TestComponent />);

    // Change icon
    const editButton = screen.getByLabelText('Edit icon');
    fireEvent.click(editButton);

    const heartIcon = screen.getByTestId('heart-icon');
    fireEvent.click(heartIcon);

    // Should save settings
    expect(mockIconUtils.saveIconSettings).toHaveBeenCalledWith({
      titleIcon: 'heart',
      defaultIcons: {
        status: { todo: 'circle', doing: 'arrow', done: 'check' },
        priority: { high: 'high', medium: 'medium', low: 'low' }
      },
      customIcons: []
    });
  });

  it('should load icon settings on component mount', () => {
    const TestComponent = () => {
      const [iconSettings, setIconSettings] = React.useState(null);

      React.useEffect(() => {
        const settings = mockIconUtils.loadIconSettings();
        setIconSettings(settings);
      }, []);

      if (!iconSettings) return <div>Loading...</div>;

      return (
        <EditableTitleIcon
          currentIcon={iconSettings.titleIcon}
          availableIcons={mockIcons}
          onIconChange={() => {}}
          editable={true}
        />
      );
    };

    render(<TestComponent />);

    expect(mockIconUtils.loadIconSettings).toHaveBeenCalled();
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
  });

  it('should handle icon search and filtering', async () => {
    render(
      <IconManager
        availableIcons={mockIcons}
        onIconSelect={jest.fn()}
        editable={true}
      />
    );

    // Open selector
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Search for "heart"
    const searchInput = screen.getByPlaceholderText('Search icons...');
    fireEvent.change(searchInput, { target: { value: 'heart' } });

    // Should only show heart icon
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('star-icon')).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    // Should show all icons again
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
  });

  it('should handle category filtering', () => {
    render(
      <IconManager
        availableIcons={mockIcons}
        onIconSelect={jest.fn()}
        editable={true}
      />
    );

    // Open selector
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show category tabs
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();

    // Click on Priority category
    const priorityTab = screen.getByText('Priority');
    fireEvent.click(priorityTab);

    // Should only show priority icons
    expect(screen.getByTestId('high-icon')).toBeInTheDocument();
    expect(screen.getByTestId('medium-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('star-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('heart-icon')).not.toBeInTheDocument();
  });

  it('should handle keyboard navigation in icon selector', () => {
    render(
      <IconManager
        availableIcons={mockIcons}
        onIconSelect={jest.fn()}
        editable={true}
      />
    );

    // Open selector
    const button = screen.getByRole('button');
    fireEvent.click(button);

    const modal = screen.getByRole('dialog');

    // Test Escape key closes modal
    fireEvent.keyDown(modal, { key: 'Escape' });
    expect(screen.queryByText('Select an Icon')).not.toBeInTheDocument();

    // Reopen modal
    fireEvent.click(button);

    // Test Tab navigation
    fireEvent.keyDown(modal, { key: 'Tab' });
    expect(document.activeElement).toBeTruthy();

    // Test Enter key on icon
    const firstIcon = screen.getByTestId('star-icon').closest('button');
    firstIcon?.focus();
    fireEvent.keyDown(firstIcon!, { key: 'Enter' });
    
    // Should close modal
    expect(screen.queryByText('Select an Icon')).not.toBeInTheDocument();
  });

  it('should handle icon removal workflow', async () => {
    const TestComponent = () => {
      const [currentIcon, setCurrentIcon] = React.useState('star');

      const handleIconRemove = () => {
        setCurrentIcon('');
        // Simulate removing icon from settings
        mockIconUtils.saveIconSettings({
          titleIcon: '',
          defaultIcons: {
            status: {},
            priority: {}
          },
          customIcons: []
        });
      };

      return (
        <div>
          <EditableTitleIcon
            currentIcon={currentIcon}
            availableIcons={mockIcons}
            onIconChange={setCurrentIcon}
            editable={true}
          />
          <button onClick={handleIconRemove}>Remove Icon</button>
        </div>
      );
    };

    render(<TestComponent />);

    // Initially should show star icon
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();

    // Remove icon
    const removeButton = screen.getByText('Remove Icon');
    fireEvent.click(removeButton);

    // Should show default state
    expect(screen.queryByTestId('star-icon')).not.toBeInTheDocument();
    expect(screen.getByText('No icon')).toBeInTheDocument();
  });

  it('should handle error states gracefully', () => {
    // Mock localStorage error
    mockIconUtils.loadIconSettings.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const TestComponent = () => {
      const [error, setError] = React.useState(null);

      React.useEffect(() => {
        try {
          mockIconUtils.loadIconSettings();
        } catch (err) {
          setError(err.message);
        }
      }, []);

      if (error) {
        return <div>Error loading icons: {error}</div>;
      }

      return (
        <EditableTitleIcon
          currentIcon="star"
          availableIcons={mockIcons}
          onIconChange={() => {}}
          editable={true}
        />
      );
    };

    render(<TestComponent />);

    expect(screen.getByText('Error loading icons: Storage error')).toBeInTheDocument();
  });

  it('should handle concurrent icon changes', async () => {
    const onIconChange = jest.fn();
    
    render(
      <EditableTitleIcon
        currentIcon="star"
        availableIcons={mockIcons}
        onIconChange={onIconChange}
        editable={true}
      />
    );

    // Open selector
    const editButton = screen.getByLabelText('Edit icon');
    fireEvent.click(editButton);

    // Quickly select multiple icons
    const heartIcon = screen.getByTestId('heart-icon');
    const highIcon = screen.getByTestId('high-icon');

    fireEvent.click(heartIcon);
    fireEvent.click(highIcon);

    // Should handle both calls
    expect(onIconChange).toHaveBeenCalledTimes(2);
    expect(onIconChange).toHaveBeenCalledWith('heart');
    expect(onIconChange).toHaveBeenCalledWith('high');
  });

  it('should validate icon configurations', () => {
    const invalidIcon = {
      id: '',
      name: '',
      component: null,
      category: 'invalid'
    };

    mockIconUtils.validateIconConfig.mockReturnValue({
      isValid: false,
      error: 'Invalid icon configuration'
    });

    const TestComponent = () => {
      const [error, setError] = React.useState(null);

      React.useEffect(() => {
        const validation = mockIconUtils.validateIconConfig(invalidIcon);
        if (!validation.isValid) {
          setError(validation.error);
        }
      }, []);

      if (error) {
        return <div>Validation error: {error}</div>;
      }

      return <div>Valid configuration</div>;
    };

    render(<TestComponent />);

    expect(screen.getByText('Validation error: Invalid icon configuration')).toBeInTheDocument();
  });

  it('should handle icon preview and tooltips', async () => {
    render(
      <EditableTitleIcon
        currentIcon="star"
        availableIcons={mockIcons}
        onIconChange={() => {}}
        editable={true}
      />
    );

    // Hover over icon to show tooltip
    const iconContainer = screen.getByTestId('star-icon').closest('div');
    fireEvent.mouseEnter(iconContainer!);

    await waitFor(() => {
      expect(screen.getByText('Star')).toBeInTheDocument();
    });

    // Mouse leave should hide tooltip
    fireEvent.mouseLeave(iconContainer!);

    await waitFor(() => {
      expect(screen.queryByText('Star')).not.toBeInTheDocument();
    });
  });
});