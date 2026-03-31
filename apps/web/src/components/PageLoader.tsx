import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * PageLoader component for Suspense fallback
 * Displays when page content is loading due to code splitting with React.lazy()
 */
export function PageLoader() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <div className='text-center space-y-4'>
        <LoadingSpinner size='lg' />
        <p className='text-sm text-muted-foreground animate-fade-in'>
          Loading page content...
        </p>
      </div>
    </div>
  );
}

/**
 * Minimal loader for inline content
 * Use inside card content or sections
 */
export function ContentLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className='flex items-center justify-center py-8'>
      <div className='text-center space-y-3'>
        <LoadingSpinner size='md' />
        <p className='text-xs text-muted-foreground'>{message}</p>
      </div>
    </div>
  );
}
