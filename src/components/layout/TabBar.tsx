// File: app/src/components/layout/TabBar.tsx

import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../config/navigation';

export function TabBar() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-10 flex bg-white/95 backdrop-blur-md border-t border-platinum"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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
                className={`transition-transform motion-safe:duration-200 ${
                  isActive ? 'text-accent scale-110' : 'text-olive'
                }`}
              />
              <span
                className={`text-[11px] transition-colors motion-safe:duration-200 ${
                  isActive ? 'text-accent font-medium' : 'text-olive'
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