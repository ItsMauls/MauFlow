/**
 * Accessibility testing utilities for collaboration components
 * Provides helpers for testing keyboard navigation, ARIA attributes, and screen reader support
 */

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { KEYBOARD_KEYS, ARIA_ROLES } from '@/lib/accessibility';

// Keyboard navigation test helpers
export const keyboardNavigation = {
  // Test arrow key navigation in lists/dropdowns
  async testArrowKeyNavigation(container: HTMLElement, items: HTMLElement[]) {
    const firstItem = items[0];
    const lastItem = items[items.length - 1];

    // Focus first item
    firstItem.focus();
    expect(document.activeElement).toBe(firstItem);

    // Test arrow down navigation
    for (let i = 1; i < items.length; i++) {
      fireEvent.keyDown(document.activeElement!, { key: KEYBOARD_KEYS.ARROW_DOWN });
      await waitFor(() => {
        expect(document.activeElement).toBe(items[i]);
      });
    }

    // Test wrapping to first item
    fireEvent.keyDown(document.activeElement!, { key: KEYBOARD_KEYS.ARROW_DOWN });
    await waitFor(() => {
      expect(document.activeElement).toBe(firstItem);
    });

    // Test arrow up navigation
    fireEvent.keyDown(document.activeElement!, { key: KEYBOARD_KEYS.ARROW_UP });
    await waitFor(() => {
      expect(document.activeElement).toBe(lastItem);
    });
  },

  // Test Enter and Space key activation
  async testKeyActivation(element: HTMLElement, onActivate: jest.Mock) {
    element.focus();
    
    // Test Enter key
    fireEvent.keyDown(element, { key: KEYBOARD_KEYS.ENTER });
    expect(onActivate).toHaveBeenCalledTimes(1);

    // Test Space key
    fireEvent.keyDown(element, { key: KEYBOARD_KEYS.SPACE });
    expect(onActivate).toHaveBeenCalledTimes(2);
  },

  // Test Escape key handling
  async testEscapeKey(element: HTMLElement, onEscape: jest.Mock) {
    element.focus();
    fireEvent.keyDown(element, { key: KEYBOARD_KEYS.ESCAPE });
    expect(onEscape).toHaveBeenCalledTimes(1);
  },

  // Test Tab key focus trapping in modals
  async testFocusTrapping(modal: HTMLElement) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    firstElement.focus();
    expect(document.activeElement).toBe(firstElement);

    // Tab to last element
    for (let i = 1; i < focusableElements.length; i++) {
      fireEvent.keyDown(document.activeElement!, { key: KEYBOARD_KEYS.TAB });
      await waitFor(() => {
        expect(document.activeElement).toBe(focusableElements[i]);
      });
    }

    // Tab from last element should wrap to first
    fireEvent.keyDown(document.activeElement!, { key: KEYBOARD_KEYS.TAB });
    await waitFor(() => {
      expect(document.activeElement).toBe(firstElement);
    });

    // Shift+Tab from first element should wrap to last
    fireEvent.keyDown(document.activeElement!, { key: KEYBOARD_KEYS.TAB, shiftKey: true });
    await waitFor(() => {
      expect(document.activeElement).toBe(lastElement);
    });
  }
};

// ARIA attributes testing helpers
export const ariaAttributes = {
  // Test required ARIA attributes for components
  testNotificationItem(element: HTMLElement) {
    expect(element).toHaveAttribute('role', 'listitem');
    expect(element).toHaveAttribute('tabindex', '0');
    expect(element).toHaveAttribute('aria-label');
    
    const ariaLabel = element.getAttribute('aria-label');
    expect(ariaLabel).toContain('notification');
    expect(ariaLabel).toMatch(/(read|unread)/i);
  },

  testNotificationCenter(element: HTMLElement) {
    expect(element).toHaveAttribute('role', ARIA_ROLES.NOTIFICATION_CENTER);
    expect(element).toHaveAttribute('aria-label');
    
    const button = element.querySelector('button');
    expect(button).toHaveAttribute('aria-expanded');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
  },

  testDelegationModal(modal: HTMLElement) {
    expect(modal).toHaveAttribute('role', ARIA_ROLES.DELEGATION_MODAL);
    expect(modal).toHaveAttribute('aria-labelledby');
    expect(modal).toHaveAttribute('aria-describedby');
    expect(modal).toHaveAttribute('aria-modal', 'true');
  },

  testTeamMemberSelector(element: HTMLElement) {
    expect(element).toHaveAttribute('role', ARIA_ROLES.TEAM_MEMBER_SELECTOR);
    expect(element).toHaveAttribute('aria-expanded');
    expect(element).toHaveAttribute('aria-haspopup', 'listbox');
    
    const input = element.querySelector('input');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-controls');
  },

  testMentionDropdown(dropdown: HTMLElement) {
    expect(dropdown).toHaveAttribute('role', ARIA_ROLES.MENTION_DROPDOWN);
    
    const options = dropdown.querySelectorAll('[role="option"]');
    options.forEach((option, index) => {
      expect(option).toHaveAttribute('aria-selected');
      expect(option).toHaveAttribute('id');
    });
  },

  testCommentInput(element: HTMLElement) {
    expect(element).toHaveAttribute('role', ARIA_ROLES.COMMENT_INPUT);
    expect(element).toHaveAttribute('aria-label');
    expect(element).toHaveAttribute('aria-multiline', 'true');
  }
};

// Screen reader testing helpers
export const screenReader = {
  // Test live region announcements
  async testLiveRegionAnnouncement(expectedMessage: string) {
    await waitFor(() => {
      const liveRegion = document.querySelector('[aria-live]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveTextContent(expectedMessage);
    });
  },

  // Test aria-describedby relationships
  testAriaDescribedBy(element: HTMLElement, descriptionId: string) {
    expect(element).toHaveAttribute('aria-describedby', descriptionId);
    
    const description = document.getElementById(descriptionId);
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent(/\S/); // Has non-whitespace content
  },

  // Test aria-labelledby relationships
  testAriaLabelledBy(element: HTMLElement, labelId: string) {
    expect(element).toHaveAttribute('aria-labelledby', labelId);
    
    const label = document.getElementById(labelId);
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent(/\S/); // Has non-whitespace content
  }
};

// Mobile accessibility testing helpers
export const mobileAccessibility = {
  // Test touch target sizes (minimum 44px)
  testTouchTargetSize(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);
  },

  // Test responsive font sizes
  testResponsiveFontSize(element: HTMLElement, breakpoint: 'mobile' | 'tablet' | 'desktop') {
    const computedStyle = window.getComputedStyle(element);
    const fontSize = parseFloat(computedStyle.fontSize);
    
    switch (breakpoint) {
      case 'mobile':
        expect(fontSize).toBeGreaterThanOrEqual(16); // Minimum 16px for mobile
        break;
      case 'tablet':
        expect(fontSize).toBeGreaterThanOrEqual(14);
        break;
      case 'desktop':
        expect(fontSize).toBeGreaterThanOrEqual(12);
        break;
    }
  },

  // Test mobile-friendly spacing
  testMobileSpacing(element: HTMLElement) {
    const computedStyle = window.getComputedStyle(element);
    const padding = parseFloat(computedStyle.padding);
    
    // Mobile should have adequate padding for touch interaction
    expect(padding).toBeGreaterThanOrEqual(12);
  }
};

// Color contrast testing helpers
export const colorContrast = {
  // Test color contrast ratios (simplified - in real tests you'd use a proper contrast checker)
  testContrastRatio(element: HTMLElement, minimumRatio: number = 4.5) {
    const computedStyle = window.getComputedStyle(element);
    const color = computedStyle.color;
    const backgroundColor = computedStyle.backgroundColor;
    
    // This is a simplified test - in practice you'd use a library like 'color-contrast'
    expect(color).toBeTruthy();
    expect(backgroundColor).toBeTruthy();
    
    // Ensure colors are not the same (basic contrast check)
    expect(color).not.toBe(backgroundColor);
  },

  // Test high contrast mode support
  testHighContrastMode(element: HTMLElement) {
    // Simulate high contrast mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Test that element has appropriate high contrast styles
    expect(element).toHaveClass(/border-white|text-white|bg-black/);
  }
};

// Animation and motion testing helpers
export const motionAccessibility = {
  // Test reduced motion preference
  testReducedMotion(element: HTMLElement) {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const computedStyle = window.getComputedStyle(element);
    
    // Should not have animations when reduced motion is preferred
    expect(computedStyle.animationDuration).toBe('0s');
    expect(computedStyle.transitionDuration).toBe('0s');
  }
};

// Comprehensive accessibility test suite
export const runAccessibilityTests = {
  async notificationItem(element: HTMLElement, onActivate: jest.Mock) {
    // ARIA attributes
    ariaAttributes.testNotificationItem(element);
    
    // Keyboard navigation
    await keyboardNavigation.testKeyActivation(element, onActivate);
    
    // Touch target size (if on mobile)
    if (window.innerWidth <= 640) {
      mobileAccessibility.testTouchTargetSize(element);
    }
    
    // Color contrast
    colorContrast.testContrastRatio(element);
  },

  async delegationModal(modal: HTMLElement) {
    // ARIA attributes
    ariaAttributes.testDelegationModal(modal);
    
    // Focus trapping
    await keyboardNavigation.testFocusTrapping(modal);
    
    // Escape key handling
    const onEscape = jest.fn();
    await keyboardNavigation.testEscapeKey(modal, onEscape);
  },

  async teamMemberSelector(element: HTMLElement, items: HTMLElement[]) {
    // ARIA attributes
    ariaAttributes.testTeamMemberSelector(element);
    
    // Arrow key navigation
    await keyboardNavigation.testArrowKeyNavigation(element, items);
    
    // Mobile accessibility
    if (window.innerWidth <= 640) {
      mobileAccessibility.testTouchTargetSize(element);
      mobileAccessibility.testResponsiveFontSize(element, 'mobile');
    }
  }
};