// File: app/src/components/layout/TabBar.tsx
//
// Premium mobile tab bar.
// - Frosted glass matching NavBar spec
// - Active tab: Framer Motion layoutId spring pill behind the icon
// - Badge dot for unread counts (now driven by real data via props,
//   not a hardcoded value in NAV_ITEMS)
// - 44px minimum touch targets
// - Safe-area aware bottom padding

import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { NavItem } from '../../config/navigation';

interface TabBarProps {
  navItems: NavItem[];
}

export function TabBar({ navItems }: TabBarProps) {
  const { pathname } = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-xl border-t border-white/60 shadow-[0_-1px_0_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="flex">
        {navItems.map(({ to, label, icon: Icon, end, badge }) => {
          const isActive = end ? pathname === to : pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex-1 flex flex-col items-center pt-2 pb-1 min-h-[48px] relative"
            >
              <div className="relative flex items-center justify-center w-12 h-8">
                {/* Spring pill behind active icon */}
                {isActive && (
                  <motion.div
                    layoutId="tab-bar-pill"
                    className="absolute inset-0 rounded-full bg-accent-dark/[0.08]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  className={`relative z-10 transition-colors duration-200 ${
                    isActive ? 'text-accent-dark' : 'text-olive'
                  }`}
                />

                {/* Badge dot */}
                {!!badge && !isActive && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute top-0.5 right-0.5 w-[7px] h-[7px] rounded-full bg-accent-dark z-20"
                  />
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 font-medium transition-colors duration-200 ${
                  isActive ? 'text-accent-dark' : 'text-olive'
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}