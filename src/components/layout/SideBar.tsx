// File: app/src/components/layout/Sidebar.tsx
//
// Desktop-only persistent nav. Extracted out of AppShell so it can
// share NAV_ITEMS with TabBar instead of keeping a second, divergeable
// copy of the nav list.

import { NavLink } from 'react-router-dom';
import { Cake, LogOut } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { NAV_ITEMS } from '../../config/navigation';

export function Sidebar() {
  // Adjust these field/method names if your useAuth() shape differs —
  // organization_name comes from the sign-up metadata set in
  // SignUpFlow.tsx.
  const { session, signOut } = useAuth() as {
    session: { user?: { user_metadata?: { organization_name?: string } } } | null;
    signOut?: () => void;
  };
  const shopName = session?.user?.user_metadata?.organization_name?.trim() || 'Your Shop';
  const shopInitial = shopName.charAt(0).toUpperCase();

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col md:shrink-0 bg-white border-r border-platinum">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <div className="w-11 h-11 rounded-control bg-accent-dark flex items-center justify-center shrink-0">
          <Cake size={22} className="text-white" />
        </div>
        <span className="font-display text-lg font-bold tracking-tight text-accent-dark">
          BakeShopOS
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-control px-4 py-3 font-medium transition-colors ${
                isActive
                  ? 'bg-accent-dark/[0.06] text-accent-dark'
                  : 'text-olive hover:bg-platinum/60 hover:text-accent-dark'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-6 pt-4 border-t border-platinum">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-accent-light/40 flex items-center justify-center text-sm font-semibold text-accent-dark shrink-0">
            {shopInitial}
          </div>
          <span className="text-sm font-medium text-accent-dark truncate">{shopName}</span>
        </div>
        <button
          onClick={() => signOut?.()}
          className="w-full flex items-center gap-3 rounded-control px-4 py-2.5 text-sm font-medium text-olive hover:bg-platinum/60 hover:text-accent-dark transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}