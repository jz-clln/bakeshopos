// File: app/src/components/layout/ScreenShell.tsx

import type { ReactNode } from 'react';

interface ScreenShellProps {
  children: ReactNode;
}

export function ScreenShell({ children }: ScreenShellProps) {
  return (
    <div
      className="
        mx-auto
        w-full
        min-w-0
        max-w-5xl

        px-4
        pb-6

        sm:px-5

        md:px-8
        md:pb-10

        lg:px-10
      "
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 24px)',
      }}
    >
      {children}
    </div>
  );
}