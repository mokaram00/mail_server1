/**
 * Subdomain navigation helper
 * Determines the correct URL format based on the current host and target path
 */

// Helper to determine if we should use a full URL (for cross-subdomain navigation)
export const shouldUseFullUrl = (pathname: string, currentHost: string): boolean => {
  // Navigation from main domain to shop paths requires full URL (subdomain change)
  if ((currentHost === 'bltnm.store' || currentHost === 'www.bltnm.store') &&
      (pathname.startsWith('/products') || pathname.startsWith('/cart') || pathname.startsWith('/checkout'))) {
    return true;
  }
  
  // Navigation to dashboard from any other domain requires full URL
  if ((currentHost !== 'dashboard.bltnm.store') &&
      (pathname.startsWith('/dashboard') || pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return true;
  }
  
  return false;
};

// Get the appropriate URL for navigation
export const getProperUrl = (pathname: string, currentHost: string): string => {
  // For cross-subdomain navigation, return full URL
  if (shouldUseFullUrl(pathname, currentHost)) {
    // From main domain to shop
    if ((currentHost === 'bltnm.store' || currentHost === 'www.bltnm.store') &&
        (pathname.startsWith('/products') || pathname.startsWith('/cart') || pathname.startsWith('/checkout'))) {
      return `https://shop.bltnm.store${pathname}`;
    }
    
    // To dashboard/login/register
    if (pathname.startsWith('/dashboard')) {
      return `https://dashboard.bltnm.store${pathname.replace('/dashboard', '') || '/'}`;
    }
    
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
      return `https://dashboard.bltnm.store${pathname}`;
    }
  }
  
  // For same subdomain navigation, return relative path
  return pathname;
};