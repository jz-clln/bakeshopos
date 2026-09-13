// File: app/src/screens/OrdersScreen.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Plus, ChevronRight, Inbox, WifiOff, RefreshCw, Wallet, Calendar } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/currency';
import { getValidNextStatuses, transitionOrderStatus } from '../api/orders';
import { getAvatarPreset } from '../lib/avatarPresets';
import { RecordPaymentSheet } from '../components/orders/RecordPaymentSheet';
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

interface OrderRow {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar_url: string | null;
  summary: string;
  total_quantity: number;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  event_date: string | null;
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

const TABS: { label: string; value: TabValue }[] = [
  { label: 'All',       value: 'all'       },
  { label: 'Inquiry',   value: 'inquiry'   },
  { label: 'Quote',     value: 'quote'     },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In prod.',  value: 'in_production' },
  { label: 'Ready',     value: 'ready'     },
];

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatEventDate(iso: string | null): string | null {
  if (!iso) return null;
  // Split on 'T'/space rather than `new Date(iso)` — event_date is a
  // plain date (no time/timezone), and letting the Date constructor
  // parse it can shift it a day in either direction depending on the
  // browser's local timezone.
  const [year, month, day] = iso.split(/[-T]/).map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function OrdersScreen() {
  const { organizationId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [openMenuOrderId, setOpenMenuOrderId] = useState<string | null>(null);
  const [menuOptions, setMenuOptions] = useState<OrderStatus[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Which order's payment sheet is open — separate from
  // openMenuOrderId, since a payment can be recorded regardless of
  // whether the status menu happens to be open too.
  const [paymentSheetOrderId, setPaymentSheetOrderId] = useState<string | null>(null);

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
      .from('order_list_view')
      .select('id, customer_id, customer_name, summary, total_quantity, total_amount, status, created_at, event_date')
      .eq('organization_id', organizationId)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });

    if (activeTab !== 'all') {
      query = query.eq('status', activeTab);
    }

    const { data, error: err } = await query;

    if (err) {
      console.error('Failed to load orders:', err);
      setError(true);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Array<Omit<OrderRow, 'customer_avatar_url'>>;

    if (rows.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const customerIds = [...new Set(rows.map((o) => o.customer_id))];
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, facebook_profile_pic_url')
      .in('id', customerIds);

    if (customersError) {
      console.error('Failed to load customer avatars:', customersError);
      setOrders(rows.map((o) => ({ ...o, customer_avatar_url: null })));
      setLoading(false);
      return;
    }

    const avatarByCustomerId = new Map(
      (customers ?? []).map((c) => [c.id, c.facebook_profile_pic_url as string | null])
    );

    setOrders(
      rows.map((o) => ({
        ...o,
        customer_avatar_url: avatarByCustomerId.get(o.customer_id) ?? null,
      }))
    );
    setLoading(false);
  }

  async function handleStatusPillTap(order: OrderRow) {
    setTransitionError(null);
    setPaymentSheetOrderId(null);
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
      const message = err instanceof Error ? err.message : 'Could not update order status.';
      setTransitionError(message);
    }
  }

  return (
    <ScreenShell>
      <MotionConfig reducedMotion="user">
        <motion.div
          className="flex items-center justify-between gap-4 mb-6"
          custom={0} variants={fadeUp} initial="hidden" animate="visible"
        >
          <div>
            <h1 className="font-display text-[26px] md:text-3xl font-bold tracking-tight text-accent-dark">
              Orders
            </h1>
            {!loading && !error && orders.length > 0 && (
              <p className="text-[13px] text-olive mt-0.5">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} today
              </p>
            )}
          </div>
          <Link
            to="/orders/new"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-accent-dark text-white px-5 h-11 text-sm font-semibold shadow-control transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
          >
            <Plus size={15} strokeWidth={2.5} />
            New order
          </Link>
        </motion.div>

        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="mb-5 -mx-5 px-5 md:mx-0 md:px-0 overflow-x-auto scrollbar-none"
        >
          <div className="inline-flex gap-1 p-1 rounded-full bg-platinum/40">
            {TABS.map(({ label, value }) => {
              const isActive = activeTab === value;
              return (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={`relative shrink-0 px-4 h-9 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors duration-200 ${
                    isActive ? 'text-accent-dark' : 'text-olive hover:text-accent-dark/80'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeTabPill"
                      className="absolute inset-0 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <AnimatePresence>
          {transitionError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="mb-4 px-4 py-3 rounded-[14px] bg-red-50 text-red-600 text-sm font-medium"
            >
              {transitionError}
            </motion.div>
          )}
        </AnimatePresence>

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
                  <div key={i} className="flex items-center gap-3.5 px-5 md:px-6 py-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-platinum/80 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-platinum/80 rounded w-1/3" />
                      <div className="h-3 bg-platinum/60 rounded w-2/3" />
                    </div>
                    <div className="h-3 bg-platinum/60 rounded w-16 shrink-0" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-16 flex flex-col items-center gap-3 px-6 text-center">
                <div className="w-11 h-11 rounded-full bg-platinum/60 flex items-center justify-center">
                  <WifiOff size={18} className="text-olive" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-accent-dark">Couldn't load orders</p>
                  <p className="text-sm text-olive mt-0.5">Check your connection and try again.</p>
                </div>
                <button
                  onClick={loadOrders}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent-dark mt-1"
                >
                  <RefreshCw size={13} />
                  Try again
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3 px-6 text-center">
                <div className="w-11 h-11 rounded-full bg-platinum/60 flex items-center justify-center">
                  <Inbox size={18} className="text-olive" />
                </div>
                <p className="text-sm text-olive">
                  No {activeTab === 'all' ? '' : STATUS_LABEL[activeTab as OrderStatus].toLowerCase() + ' '}orders today.
                </p>
                <Link
                  to="/orders/new"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent-dark"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  Create an order
                </Link>
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
                  {orders.map((order) => {
                    const hasAvatar = !!order.customer_avatar_url;
                    const preset = getAvatarPreset(order.customer_id);
                    const canRecordPayment = ['quote', 'pending_payment'].includes(order.status);
                    const eventDateLabel = formatEventDate(order.event_date);

                    return (
                      <motion.div key={order.id} layout="position" className="relative">
                        <motion.div variants={listRow} whileTap={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>

                          {/* ── Mobile card — fully separate markup from
                              desktop, not a shared/collapsed layout, so
                              nothing here can silently misalign the
                              desktop grid or vice versa. ── */}
                          <div className="md:hidden flex items-center gap-3 px-5 py-4">
                            <img
                              src={hasAvatar ? order.customer_avatar_url! : preset.src}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover bg-platinum shrink-0"
                              onError={(e) => {
                                if (e.currentTarget.src !== window.location.origin + preset.src) {
                                  e.currentTarget.src = preset.src;
                                }
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-semibold text-accent-dark leading-snug">
                                {order.customer_name}
                              </p>
                              {/* No truncate — full item details wrap
                                  onto as many lines as they need, so
                                  nothing the owner needs is ever cut off. */}
                              <p className="text-[12px] text-olive leading-snug mt-0.5">
                                {order.summary}
                              </p>
                              {eventDateLabel && order.status !== 'refunded' && (
                                <p className="flex items-center gap-1 text-[12px] text-olive/80 mt-1">
                                  <Calendar size={11} />
                                  {eventDateLabel}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <button
                                onClick={() => handleStatusPillTap(order)}
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[order.status]}`}
                              >
                                {STATUS_LABEL[order.status]}
                                <motion.span
                                  animate={{ rotate: openMenuOrderId === order.id ? 90 : 0 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <ChevronRight size={10} strokeWidth={2.5} />
                                </motion.span>
                              </button>
                              <span className="text-[15px] font-bold text-accent-dark tabular-nums">
                                {formatPrice(order.total_amount)}
                              </span>
                            </div>
                          </div>

                          {/* ── Desktop row — a real 4-column grid with
                              exactly one direct child per column, so
                              Total and Status always land under their
                              own headers no matter what. ── */}
                          <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_auto] items-center gap-4 px-6 py-4">
                            <p className="text-[15px] font-semibold text-accent-dark truncate">
                              {order.customer_name}
                            </p>

                            <div className="min-w-0">
                              <p className="text-[13px] text-accent-dark">{order.summary}</p>
                              {eventDateLabel && order.status !== 'refunded' && (
                                <p className="flex items-center gap-1 text-[12px] text-olive mt-0.5">
                                  <Calendar size={11} />
                                  Needed {eventDateLabel}
                                </p>
                              )}
                            </div>

                            <span className="text-[15px] font-bold text-accent-dark tabular-nums whitespace-nowrap">
                              {formatPrice(order.total_amount)}
                            </span>

                            <button
                              onClick={() => handleStatusPillTap(order)}
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit justify-self-end ${STATUS_STYLES[order.status]}`}
                            >
                              {STATUS_LABEL[order.status]}
                              <motion.span
                                animate={{ rotate: openMenuOrderId === order.id ? 90 : 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                <ChevronRight size={10} strokeWidth={2.5} />
                              </motion.span>
                            </button>
                          </div>
                        </motion.div>

                        {/* Payment action row — shown separately from
                            the status pill, since it's not itself a
                            status change, just a prerequisite for one. */}
                        {canRecordPayment && paymentSheetOrderId !== order.id && (
                          <div className="px-5 md:px-6 pb-3 -mt-2">
                            <button
                              onClick={() => { setOpenMenuOrderId(null); setPaymentSheetOrderId(order.id); }}
                              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent-dark"
                            >
                              <Wallet size={13} />
                              Record Payment
                            </button>
                          </div>
                        )}

                        <AnimatePresence>
                          {paymentSheetOrderId === order.id && (
                            <RecordPaymentSheet
                              orderId={order.id}
                              orderTotal={order.total_amount}
                              onClose={() => setPaymentSheetOrderId(null)}
                              onRecorded={() => {
                                setPaymentSheetOrderId(null);
                                loadOrders();
                              }}
                            />
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {openMenuOrderId === order.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.18, ease: EASE }}
                              className="px-5 md:px-6 pb-4 flex flex-wrap gap-2"
                            >
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
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

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
      </MotionConfig>
    </ScreenShell>
  );
}