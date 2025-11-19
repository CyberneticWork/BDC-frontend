import { isMobile, isTablet, isDesktop } from './responsive';

/**
 * Responsive Utilities - Replicates functionality of useResponsive hook
 * 
 * This utility provides responsive utilities and device detection similar to the hook
 * but using a class-based approach that can be used in components without hooks.
 */

class ResponsiveUtils {
  constructor() {
    // Initialize with default values
    this.windowDimensions = {
      width: typeof window !== 'undefined' ? window.innerWidth : 1024,
      height: typeof window !== 'undefined' ? window.innerHeight : 768,
    };

    // Breakpoint definitions (matching Tailwind CSS)
    this.breakpoints = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    };

    // Bind event handlers
    this.handleResize = this.handleResize.bind(this);
    this.debounce = this.debounce.bind(this);
    
    // Setup event listeners if in browser
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // Debounce resize events for performance
    let resizeTimer;
    const debouncedHandleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(this.handleResize, 100);
    };

    window.addEventListener('resize', debouncedHandleResize);
    
    // Set initial dimensions
    this.handleResize();
  }

  handleResize() {
    if (typeof window !== 'undefined') {
      this.windowDimensions = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Current breakpoint detection
  getCurrentBreakpoint() {
    const width = this.windowDimensions.width;
    
    if (width >= this.breakpoints['2xl']) return '2xl';
    if (width >= this.breakpoints.xl) return 'xl';
    if (width >= this.breakpoints.lg) return 'lg';
    if (width >= this.breakpoints.md) return 'md';
    if (width >= this.breakpoints.sm) return 'sm';
    return 'xs';
  }

  // Device type detection
  getDeviceType() {
    const width = this.windowDimensions.width;
    
    if (width < this.breakpoints.sm) return 'mobile';
    if (width < this.breakpoints.lg) return 'tablet';
    return 'desktop';
  }

  // Utility function to get responsive value
  getResponsiveValue(values) {
    const currentBreakpoint = this.getCurrentBreakpoint();
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
  }

  // Responsive utilities
  getResponsive() {
    const currentBreakpoint = this.getCurrentBreakpoint();
    const deviceType = this.getDeviceType();
    const width = this.windowDimensions.width;
    const height = this.windowDimensions.height;

    return {
      // Current state
      width: width,
      height: height,
      breakpoint: currentBreakpoint,
      deviceType: deviceType,
      isClient: typeof window !== 'undefined',

      // Device type checks using existing utility functions
      isMobile: isMobile(),
      isTablet: isTablet(),
      isDesktop: isDesktop(),
      
      // Specific breakpoint checks
      isXs: width < this.breakpoints.sm,
      isSm: width >= this.breakpoints.sm && width < this.breakpoints.md,
      isMd: width >= this.breakpoints.md && width < this.breakpoints.lg,
      isLg: width >= this.breakpoints.lg && width < this.breakpoints.xl,
      isXl: width >= this.breakpoints.xl && width < this.breakpoints['2xl'],
      is2Xl: width >= this.breakpoints['2xl'],

      // Min-width checks (mobile-first)
      minSm: width >= this.breakpoints.sm,
      minMd: width >= this.breakpoints.md,
      minLg: width >= this.breakpoints.lg,
      minXl: width >= this.breakpoints.xl,
      min2Xl: width >= this.breakpoints['2xl'],

      // Max-width checks
      maxSm: width < this.breakpoints.md,
      maxMd: width < this.breakpoints.lg,
      maxLg: width < this.breakpoints.xl,
      maxXl: width < this.breakpoints['2xl'],

      // Orientation
      isLandscape: width > height,
      isPortrait: width <= height,

      // Utility functions
      getResponsiveValue: (values) => {
        return this.getResponsiveValue(values);
      },

      // Get responsive class names
      getResponsiveClasses: (classes) => {
        return this.getResponsiveValue(classes) || '';
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
        return this.getResponsiveValue(cols);
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
        return this.getResponsiveValue(spacing);
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
        return this.getResponsiveValue(fontSize);
      },
    };
  }

  // Simple breakpoint detection
  getBreakpoint(breakpoint) {
    const responsive = this.getResponsive();
    
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
  }

  // Device type detection
  getDeviceTypeInfo() {
    const responsive = this.getResponsive();
    return {
      isMobile: responsive.isMobile,
      isTablet: responsive.isTablet,
      isDesktop: responsive.isDesktop,
      deviceType: responsive.deviceType,
    };
  }
}

// Export singleton instance
export const responsiveUtils = new ResponsiveUtils();

// Export individual utility functions for convenience
export const getResponsive = () => responsiveUtils.getResponsive();
export const getBreakpoint = (breakpoint) => responsiveUtils.getBreakpoint(breakpoint);
export const getDeviceType = () => responsiveUtils.getDeviceTypeInfo();