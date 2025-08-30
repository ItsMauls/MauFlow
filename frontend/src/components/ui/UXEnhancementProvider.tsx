'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useKeyboardShortcuts, createCommonShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAriaLiveRegion, useReducedMotion, useHighContrast } from '@/hooks/useAccessibility';

interface UXEnhancementContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
}

const UXEnhancementContext = createContext<UXEnhancementContextType | null>(null);

interface UXEnhancementProviderProps {
  children: React.ReactNode;
  keyboardShortcuts?: {
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
  };
}

export const UXEnhancementProvider: React.FC<UXEnhancementProviderProps> = ({
  children,
  keyboardShortcuts = {}
}) => {
  const { announce } = useAriaLiveRegion();
  const prefersReducedMotion = useReducedMotion();
  const prefersHighContrast = useHighContrast();

  // Set up keyboard shortcuts
  const shortcuts = createCommonShortcuts(keyboardShortcuts);
  useKeyboardShortcuts({ shortcuts });

  // Apply accessibility classes to body
  useEffect(() => {
    const body = document.body;
    
    if (prefersReducedMotion) {
      body.classList.add('reduce-motion');
    } else {
      body.classList.remove('reduce-motion');
    }

    if (prefersHighContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }
  }, [prefersReducedMotion, prefersHighContrast]);

  const contextValue: UXEnhancementContextType = {
    announce,
    prefersReducedMotion,
    prefersHighContrast
  };

  return (
    <UXEnhancementContext.Provider value={contextValue}>
      {children}
    </UXEnhancementContext.Provider>
  );
};

export const useUXEnhancement = () => {
  const context = useContext(UXEnhancementContext);
  if (!context) {
    throw new Error('useUXEnhancement must be used within UXEnhancementProvider');
  }
  return context;
};