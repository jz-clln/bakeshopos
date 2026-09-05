// File: app/src/components/layout/NavBar.tsx
//
// An iOS-style large title bar: the title starts big and left-aligned,
// like the native Settings/Mail apps, rather than a centered small
// title in a colored bar. leading/trailing are optional — used for a
// back button or a Save action on pushed screens like the editor.

import type { ReactNode } from 'react';

interface NavBarProps {
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function NavBar({ title, leading, trailing }: NavBarProps) {
  return (
    <header
      className="sticky top-0 z-10 bg-[#FAFAF8]/90 backdrop-blur-md px-4 pb-2"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
    >
      {(leading || trailing) && (
        <div className="flex items-center justify-between h-8 mb-1">
          <div>{leading}</div>
          <div>{trailing}</div>
        </div>
      )}
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        {title}
      </h1>
    </header>
  );
}