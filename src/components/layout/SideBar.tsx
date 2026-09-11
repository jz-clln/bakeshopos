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
      <div className="px-5 pt-8 pb-7">
        <img src="/logo-horizontal.png" alt="KEKI" className="h-9 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 font-medium text-[15px] transition-colors duration-150 ${
                isActive
                  ? 'bg-accent-dark/[0.07] text-accent-dark'
                  : 'text-olive hover:bg-platinum/50 hover:text-accent-dark'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.2 : 1.75}
                  className="shrink-0 transition-colors duration-150"
                />
                <span className="flex-1 truncate">{label}</span>
                {!!badge && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center tabular-nums ${
                      isActive
                        ? 'bg-accent-dark/10 text-accent-dark'
                        : 'bg-accent-dark text-white'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  );
}