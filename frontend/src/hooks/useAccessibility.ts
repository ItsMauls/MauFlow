'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook for managing focus and keyboard navigation
 */
export const useFocusManagement = () => {
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const currentFocusIndexRef = useRef(0);

  const updateFocusableElements = useCallback((container: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    focusableElementsRef.current = elements.filter(el => {
      // Check if element is visible
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
  }, []);

  const focusNext = useCallback(() => {
    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    currentFocusIndexRef.current = (currentFocusIndexRef.current + 1) % elements.length;
    elements[currentFocusIndexRef.current]?.focus();
  }, []);

  const focusPrevious = useCallback(() => {
    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    currentFocusIndexRef.current = currentFocusIndexRef.current === 0 
      ? elements.length - 1 
      : currentFocusIndexRef.current - 1;
    elements[currentFocusIndexRef.current]?.focus();
  }, []);

  const focusFirst = useCallback(() => {
    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    currentFocusIndexRef.current = 0;
    elements[0]?.focus();
  }, []);

  const focusLast = useCallback(() => {
    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    currentFocusIndexRef.current = elements.length - 1;
    elements[elements.length - 1]?.focus();
  }, []);

  return {
    updateFocusableElements,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    focusableElements: focusableElementsRef.current
  };
};

/**
 * Hook for managing ARIA live regions for screen reader announcements
 */
export const useAriaLiveRegion = () => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.id = 'aria-live-region';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegionRef.current) return;

    liveRegionRef.current.setAttribute('aria-live', priority);
    liveRegionRef.current.textContent = message;

    // Clear the message after a delay to allow for re-announcements
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  return { announce };
};

/**
 * Hook for managing modal accessibility
 */
export const useModalAccessibility = (isOpen: boolean) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { updateFocusableElements, focusFirst, focusLast } = useFocusManagement();

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus the modal
      if (modalRef.current) {
        updateFocusableElements(modalRef.current);
        focusFirst();
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, updateFocusableElements, focusFirst]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        // Modal should handle its own close logic
        break;
      case 'Tab':
        if (!modalRef.current) return;
        
        updateFocusableElements(modalRef.current);
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
        ) as NodeListOf<HTMLElement>;
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
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
        break;
    }
  }, [isOpen, updateFocusableElements]);

  return {
    modalRef,
    handleKeyDown
  };
};

/**
 * Hook for managing skip links for keyboard navigation
 */
export const useSkipLinks = () => {
  const skipLinksRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!skipLinksRef.current) {
      const skipLinks = document.createElement('div');
      skipLinks.className = 'skip-links';
      skipLinks.innerHTML = `
        <a href="#main-content" class="skip-link">Skip to main content</a>
        <a href="#navigation" class="skip-link">Skip to navigation</a>
      `;
      document.body.insertBefore(skipLinks, document.body.firstChild);
      skipLinksRef.current = skipLinks;
    }

    return () => {
      if (skipLinksRef.current && document.body.contains(skipLinksRef.current)) {
        document.body.removeChild(skipLinksRef.current);
      }
    };
  }, []);

  return skipLinksRef;
};

/**
 * Hook for managing reduced motion preferences
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook for managing high contrast mode
 */
export const useHighContrast = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
};

/**
 * Hook for generating accessible IDs
 */
export const useAccessibleId = (prefix: string = 'accessible') => {
  const idRef = useRef<string>(`${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return idRef.current;
};

/**
 * Hook for managing ARIA expanded state
 */
export const useAriaExpanded = (initialState: boolean = false) => {
  const [isExpanded, setIsExpanded] = useState(initialState);
  const { announce } = useAriaLiveRegion();

  const toggle = useCallback((label?: string) => {
    setIsExpanded(prev => {
      const newState = !prev;
      if (label) {
        announce(`${label} ${newState ? 'expanded' : 'collapsed'}`);
      }
      return newState;
    });
  }, [announce]);

  const expand = useCallback((label?: string) => {
    setIsExpanded(true);
    if (label) {
      announce(`${label} expanded`);
    }
  }, [announce]);

  const collapse = useCallback((label?: string) => {
    setIsExpanded(false);
    if (label) {
      announce(`${label} collapsed`);
    }
  }, [announce]);

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    ariaExpanded: isExpanded.toString()
  };
};

/**
 * Hook for managing form accessibility
 */
export const useFormAccessibility = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { announce } = useAriaLiveRegion();

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    announce(`Error in ${fieldName}: ${error}`, 'assertive');
  }, [announce]);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getFieldProps = useCallback((fieldName: string) => {
    const hasError = !!errors[fieldName];
    const errorId = hasError ? `${fieldName}-error` : undefined;

    return {
      'aria-invalid': hasError,
      'aria-describedby': errorId,
      id: fieldName
    };
  }, [errors]);

  const getErrorProps = useCallback((fieldName: string) => {
    const hasError = !!errors[fieldName];
    
    return hasError ? {
      id: `${fieldName}-error`,
      role: 'alert',
      'aria-live': 'polite' as const
    } : {};
  }, [errors]);

  return {
    errors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    getFieldProps,
    getErrorProps
  };
};

/**
 * Utility function to generate ARIA labels for complex components
 */
export const generateAriaLabel = (
  baseLabel: string,
  context?: {
    status?: string;
    priority?: string;
    count?: number;
    position?: { current: number; total: number };
  }
): string => {
  let label = baseLabel;

  if (context?.status) {
    label += `, status: ${context.status}`;
  }

  if (context?.priority) {
    label += `, priority: ${context.priority}`;
  }

  if (context?.count !== undefined) {
    label += `, ${context.count} items`;
  }

  if (context?.position) {
    label += `, item ${context.position.current} of ${context.position.total}`;
  }

  return label;
};