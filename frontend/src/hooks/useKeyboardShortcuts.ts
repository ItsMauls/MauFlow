'use client';

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category?: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  target?: HTMLElement | null;
}

/**
 * Hook for managing keyboard shortcuts with accessibility support
 * Provides common shortcuts for task management, navigation, and UI actions
 */
export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
  target
}: UseKeyboardShortcutsOptions) => {
  const shortcutsRef = useRef<KeyboardShortcut[]>([]);
  const enabledRef = useRef(enabled);

  // Update refs when props change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    enabledRef.current = enabled;
  }, [shortcuts, enabled]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabledRef.current) return;

    // Don't trigger shortcuts when user is typing in input fields
    const activeElement = document.activeElement;
    const isInputField = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.getAttribute('contenteditable') === 'true'
    );

    if (isInputField) return;

    // Find matching shortcut
    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
      const altMatch = !!shortcut.altKey === event.altKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
      const metaMatch = !!shortcut.metaKey === event.metaKey;

      return keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch;
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      try {
        matchingShortcut.action();
      } catch (error) {
        console.error('Error executing keyboard shortcut:', error);
      }
    }
  }, []);

  useEffect(() => {
    const targetElement = target || document;
    
    if (enabled) {
      targetElement.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled, target]);

  return {
    shortcuts: shortcutsRef.current,
    enabled: enabledRef.current
  };
};

/**
 * Common keyboard shortcuts for the application
 */
export const createCommonShortcuts = (actions: {
  onNewTask?: () => void;
  onSearch?: () => void;
  onToggleView?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onEscape?: () => void;
  onHelp?: () => void;
  onRefresh?: () => void;
  onToggleCalendar?: () => void;
  onFocusNext?: () => void;
  onFocusPrevious?: () => void;
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onNewTask) {
    shortcuts.push({
      key: 'n',
      ctrlKey: true,
      action: actions.onNewTask,
      description: 'Create new task',
      category: 'Tasks'
    });
  }

  if (actions.onSearch) {
    shortcuts.push({
      key: 'k',
      ctrlKey: true,
      action: actions.onSearch,
      description: 'Open search',
      category: 'Navigation'
    });
  }

  if (actions.onToggleView) {
    shortcuts.push({
      key: 'v',
      ctrlKey: true,
      action: actions.onToggleView,
      description: 'Toggle view mode',
      category: 'View'
    });
  }

  if (actions.onSave) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      action: actions.onSave,
      description: 'Save changes',
      category: 'Actions'
    });
  }

  if (actions.onUndo) {
    shortcuts.push({
      key: 'z',
      ctrlKey: true,
      action: actions.onUndo,
      description: 'Undo last action',
      category: 'Actions'
    });
  }

  if (actions.onRedo) {
    shortcuts.push({
      key: 'y',
      ctrlKey: true,
      action: actions.onRedo,
      description: 'Redo last action',
      category: 'Actions'
    });
  }

  if (actions.onDelete) {
    shortcuts.push({
      key: 'Delete',
      action: actions.onDelete,
      description: 'Delete selected item',
      category: 'Actions'
    });
  }

  if (actions.onEscape) {
    shortcuts.push({
      key: 'Escape',
      action: actions.onEscape,
      description: 'Close modal or cancel action',
      category: 'Navigation',
      preventDefault: false
    });
  }

  if (actions.onHelp) {
    shortcuts.push({
      key: '?',
      shiftKey: true,
      action: actions.onHelp,
      description: 'Show keyboard shortcuts',
      category: 'Help'
    });
  }

  if (actions.onRefresh) {
    shortcuts.push({
      key: 'r',
      ctrlKey: true,
      action: actions.onRefresh,
      description: 'Refresh data',
      category: 'Actions'
    });
  }

  if (actions.onToggleCalendar) {
    shortcuts.push({
      key: 'c',
      ctrlKey: true,
      action: actions.onToggleCalendar,
      description: 'Toggle calendar view',
      category: 'View'
    });
  }

  if (actions.onFocusNext) {
    shortcuts.push({
      key: 'j',
      action: actions.onFocusNext,
      description: 'Focus next item',
      category: 'Navigation'
    });
  }

  if (actions.onFocusPrevious) {
    shortcuts.push({
      key: 'k',
      action: actions.onFocusPrevious,
      description: 'Focus previous item',
      category: 'Navigation'
    });
  }

  return shortcuts;
};

/**
 * Hook for displaying keyboard shortcuts help
 */
export const useShortcutsHelp = (shortcuts: KeyboardShortcut[]) => {
  const formatShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const keys: string[] = [];
    
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.metaKey) keys.push('Cmd');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.shiftKey) keys.push('Shift');
    
    keys.push(shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1));
    
    return keys.join(' + ');
  }, []);

  const groupedShortcuts = useCallback(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};
    
    shortcuts.forEach(shortcut => {
      const category = shortcut.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
    });
    
    return groups;
  }, [shortcuts]);

  return {
    formatShortcut,
    groupedShortcuts: groupedShortcuts()
  };
};

/**
 * Accessibility helper for announcing keyboard shortcuts to screen readers
 */
export const announceShortcut = (description: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = `Keyboard shortcut activated: ${description}`;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};