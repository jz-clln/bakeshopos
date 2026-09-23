// File: app/src/components/layout/TabBar.tsx

import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { NavItem } from '../../config/navigation';

interface TabBarProps {
  navItems: NavItem[];
}

const SPRING = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
} as const;

export function TabBar({ navItems }: TabBarProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="
        fixed bottom-0 left-0 right-0 z-20
        border-t border-[#E5DED5]
        bg-white/95
        shadow-[0_-4px_20px_rgba(42,35,32,0.09)]
        backdrop-blur-2xl
        md:hidden
      "
      style={{
        paddingBottom:
          'max(env(safe-area-inset-bottom), 8px)',
      }}
    >
      <div className="mx-auto flex w-full max-w-[600px] items-stretch px-1">
        {navItems.map(
          ({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={
                badge
                  ? `${label}, new activity`
                  : label
              }
              className="
                relative flex min-h-[56px] min-w-0 flex-1
                flex-col items-center justify-center
                gap-0.5 rounded-[14px] px-1 py-1.5
                outline-none
                focus-visible:ring-2
                focus-visible:ring-accent-dark/25
              "
            >
              {({ isActive }) => (
                <>
                  {/* Icon container */}

                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 28,
                    }}
                    className="
                      relative flex h-8 w-12 shrink-0
                      items-center justify-center
                    "
                  >
                    {/* Active pill */}

                    {isActive && (
                      <motion.div
                        layoutId="tab-bar-pill"
                        className="
                          absolute inset-0 rounded-full
                          border border-[#E5DED5]/60
                          bg-[#F2EDE6]
                          shadow-[0_1px_3px_rgba(42,35,32,0.035)]
                        "
                        transition={SPRING}
                      />
                    )}

                    {/* Navigation icon */}

                    <Icon
                      size={21}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className={`relative z-10 transition-colors duration-200 ${
                        isActive
                          ? 'text-accent-dark'
                          : 'text-olive/65'
                      }`}
                    />

                    {/* Unread indicator */}

                    {!!badge && !isActive && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={SPRING}
                        aria-hidden="true"
                        className="
                          absolute right-0.5 top-0.5 z-20
                          h-[7px] w-[7px] rounded-full
                          bg-accent-dark
                          ring-2 ring-white
                        "
                      />
                    )}
                  </motion.div>

                  {/* Tab label */}

                  <span
                    className={`
                      max-w-full truncate
                      text-center text-[10px]
                      leading-[14px] tracking-[-0.01em]
                      transition-colors duration-200
                      ${
                        isActive
                          ? 'font-semibold text-accent-dark'
                          : 'font-medium text-olive/65'
                      }
                    `}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          )
        )}
      </div>
    </nav>
  );
}