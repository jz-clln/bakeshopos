// File: app/src/components/layout/AppShell.tsx

import { Outlet } from 'react-router-dom';
import { Sidebar } from './SideBar';
import { TabBar } from './TabBar';

export function AppShell() {
  return (
    <div className="min-h-[100dvh] bg-platinum/30 md:flex">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}