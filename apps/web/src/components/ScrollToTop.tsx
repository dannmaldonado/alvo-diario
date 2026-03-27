/**
 * Scroll to Top Component
 * Automatically scrolls page to top when route changes
 * Returns null (renders nothing) - used for side effects only
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
