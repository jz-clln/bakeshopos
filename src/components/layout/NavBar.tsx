// File: app/src/components/layout/NavBar.tsx

import type { ReactNode } from 'react';

interface NavBarProps {
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function NavBar({ title, leading, trailing }: NavBarProps) {
  return (
    <header
      className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-5 md:px-10 pb-2"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
    >
      <div className="max-w-5xl mx-auto">
        {(leading || trailing) && (
          <div className="flex items-center justify-between h-8 mb-0.5">
            <div>{leading}</div>
            <div>{trailing}</div>
          </div>
        )}
        <h1 className="font-display text-[28px] font-bold tracking-tight text-accent-dark">
          {title}
        </h1>
      </div>
    </header>
  );
}