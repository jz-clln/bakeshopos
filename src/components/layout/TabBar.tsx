// File: app/src/components/layout/TabBar.tsx
//
// A standard iOS-style bottom tab bar: icon + label, active tab picked
// out by the accent color rather than a background fill, safe-area
// aware so it clears the home indicator on notched phones.

import { NavLink } from 'react-router-dom';
import { LayoutGrid, ShoppingBag, Cake, Settings } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/catalog', label: 'Catalog', icon: Cake },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function TabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 flex bg-[#FAFAF8]/90 backdrop-blur-md border-t border-gray-200"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="flex-1 flex flex-col items-center gap-1 pt-2 pb-1 min-h-[44px]"
        >
          {({ isActive }) => (
            <>
              <Icon
                size={24}
                strokeWidth={isActive ? 2.25 : 1.75}
                className={isActive ? 'text-accent' : 'text-gray-400'}
              />
              <span
                className={`text-[11px] ${
                  isActive ? 'text-accent font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}