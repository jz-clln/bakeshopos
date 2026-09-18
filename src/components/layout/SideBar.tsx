// File: app/src/components/layout/SideBar.tsx

import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { NavItem } from '../../config/navigation';

interface SidebarProps {
  navItems: NavItem[];
}

export function Sidebar({ navItems }: SidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.9 }}
      className="hidden md:flex md:w-64 md:flex-col md:shrink-0 bg-white border-r border-platinum/70"
    >
      {/* Brand */}
      <div className="px-5 pt-8 pb-7 flex justify-center">
        <img src="/logo-horizontal.png" alt="KEKI" className="h-14 w-auto" />
      </div>

      <div className="mx-5 border-b border-platinum/40" />

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 pb-6 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 font-medium text-[15px] text-olive hover:text-accent-dark transition-colors duration-150"
          >
            {({ isActive }) => (
              <>
                {/* Animated pill — same layoutId-driven spring pattern
                    as TabBar's active indicator, so switching pages
                    reads as one continuous, connected motion instead
                    of a hard state swap. */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-[12px] bg-accent-dark/[0.07]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <motion.span
                  whileHover={!isActive ? { x: 2 } : undefined}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`relative z-10 flex items-center gap-3 flex-1 min-w-0 ${
                    isActive ? 'text-accent-dark' : ''
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.2 : 1.75}
                    className="shrink-0 transition-colors duration-150"
                  />
                  <span className="flex-1 truncate">{label}</span>
                </motion.span>

                {!!badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className={`relative z-10 text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center tabular-nums ${
                      isActive
                        ? 'bg-accent-dark/10 text-accent-dark'
                        : 'bg-accent-dark text-white'
                    }`}
                  >
                    {badge}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  );
}