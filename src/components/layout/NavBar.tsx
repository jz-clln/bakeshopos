// File: app/src/components/layout/NavBar.tsx
//
// iOS-standard navigation bar.
// - Frosted glass: bg-white/80 + backdrop-blur-xl
// - Title is absolutely centered so leading/trailing slots never shift it
// - Spring entrance on mount
// - 44px minimum touch targets on all interactive slots

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface NavBarProps {
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function NavBar({ title, leading, trailing }: NavBarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
      className="sticky top-0 z-20"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Frosted glass panel */}
      <div className="relative bg-white/80 backdrop-blur-xl border-b border-white/60 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
        <div className="relative flex items-center justify-center h-[52px] px-4 max-w-5xl mx-auto">

          {/* Leading slot — absolutely left */}
          {leading && (
            <div className="absolute left-4 flex items-center">
              {leading}
            </div>
          )}

          {/* Title — truly centered regardless of slot widths */}
          <h1 className="text-[17px] font-semibold tracking-tight text-accent-dark select-none px-16 truncate">
            {title}
          </h1>

          {/* Trailing slot — absolutely right */}
          {trailing && (
            <div className="absolute right-4 flex items-center">
              {trailing}
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}