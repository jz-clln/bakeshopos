// File: app/src/components/layout/AppShell.tsx

import { Outlet } from 'react-router-dom';
import { Sidebar } from './SideBar';
import { TabBar } from './TabBar';
import { useAuth } from '../../lib/auth-context';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessageCount';
import { NAV_ITEMS } from '../../config/navigation';

export function AppShell() {
  const { organizationId } = useAuth();
  const unreadMessageCount = useUnreadMessageCount(organizationId);

  // Single place where NAV_ITEMS gets its real badge data merged in —
  // Sidebar and TabBar just render whatever array they're handed.
  const navItems = NAV_ITEMS.map((item) =>
    item.to === '/messages'
      ? { ...item, badge: unreadMessageCount > 0 ? unreadMessageCount : undefined }
      : item
  );

  return (
    <div className="min-h-[100dvh] md:h-dvh bg-platinum/30 md:flex md:overflow-hidden">
      <Sidebar navItems={navItems} />
      <main className="flex-1 min-w-0 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0 md:h-dvh md:overflow-y-auto">
        <Outlet />
      </main>
      <TabBar navItems={navItems} />
    </div>
  );
}