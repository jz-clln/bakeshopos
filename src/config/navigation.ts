// File: app/src/config/navigation.ts
//
// One list, consumed by both Sidebar.tsx (desktop) and TabBar.tsx
// (mobile) — keeps the two nav presentations from silently drifting
// to different icons/labels/order over time.

import type { LucideIcon } from 'lucide-react';
import { LayoutGrid, ShoppingBag, Cake, Settings } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/orders', label: 'Orders', icon: ShoppingBag, end: false },
  { to: '/catalog', label: 'Catalog', icon: Cake, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];