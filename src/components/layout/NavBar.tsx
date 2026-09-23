// File: app/src/components/layout/NavBar.tsx

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface NavBarProps {
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

const EASE = [0.23, 1, 0.32, 1] as const;

export function NavBar({
  title,
  leading,
  trailing,
}: NavBarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.24,
        ease: EASE,
      }}
      className="
        sticky top-0 z-20
        border-b border-[#E5DED5]
        bg-white/95
        shadow-[0_2px_12px_rgba(42,35,32,0.055)]
        backdrop-blur-2xl
      "
      style={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Navigation content */}

      <div
        className="
          mx-auto grid h-[54px] w-full max-w-5xl
          grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]
          items-center gap-2 px-3
          sm:px-5
        "
      >
        {/* Leading controls */}

        <div className="flex min-w-0 items-center justify-start">
          {leading}
        </div>

        {/* Centered title */}

        <h1
          className="
            min-w-0 truncate
            text-center font-display
            text-[16px] font-semibold
            tracking-[-0.025em]
            text-accent-dark
            select-none
            sm:text-[17px]
          "
        >
          {title}
        </h1>

        {/* Trailing controls */}

        <div className="flex min-w-0 items-center justify-end">
          {trailing}
        </div>
      </div>
    </motion.header>
  );
}