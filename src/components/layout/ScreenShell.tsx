// File: app/src/components/layout/ScreenShell.tsx
//
// Thin wrapper used by every tab-destination screen.
// Handles safe-area top padding and the shared content container.
// Desktop: content sits next to the Sidebar (from AppShell).
// Mobile: content sits above the TabBar (from AppShell).

import type { ReactNode } from 'react';

interface ScreenShellProps {
  children: ReactNode;
}

export function ScreenShell({ children }: ScreenShellProps) {
  return (
    <div
      className="px-5 md:px-10 pb-28 md:pb-12 max-w-5xl mx-auto w-full"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
    >
      {children}
    </div>
  );
}