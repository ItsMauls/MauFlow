/**
 * Responsive design utilities for collaboration components
 * Provides breakpoint detection, mobile-first styling, and adaptive layouts
 */

import { useEffect, useState } from 'react';

// Breakpoint definitions
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
  wide: 1536
} as const;

// Media query strings
export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.mobile - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  wide: `(min-width: ${BREAKPOINTS.desktop}px)`,
  
  // Utility queries
  touchDevice: '(hover: none) and (pointer: coarse)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  highContrast: '(prefers-contrast: high)',
  darkMode: '(prefers-color-scheme: dark)'
} as const;

// Hook for detecting current breakpoint
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop' | 'wide'>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < BREAKPOINTS.mobile) {
        setBreakpoint('mobile');
      } else if (width < BREAKPOINTS.tablet) {
        setBreakpoint('tablet');
      } else if (width < BREAKPOINTS.desktop) {
        setBreakpoint('desktop');
      } else {
        setBreakpoint('wide');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// Hook for detecting mobile devices
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Hook for detecting touch devices
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(window.matchMedia(MEDIA_QUERIES.touchDevice).matches);
    };

    checkTouchDevice();
    const mediaQuery = window.matchMedia(MEDIA_QUERIES.touchDevice);
    mediaQuery.addEventListener('change', checkTouchDevice);
    
    return () => mediaQuery.removeEventListener('change', checkTouchDevice);
  }, []);

  return isTouchDevice;
}

// Hook for detecting user preferences
export function useUserPreferences() {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    darkMode: false
  });

  useEffect(() => {
    const updatePreferences = () => {
      setPreferences({
        reducedMotion: window.matchMedia(MEDIA_QUERIES.reducedMotion).matches,
        highContrast: window.matchMedia(MEDIA_QUERIES.highContrast).matches,
        darkMode: window.matchMedia(MEDIA_QUERIES.darkMode).matches
      });
    };

    updatePreferences();

    // Listen for changes
    const reducedMotionQuery = window.matchMedia(MEDIA_QUERIES.reducedMotion);
    const highContrastQuery = window.matchMedia(MEDIA_QUERIES.highContrast);
    const darkModeQuery = window.matchMedia(MEDIA_QUERIES.darkMode);

    reducedMotionQuery.addEventListener('change', updatePreferences);
    highContrastQuery.addEventListener('change', updatePreferences);
    darkModeQuery.addEventListener('change', updatePreferences);

    return () => {
      reducedMotionQuery.removeEventListener('change', updatePreferences);
      highContrastQuery.removeEventListener('change', updatePreferences);
      darkModeQuery.removeEventListener('change', updatePreferences);
    };
  }, []);

  return preferences;
}

// Responsive spacing utilities
export const responsiveSpacing = {
  // Padding classes based on breakpoint
  getPadding: (breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide', size: 'sm' | 'md' | 'lg') => {
    const spacingMap = {
      mobile: { sm: 'p-2', md: 'p-3', lg: 'p-4' },
      tablet: { sm: 'p-3', md: 'p-4', lg: 'p-6' },
      desktop: { sm: 'p-4', md: 'p-6', lg: 'p-8' },
      wide: { sm: 'p-6', md: 'p-8', lg: 'p-12' }
    };
    return spacingMap[breakpoint][size];
  },

  // Gap classes based on breakpoint
  getGap: (breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide', size: 'sm' | 'md' | 'lg') => {
    const gapMap = {
      mobile: { sm: 'gap-2', md: 'gap-3', lg: 'gap-4' },
      tablet: { sm: 'gap-3', md: 'gap-4', lg: 'gap-6' },
      desktop: { sm: 'gap-4', md: 'gap-6', lg: 'gap-8' },
      wide: { sm: 'gap-6', md: 'gap-8', lg: 'gap-12' }
    };
    return gapMap[breakpoint][size];
  }
};

// Responsive typography utilities
export const responsiveTypography = {
  // Font size classes based on breakpoint
  getFontSize: (breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide', size: 'xs' | 'sm' | 'base' | 'lg' | 'xl') => {
    const fontSizeMap = {
      mobile: { 
        xs: 'text-sm', 
        sm: 'text-base', 
        base: 'text-lg', 
        lg: 'text-xl', 
        xl: 'text-2xl' 
      },
      tablet: { 
        xs: 'text-xs', 
        sm: 'text-sm', 
        base: 'text-base', 
        lg: 'text-lg', 
        xl: 'text-xl' 
      },
      desktop: { 
        xs: 'text-xs', 
        sm: 'text-sm', 
        base: 'text-base', 
        lg: 'text-lg', 
        xl: 'text-xl' 
      },
      wide: { 
        xs: 'text-xs', 
        sm: 'text-sm', 
        base: 'text-base', 
        lg: 'text-lg', 
        xl: 'text-xl' 
      }
    };
    return fontSizeMap[breakpoint][size];
  },

  // Line height adjustments for mobile readability
  getLineHeight: (breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide') => {
    return breakpoint === 'mobile' ? 'leading-relaxed' : 'leading-normal';
  }
};

// Touch target utilities
export const touchTargets = {
  // Minimum touch target size (44px recommended by WCAG)
  getMinSize: (isTouchDevice: boolean) => {
    return isTouchDevice ? 'min-h-[44px] min-w-[44px]' : '';
  },

  // Touch-friendly button sizing
  getButtonSize: (isTouchDevice: boolean, size: 'sm' | 'md' | 'lg') => {
    if (!isTouchDevice) {
      const sizeMap = { sm: 'px-2 py-1', md: 'px-3 py-2', lg: 'px-4 py-3' };
      return sizeMap[size];
    }
    
    const touchSizeMap = { 
      sm: 'px-3 py-2 min-h-[44px]', 
      md: 'px-4 py-3 min-h-[48px]', 
      lg: 'px-6 py-4 min-h-[52px]' 
    };
    return touchSizeMap[size];
  }
};

// Layout utilities for different screen sizes
export const responsiveLayout = {
  // Container max widths
  getContainerWidth: (breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide') => {
    const widthMap = {
      mobile: 'max-w-full',
      tablet: 'max-w-2xl',
      desktop: 'max-w-4xl',
      wide: 'max-w-6xl'
    };
    return widthMap[breakpoint];
  },

  // Grid columns based on breakpoint
  getGridColumns: (breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide') => {
    const columnsMap = {
      mobile: 'grid-cols-1',
      tablet: 'grid-cols-2',
      desktop: 'grid-cols-3',
      wide: 'grid-cols-4'
    };
    return columnsMap[breakpoint];
  },

  // Flex direction for responsive layouts
  getFlexDirection: (breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide') => {
    return breakpoint === 'mobile' ? 'flex-col' : 'flex-row';
  }
};

// Notification positioning for different screen sizes
export const notificationPositioning = {
  getDropdownPosition: (breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide') => {
    if (breakpoint === 'mobile') {
      return {
        position: 'fixed' as const,
        top: '1rem',
        left: '1rem',
        right: '1rem',
        width: 'auto',
        maxWidth: 'none'
      };
    }
    
    return {
      position: 'absolute' as const,
      top: '100%',
      right: '0',
      width: '20rem',
      maxWidth: '90vw'
    };
  },

  getMentionDropdownPosition: (breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide', basePosition: { top: number; left: number }) => {
    if (breakpoint === 'mobile') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100vw - 2rem)',
        maxWidth: '24rem'
      };
    }
    
    return {
      position: 'absolute' as const,
      top: basePosition.top,
      left: basePosition.left,
      width: 'auto',
      minWidth: '12rem',
      maxWidth: '18rem'
    };
  }
};

// Animation utilities that respect user preferences
export const responsiveAnimations = {
  getTransition: (reducedMotion: boolean, duration: 'fast' | 'normal' | 'slow' = 'normal') => {
    if (reducedMotion) {
      return 'transition-none';
    }
    
    const durationMap = {
      fast: 'transition-all duration-150',
      normal: 'transition-all duration-200',
      slow: 'transition-all duration-300'
    };
    return durationMap[duration];
  },

  getHoverScale: (reducedMotion: boolean) => {
    return reducedMotion ? 'hover:bg-opacity-80' : 'hover:scale-105 active:scale-95';
  },

  getSlideIn: (reducedMotion: boolean) => {
    return reducedMotion ? 'opacity-100' : 'animate-in slide-in-from-top-2 duration-200';
  }
};

// Utility function to combine responsive classes
export function combineResponsiveClasses(
  baseClasses: string,
  responsiveClasses: Partial<Record<'mobile' | 'tablet' | 'desktop' | 'wide', string>>,
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide'
): string {
  const responsiveClass = responsiveClasses[currentBreakpoint] || '';
  return `${baseClasses} ${responsiveClass}`.trim();
}

// Hook for responsive class names
export function useResponsiveClasses(
  baseClasses: string,
  responsiveClasses: Partial<Record<'mobile' | 'tablet' | 'desktop' | 'wide', string>>
) {
  const breakpoint = useBreakpoint();
  return combineResponsiveClasses(baseClasses, responsiveClasses, breakpoint);
}