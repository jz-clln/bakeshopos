// File: app/src/config/navigation.ts
//
// Single source of truth for tab navigation.
// Consumed by Sidebar.tsx (desktop) and TabBar.tsx (mobile).

import type { LucideIcon } from 'lucide-react';
import { LayoutGrid, ShoppingBag, Cake, MessageSquare, Settings } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
  badge?: number; // unread count — drives dot on TabBar and Sidebar
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/',         label: 'Dashboard', icon: LayoutGrid,    end: true  },
  { to: '/orders',   label: 'Orders',    icon: ShoppingBag,   end: false },
  { to: '/catalog',  label: 'Catalog',   icon: Cake,          end: false },
  { to: '/messages', label: 'Messages',  icon: MessageSquare, end: false, badge: 3 },
  { to: '/settings', label: 'Settings',  icon: Settings,      end: false },
];