// File: app/src/screens/OrdersScreen.tsx

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';

import {
  Plus,
  ChevronRight,
  Inbox,
  WifiOff,
  RefreshCw,
  Wallet,
  Calendar,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

import { ScreenShell } from '../components/layout/ScreenShell';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/currency';

import {
  getValidNextStatuses,
  transitionOrderStatus,
  archiveOrder,
  unarchiveOrder,
} from '../api/orders';

import { getAvatarPreset } from '../lib/avatarPresets';
import { RecordPaymentSheet } from '../components/orders/RecordPaymentSheet';
import { OrderDetailModal } from '../components/orders/OrderDetailModal';
import { fetchPaymentsForOrders, type PaymentRecord } from '../api/payments';

import type { OrderStatus } from '../types/catalog';

/* ============================================================
   DESIGN & MOTION
============================================================ */

const EASE = [0.23, 1, 0.32, 1] as const;

const SPRING = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
} as const;

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 8,
  },

  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: EASE,
      delay: i * 0.05,
    },
  }),
};

const listContainer = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const listRow = {
  hidden: {
    opacity: 0,
    y: 6,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.22,
      ease: EASE,
    },
  },
};

/* ============================================================
   SHARED DESIGN STYLES
============================================================ */

const CARD_STYLE =
  'overflow-hidden rounded-[20px] border border-platinum/60 bg-white shadow-[0_3px_16px_rgba(42,35,32,0.035)]';

const PRIMARY_BUTTON =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-accent-dark px-4 text-[12px] font-semibold text-white shadow-[0_3px_10px_rgba(42,35,32,0.12)] transition-all duration-150 hover:bg-accent-dark/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 focus-visible:ring-offset-2';

/* ============================================================
   TYPES
============================================================ */

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
  archived_at: string | null;
  payments: PaymentRecord[];
}

type TabValue = 'all' | OrderStatus;

/* ============================================================
   ORDER STATUS
============================================================ */

const STATUS_LABEL: Record<OrderStatus, string> = {
  inquiry: 'Inquiry',
  quote: 'Quote sent',
  confirmed: 'Confirmed',
  in_production: 'In production',
  completed: 'Done',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  inquiry:
    'border-platinum/70 bg-platinum/45 text-olive',

  quote:
    'border-[#E9DDD0] bg-[#F5EEE5] text-accent-dark',

  confirmed:
    'border-[#DED5C8] bg-[#F2EDE6] text-accent-dark',

  in_production:
    'border-accent-dark bg-accent-dark text-white',

  completed:
    'border-emerald-100 bg-emerald-50 text-emerald-700',

  cancelled:
    'border-rose-100 bg-rose-50 text-rose-600',

  refunded:
    'border-rose-100 bg-rose-50 text-rose-600',
};

const TABS: {
  label: string;
  value: TabValue;
}[] = [
  { label: 'All', value: 'all' },
  { label: 'Inquiry', value: 'inquiry' },
  { label: 'Quote', value: 'quote' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In prod.', value: 'in_production' },
];

/* ============================================================
   HELPERS
============================================================ */

function formatEventDate(iso: string | null): string | null {
  if (!iso) return null;

  const [year, month, day] = iso.split(/[-T]/).map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });
}

/* ============================================================
   ORDERS SCREEN
============================================================ */

export function OrdersScreen() {
  const { organizationId } = useAuth();

  /* ==========================================================
     STATE
  ========================================================== */

  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const [showArchived, setShowArchived] = useState(false);

  const [orders, setOrders] = useState<OrderRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

  const [archivingOrderId, setArchivingOrderId] = useState<
    string | null
  >(null);

  const [openMenuOrderId, setOpenMenuOrderId] = useState<
    string | null
  >(null);

  const [menuOptions, setMenuOptions] = useState<OrderStatus[]>([]);

  const [menuLoading, setMenuLoading] = useState(false);

  const [transitionError, setTransitionError] = useState<
    string | null
  >(null);

  const [paymentSheetOrderId, setPaymentSheetOrderId] = useState<
    string | null
  >(null);

  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [paymentDataUnavailable, setPaymentDataUnavailable] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState<
    string | null
  >(null);

  /* ==========================================================
     ORDER DETAIL DEEP LINK
  ========================================================== */

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const openId = searchParams.get('open');

    if (!openId) return;

    setSelectedOrderId(openId);

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('open');
        return next;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams]);

  /* ==========================================================
     LOAD ORDERS
  ========================================================== */

  useEffect(() => {
    if (!organizationId) return;

    loadOrders();
  }, [organizationId, activeTab, showArchived]);

  async function loadOrders(silent = false) {
    if (!organizationId) return;

    if (!silent) setLoading(true);
    if (!silent) setError(false);

    let query = supabase
      .from('order_list_view')
      .select(
        'id, customer_id, customer_name, summary, total_quantity, total_amount, status, created_at, event_date, archived_at'
      )
      .eq('organization_id', organizationId)
      .order('created_at', {
        ascending: false,
      });

    /* Archived filter */

    query = showArchived
      ? query.not('archived_at', 'is', null)
      : query.is('archived_at', null);

    /* Status filter */

    if (activeTab !== 'all') {
      query = query.eq('status', activeTab);
    }

    const { data, error: err } = await query;

    if (err) {
      console.error('Failed to load orders:', err);
      if (!silent) {
        setError(true);
        setLoading(false);
      }
      return;
    }

    const rows = (data ?? []) as Array<
      Omit<OrderRow, 'customer_avatar_url' | 'payments'>
    >;

    if (rows.length === 0) {
      setPaymentDataUnavailable(false);
      setOrders([]);
      setLoading(false);
      return;
    }

    /* Customer avatars and payment records are fetched together. If payment
       lookup fails, never interpret that as "unpaid" and display another
       Record payment button: that could create a duplicate. */
    const customerIds = [...new Set(rows.map((o) => o.customer_id))];
    const [customerResult, paymentResult] = await Promise.all([
      supabase
        .from('customers')
        .select('id, facebook_profile_pic_url')
        .in('id', customerIds),
      fetchPaymentsForOrders(rows.map((o) => o.id)).then(
        (payments) => ({ payments, error: null as unknown }),
        (error: unknown) => ({ payments: [] as PaymentRecord[], error })
      ),
    ]);

    if (paymentResult.error) {
      setPaymentDataUnavailable(true);
      console.error('Failed to load order payments:', paymentResult.error);
      if (silent) {
        setTransitionError('Could not refresh payment details. Please reload before recording another payment.');
      } else {
        setError(true);
      }
      setLoading(false);
      return;
    }

    if (customerResult.error) {
      console.error('Failed to load customer avatars:', customerResult.error);
    }

    const avatarByCustomerId = new Map(
      (customerResult.data ?? []).map((c) => [
        c.id,
        c.facebook_profile_pic_url as string | null,
      ])
    );

    const paymentsByOrderId = new Map<string, PaymentRecord[]>();
    for (const payment of paymentResult.payments) {
      const collection = paymentsByOrderId.get(payment.order_id) ?? [];
      collection.push(payment);
      paymentsByOrderId.set(payment.order_id, collection);
    }

    setPaymentDataUnavailable(false);
    setOrders(
      rows.map((o) => ({
        ...o,
        customer_avatar_url: avatarByCustomerId.get(o.customer_id) ?? null,
        payments: paymentsByOrderId.get(o.id) ?? [],
      }))
    );

    setLoading(false);
  }

  /* ==========================================================
     OPEN ORDER DETAILS
  ========================================================== */

  function handleOpenDetails(orderId: string) {
    setOpenMenuOrderId(null);
    setPaymentSheetOrderId(null);
    setSelectedOrderId(orderId);
  }

  /* ==========================================================
     STATUS MENU
  ========================================================== */

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
      console.error(
        'Failed to load valid next statuses:',
        err
      );

      setMenuOptions([]);
    } finally {
      setMenuLoading(false);
    }
  }

  /* ==========================================================
     UPDATE ORDER STATUS
  ========================================================== */

  async function handleSelectNextStatus(
    orderId: string,
    nextStatus: OrderStatus
  ) {
    setTransitionError(null);

    try {
      await transitionOrderStatus(orderId, nextStatus);

      // Update the row without briefly replacing the whole list with skeletons.
      setOrders((prev) =>
        prev
          .map((order) =>
            order.id === orderId
              ? { ...order, status: nextStatus }
              : order
          )
          .filter((order) => activeTab === 'all' || order.status === activeTab)
      );

      setOpenMenuOrderId(null);
      await loadOrders(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not update order status.';

      setTransitionError(message);
    }
  }

  /* ==========================================================
     ARCHIVE / UNARCHIVE
  ========================================================== */

  async function handleToggleArchive(order: OrderRow) {
    setArchivingOrderId(order.id);
    setTransitionError(null);

    try {
      if (order.archived_at) {
        await unarchiveOrder(order.id);
      } else {
        await archiveOrder(order.id);
      }

      setOrders((prev) =>
        prev.filter((o) => o.id !== order.id)
      );
    } catch (err) {
      console.error(
        'Failed to update archive status:',
        err
      );

      setTransitionError(
        err instanceof Error
          ? err.message
          : 'Could not update this order.'
      );
    } finally {
      setArchivingOrderId(null);
    }
  }

  /* ==========================================================
     VIEW
  ========================================================== */

  return (
    <>
      <ScreenShell>
        <MotionConfig reducedMotion="user">
          <div className="mx-auto w-full min-w-0 max-w-[1200px] pb-6">

            {/* ==================================================
                HEADER
            ================================================== */}

            <motion.header
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-5 flex items-center justify-between gap-3"
            >
              {/* Title */}

              <div className="min-w-0 flex-1">
                <h1 className="font-display text-[23px] font-bold leading-tight tracking-[-0.035em] text-accent-dark sm:text-[26px]">
                  {showArchived
                    ? 'Archived orders'
                    : 'Orders'}
                </h1>

                {!loading && !error && orders.length > 0 && (
                  <p className="mt-1 text-[11px] font-medium text-olive/60 sm:text-[12px]">
                    {orders.length}{' '}
                    {orders.length === 1
                      ? 'order'
                      : 'orders'}
                  </p>
                )}
              </div>

              {/* Header actions */}

              <div className="flex shrink-0 items-center gap-2">

                {/* Archive toggle */}

                <button
                  type="button"
                  onClick={() =>
                    setShowArchived((v) => !v)
                  }
                  className={`group inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 sm:px-4 sm:text-[12px] ${
                    showArchived
                      ? 'border-accent-dark bg-accent-dark text-white shadow-[0_3px_10px_rgba(42,35,32,0.12)]'
                      : 'border-platinum/60 bg-white text-olive shadow-[0_2px_8px_rgba(42,35,32,0.035)] hover:bg-platinum/20 hover:text-accent-dark'
                  }`}
                >
                  {showArchived ? (
                    <>
                      <ArchiveRestore
                        size={14}
                        strokeWidth={1.9}
                      />

                      <span className="hidden min-[380px]:inline">
                        Active orders
                      </span>
                    </>
                  ) : (
                    <>
                      <Archive
                        size={14}
                        strokeWidth={1.9}
                      />

                      <span className="hidden min-[380px]:inline">
                        Archived
                      </span>
                    </>
                  )}
                </button>

                {/* Desktop new order */}

                {!showArchived && (
                  <Link
                    to="/orders/new"
                    className={`${PRIMARY_BUTTON} hidden sm:inline-flex`}
                  >
                    <Plus
                      size={15}
                      strokeWidth={2.2}
                    />

                    New order
                  </Link>
                )}
              </div>
            </motion.header>

            {/* ==================================================
                ORDER STATUS FILTERS
            ================================================== */}

            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-4 w-full min-w-0 overflow-x-auto pb-1 scrollbar-none"
            >
              <div className="inline-flex min-w-max items-center gap-1 rounded-full border border-platinum/50 bg-[#F2EDE6]/70 p-1">
                {TABS.map(({ label, value }) => {
                  const isActive = activeTab === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setActiveTab(value)}
                      className={`relative flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 sm:px-4 sm:text-[12px] ${
                        isActive
                          ? 'text-accent-dark'
                          : 'text-olive/70 hover:text-accent-dark'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeTabPill"
                          className="absolute inset-0 rounded-full border border-platinum/40 bg-white shadow-[0_2px_6px_rgba(42,35,32,0.075)]"
                          transition={SPRING}
                        />
                      )}

                      <span className="relative z-10">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* ==================================================
                ERROR MESSAGE
            ================================================== */}

            <AnimatePresence>
              {transitionError && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -6,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -6,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: EASE,
                  }}
                  className="mb-4 rounded-[14px] border border-rose-100 bg-rose-50 px-4 py-3 text-[12px] font-medium leading-5 text-rose-600"
                >
                  {transitionError}
                </motion.div>
              )}
            </AnimatePresence>

            {paymentNotice && (
              <div role="status" className="mb-4 flex items-start justify-between gap-3 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800">
                <span>{paymentNotice}</span>
                <button type="button" aria-label="Dismiss payment notice" onClick={() => setPaymentNotice(null)} className="shrink-0 font-semibold">Dismiss</button>
              </div>
            )}

            {/* ==================================================
                ORDERS CONTENT
            ================================================== */}

            <AnimatePresence mode="wait">
              <motion.section
                key={`${activeTab}-${showArchived}`}
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                  ease: EASE,
                }}
                className={CARD_STYLE}
              >

                {/* ==================================================
                    LOADING STATE
                ================================================== */}

                {loading ? (
                  <div className="divide-y divide-platinum/45">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex min-h-[76px] animate-pulse items-center gap-3 px-4 py-3 motion-reduce:animate-none sm:px-5"
                      >
                        <div className="h-10 w-10 shrink-0 rounded-full bg-platinum/65" />

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-3 w-28 max-w-full rounded-full bg-platinum/65" />
                          <div className="h-2.5 w-44 max-w-full rounded-full bg-platinum/45" />
                        </div>

                        <div className="h-3 w-14 shrink-0 rounded-full bg-platinum/50" />
                      </div>
                    ))}
                  </div>

                ) : error ? (

                  /* ==================================================
                      ERROR STATE
                  ================================================== */

                  <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-8 text-center">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-platinum/40">
                      <WifiOff
                        size={19}
                        strokeWidth={1.7}
                        className="text-olive"
                      />
                    </div>

                    <p className="text-[13px] font-semibold text-accent-dark">
                      Couldn't load orders
                    </p>

                    <p className="mt-1 max-w-[260px] text-[11px] leading-5 text-olive/60">
                      Check your connection and try again.
                    </p>

                    <button
                      type="button"
                      onClick={() => loadOrders()}
                      className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#F2EDE6] px-4 text-[12px] font-semibold text-accent-dark transition-colors duration-150 hover:bg-[#E9E1D7] active:scale-95"
                    >
                      <RefreshCw
                        size={14}
                        strokeWidth={2}
                      />

                      Try again
                    </button>
                  </div>

                ) : orders.length === 0 ? (

                  /* ==================================================
                      EMPTY STATE
                  ================================================== */

                  <div className="flex min-h-[210px] flex-col items-center justify-center px-5 py-8 text-center">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#F2EDE6]">
                      {showArchived ? (
                        <Archive
                          size={19}
                          strokeWidth={1.7}
                          className="text-olive"
                        />
                      ) : (
                        <Inbox
                          size={19}
                          strokeWidth={1.7}
                          className="text-olive"
                        />
                      )}
                    </div>

                    <p className="text-[13px] font-semibold text-accent-dark">
                      {showArchived
                        ? 'No archived orders'
                        : `No ${
                            activeTab === 'all'
                              ? ''
                              : STATUS_LABEL[
                                  activeTab as OrderStatus
                                ].toLowerCase() + ' '
                          }orders yet`}
                    </p>

                    <p className="mt-1 max-w-[260px] text-[11px] leading-5 text-olive/60">
                      {showArchived
                        ? 'Your archived orders will appear here.'
                        : 'Your orders will appear here as they come in.'}
                    </p>

                    {!showArchived && (
                      <Link
                        to="/orders/new"
                        className={`${PRIMARY_BUTTON} mt-4`}
                      >
                        <Plus
                          size={14}
                          strokeWidth={2.2}
                        />

                        Create an order
                      </Link>
                    )}
                  </div>

                ) : (

                  /* ==================================================
                      ORDER LIST
                  ================================================== */

                  <>

                    {/* ==================================================
                        DESKTOP COLUMN HEADERS
                    ================================================== */}

                    <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(100px,0.7fr)_minmax(155px,auto)] items-center gap-4 border-b border-platinum/50 bg-[#FAF8F5] px-5 py-3 xl:grid xl:px-6">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-olive/65">
                        Customer
                      </span>

                      <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-olive/65">
                        Items
                      </span>

                      <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-olive/65">
                        Total
                      </span>

                      <span className="text-right text-[10px] font-semibold uppercase tracking-[0.10em] text-olive/65">
                        Status
                      </span>
                    </div>

                    {/* ==================================================
                        ORDER ROWS
                    ================================================== */}

                    <motion.div
                      className="divide-y divide-platinum/45"
                      variants={listContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      <AnimatePresence initial={false}>
                      {orders.map((order) => {
                        const hasAvatar =
                          !!order.customer_avatar_url;

                        const preset = getAvatarPreset(
                          order.customer_id
                        );

                        const paymentRows = order.payments ?? [];
                        const paidAmount = paymentRows.reduce(
                          (sum, payment) => sum + payment.amount_paid,
                          0
                        );
                        const remainingAmount = Math.max(0, order.total_amount - paidAmount);
                        const hasRecordedPayment = paymentRows.length > 0;
                        const canAddPayment =
                          order.status === 'quote' &&
                          !showArchived &&
                          remainingAmount > 0;
                        const canManagePayment = hasRecordedPayment && !showArchived;
                        const showPaymentAction = !paymentDataUnavailable && (canManagePayment || canAddPayment);
                        const paymentActionLabel = hasRecordedPayment
                          ? paymentRows.length === 1 ? 'Edit payment' : `Payments (${paymentRows.length})`
                          : 'Record payment';

                        const eventDateLabel =
                          formatEventDate(order.event_date);

                        const isArchiving =
                          archivingOrderId === order.id;

                        /* ==================================================
                            ARCHIVE BUTTON
                        ================================================== */

                        const archiveButton = (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleArchive(order);
                            }}
                            disabled={isArchiving}
                            aria-label={
                              showArchived
                                ? 'Unarchive order'
                                : 'Archive order'
                            }
                            title={
                              showArchived
                                ? 'Move back to active orders'
                                : 'Archive this order'
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-olive/55 transition-all duration-150 hover:bg-[#F2EDE6] hover:text-accent-dark active:scale-95 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/20"
                          >
                            {showArchived ? (
                              <ArchiveRestore
                                size={15}
                                strokeWidth={1.8}
                              />
                            ) : (
                              <Archive
                                size={15}
                                strokeWidth={1.8}
                              />
                            )}
                          </button>
                        );

                        /* ==================================================
                            STATUS BUTTON
                        ================================================== */

                        const statusButton = (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusPillTap(order);
                            }}
                            className={`inline-flex min-h-8 max-w-full shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-4 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/20 ${STATUS_STYLES[order.status]}`}
                          >
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.span
                                key={order.status}
                                className="truncate"
                                initial={{ opacity: 0, y: 3 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -3 }}
                                transition={{ duration: 0.15, ease: EASE }}
                              >
                                {STATUS_LABEL[order.status]}
                              </motion.span>
                            </AnimatePresence>

                            <motion.span
                              className="shrink-0"
                              animate={{
                                rotate:
                                  openMenuOrderId === order.id
                                    ? 90
                                    : 0,
                              }}
                              transition={{
                                duration: 0.15,
                              }}
                            >
                              <ChevronRight
                                size={11}
                                strokeWidth={2.3}
                              />
                            </motion.span>
                          </button>
                        );

                        return (
                          <motion.div
                            key={order.id}
                            layout="position"
                            variants={listRow}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{
                              layout: { duration: 0.26, ease: EASE },
                              opacity: { duration: 0.18 },
                              y: { duration: 0.22, ease: EASE },
                            }}
                            className="relative min-w-0"
                          >

                            {/* ==================================================
                                ORDER INFORMATION
                            ================================================== */}

                            <motion.div
                              variants={listRow}
                              onClick={() =>
                                handleOpenDetails(order.id)
                              }
                              className="group min-w-0 cursor-pointer"
                            >

                              {/* ==================================================
                                      MOBILE / TABLET LAYOUT
                                  ================================================== */}

                                  <div className="min-w-0 px-4 py-3.5 sm:px-5 xl:hidden">

                                    {/* ==================================================
                                        CUSTOMER INFORMATION + PRICE
                                    ================================================== */}

                                    <div className="flex min-w-0 items-center gap-3">

                                      {/* Customer avatar */}

                                      <img
                                        src={
                                          hasAvatar
                                            ? order.customer_avatar_url!
                                            : preset.src
                                        }
                                        alt=""
                                        className="h-10 w-10 shrink-0 rounded-full bg-platinum object-cover ring-1 ring-black/[0.04]"
                                        onError={(e) => {
                                          if (
                                            e.currentTarget.src !==
                                            window.location.origin + preset.src
                                          ) {
                                            e.currentTarget.src = preset.src;
                                          }
                                        }}
                                      />

                                      {/* Customer details */}

                                      <div className="min-w-0 flex-1">

                                        <p className="break-words text-[13px] font-semibold leading-5 tracking-[-0.01em] text-accent-dark sm:text-[14px]">
                                          {order.customer_name}
                                        </p>

                                        <p className="mt-0.5 break-words text-[11px] leading-[1.5] text-olive/70 sm:text-[12px]">
                                          {order.summary}
                                        </p>

                                        {eventDateLabel && order.status !== 'refunded' && (
                                          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-medium text-olive/60 sm:text-[11px]">
                                            <Calendar size={12} strokeWidth={1.8} />
                                            {eventDateLabel}
                                          </p>
                                        )}

                                      </div>

                                      {/* ==================================================
                                          PRICE — FAR RIGHT, VERTICALLY CENTERED
                                      ================================================== */}

                                      <div className="max-w-[38%] shrink-0 self-center text-right">

                                        <p className="break-words font-display text-[14px] font-bold leading-5 tracking-[-0.02em] tabular-nums text-accent-dark sm:text-[15px]">
                                          {formatPrice(order.total_amount)}
                                        </p>
                                        {hasRecordedPayment && (
                                          <p className={`mt-1 text-[10px] font-semibold ${paidAmount > order.total_amount ? 'text-rose-600' : 'text-emerald-700'}`}>
                                            {paidAmount > order.total_amount
                                              ? `Overpaid ${formatPrice(paidAmount - order.total_amount)}`
                                              : remainingAmount === 0
                                                ? 'Paid'
                                                : `Paid ${formatPrice(paidAmount)} · Due ${formatPrice(remainingAmount)}`}
                                          </p>
                                        )}

                                      </div>

                                    </div>

                                    {/* ==================================================
                                        MOBILE ACTION ROW
                                        Record payment → Order status → Archive
                                    ================================================== */}

                                    <div className="mt-3 flex min-w-0 items-center gap-2">

                                      {/* LEFT: Record payment */}

                                      <div className="flex min-w-0 flex-1 items-center justify-start">

                                        <AnimatePresence initial={false}>
                                          {showPaymentAction && paymentSheetOrderId !== order.id && (
                                            <motion.button
                                              key="payment-action"
                                              type="button"
                                              initial={{ opacity: 0, scale: 0.96 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              exit={{ opacity: 0, scale: 0.96 }}
                                              transition={{ duration: 0.18, ease: EASE }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuOrderId(null);
                                                setPaymentSheetOrderId(order.id);
                                              }}
                                              className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-full bg-[#F2EDE6]/70 px-2.5 text-[10px] font-semibold text-accent-dark transition-colors duration-150 hover:bg-[#E9E1D7] sm:px-3 sm:text-[11px]"
                                            >
                                              <Wallet size={13} strokeWidth={1.9} className="shrink-0" />
                                              <span className="whitespace-nowrap">{paymentActionLabel}</span>
                                            </motion.button>
                                          )}
                                        </AnimatePresence>

                                      </div>

                                      {/* CENTER: Order status */}

                                      <div className="flex shrink-0 items-center justify-center">
                                        {statusButton}
                                      </div>

                                      {/* RIGHT: Archive button */}

                                      <div className="ml-auto flex shrink-0 items-center justify-end">
                                        {archiveButton}
                                      </div>

                                    </div>

                                  </div>

                              {/* ==================================================
                                  DESKTOP LAYOUT — UNCHANGED
                              ================================================== */}

                              <div className="hidden min-w-0 grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(100px,0.7fr)_minmax(155px,auto)] items-center gap-4 px-5 py-3.5 xl:grid xl:px-6">

                                {/* Customer */}

                                <div className="flex min-w-0 items-center gap-3">
                                  <img
                                    src={
                                      hasAvatar
                                        ? order.customer_avatar_url!
                                        : preset.src
                                    }
                                    alt=""
                                    className="h-9 w-9 shrink-0 rounded-full bg-platinum object-cover ring-1 ring-black/[0.04]"
                                    onError={(e) => {
                                      if (
                                        e.currentTarget.src !==
                                        window.location.origin +
                                          preset.src
                                      ) {
                                        e.currentTarget.src =
                                          preset.src;
                                      }
                                    }}
                                  />

                                  <p className="min-w-0 truncate text-[13px] font-semibold tracking-[-0.01em] text-accent-dark">
                                    {order.customer_name}
                                  </p>
                                </div>

                                {/* Order details */}

                                <div className="min-w-0">
                                  <p className="break-words text-[12px] leading-5 text-accent-dark/85">
                                    {order.summary}
                                  </p>

                                  {eventDateLabel &&
                                    order.status !==
                                      'refunded' && (
                                      <p className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-medium text-olive/60">
                                        <Calendar
                                          size={11}
                                          strokeWidth={1.8}
                                        />

                                        Needed {eventDateLabel}
                                      </p>
                                    )}
                                </div>

                                {/* Total */}

                                <span className="min-w-0 break-words font-display text-[13px] font-bold tabular-nums tracking-[-0.01em] text-accent-dark">
                                  {formatPrice(
                                    order.total_amount
                                  )}
                                  {hasRecordedPayment && (
                                    <span className={`mt-1 block text-[10px] font-semibold ${paidAmount > order.total_amount ? 'text-rose-600' : 'text-emerald-700'}`}>
                                      {paidAmount > order.total_amount
                                        ? `Overpaid ${formatPrice(paidAmount - order.total_amount)}`
                                        : remainingAmount === 0
                                          ? 'Paid'
                                          : `Paid ${formatPrice(paidAmount)} · Due ${formatPrice(remainingAmount)}`}
                                    </span>
                                  )}
                                </span>

                                {/* Status and archive */}

                                <div className="flex min-w-0 items-center justify-end gap-1">
                                  {statusButton}
                                  {archiveButton}
                                </div>

                              </div>

                            </motion.div>

                            {/* ==================================================
                                DESKTOP RECORD PAYMENT ACTION

                                Hidden on mobile/tablet because the
                                mobile payment button is now beside
                                the status button.
                            ================================================== */}

                            {showPaymentAction &&
                              paymentSheetOrderId !==
                                order.id && (
                                <div className="hidden px-4 pb-3 xl:block xl:px-6">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuOrderId(null);

                                      setPaymentSheetOrderId(
                                        order.id
                                      );
                                    }}
                                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#F2EDE6]/70 px-3 text-[11px] font-semibold text-accent-dark transition-colors duration-150 hover:bg-[#E9E1D7] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/20"
                                  >
                                    <Wallet
                                      size={13}
                                      strokeWidth={1.9}
                                    />

                                    {paymentActionLabel}
                                  </button>
                                </div>
                              )}

                            {/* ==================================================
                                PAYMENT SHEET
                            ================================================== */}

                            <AnimatePresence>
                              {paymentSheetOrderId ===
                                order.id && (
                                <RecordPaymentSheet
                                  orderId={order.id}
                                  orderTotal={
                                    order.total_amount
                                  }
                                  onClose={() =>
                                    setPaymentSheetOrderId(
                                      null
                                    )
                                  }
                                  payments={paymentRows}
                                  allowNew={canAddPayment}
                                  onRecorded={async (proofWarning) => {
                                    await loadOrders(true);
                                    setPaymentSheetOrderId(null);
                                    if (proofWarning) setPaymentNotice(proofWarning);
                                  }}
                                />
                              )}
                            </AnimatePresence>

                            {/* ==================================================
                                STATUS TRANSITION OPTIONS
                            ================================================== */}

                            <AnimatePresence>
                              {openMenuOrderId ===
                                order.id && (
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    y: -4,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    y: 0,
                                  }}
                                  exit={{
                                    opacity: 0,
                                    y: -4,
                                  }}
                                  transition={{
                                    duration: 0.18,
                                    ease: EASE,
                                  }}
                                  className="flex flex-wrap gap-2 border-t border-platinum/40 bg-[#FAF8F5] px-4 py-3 sm:px-5 xl:px-6"
                                >
                                  {menuLoading ? (
                                    <span className="text-[11px] text-olive/65">
                                      Loading options…
                                    </span>

                                  ) : menuOptions.length ===
                                    0 ? (
                                    <span className="text-[11px] text-olive/65">
                                      No further status changes available.
                                    </span>

                                  ) : (
                                    menuOptions.map(
                                      (status) => (
                                        <button
                                          key={status}
                                          type="button"
                                          onClick={() =>
                                            handleSelectNextStatus(
                                              order.id,
                                              status
                                            )
                                          }
                                          className="inline-flex min-h-9 items-center justify-center rounded-full bg-accent-dark px-3 text-[11px] font-semibold text-white shadow-[0_2px_6px_rgba(42,35,32,0.10)] transition-all duration-150 hover:bg-accent-dark/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25"
                                        >
                                          Move to{' '}
                                          {STATUS_LABEL[status]}
                                        </button>
                                      )
                                    )
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>

                          </motion.div>
                        );
                      })}
                      </AnimatePresence>
                    </motion.div>
                  </>
                )}

              </motion.section>
            </AnimatePresence>

            {/* ==================================================
                MOBILE FLOATING ACTION BUTTON
            ================================================== */}

            {!showArchived && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 0.3,
                  ease: EASE,
                  delay: 0.35,
                }}
                className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-5 z-20 sm:hidden"
              >
                <Link
                  to="/orders/new"
                  aria-label="New order"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-dark text-white shadow-[0_8px_22px_rgba(42,35,32,0.22)] ring-1 ring-white/10 transition-transform duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 focus-visible:ring-offset-2"
                >
                  <Plus
                    size={20}
                    strokeWidth={2.2}
                  />
                </Link>
              </motion.div>
            )}

          </div>
        </MotionConfig>
      </ScreenShell>

      {/* ==================================================
          ORDER DETAIL MODAL
      ================================================== */}

      <AnimatePresence>
        {selectedOrderId && (
          <OrderDetailModal
            key={selectedOrderId}
            orderId={selectedOrderId}
            onClose={() =>
              setSelectedOrderId(null)
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}