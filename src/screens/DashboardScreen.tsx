// File: app/src/screens/DashboardScreen.tsx
// Requires: framer-motion  →  pnpm add framer-motion

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ClipboardList, Clock, MessageCircle, ArrowUpRight } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';

/* ─── Motion ─── */
const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE, delay: i * 0.06 },
  }),
};

const listContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const listRow = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE } },
};

/* ─── Data ─── */
type OrderStatus = 'New' | 'Preparing' | 'Ready';

interface RecentOrder {
  id: string;
  customer: string;
  item: string;
  price: string;
  status: OrderStatus;
}

const RECENT_ORDERS: RecentOrder[] = [
  { id: '1', customer: 'Maria Santos', item: '2x Choco Overload, 1x Ube Cake', price: '₱1,450', status: 'New' },
  { id: '2', customer: 'Jerome Cruz', item: '1x Custom Birthday Cake', price: '₱2,200', status: 'Preparing' },
  { id: '3', customer: 'Angel Reyes', item: '3x Cinnamon Rolls', price: '₱540', status: 'Preparing' },
  { id: '4', customer: 'Kim Villanueva', item: '1x Red Velvet, 6x Cupcakes', price: '₱1,180', status: 'Ready' },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  New: 'bg-accent-light/50 text-accent-dark',
  Preparing: 'bg-platinum text-olive',
  Ready: 'bg-accent-dark text-white',
};

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}

/* ─── Screen ─── */
export function DashboardScreen() {
  const completed = 8;
  const total = 12;
  const pct = Math.round((completed / total) * 100);

  return (
    <ScreenShell>
      {/* Header */}
      <motion.div
        className="flex items-start justify-between gap-4 mb-6"
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
      >
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-olive uppercase mb-1">Today</p>
          <h1 className="font-display text-[26px] md:text-3xl font-bold tracking-tight text-accent-dark leading-tight">
            Good morning 👋
          </h1>
        </div>
        <button className="hidden sm:inline-flex items-center gap-2 rounded-full bg-accent-dark text-white px-5 h-11 text-sm font-semibold shadow-control transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97] shrink-0">
          <Plus size={15} strokeWidth={2.5} />
          New order
        </button>
      </motion.div>

      {/* Top section — hero + stats side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 mb-4">

        {/* Hero revenue card — takes 3/5 on desktop */}
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="lg:col-span-3 relative overflow-hidden rounded-[20px] bg-accent-dark p-6 md:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-14 -right-4 w-64 h-64 rounded-full bg-white/[0.03]" />
          <p className="text-white/60 text-sm font-medium mb-1">Revenue today</p>
          <p className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
            ₱4,850
          </p>
          <div className="h-[3px] w-full rounded-full bg-white/15 overflow-hidden mb-1.5">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
            />
          </div>
          <p className="text-white/50 text-xs font-medium">
            {completed} of {total} orders fulfilled · {pct}% done
          </p>
        </motion.div>

        {/* Three supporting stats — stack vertically on desktop (2/5), row on mobile */}
        <div className="lg:col-span-2 grid grid-cols-3 lg:grid-cols-1 gap-3">
          {[
            { label: 'Orders', value: '12', icon: ClipboardList, custom: 2 },
            { label: 'Pending', value: '5',  icon: Clock,          custom: 3 },
            { label: 'Messages', value: '3', icon: MessageCircle,  custom: 4 },
          ].map(({ label, value, icon: Icon, custom }) => (
            <motion.div
              key={label}
              custom={custom} variants={fadeUp} initial="hidden" animate="visible"
              whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
              whileTap={{ scale: 0.97 }}
              className="bg-white rounded-[16px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col justify-between cursor-default"
            >
              <div className="w-7 h-7 rounded-full bg-platinum flex items-center justify-center mb-3">
                <Icon size={13} className="text-accent-dark" strokeWidth={2} />
              </div>
              <div>
                <p className="text-xl font-bold text-accent-dark leading-none mb-0.5">{value}</p>
                <p className="text-xs text-olive">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <motion.div
        custom={5} variants={fadeUp} initial="hidden" animate="visible"
        className="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center justify-between px-5 md:px-6 pt-5 pb-3">
          <h2 className="font-display text-base font-semibold text-accent-dark tracking-tight">Recent orders</h2>
          <Link to="/orders" className="inline-flex items-center gap-0.5 text-sm font-semibold text-accent transition-opacity duration-150 hover:opacity-70">
            View all <ArrowUpRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
        <motion.div className="divide-y divide-platinum/60" variants={listContainer} initial="hidden" animate="visible">
          {RECENT_ORDERS.map((order) => (
            <motion.div
              key={order.id} variants={listRow} whileTap={{ backgroundColor: 'rgba(0,0,0,0.015)' }}
              className="flex items-center gap-3.5 px-5 md:px-6 py-3.5 cursor-default"
            >
              <div className="w-9 h-9 rounded-full bg-accent-light/40 flex items-center justify-center text-[11px] font-bold text-accent-dark shrink-0 tracking-wide">
                {initials(order.customer)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-accent-dark truncate leading-snug">{order.customer}</p>
                <p className="text-[13px] text-olive truncate">{order.item}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[15px] font-bold text-accent-dark tabular-nums">{order.price}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status]}`}>
                  {order.status}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Mobile FAB */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: EASE, delay: 0.4 }}
        className="sm:hidden fixed right-5 bottom-[calc(76px+env(safe-area-inset-bottom))] z-20"
      >
        <Link
          to="/orders/new" aria-label="New order"
          className="w-14 h-14 rounded-full bg-accent-dark text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-transform duration-150 ease-out active:scale-90"
        >
          <Plus size={22} strokeWidth={2.5} />
        </Link>
      </motion.div>
    </ScreenShell>
  );
}