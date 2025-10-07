import { useState, useEffect } from 'react';

/**
 * useResponsive hook - Provides responsive utilities and device detection
 * 
 * This hook helps manage responsive behavior across components by providing:
 * - Current breakpoint information
 * - Device type detection
 * - Window dimensions
 * - Responsive utilities
 */

export const useResponsive = () => {
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Debounce resize events for performance
    let resizeTimer;
    const debouncedHandleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedHandleResize);
    
    // Set initial dimensions
    handleResize();

    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Breakpoint definitions (matching Tailwind CSS)
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  };

  // Current breakpoint detection
  const getCurrentBreakpoint = () => {
    const width = windowDimensions.width;
    
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  };

  // Device type detection
  const getDeviceType = () => {
    const width = windowDimensions.width;
    
    if (width < breakpoints.sm) return 'mobile';
    if (width < breakpoints.lg) return 'tablet';
    return 'desktop';
  };

  // Responsive utilities
  const responsive = {
    // Current state
    width: windowDimensions.width,
    height: windowDimensions.height,
    breakpoint: getCurrentBreakpoint(),
    deviceType: getDeviceType(),
    isClient,

    // Breakpoint checks
    isMobile: windowDimensions.width < breakpoints.sm,
    isTablet: windowDimensions.width >= breakpoints.sm && windowDimensions.width < breakpoints.lg,
    isDesktop: windowDimensions.width >= breakpoints.lg,
    
    // Specific breakpoint checks
    isXs: windowDimensions.width < breakpoints.sm,
    isSm: windowDimensions.width >= breakpoints.sm && windowDimensions.width < breakpoints.md,
    isMd: windowDimensions.width >= breakpoints.md && windowDimensions.width < breakpoints.lg,
    isLg: windowDimensions.width >= breakpoints.lg && windowDimensions.width < breakpoints.xl,
    isXl: windowDimensions.width >= breakpoints.xl && windowDimensions.width < breakpoints['2xl'],
    is2Xl: windowDimensions.width >= breakpoints['2xl'],

    // Min-width checks (mobile-first)
    minSm: windowDimensions.width >= breakpoints.sm,
    minMd: windowDimensions.width >= breakpoints.md,
    minLg: windowDimensions.width >= breakpoints.lg,
    minXl: windowDimensions.width >= breakpoints.xl,
    min2Xl: windowDimensions.width >= breakpoints['2xl'],

    // Max-width checks
    maxSm: windowDimensions.width < breakpoints.md,
    maxMd: windowDimensions.width < breakpoints.lg,
    maxLg: windowDimensions.width < breakpoints.xl,
    maxXl: windowDimensions.width < breakpoints['2xl'],

    // Orientation
    isLandscape: windowDimensions.width > windowDimensions.height,
    isPortrait: windowDimensions.width <= windowDimensions.height,

    // Utility functions
    getResponsiveValue: (values) => {
      const currentBreakpoint = getCurrentBreakpoint();
      const orderedBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      const currentIndex = orderedBreakpoints.indexOf(currentBreakpoint);
      
      // Find the appropriate value for current breakpoint
      for (let i = currentIndex; i >= 0; i--) {
        const bp = orderedBreakpoints[i];
        if (values[bp] !== undefined) {
          return values[bp];
        }
      }
      
      // Fallback to the first available value
      for (const bp of orderedBreakpoints) {
        if (values[bp] !== undefined) {
          return values[bp];
        }
      }
      
      return null;
    },

    // Get responsive class names
    getResponsiveClasses: (classes) => {
      return responsive.getResponsiveValue(classes) || '';
    },

    // Get responsive grid columns
    getGridCols: (config = {}) => {
      const defaults = {
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
        xl: 4,
        '2xl': 4
      };
      
      const cols = { ...defaults, ...config };
      return responsive.getResponsiveValue(cols);
    },

    // Get responsive spacing
    getSpacing: (config = {}) => {
      const defaults = {
        xs: '0.75rem', // 3
        sm: '1rem',    // 4
        md: '1.5rem',  // 6
        lg: '2rem',    // 8
        xl: '2rem',    // 8
        '2xl': '2.5rem' // 10
      };
      
      const spacing = { ...defaults, ...config };
      return responsive.getResponsiveValue(spacing);
    },

    // Get responsive font size
    getFontSize: (config = {}) => {
      const defaults = {
        xs: '0.875rem', // text-sm
        sm: '1rem',     // text-base
        md: '1.125rem', // text-lg
        lg: '1.25rem',  // text-xl
        xl: '1.5rem',   // text-2xl
        '2xl': '1.875rem' // text-3xl
      };
      
      const fontSize = { ...defaults, ...config };
      return responsive.getResponsiveValue(fontSize);
    },
  };

  return responsive;
};

/**
 * useBreakpoint hook - Simple breakpoint detection
 */
export const useBreakpoint = (breakpoint) => {
  const responsive = useResponsive();
  
  switch (breakpoint) {
    case 'sm':
      return responsive.minSm;
    case 'md':
      return responsive.minMd;
    case 'lg':
      return responsive.minLg;
    case 'xl':
      return responsive.minXl;
    case '2xl':
      return responsive.min2Xl;
    default:
      return false;
  }
};

/**
 * useDeviceType hook - Device type detection
 */
export const useDeviceType = () => {
  const responsive = useResponsive();
  return {
    isMobile: responsive.isMobile,
    isTablet: responsive.isTablet,
    isDesktop: responsive.isDesktop,
    deviceType: responsive.deviceType,
  };
};

/**
 * useSidebarState hook - Manages sidebar state across breakpoints
 */
export const useSidebarState = () => {
  const responsive = useResponsive();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-close sidebar on mobile when breakpoint changes
  useEffect(() => {
    if (responsive.isDesktop) {
      setIsOpen(false); // Let CSS handle desktop visibility
    }
  }, [responsive.isDesktop]);

  // Close sidebar when clicking outside on mobile/tablet
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (responsive.isMobile || responsive.isTablet) {
        const sidebar = document.querySelector('[data-sidebar]');
        const hamburger = document.querySelector('[data-hamburger]');
        
        if (sidebar && !sidebar.contains(event.target) && 
            hamburger && !hamburger.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, responsive.isMobile, responsive.isTablet]);

  return {
    isOpen,
    setIsOpen,
    toggle: () => setIsOpen(!isOpen),
    close: () => setIsOpen(false),
    open: () => setIsOpen(true),
    shouldShowOverlay: (responsive.isMobile || responsive.isTablet) && isOpen,
  };
};

export default useResponsive;