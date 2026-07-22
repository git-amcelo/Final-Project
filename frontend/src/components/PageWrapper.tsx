'use client';

import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageWrapper - Adds padding-top to account for fixed navbar
 * Use this wrapper for all page content to prevent navbar overlap
 */
export default function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <div className={`pt-20 ${className}`}>
      {children}
    </div>
  );
}
