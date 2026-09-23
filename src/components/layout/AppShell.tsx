// File: app/src/components/layout/AppShell.tsx

import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { Sidebar } from './SideBar';
import { TabBar } from './TabBar';

import { useAuth } from '../../lib/auth-context';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessageCount';
import { NAV_ITEMS } from '../../config/navigation';

const EASE = [0.23, 1, 0.32, 1] as const;

export function AppShell() {
  const { organizationId } = useAuth();

  const unreadMessageCount =
    useUnreadMessageCount(organizationId);

  const location = useLocation();

  const mainRef = useRef<HTMLElement>(null);

  /* ============================================================
     SCROLL POSITION
  ============================================================ */

  useEffect(() => {
    // Desktop uses an independently scrolling main container.
    // Reset it when navigating to another screen.
    mainRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [location.pathname]);

  /* ============================================================
     NAVIGATION BADGES
  ============================================================ */

  const navItems = NAV_ITEMS.map((item) =>
    item.to === '/messages'
      ? {
          ...item,
          badge:
            unreadMessageCount > 0
              ? unreadMessageCount
              : undefined,
        }
      : item
  );

  /* ============================================================
     APPLICATION LAYOUT
  ============================================================ */

  return (
    <div
      className="
        min-h-[100dvh]
        bg-[#F6EEE2]

        md:flex
        md:h-dvh
        md:overflow-hidden
      "
    >
      {/* ==================================================
          DESKTOP SIDEBAR
      ================================================== */}

      <Sidebar navItems={navItems} />

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main
        ref={mainRef}
        className="
          min-w-0
          flex-1

          pb-[calc(64px+env(safe-area-inset-bottom))]

          md:h-dvh
          md:overflow-y-auto
          md:pb-0
        "
      >
        {/* ==================================================
            PAGE TRANSITIONS

            Opacity only: avoid transforms on this wrapper
            so fixed-position conversation screens continue
            to fill the viewport correctly.
        ================================================== */}

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.16,
              ease: EASE,
            }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ==================================================
          MOBILE TAB BAR
      ================================================== */}

      <TabBar navItems={navItems} />
    </div>
  );
}