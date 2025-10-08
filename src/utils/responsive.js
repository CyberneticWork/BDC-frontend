// Simple responsive utility using window.matchMedia

export function isMobile() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 639px)').matches;
}

export function isTablet() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(min-width: 640px) and (max-width: 1023px)').matches;
}

export function isDesktop() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(min-width: 1024px)').matches;
}
