// File: app/src/screens/OrdersScreen.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';

const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.26, ease: EASE, delay: i * 0.05 },
  }),
};

const listContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const listRow = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE } },
};

/* ─── Data ─── */
type OrderStatus = 'New' | 'Preparing' | 'Ready' | 'Completed';

interface Order {
  id: string;
  customer: string;
  item: string;
  price: string;
  status: OrderStatus;
  time: string;
}

const ALL_ORDERS: Order[] = [
  { id: '1', customer: 'Maria Santos',   item: '2x Choco Overload, 1x Ube Cake',   price: '₱1,450', status: 'New',       time: '8:12 AM' },
  { id: '2', customer: 'Jerome Cruz',    item: '1x Custom Birthday Cake',           price: '₱2,200', status: 'Preparing', time: '8:45 AM' },
  { id: '3', customer: 'Angel Reyes',    item: '3x Cinnamon Rolls',                 price: '₱540',   status: 'Preparing', time: '9:01 AM' },
  { id: '4', customer: 'Kim Villanueva', item: '1x Red Velvet, 6x Cupcakes',        price: '₱1,180', status: 'Ready',     time: '9:30 AM' },
  { id: '5', customer: 'Ryan Bautista',  item: '2x Ube Cheesecake',                 price: '₱980',   status: 'Completed', time: '7:50 AM' },
  { id: '6', customer: 'Carla Mendoza',  item: '1x Mango Cake, 12x Cupcakes',       price: '₱2,600', status: 'Completed', time: '7:20 AM' },
];

const TABS: { label: string; value: OrderStatus | 'All' }[] = [
  { label: 'All',       value: 'All'       },
  { label: 'New',       value: 'New'       },
  { label: 'Preparing', value: 'Preparing' },
  { label: 'Ready',     value: 'Ready'     },
  { label: 'Completed', value: 'Completed' },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  New:       'bg-accent-light/50 text-accent-dark',
  Preparing: 'bg-platinum text-olive',
  Ready:     'bg-accent-dark text-white',
  Completed: 'bg-green-50 text-green-700',
};

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}

/* ─── Screen ─── */
export function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'All'>('All');

  const filtered = activeTab === 'All'
    ? ALL_ORDERS
    : ALL_ORDERS.filter((o) => o.status === activeTab);

  return (
    <ScreenShell>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-4 mb-6"
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
      >
        <h1 className="font-display text-[26px] md:text-3xl font-bold tracking-tight text-accent-dark">
          Orders
        </h1>
        <Link
          to="/orders/new"
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-accent-dark text-white px-5 h-11 text-sm font-semibold shadow-control transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
        >
          <Plus size={15} strokeWidth={2.5} />
          New order
        </Link>
      </motion.div>

      {/* Filter tabs */}
      <motion.div
        custom={1} variants={fadeUp} initial="hidden" animate="visible"
        className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-5 px-5 md:mx-0 md:px-0 scrollbar-none"
      >
        {TABS.map(({ label, value }) => {
          const isActive = activeTab === value;
          return (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`relative shrink-0 px-4 h-9 rounded-full text-sm font-semibold transition-colors duration-150 ${
                isActive
                  ? 'bg-accent-dark text-white shadow-control'
                  : 'bg-white text-olive border border-platinum/70 hover:border-accent-dark/30'
              }`}
            >
              {label}
            </button>
          );
        })}
      </motion.div>

      {/* Orders list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        >
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <p className="text-sm text-olive">No {activeTab.toLowerCase()} orders</p>
            </div>
          ) : (
            <>
              {/* Desktop table header */}
              <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_auto] gap-4 px-6 py-3 border-b border-platinum/60">
                <span className="text-xs font-semibold text-olive uppercase tracking-wide">Customer</span>
                <span className="text-xs font-semibold text-olive uppercase tracking-wide">Items</span>
                <span className="text-xs font-semibold text-olive uppercase tracking-wide">Price</span>
                <span className="text-xs font-semibold text-olive uppercase tracking-wide">Status</span>
              </div>

              <motion.div
                className="divide-y divide-platinum/60"
                variants={listContainer} initial="hidden" animate="visible"
              >
                {filtered.map((order) => (
                  <motion.div
                    key={order.id} variants={listRow}
                    whileTap={{ backgroundColor: 'rgba(0,0,0,0.015)' }}
                    className="flex md:grid md:grid-cols-[1fr_2fr_1fr_auto] items-center gap-3.5 md:gap-4 px-5 md:px-6 py-3.5 cursor-default"
                  >
                    {/* Mobile: avatar + stacked info | Desktop: columns */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 md:contents">
                      <div className="w-9 h-9 rounded-full bg-accent-light/40 flex items-center justify-center text-[11px] font-bold text-accent-dark shrink-0 tracking-wide md:hidden">
                        {initials(order.customer)}
                      </div>
                      <div className="min-w-0 flex-1 md:flex md:flex-col md:justify-center">
                        <p className="text-[15px] font-semibold text-accent-dark truncate leading-snug">
                          {order.customer}
                        </p>
                        <p className="text-[13px] text-olive truncate md:hidden">{order.item}</p>
                        <p className="text-[13px] text-olive truncate hidden md:block">{order.item}</p>
                      </div>
                      <span className="hidden md:block text-[15px] font-bold text-accent-dark tabular-nums whitespace-nowrap">
                        {order.price}
                      </span>
                    </div>

                    {/* Mobile: price + status right-aligned */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0 md:hidden">
                      <span className="text-[15px] font-bold text-accent-dark tabular-nums">{order.price}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status]}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Desktop: status pill */}
                    <span className={`hidden md:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ${STATUS_STYLES[order.status]}`}>
                      {order.status}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Mobile FAB */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: EASE, delay: 0.35 }}
        className="sm:hidden fixed right-5 bottom-[calc(76px+env(safe-area-inset-bottom))] z-20"
      >
        <Link
          to="/orders/new" aria-label="New order"
          className="w-14 h-14 rounded-full bg-accent-dark text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-transform duration-150 active:scale-90"
        >
          <Plus size={22} strokeWidth={2.5} />
        </Link>
      </motion.div>
    </ScreenShell>
  );
}