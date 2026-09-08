// File: app/src/screens/OrdersScreen.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/currency';
import { getValidNextStatuses, transitionOrderStatus } from '../api/orders';
import type { OrderStatus } from '../types/catalog';

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

/* ─── Types ─── */
interface OrderRow {
  id: string;
  customer_name: string;
  summary: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  inquiry:         'Inquiry',
  quote:           'Quote sent',
  pending_payment: 'Awaiting payment',
  confirmed:       'Confirmed',
  scheduled:       'Scheduled',
  in_production:   'In production',
  ready:           'Ready',
  completed:       'Completed',
  cancelled:       'Cancelled',
  refunded:        'Refunded',
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  inquiry:         'bg-platinum text-olive',
  quote:           'bg-accent-light/50 text-accent-dark',
  pending_payment: 'bg-amber-50 text-amber-700',
  confirmed:       'bg-accent-light/50 text-accent-dark',
  scheduled:       'bg-blue-50 text-blue-700',
  in_production:   'bg-accent-dark text-white',
  ready:           'bg-accent-dark text-white',
  completed:       'bg-green-50 text-green-700',
  cancelled:       'bg-red-50 text-red-600',
  refunded:        'bg-red-50 text-red-600',
};

type TabValue = 'all' | OrderStatus;

// A curated subset for the filter tabs — showing all 10 states as tabs
// would overwhelm the UI. "All" plus the active-pipeline states covers
// the day-to-day view; cancelled/refunded orders are still reachable
// via "All", just not given their own tab.
const TABS: { label: string; value: TabValue }[] = [
  { label: 'All',       value: 'all'       },
  { label: 'Inquiry',   value: 'inquiry'   },
  { label: 'Quote',     value: 'quote'     },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In prod.',  value: 'in_production' },
  { label: 'Ready',     value: 'ready'     },
];

function initials(name: string) {
  const p = (name ?? '').trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

/* ─── Screen ─── */
export function OrdersScreen() {
  const { organizationId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Which order's next-status menu is currently open, and the valid
  // options for it (fetched fresh each time, since they depend on
  // that specific order's current status).
  const [openMenuOrderId, setOpenMenuOrderId] = useState<string | null>(null);
  const [menuOptions, setMenuOptions] = useState<OrderStatus[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    loadOrders();
  }, [organizationId, activeTab]);

  async function loadOrders() {
    if (!organizationId) return;
    setLoading(true);
    setError(false);
    const { start, end } = todayRange();

    let query = supabase
      .from('orders')
      .select('id, customer_name, summary, total_amount, status, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });

    if (activeTab !== 'all') {
      query = query.eq('status', activeTab);
    }

    const { data, error: err } = await query;

    if (err) {
      setError(true);
    } else {
      setOrders((data ?? []) as OrderRow[]);
    }
    setLoading(false);
  }

  async function handleStatusPillTap(order: OrderRow) {
    setTransitionError(null);
    if (openMenuOrderId === order.id) {
      setOpenMenuOrderId(null);
      return;
    }

    setOpenMenuOrderId(order.id);
    setMenuLoading(true);
    try {
      const options = await getValidNextStatuses(order.status);
      setMenuOptions(options);
    } catch (err) {
      console.error('Failed to load valid next statuses:', err);
      setMenuOptions([]);
    } finally {
      setMenuLoading(false);
    }
  }

  async function handleSelectNextStatus(orderId: string, nextStatus: OrderStatus) {
    setTransitionError(null);
    try {
      await transitionOrderStatus(orderId, nextStatus);
      setOpenMenuOrderId(null);
      await loadOrders();
    } catch (err) {
      // The database function throws specific, readable messages
      // (e.g. "Full payment required before confirming this order") —
      // surface that exact text rather than a generic failure.
      const message = err instanceof Error ? err.message : 'Could not update order status.';
      setTransitionError(message);
    }
  }

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
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`shrink-0 px-4 h-9 rounded-full text-sm font-semibold transition-colors duration-150 ${
              activeTab === value
                ? 'bg-accent-dark text-white shadow-control'
                : 'bg-white text-olive border border-platinum/70 hover:border-accent-dark/30'
            }`}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {transitionError && (
        <div className="mb-4 px-4 py-3 rounded-[14px] bg-red-50 text-red-600 text-sm font-medium">
          {transitionError}
        </div>
      )}

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
          {loading ? (
            <div className="divide-y divide-platinum/60">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3.5 px-5 md:px-6 py-3.5 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-platinum/80 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-platinum/80 rounded w-1/3" />
                    <div className="h-3 bg-platinum/60 rounded w-2/3" />
                  </div>
                  <div className="h-3 bg-platinum/60 rounded w-16 shrink-0" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <p className="text-[15px] font-medium text-accent-dark">Couldn't load orders</p>
              <p className="text-sm text-olive">Check your connection and try again.</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <p className="text-sm text-olive">
                No {activeTab === 'all' ? '' : STATUS_LABEL[activeTab as OrderStatus].toLowerCase() + ' '}orders today.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop column headers */}
              <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_auto] gap-4 px-6 py-3 border-b border-platinum/60">
                <span className="text-xs font-semibold text-olive uppercase tracking-wide">Customer</span>
                <span className="text-xs font-semibold text-olive uppercase tracking-wide">Items</span>
                <span className="text-xs font-semibold text-olive uppercase tracking-wide">Total</span>
                <span className="text-xs font-semibold text-olive uppercase tracking-wide">Status</span>
              </div>

              <motion.div
                className="divide-y divide-platinum/60"
                variants={listContainer} initial="hidden" animate="visible"
              >
                {orders.map((order) => (
                  <div key={order.id} className="relative">
                    <motion.div
                      variants={listRow}
                      whileTap={{ backgroundColor: 'rgba(0,0,0,0.015)' }}
                      className="flex md:grid md:grid-cols-[1fr_2fr_1fr_auto] items-center gap-3.5 md:gap-4 px-5 md:px-6 py-3.5"
                    >
                      {/* Mobile layout */}
                      <div className="flex items-center gap-3 min-w-0 flex-1 md:contents">
                        <div className="w-9 h-9 rounded-full bg-accent-light/40 flex items-center justify-center text-[11px] font-bold text-accent-dark shrink-0 tracking-wide md:hidden">
                          {initials(order.customer_name)}
                        </div>
                        <div className="min-w-0 flex-1 md:flex md:flex-col md:justify-center">
                          <p className="text-[15px] font-semibold text-accent-dark truncate leading-snug">
                            {order.customer_name}
                          </p>
                          <p className="text-[13px] text-olive truncate">{order.summary}</p>
                        </div>
                        <span className="hidden md:block text-[15px] font-bold text-accent-dark tabular-nums whitespace-nowrap">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>

                      {/* Mobile: price + status */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0 md:hidden">
                        <span className="text-[15px] font-bold text-accent-dark tabular-nums">
                          {formatPrice(order.total_amount)}
                        </span>
                        <button
                          onClick={() => handleStatusPillTap(order)}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status]}`}
                        >
                          {STATUS_LABEL[order.status]}
                          <ChevronRight size={10} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Desktop: status pill */}
                      <button
                        onClick={() => handleStatusPillTap(order)}
                        className={`hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ${STATUS_STYLES[order.status]}`}
                      >
                        {STATUS_LABEL[order.status]}
                        <ChevronRight size={10} strokeWidth={2.5} />
                      </button>
                    </motion.div>

                    {/* Inline next-status menu */}
                    {openMenuOrderId === order.id && (
                      <div className="px-5 md:px-6 pb-3.5 flex flex-wrap gap-2">
                        {menuLoading ? (
                          <span className="text-xs text-olive">Loading options…</span>
                        ) : menuOptions.length === 0 ? (
                          <span className="text-xs text-olive">No further status changes available.</span>
                        ) : (
                          menuOptions.map((status) => (
                            <button
                              key={status}
                              onClick={() => handleSelectNextStatus(order.id, status)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent-dark text-white transition-transform duration-150 active:scale-95"
                            >
                              Move to {STATUS_LABEL[status]}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
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