// File: app/src/components/layout/AppShell.tsx

import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './SideBar';
import { TabBar } from './TabBar';
import { useAuth } from '../../lib/auth-context';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessageCount';
import { NAV_ITEMS } from '../../config/navigation';

export function AppShell() {
  const { organizationId } = useAuth();
  const unreadMessageCount = useUnreadMessageCount(organizationId);
  const location = useLocation();

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
        {/*
          Opacity-only route transition — deliberately NOT animating
          y/scale here. Framer Motion drives those via CSS `transform`,
          and ANY transform on an ancestor (even a resting
          translateY(0)) creates a new containing block for
          `position: fixed` descendants. ConversationDetailScreen
          depends on `fixed inset-0` to fill the viewport; a transform
          on this wrapper would silently break that screen's layout
          every time it mounted. Opacity carries none of that risk.
        */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <TabBar navItems={navItems} />
    </div>
  );
}