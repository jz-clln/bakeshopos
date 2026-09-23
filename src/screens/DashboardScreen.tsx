// File: app/src/screens/DashboardScreen.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';

import {
  Plus,
  ClipboardList,
  Clock,
  MessageCircle,
  ArrowUpRight,
  Bell,
  Check,
} from 'lucide-react';

import { ScreenShell } from '../components/layout/ScreenShell';
import { Switch } from '../components/ui/Switch';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';

import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/currency';

import {
  fetchShopProfile,
  setAcceptingOrders,
} from '../api/shopProfile';

import { usePushNotifications } from '../hooks/usePushNotifications';
import { useHandoffCount } from '../hooks/useHandoffCount';

import type { OrderStatus } from '../types/catalog';

/* ============================================================
   MOTION
============================================================ */

const SPRING = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
  mass: 0.8,
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
      ...SPRING,
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
      ...SPRING,
    },
  },
};

/* ============================================================
   LOADING SURFACES
============================================================ */

const SHIMMER_LIGHT =
  'bg-[linear-gradient(90deg,rgba(42,35,32,0.07)_25%,rgba(42,35,32,0.14)_37%,rgba(42,35,32,0.07)_63%)] bg-[length:400%_100%] animate-shimmer motion-reduce:animate-none';

const SHIMMER_DARK =
  'bg-[linear-gradient(90deg,rgba(255,255,255,0.09)_25%,rgba(255,255,255,0.20)_37%,rgba(255,255,255,0.09)_63%)] bg-[length:400%_100%] animate-shimmer motion-reduce:animate-none';

/* ============================================================
   TYPES
============================================================ */

interface OrderRow {
  id: string;
  customer_name: string;
  summary: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
}

interface DashboardStats {
  totalOrders: number;
  revenueToday: number;
  pendingPickups: number;
  unreadMessages: number;
  completedOrders: number;
}

/* ============================================================
   ORDER STATUS
============================================================ */

const STATUS_LABEL: Record<OrderStatus, string> = {
  inquiry: 'Inquiry',
  quote: 'Quote',
  confirmed: 'Confirmed',
  in_production: 'In production',
  completed: 'Done',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  inquiry: 'bg-platinum/60 text-olive',
  quote: 'bg-accent-light/40 text-accent-dark',
  confirmed: 'bg-accent-light/60 text-accent-dark',
  in_production: 'bg-platinum text-olive',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
  refunded: 'bg-gray-100 text-gray-600',
};

/* ============================================================
   HELPERS
============================================================ */

function initials(name: string) {
  const p = (name ?? '').trim().split(/\s+/);

  return (
    (p[0]?.[0] ?? '') +
    (p[1]?.[0] ?? '')
  ).toUpperCase();
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/* ============================================================
   DASHBOARD
============================================================ */

export function DashboardScreen() {
  const { organizationId, session } = useAuth();

  const {
    status: pushStatus,
    loading: pushStatusLoading,
  } = usePushNotifications();

  const handoffCount = useHandoffCount(organizationId);

  /* ==========================================================
     STATE
  ========================================================== */

  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    revenueToday: 0,
    pendingPickups: 0,
    unreadMessages: 0,
    completedOrders: 0,
  });

  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [acceptingOrders, setAcceptingOrdersState] =
    useState(true);

  const [acceptingOrdersLoaded, setAcceptingOrdersLoaded] =
    useState(false);

  const [togglingAccepting, setTogglingAccepting] =
    useState(false);

  const [acceptingOrdersError, setAcceptingOrdersError] =
    useState<string | null>(null);

  const [shopName, setShopName] = useState<string>(
    session?.user?.user_metadata?.organization_name?.trim() ||
      'there'
  );

  /* ==========================================================
     GREETING
  ========================================================== */

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? 'Good morning'
      : hour < 17
        ? 'Good afternoon'
        : 'Good evening';

  /* ==========================================================
     DASHBOARD DATA
  ========================================================== */

  useEffect(() => {
    if (!organizationId) return;

    let cancelled = false;

    async function loadDashboardData(): Promise<{
      stats: DashboardStats;
      recentOrders: OrderRow[];
    }> {
      const { start, end } = todayRange();

      const { data: todayOrders } = await supabase
        .from('order_list_view')
        .select(
          'id, customer_name, summary, total_amount, status, created_at'
        )
        .eq('organization_id', organizationId)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', {
          ascending: false,
        });

      const orders = (todayOrders ?? []) as OrderRow[];

      const {
        data: todayPayments,
        error: paymentsError,
      } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('organization_id', organizationId)
        .eq('status', 'verified')
        .gte('verified_at', start)
        .lte('verified_at', end);

      if (paymentsError) {
        console.error(
          "Failed to load today's payments:",
          paymentsError
        );
      }

      const {
        data: refundedOrdersToday,
        error: refundsError,
      } = await supabase
        .from('orders')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('status', 'refunded')
        .gte('updated_at', start)
        .lte('updated_at', end);

      if (refundsError) {
        console.error(
          "Failed to load today's refunds:",
          refundsError
        );
      }

      let refundedAmountToday = 0;

      if (
        refundedOrdersToday &&
        refundedOrdersToday.length > 0
      ) {
        const refundedOrderIds = refundedOrdersToday.map(
          (o) => o.id
        );

        const {
          data: refundedPayments,
          error: refundedPaymentsError,
        } = await supabase
          .from('payments')
          .select('amount_paid')
          .in('order_id', refundedOrderIds)
          .eq('status', 'verified');

        if (refundedPaymentsError) {
          console.error(
            'Failed to load payments for refunded orders:',
            refundedPaymentsError
          );
        } else {
          refundedAmountToday = (
            refundedPayments ?? []
          ).reduce(
            (sum, p) => sum + (p.amount_paid ?? 0),
            0
          );
        }
      }

      const revenueToday =
        (todayPayments ?? []).reduce(
          (sum, p) => sum + (p.amount_paid ?? 0),
          0
        ) - refundedAmountToday;

      const pendingPickups = orders.filter(
        (o) => o.status === 'in_production'
      ).length;

      const completedOrders = orders.filter(
        (o) => o.status === 'completed'
      ).length;

      return {
        stats: {
          totalOrders: orders.length,
          revenueToday,
          pendingPickups,
          unreadMessages: 0,
          completedOrders,
        },

        recentOrders: orders.slice(0, 4),
      };
    }

    /* ========================================================
       REFRESH
    ======================================================== */

    async function refresh(showLoading: boolean) {
      if (showLoading) {
        setLoading(true);
      }

      const result = await loadDashboardData();

      if (cancelled) return;

      setStats(result.stats);

      setRecentOrders(result.recentOrders);

      if (showLoading) {
        setLoading(false);
      }
    }

    refresh(true);

    /* ========================================================
       REALTIME
    ======================================================== */

    let debounceTimer: ReturnType<typeof setTimeout> | null =
      null;

    function scheduleRefresh() {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(
        () => refresh(false),
        400
      );
    }

    const channel = supabase
      .channel(`dashboard-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `organization_id=eq.${organizationId}`,
        },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `organization_id=eq.${organizationId}`,
        },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      cancelled = true;

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  /* ==========================================================
     SHOP PROFILE
  ========================================================== */

  useEffect(() => {
    if (!organizationId) return;

    fetchShopProfile(organizationId)
      .then((p) => {
        setAcceptingOrdersState(p.accepting_orders);

        setAcceptingOrdersLoaded(true);

        if (p.name?.trim()) {
          setShopName(p.name.trim());
        }
      })
      .catch((err) => {
        console.error(
          'Failed to load shop status:',
          err
        );

        setAcceptingOrdersLoaded(true);
      });
  }, [organizationId]);

  /* ==========================================================
     ACCEPTING ORDERS
  ========================================================== */

  async function handleToggleAccepting() {
    if (!organizationId || togglingAccepting) return;

    const next = !acceptingOrders;

    setAcceptingOrdersState(next);

    setAcceptingOrdersError(null);

    setTogglingAccepting(true);

    try {
      await setAcceptingOrders(
        organizationId,
        next
      );
    } catch (err) {
      console.error(
        'Failed to update accepting orders status:',
        err
      );

      setAcceptingOrdersState(!next);

      setAcceptingOrdersError(
        err instanceof Error
          ? err.message
          : 'Could not update. Please try again.'
      );
    } finally {
      setTogglingAccepting(false);
    }
  }

  /* ==========================================================
     FULFILLMENT
  ========================================================== */

  const pct =
    stats.totalOrders > 0
      ? Math.round(
          (stats.completedOrders / stats.totalOrders) * 100
        )
      : 0;

  /* ==========================================================
     VIEW
  ========================================================== */

  return (
    <ScreenShell>
      <MotionConfig reducedMotion="user">
        <div className="mx-auto w-full min-w-0 max-w-[1320px] pb-5">

          {/* ==================================================
              HEADER
          ================================================== */}

          <motion.header
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-4 flex items-start justify-between gap-3 sm:mb-5"
          >

            {/* Greeting */}

            <div className="min-w-0 flex-1">

              <div className="mb-1.5 flex items-center gap-2">

                <span className="h-1 w-1 shrink-0 rounded-full bg-accent-dark/45" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-olive/65">
                  Your overview
                </span>

              </div>

              <h1 className="max-w-full font-display text-[20px] font-bold leading-[1.2] tracking-[-0.035em] text-accent-dark sm:text-[23px] lg:overflow-hidden lg:text-ellipsis lg:whitespace-nowrap lg:text-[clamp(18px,1.8vw,26px)]">

                {greeting},{' '}

                <span className="block lg:inline">
                  {shopName}
                </span>

              </h1>

            </div>

            {/* Header actions */}

            <div className="flex shrink-0 items-center gap-2 pt-0.5">

              {/* Notifications */}

              <Link
                to={
                  handoffCount > 0
                    ? '/messages'
                    : '/settings/notifications'
                }
                aria-label={
                  handoffCount > 0
                    ? `${handoffCount} conversations need you`
                    : 'Notifications'
                }
                className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-platinum/60 bg-white text-olive shadow-[0_2px_8px_rgba(0,0,0,0.035)] transition-all duration-150 hover:bg-platinum/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25"
              >

                <Bell
                  size={16}
                  strokeWidth={1.8}
                />

                {handoffCount > 0 ? (

                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {handoffCount > 9
                      ? '9+'
                      : handoffCount}
                  </span>

                ) : (

                  !pushStatusLoading &&
                  pushStatus !== 'on' && (

                    <span className="absolute right-[8px] top-[7px] h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />

                  )

                )}

              </Link>

              {/* Desktop new order */}

              <Link
                to="/orders/new"
                className="hidden h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent-dark px-4 text-[12px] font-semibold text-white shadow-[0_3px_10px_rgba(42,35,32,0.13)] transition-all duration-150 hover:bg-accent-dark/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 focus-visible:ring-offset-2 sm:inline-flex"
              >

                <Plus
                  size={14}
                  strokeWidth={2.2}
                />

                New order

              </Link>

            </div>

          </motion.header>

          {/* ==================================================
              SHOP AVAILABILITY
          ================================================== */}

          <div className="mb-3">

            {!acceptingOrdersLoaded ? (

              <div
                aria-hidden="true"
                className="rounded-[16px] border border-platinum/60 bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.025)]"
              >

                <div className="flex items-center justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-2.5">

                    <span
                      className={`h-8 w-8 shrink-0 rounded-[10px] ${SHIMMER_LIGHT}`}
                    />

                    <div className="space-y-1.5">

                      <div
                        className={`h-3 w-28 rounded-full ${SHIMMER_LIGHT}`}
                      />

                      <div
                        className={`h-2 w-24 rounded-full ${SHIMMER_LIGHT}`}
                      />

                    </div>

                  </div>

                  <span
                    className={`h-6 w-11 shrink-0 rounded-full ${SHIMMER_LIGHT}`}
                  />

                </div>

              </div>

            ) : (

              <motion.div
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className={`overflow-hidden rounded-[16px] border px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.025)] transition-colors duration-200 ${
                  acceptingOrders
                    ? 'border-platinum/60 bg-white'
                    : 'border-rose-200/70 bg-rose-50/60'
                }`}
              >

                <div className="flex items-center justify-between gap-3">

                  {/* Status information */}

                  <div className="flex min-w-0 items-center gap-2.5">

                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${
                        acceptingOrders
                          ? 'bg-emerald-50'
                          : 'bg-rose-100'
                      }`}
                    >

                      <span
                        className={`relative flex h-2 w-2 rounded-full ${
                          acceptingOrders
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                      >

                        <span
                          className={`absolute inset-0 rounded-full opacity-30 motion-safe:animate-ping ${
                            acceptingOrders
                              ? 'bg-emerald-500'
                              : 'bg-rose-500'
                          }`}
                        />

                      </span>

                    </div>

                    <div className="min-w-0">

                      <p
                        className={`text-[12px] font-semibold leading-4 ${
                          acceptingOrders
                            ? 'text-accent-dark'
                            : 'text-rose-700'
                        }`}
                      >
                        {acceptingOrders
                          ? 'Accepting orders'
                          : 'Not accepting orders'}
                      </p>

                      <p
                        className={`mt-0.5 text-[10px] leading-4 ${
                          acceptingOrders
                            ? 'text-olive/55'
                            : 'text-rose-600/75'
                        }`}
                      >
                        {acceptingOrders
                          ? 'Your shop is open for business.'
                          : 'Customers messaging you will be told you are closed.'}
                      </p>

                    </div>

                  </div>

                  {/* Availability switch */}

                  <div className="shrink-0">

                    <Switch
                      checked={acceptingOrders}
                      onChange={handleToggleAccepting}
                      ariaLabel="Accepting orders"
                    />

                  </div>

                </div>

                {acceptingOrdersError && (

                  <p className="mt-2.5 border-t border-rose-200/70 pt-2.5 text-[11px] leading-4 text-red-600">
                    {acceptingOrdersError}
                  </p>

                )}

              </motion.div>

            )}

          </div>

          {/* ==================================================
              PRIMARY DASHBOARD

              Revenue: compact full-width hero.
              Metrics: three cards on one row at every screen size.
          ================================================== */}

          <div className="mb-3 flex min-w-0 flex-col gap-3">

            {/* ==================================================
                REVENUE HERO
            ================================================== */}

            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              aria-busy={loading}
              className="relative isolate min-w-0 overflow-hidden rounded-[20px] bg-accent-dark px-4 py-4 text-white shadow-[0_8px_24px_rgba(42,35,32,0.13)] sm:px-5 sm:py-4"
            >

              {/* Subtle decorative lighting */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/[0.035] blur-[50px]"
              />

              {/* Top row */}

              <div className="relative flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-white/45">
                    Financial overview
                  </p>

                  <h2 className="mt-1 font-display text-[12px] font-semibold tracking-[-0.01em] text-white/90 sm:text-[13px]">
                    Revenue today
                  </h2>

                </div>

                {/* Today indicator */}

                <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                  <span className="text-[9px] font-semibold text-white/75">
                    Today
                  </span>

                </div>

              </div>

              {/* ==================================================
                  REVENUE AMOUNT

                  Reduced vertical spacing.
              ================================================== */}

              <div className="relative mb-3 mt-3 min-w-0 sm:mb-4 sm:mt-4">

                {loading ? (

                  <div
                    aria-hidden="true"
                    className={`h-9 w-36 max-w-full rounded-[8px] sm:h-10 sm:w-44 ${SHIMMER_DARK}`}
                  />

                ) : (

                  <p className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-display text-[clamp(1.75rem,5vw,2.625rem)] font-bold leading-[1.1] tracking-[-0.04em] text-white">
                    <AnimatedNumber
                      value={stats.revenueToday}
                      format={formatPrice}
                    />
                  </p>

                )}

                <p className="mt-1.5 text-[10px] font-medium leading-4 text-white/45">
                  Verified payments less refunds
                </p>

              </div>

              {/* ==================================================
                  FULFILLMENT
              ================================================== */}

              <div className="relative border-t border-white/10 pt-3">

                <div className="mb-2 flex items-center justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-2">

                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.09]">

                      <Check
                        size={11}
                        strokeWidth={2.2}
                        className="text-white/75"
                      />

                    </div>

                    <span className="text-[10px] font-medium text-white/60">
                      Order fulfillment
                    </span>

                  </div>

                  {loading ? (

                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-7 shrink-0 rounded-full ${SHIMMER_DARK}`}
                    />

                  ) : (

                    <span className="shrink-0 text-[10px] font-semibold tabular-nums text-white/85">
                      {pct}%
                    </span>

                  )}

                </div>

                {/* Progress track */}

                <div className="h-[4px] w-full overflow-hidden rounded-full bg-white/[0.13]">

                  <motion.div
                    className="h-full rounded-full bg-white"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${pct}%`,
                    }}
                    transition={{
                      ...SPRING,
                      delay: loading ? 0.3 : 0,
                    }}
                  />

                </div>

                {/* Progress caption */}

                {loading ? (

                  <div
                    aria-hidden="true"
                    className={`mt-2 h-2.5 w-32 max-w-full rounded-full ${SHIMMER_DARK}`}
                  />

                ) : (

                  <p className="mt-2 text-[10px] leading-4 text-white/45">
                    {stats.completedOrders} of {stats.totalOrders}{' '}
                    orders completed today
                  </p>

                )}

              </div>

            </motion.div>

            {/* ==================================================
                SUPPORTING METRICS

                Always three columns:
                Orders | Pending | Messages

                Compact on mobile, roomier on desktop.
            ================================================== */}

            <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">

              {[
                {
                  label: 'Orders',
                  description: 'Total today',
                  value: stats.totalOrders,
                  icon: ClipboardList,
                  custom: 3,
                  to: undefined,
                },
                {
                  label: 'Pending',
                  description: 'In production',
                  value: stats.pendingPickups,
                  icon: Clock,
                  custom: 4,
                  to: undefined,
                },
                {
                  label: 'Messages',
                  description: 'Unread messages',
                  value: stats.unreadMessages,
                  icon: MessageCircle,
                  custom: 5,
                  to: '/messages',
                },
              ].map(
                ({
                  label,
                  description,
                  value,
                  icon: Icon,
                  custom,
                  to,
                }) => {

                  const isLink = Boolean(to);

                  const inner = (

                    <motion.div
                      custom={custom}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      aria-busy={loading}
                      className={`group flex h-full min-w-0 flex-col rounded-[16px] border border-platinum/60 bg-white p-2.5 shadow-[0_2px_10px_rgba(42,35,32,0.035)] sm:rounded-[18px] sm:p-4 md:flex-row md:items-center md:gap-3 ${
                        isLink
                          ? 'cursor-pointer transition-shadow duration-150 hover:shadow-[0_4px_14px_rgba(42,35,32,0.07)]'
                          : 'cursor-default'
                      }`}
                    >

                      {/* Icon */}

                      <div className="mb-2 flex min-w-0 items-center justify-between md:mb-0">

                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#F2EDE6] text-accent-dark sm:h-8 sm:w-8 sm:rounded-[10px]">

                          <Icon
                            size={14}
                            strokeWidth={1.8}
                          />

                        </div>

                        {isLink && (

                          <ArrowUpRight
                            size={11}
                            strokeWidth={2}
                            className="shrink-0 text-olive/40 md:hidden"
                          />

                        )}

                      </div>

                      {/* Value and label */}

                      <div className="min-w-0 flex-1">

                        {loading ? (

                          <div
                            aria-hidden="true"
                            className={`mb-1 h-5 w-7 max-w-full rounded-[5px] ${SHIMMER_LIGHT}`}
                          />

                        ) : (

                          <p className="min-w-0 truncate font-display text-[19px] font-bold leading-none tracking-[-0.03em] tabular-nums text-accent-dark sm:text-[21px]">
                            <AnimatedNumber
                              value={value}
                            />
                          </p>

                        )}

                        <p className="mt-1 truncate text-[10px] font-semibold leading-4 text-accent-dark sm:text-[12px]">
                          {label}
                        </p>

                        {/* Hidden on narrow phones to keep
                            all three cards comfortably on one row. */}

                        <p className="mt-0.5 hidden truncate text-[10px] leading-4 text-olive/50 sm:block">
                          {description}
                        </p>

                      </div>

                      {/* Desktop link indicator */}

                      {isLink && (

                        <ArrowUpRight
                          size={13}
                          strokeWidth={1.8}
                          className="hidden shrink-0 text-olive/35 lg:block"
                        />

                      )}

                    </motion.div>

                  );

                  return to ? (

                    <Link
                      key={label}
                      to={to}
                      className="block h-full min-w-0 rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25"
                    >
                      {inner}
                    </Link>

                  ) : (

                    <div
                      key={label}
                      className="h-full min-w-0"
                    >
                      {inner}
                    </div>

                  );

                }
              )}

            </div>

          </div>

          {/* ==================================================
              RECENT ORDERS
          ================================================== */}

          <motion.section
            custom={6}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="min-w-0 overflow-hidden rounded-[20px] border border-platinum/60 bg-white shadow-[0_3px_14px_rgba(0,0,0,0.03)]"
          >

            {/* Section header */}

            <div className="flex min-h-[62px] items-center justify-between gap-3 px-4 py-3 sm:px-5">

              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <h2 className="font-display text-[14px] font-semibold tracking-[-0.02em] text-accent-dark">
                    Recent orders
                  </h2>

                  <span
                    className="relative flex h-1.5 w-1.5 shrink-0"
                    title="Live"
                  >

                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 motion-safe:animate-ping" />

                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  </span>

                </div>

                <p className="mt-0.5 text-[10px] text-olive/55">
                  Your latest activity today
                </p>

              </div>

              {/* View all */}

              <Link
                to="/orders"
                className="group inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1 rounded-full px-2 text-[11px] font-semibold text-accent-dark transition-colors duration-150 hover:bg-platinum/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/20"
              >

                View all

                <ArrowUpRight
                  size={12}
                  strokeWidth={2}
                  className="text-olive/60 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />

              </Link>

            </div>

            {/* Divider */}

            <div className="h-px bg-platinum/50" />

            {/* ==================================================
                LOADING
            ================================================== */}

            {loading ? (

              <div
                className="divide-y divide-platinum/45"
                aria-busy="true"
                aria-label="Loading recent orders"
              >

                {[0, 1, 2, 3].map((i) => (

                  <div
                    key={i}
                    className="flex min-h-[64px] items-center gap-3 px-4 py-2.5 sm:px-5"
                  >

                    <div
                      className={`h-9 w-9 shrink-0 rounded-[11px] ${SHIMMER_LIGHT}`}
                    />

                    <div className="min-w-0 flex-1 space-y-1.5">

                      <div
                        className={`h-2.5 w-24 max-w-full rounded-full ${SHIMMER_LIGHT}`}
                      />

                      <div
                        className={`h-2 w-36 max-w-full rounded-full ${SHIMMER_LIGHT}`}
                      />

                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">

                      <div
                        className={`h-2.5 w-14 rounded-full ${SHIMMER_LIGHT}`}
                      />

                      <div
                        className={`h-4 w-12 rounded-full ${SHIMMER_LIGHT}`}
                      />

                    </div>

                  </div>

                ))}

              </div>

            ) : recentOrders.length === 0 ? (

              /* Empty state */

              <div className="flex min-h-[160px] flex-col items-center justify-center px-4 py-7 text-center">

                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[12px] bg-platinum/40">

                  <ClipboardList
                    size={17}
                    strokeWidth={1.7}
                    className="text-olive"
                  />

                </div>

                <h3 className="font-display text-[13px] font-semibold text-accent-dark">
                  A quiet start
                </h3>

                <p className="mt-1 max-w-[240px] text-[11px] leading-4 text-olive/60">
                  Your orders for today will appear here as they come in.
                </p>

                <Link
                  to="/orders/new"
                  className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-accent-dark px-4 text-[11px] font-semibold text-white transition-colors duration-150 hover:bg-accent-dark/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25"
                >

                  <Plus
                    size={13}
                    strokeWidth={2.2}
                  />

                  New order

                </Link>

              </div>

            ) : (

              /* ==================================================
                  ORDER LIST
              ================================================== */

              <motion.div
                className="divide-y divide-platinum/45"
                variants={listContainer}
                initial="hidden"
                animate="visible"
              >

                {recentOrders.map((order) => (

                  <motion.div
                    key={order.id}
                    variants={listRow}
                    whileTap={{
                      scale: 0.99,
                    }}
                  >

                    <Link
                      to={`/orders?open=${order.id}`}
                      className="group flex min-h-[64px] items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-platinum/[0.12] active:bg-platinum/20 focus-visible:outline-none focus-visible:bg-platinum/25 sm:px-5"
                    >

                      {/* Customer avatar */}

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-accent-light/35 text-[10px] font-bold tracking-[0.03em] text-accent-dark">

                        {initials(order.customer_name)}

                      </div>

                      {/* Customer information */}

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-[12px] font-semibold leading-4 text-accent-dark sm:text-[13px]">
                          {order.customer_name}
                        </p>

                        <p className="mt-0.5 truncate text-[10px] leading-4 text-olive/60 sm:text-[11px]">
                          {order.summary}
                        </p>

                      </div>

                      {/* Price and status */}

                      <div className="flex min-w-0 max-w-[45%] shrink-0 flex-col items-end gap-1 sm:max-w-none">

                        <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-bold tracking-[-0.01em] tabular-nums text-accent-dark sm:text-[13px]">
                          {formatPrice(order.total_amount)}
                        </span>

                        <span
                          className={`max-w-full truncate rounded-full px-2 py-0.5 text-[9px] font-semibold leading-4 ${STATUS_STYLES[order.status]}`}
                        >
                          {STATUS_LABEL[order.status]}
                        </span>

                      </div>

                      {/* Desktop navigation */}

                      <ArrowUpRight
                        size={13}
                        strokeWidth={1.8}
                        className="hidden shrink-0 text-olive/0 transition-all duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-olive/40 md:block"
                      />

                    </Link>

                  </motion.div>

                ))}

              </motion.div>

            )}

          </motion.section>

          {/* ==================================================
              MOBILE FLOATING ACTION BUTTON
          ================================================== */}

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
              ...SPRING,
              delay: 0.4,
            }}
            className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-5 z-20 sm:hidden"
          >

            <Link
              to="/orders/new"
              aria-label="New order"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-dark text-white shadow-[0_8px_22px_rgba(42,35,32,0.22)] ring-1 ring-white/10 transition-transform duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/30 focus-visible:ring-offset-2"
            >

              <Plus
                size={20}
                strokeWidth={2.2}
              />

            </Link>

          </motion.div>

        </div>
      </MotionConfig>
    </ScreenShell>
  );
}