/**
 * Sidebar Utilities - Replicates functionality of useSidebarState hook
 * 
 * This utility provides sidebar state management similar to the hook
 * but using a class-based approach that can be used in components without hooks.
 */

class SidebarUtils {
  constructor() {
    this.isOpen = false;
    this.listeners = [];
    
    // Bind methods
    this.setIsOpen = this.setIsOpen.bind(this);
    this.toggle = this.toggle.bind(this);
    this.close = this.close.bind(this);
    this.open = this.open.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    
    // Setup event listeners if in browser
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // Listen for outside clicks
    document.addEventListener('mousedown', this.handleOutsideClick);
    document.addEventListener('touchstart', this.handleOutsideClick);
  }

  handleOutsideClick(event) {
    // This will be called by components when needed
    // We'll provide a method for components to check if click is outside
  }

  setIsOpen(isOpen) {
    this.isOpen = isOpen;
    this.notifyListeners();
  }

  toggle() {
    this.setIsOpen(!this.isOpen);
  }

  close() {
    this.setIsOpen(false);
  }

  open() {
    this.setIsOpen(true);
  }

  subscribe(listener) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOpen));
  }

  // Check if click is outside sidebar and hamburger
  isOutsideClick(event) {
    const sidebar = document.querySelector('[data-sidebar]');
    const hamburger = document.querySelector('[data-hamburger]');
    
    return sidebar && !sidebar.contains(event.target) && 
           hamburger && !hamburger.contains(event.target);
  }

  // Get overlay state based on device type and open state
  shouldShowOverlay(isMobile, isTablet) {
    return (isMobile || isTablet) && this.isOpen;
  }

  // Auto-close sidebar on desktop
  handleBreakpointChange(isDesktop) {
    if (isDesktop) {
      this.close(); // Let CSS handle desktop visibility
    }
  }
}

// Export singleton instance
export const sidebarUtils = new SidebarUtils();

// Export utility methods
export const setIsOpen = (isOpen) => sidebarUtils.setIsOpen(isOpen);
export const toggleSidebar = () => sidebarUtils.toggle();
export const closeSidebar = () => sidebarUtils.close();
export const openSidebar = () => sidebarUtils.open();
export const subscribeToSidebar = (listener) => sidebarUtils.subscribe(listener);
export const isOutsideClick = (event) => sidebarUtils.isOutsideClick(event);
export const shouldShowOverlay = (isMobile, isTablet) => sidebarUtils.shouldShowOverlay(isMobile, isTablet);
export const handleBreakpointChange = (isDesktop) => sidebarUtils.handleBreakpointChange(isDesktop);