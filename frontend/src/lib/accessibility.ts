/**
 * Accessibility utilities for collaboration components
 * Provides ARIA labels, keyboard navigation helpers, and screen reader support
 */

// ARIA role definitions for collaboration components
export const ARIA_ROLES = {
  NOTIFICATION_CENTER: 'region',
  NOTIFICATION_LIST: 'list',
  NOTIFICATION_ITEM: 'listitem',
  DELEGATION_MODAL: 'dialog',
  TEAM_MEMBER_SELECTOR: 'combobox',
  MENTION_DROPDOWN: 'listbox',
  COMMENT_INPUT: 'textbox',
  BULK_ACTIONS: 'toolbar'
} as const;

// ARIA live region types for dynamic content
export const ARIA_LIVE = {
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
  OFF: 'off'
} as const;

// Screen reader announcements for collaboration actions
export const SCREEN_READER_MESSAGES = {
  TASK_DELEGATED: (taskTitle: string, assigneeName: string) => 
    `Task "${taskTitle}" has been delegated to ${assigneeName}`,
  TASK_DELEGATION_RECEIVED: (taskTitle: string, delegatorName: string) => 
    `You have been assigned task "${taskTitle}" by ${delegatorName}`,
  COMMENT_POSTED: (taskTitle: string) => 
    `Comment posted on task "${taskTitle}"`,
  MENTION_ADDED: (userName: string) => 
    `${userName} has been mentioned in your comment`,
  NOTIFICATION_RECEIVED: (type: string, count: number) => 
    `${count} new ${type} notification${count !== 1 ? 's' : ''}`,
  NOTIFICATION_MARKED_READ: (count: number) => 
    `${count} notification${count !== 1 ? 's' : ''} marked as read`,
  BULK_ACTION_COMPLETED: (action: string, count: number) => 
    `${action} completed for ${count} notification${count !== 1 ? 's' : ''}`,
  TEAM_MEMBER_SELECTED: (memberName: string) => 
    `${memberName} selected for delegation`,
  MENTION_SUGGESTION: (memberName: string, role: string) => 
    `${memberName}, ${role}, available for mention`
} as const;

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End'
} as const;

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = [];

  static pushFocus(element: HTMLElement) {
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus && currentFocus !== document.body) {
      this.focusStack.push(currentFocus);
    }
    element.focus();
  }

  static popFocus() {
    const previousFocus = this.focusStack.pop();
    if (previousFocus) {
      previousFocus.focus();
    }
  }

  static trapFocus(container: HTMLElement, event: KeyboardEvent) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.key === KEYBOARD_KEYS.TAB) {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }
}

// Screen reader announcement utility
export class ScreenReaderAnnouncer {
  private static liveRegion: HTMLElement | null = null;

  static initialize() {
    if (!this.liveRegion) {
      this.liveRegion = document.createElement('div');
      this.liveRegion.setAttribute('aria-live', ARIA_LIVE.POLITE);
      this.liveRegion.setAttribute('aria-atomic', 'true');
      this.liveRegion.setAttribute('class', 'sr-only');
      this.liveRegion.style.position = 'absolute';
      this.liveRegion.style.left = '-10000px';
      this.liveRegion.style.width = '1px';
      this.liveRegion.style.height = '1px';
      this.liveRegion.style.overflow = 'hidden';
      document.body.appendChild(this.liveRegion);
    }
  }

  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    this.initialize();
    if (this.liveRegion) {
      this.liveRegion.setAttribute('aria-live', priority);
      this.liveRegion.textContent = message;
      
      // Clear after announcement to allow repeated messages
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = '';
        }
      }, 1000);
    }
  }
}

// ARIA label generators for dynamic content
export const generateAriaLabel = {
  notificationItem: (notification: { title: string; isRead: boolean; type: string; createdAt: string }) => {
    const readStatus = notification.isRead ? 'read' : 'unread';
    const timeAgo = formatTimeAgo(notification.createdAt);
    return `${notification.title}, ${readStatus} ${notification.type} notification from ${timeAgo}`;
  },

  delegationButton: (taskTitle: string, isDelegated: boolean, assigneeName?: string) => {
    if (isDelegated && assigneeName) {
      return `Reassign task "${taskTitle}" currently assigned to ${assigneeName}`;
    }
    return `Delegate task "${taskTitle}"`;
  },

  teamMemberOption: (member: { name: string; role: string; isOnline: boolean }) => {
    const status = member.isOnline ? 'online' : 'offline';
    return `${member.name}, ${member.role}, ${status}`;
  },

  mentionSuggestion: (user: { name: string; role?: string }) => {
    return `Mention ${user.name}${user.role ? `, ${user.role}` : ''}`;
  },

  notificationBadge: (count: number) => {
    return `${count} unread notification${count !== 1 ? 's' : ''}`;
  }
};

// Helper function for time formatting (used in ARIA labels)
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}

// Responsive design breakpoints for collaboration components
export const RESPONSIVE_BREAKPOINTS = {
  MOBILE: '(max-width: 640px)',
  TABLET: '(max-width: 1024px)',
  DESKTOP: '(min-width: 1025px)'
} as const;

// Mobile-specific accessibility helpers
export const mobileAccessibility = {
  // Increase touch target sizes for mobile
  getTouchTargetSize: (isTouch: boolean) => isTouch ? 'min-h-[44px] min-w-[44px]' : '',
  
  // Adjust font sizes for mobile readability
  getMobileFontSize: (baseSize: string) => {
    const sizeMap: Record<string, string> = {
      'text-xs': 'text-sm',
      'text-sm': 'text-base',
      'text-base': 'text-lg'
    };
    return sizeMap[baseSize] || baseSize;
  },

  // Mobile-friendly spacing
  getMobileSpacing: (baseSpacing: string) => {
    const spacingMap: Record<string, string> = {
      'p-2': 'p-3',
      'p-3': 'p-4',
      'gap-2': 'gap-3',
      'gap-3': 'gap-4'
    };
    return spacingMap[baseSpacing] || baseSpacing;
  }
};

// High contrast mode detection and styles
export const highContrastSupport = {
  // Detect if user prefers high contrast
  prefersHighContrast: () => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  // Get high contrast styles
  getHighContrastStyles: (baseStyles: string) => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-contrast: high)').matches) {
      return `${baseStyles} border-2 border-white text-white bg-black`;
    }
    return baseStyles;
  }
};

// Reduced motion support
export const reducedMotionSupport = {
  // Detect if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get animation styles respecting reduced motion preference
  getAnimationStyles: (animationStyles: string, staticStyles: string = '') => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return staticStyles;
    }
    return animationStyles;
  }
};