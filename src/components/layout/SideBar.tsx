// File: app/src/components/layout/Sidebar.tsx

import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cake } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { NAV_ITEMS } from '../../config/navigation';

export function Sidebar() {
  const { session, signOut } = useAuth() as {
    session: { user?: { user_metadata?: { organization_name?: string } } } | null;
    signOut?: () => void;
  };

  const shopName = session?.user?.user_metadata?.organization_name?.trim() || 'Your Shop';
  const shopInitial = shopName.charAt(0).toUpperCase();

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.9 }}
      className="hidden md:flex md:w-64 md:flex-col md:shrink-0 bg-white border-r border-platinum/70"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pt-8 pb-7">
        <div className="w-10 h-10 rounded-[12px] bg-accent-dark flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
          <Cake size={20} className="text-white" strokeWidth={1.75} />
        </div>
        <span className="font-display text-[17px] font-bold tracking-tight text-accent-dark">
          BakeShopOS
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, badge }) => (
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

      {/* Shop identity */}
      <div className="px-3 pb-6 pt-4 border-t border-platinum/70 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-[12px]">
          <div className="w-8 h-8 rounded-full bg-accent-light/50 flex items-center justify-center text-xs font-bold text-accent-dark shrink-0">
            {shopInitial}
          </div>
          <span className="text-[14px] font-medium text-accent-dark truncate">{shopName}</span>
        </div>
      </div>
    </motion.aside>
  );
}