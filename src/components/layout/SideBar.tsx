// File: app/src/components/layout/SideBar.tsx

import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { NavItem } from '../../config/navigation';

interface SidebarProps {
  navItems: NavItem[];
}

const EASE = [0.23, 1, 0.32, 1] as const;

const SPRING = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
} as const;

export function Sidebar({ navItems }: SidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.26,
        ease: EASE,
      }}
      className="
        hidden
        min-h-0
        bg-white
        border-r border-[#E5DED5]
        shadow-[2px_0_14px_rgba(42,35,32,0.035)]
        md:flex
        md:w-64
        md:shrink-0
        md:flex-col
      "
    >
      {/* ==================================================
          BRAND
      ================================================== */}

      <div className="flex shrink-0 justify-center px-5 pb-6 pt-7">
        <img
          src="/logo-horizontal.png"
          alt="KEKI"
          className="h-14 w-auto max-w-full object-contain"
        />
      </div>

      {/* Brand divider */}

      <div className="mx-5 shrink-0 border-b border-[#E5DED5]/70" />

      {/* ==================================================
          NAVIGATION
      ================================================== */}

      <nav
        aria-label="Main navigation"
        className="
          min-h-0 flex-1
          space-y-1
          overflow-y-auto
          px-3 pb-6 pt-4
          scrollbar-none
        "
      >
        {navItems.map(
          ({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="
                group relative
                flex min-h-[44px] min-w-0
                items-center gap-3
                rounded-[13px]
                px-3 py-2.5
                text-olive/75
                outline-none
                transition-colors duration-150
                hover:bg-[#FAF8F5]
                hover:text-accent-dark
                focus-visible:ring-2
                focus-visible:ring-accent-dark/25
              "
            >
              {({ isActive }) => (
                <>
                  {/* ======================================
                      ACTIVE NAVIGATION PILL
                  ====================================== */}

                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="
                        absolute inset-0
                        rounded-[13px]
                        border border-[#E5DED5]/75
                        bg-[#F2EDE6]
                        shadow-[0_2px_7px_rgba(42,35,32,0.045)]
                      "
                      transition={SPRING}
                    />
                  )}

                  {/* ======================================
                      ICON + LABEL
                  ====================================== */}

                  <motion.span
                    whileHover={
                      !isActive
                        ? { x: 2 }
                        : undefined
                    }
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 28,
                    }}
                    className={`
                      relative z-10
                      flex min-w-0 flex-1
                      items-center gap-3
                      ${
                        isActive
                          ? 'text-accent-dark'
                          : ''
                      }
                    `}
                  >
                    {/* Navigation icon */}

                    <Icon
                      size={19}
                      strokeWidth={
                        isActive ? 2.2 : 1.8
                      }
                      className="
                        shrink-0
                        transition-colors duration-150
                      "
                    />

                    {/* Navigation label */}

                    <span
                      className={`
                        min-w-0 flex-1 truncate
                        text-[13px]
                        tracking-[-0.01em]
                        transition-colors duration-150
                        ${
                          isActive
                            ? 'font-semibold text-accent-dark'
                            : 'font-medium'
                        }
                      `}
                    >
                      {label}
                    </span>
                  </motion.span>

                  {/* ======================================
                      NOTIFICATION BADGE
                  ====================================== */}

                  {!!badge && (
                    <motion.span
                      initial={{
                        opacity: 0,
                        scale: 0.8,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 28,
                      }}
                      className={`
                        relative z-10
                        flex h-5 min-w-[20px]
                        shrink-0 items-center justify-center
                        rounded-full px-1.5
                        text-[10px] font-bold
                        tabular-nums
                        ${
                          isActive
                            ? 'bg-accent-dark/10 text-accent-dark'
                            : 'bg-accent-dark text-white'
                        }
                      `}
                    >
                      {badge}
                    </motion.span>
                  )}
                </>
              )}
            </NavLink>
          )
        )}
      </nav>
    </motion.aside>
  );
}