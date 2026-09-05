// File: app/src/components/layout/AppShell.tsx

import type { ReactNode } from 'react';
import { NavBar } from './NavBar';
import { TabBar } from './TabBar';

interface AppShellProps {
  title: string;
  children: ReactNode;
}

export function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar title={title} />
      <main className="flex-1 px-4 pb-24">{children}</main>
      <TabBar />
    </div>
  );
}