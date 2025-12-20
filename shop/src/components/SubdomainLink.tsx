'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useMemo, useEffect, useState } from 'react';
import { getProperUrl, shouldUseFullUrl } from '@/lib/subdomainHelper';

interface SubdomainLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  prefetch?: boolean;
}

const SubdomainLink: React.FC<SubdomainLinkProps> = ({ href, children, prefetch, ...props }) => {
  const pathname = usePathname();
  
  // Get host from window on client, undefined on server
  const host = typeof window !== 'undefined' ? window.location.host : undefined;
  
  // State to track if we've hydrated
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    setHydrated(true);
  }, []);

  const linkProps = useMemo(() => {
    // On server-side render or before hydration, always use relative paths to avoid hydration mismatches
    if (typeof host === 'undefined' || !hydrated) {
      return {
        href,
        prefetch,
        ...props
      };
    }
    
    // Check if this is a cross-subdomain navigation
    const isCrossSubdomain = shouldUseFullUrl(href, host);
    
    if (isCrossSubdomain) {
      // For cross-subdomain navigation, use full URL
      const fullUrl = getProperUrl(href, host);
      return {
        href: fullUrl,
        prefetch,
        ...props
      };
    } else {
      // For same subdomain navigation, use regular Link
      return {
        href,
        prefetch,
        ...props
      };
    }
  }, [href, host, hydrated, prefetch, props]);

  return (
    <Link {...linkProps}>
      {children}
    </Link>
  );
};

export default SubdomainLink;