// File: app/src/components/ScrollToTop.tsx
//
// Handles the case where the WINDOW itself is the scrolling
// container — true on mobile everywhere, and true on desktop for the
// public pages (/privacy, /terms, /cookies), since those render
// outside AppShell's overflow-hidden desktop layout entirely.
//
// Does NOT handle desktop app screens (Dashboard, Settings, etc.) —
// on desktop, <main> inside AppShell scrolls internally and the
// window never moves at all, so resetting window scroll there would
// be a no-op. That half of the fix lives in AppShell.tsx instead.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}