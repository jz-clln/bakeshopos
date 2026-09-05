// File: app/src/components/layout/AppShell.tsx

import type { ReactNode } from 'react';
import { NavBar } from './NavBar';
import { TabBar } from './TabBar';

interface AppShellProps {
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, trailing, children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar title={title} trailing={trailing} />
      <main className="flex-1 px-4 pb-24">{children}</main>
      <TabBar />
    </div>
  );
}