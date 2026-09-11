// File: app/src/screens/DashboardScreen.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ClipboardList, Clock, MessageCircle, ArrowUpRight } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import { Switch } from '../components/ui/Switch';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/currency';
import { fetchShopProfile, setAcceptingOrders } from '../api/shopProfile';
import type { OrderStatus } from '../types/catalog';

/* Motion */
const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
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

/* Types */
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

const STATUS_LABEL: Record<OrderStatus, string> = {
  inquiry:          'Inquiry',
  quote:            'Quote',
  pending_payment:  'Pending payment',
  confirmed:        'Confirmed',
  scheduled:        'Scheduled',
  in_production:    'In production',
  ready:            'Ready',
  completed:        'Completed',
  cancelled:        'Cancelled',
  refunded:         'Refunded',
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  inquiry:          'bg-platinum/60 text-olive',
  quote:            'bg-accent-light/40 text-accent-dark',
  pending_payment:  'bg-amber-50 text-amber-700',
  confirmed:        'bg-accent-light/60 text-accent-dark',
  scheduled:        'bg-blue-50 text-blue-700',
  in_production:    'bg-platinum text-olive',
  ready:            'bg-accent-dark text-white',
  completed:        'bg-green-50 text-green-700',
  cancelled:        'bg-red-50 text-red-600',
  refunded:         'bg-gray-100 text-gray-600',
};

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

/* Screen */
export function DashboardScreen() {
  const { organizationId, session } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    revenueToday: 0,
    pendingPickups: 0,
    unreadMessages: 0,
    completedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [acceptingOrders, setAcceptingOrdersState] = useState(true);
  const [acceptingOrdersLoaded, setAcceptingOrdersLoaded] = useState(false);
  const [togglingAccepting, setTogglingAccepting] = useState(false);

  // Seeded from the sign-up snapshot so the greeting isn't blank on
  // first paint, then overwritten below with the real, current shop
  // name the moment fetchShopProfile resolves — the same source of
  // truth Shop Details reads from and writes to.
  const [shopName, setShopName] = useState<string>(
    session?.user?.user_metadata?.organization_name?.trim() || 'there'
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    if (!organizationId) return;

    async function load() {
      setLoading(true);
      const { start, end } = todayRange();

      const { data: todayOrders } = await supabase
        .from('order_list_view')
        .select('id, customer_name, summary, total_amount, status, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });

      const orders = (todayOrders ?? []) as OrderRow[];

      const revenueToday = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

      const pendingPickups = orders.filter((o) => o.status === 'ready').length;
      const completedOrders = orders.filter((o) => o.status === 'completed').length;

      setStats({
        totalOrders: orders.length,
        revenueToday,
        pendingPickups,
        unreadMessages: 0,
        completedOrders,
      });

      setRecentOrders(orders.slice(0, 4));
      setLoading(false);
    }

    load();
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) return;
    fetchShopProfile(organizationId)
      .then((p) => {
        setAcceptingOrdersState(p.accepting_orders);
        setAcceptingOrdersLoaded(true);
        if (p.name?.trim()) setShopName(p.name.trim());
      })
      .catch((err) => {
        console.error('Failed to load shop status:', err);
        setAcceptingOrdersLoaded(true);
      });
  }, [organizationId]);

  async function handleToggleAccepting() {
    if (!organizationId || togglingAccepting) return;
    const next = !acceptingOrders;
    setAcceptingOrdersState(next);
    setTogglingAccepting(true);
    try {
      await setAcceptingOrders(organizationId, next);
    } catch (err) {
      console.error('Failed to update accepting orders status:', err);
      setAcceptingOrdersState(!next);
    } finally {
      setTogglingAccepting(false);
    }
  }

  const pct =
    stats.totalOrders > 0
      ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
      : 0;

  return (
    <ScreenShell>
      {/* Header */}
      <motion.div
        className="flex items-start justify-between gap-4 mb-4 md:mb-3"
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-widest text-olive uppercase mb-1">Today</p>
          <h1 className="font-display text-[22px] sm:text-[26px] md:text-3xl font-bold tracking-tight text-accent-dark leading-tight truncate">
            {greeting}, {shopName} 👋
          </h1>
        </div>
        <Link
          to="/orders/new"
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-accent-dark text-white px-5 h-11 text-sm font-semibold shadow-control transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97] shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
          New order
        </Link>
      </motion.div>

      {/* Accepting orders status */}
      {!acceptingOrdersLoaded ? (
        <div className="h-[60px] md:h-[52px] rounded-[16px] bg-platinum/60 animate-pulse mb-4 md:mb-3" aria-hidden="true" />
      ) : (
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className={`flex items-center justify-between gap-3 rounded-[16px] px-4 py-3 md:py-2.5 mb-4 md:mb-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-colors duration-200 ${
            acceptingOrders ? 'bg-white' : 'bg-rose-50'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Pulsing ring + solid glowing dot — same "live status" pattern, just recolored per state */}
            <span className="relative flex w-2.5 h-2.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex w-full h-full rounded-full opacity-60 ${
                  acceptingOrders ? 'bg-green-400' : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex w-2.5 h-2.5 rounded-full ${
                  acceptingOrders
                    ? 'bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.22),0_0_10px_3px_rgba(34,197,94,0.65)]'
                    : 'bg-rose-400 shadow-[0_0_0_3px_rgba(251,113,133,0.22),0_0_10px_3px_rgba(251,113,133,0.55)]'
                }`}
              />
            </span>
            <div className="min-w-0">
              <p className={`text-[14px] font-semibold truncate ${acceptingOrders ? 'text-accent-dark' : 'text-rose-700'}`}>
                {acceptingOrders ? 'Accepting orders' : 'Not accepting orders'}
              </p>
              {!acceptingOrders && (
                <p className="text-[12px] text-rose-500 truncate">
                  Customers messaging you will be told you are closed.
                </p>
              )}
            </div>
          </div>
          <Switch
            checked={acceptingOrders}
            onChange={handleToggleAccepting}
            ariaLabel="Accepting orders"
          />
        </motion.div>
      )}

      {/* Hero + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-3 mb-4 md:mb-3">

        {/* Hero revenue card */}
        <motion.div
          custom={2} variants={fadeUp} initial="hidden" animate="visible"
          aria-busy={loading}
          className="lg:col-span-3 relative overflow-hidden rounded-[20px] bg-accent-dark p-6 md:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-14 -right-4 w-64 h-64 rounded-full bg-white/[0.03]" />

          <p className="text-white/60 text-sm font-medium mb-1">Revenue today</p>

          {loading ? (
            <div className="h-10 md:h-9 w-44 bg-white/15 rounded-[8px] animate-pulse mb-5 md:mb-3" aria-hidden="true" />
          ) : (
            <p className="font-display text-4xl md:text-3xl font-bold text-white tracking-tight mb-5 md:mb-3">
              {formatPrice(stats.revenueToday)}
            </p>
          )}

          <div className="h-[3px] w-full rounded-full bg-white/15 overflow-hidden mb-1.5">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
            />
          </div>
          <p className="text-white/50 text-xs font-medium">
            {loading
              ? 'Loading…'
              : `${stats.completedOrders} of ${stats.totalOrders} orders fulfilled · ${pct}% done`}
          </p>
        </motion.div>

        {/* Supporting stats */}
        <div className="lg:col-span-2 grid grid-cols-3 lg:grid-cols-1 gap-3 md:gap-2">
          {[
            { label: 'Orders',   value: stats.totalOrders,    icon: ClipboardList, custom: 3 },
            { label: 'Pending',  value: stats.pendingPickups, icon: Clock,         custom: 4 },
            { label: 'Messages', value: stats.unreadMessages, icon: MessageCircle, custom: 5, to: '/messages' },
          ].map(({ label, value, icon: Icon, custom, to }) => {
            const isLink = Boolean(to);
            const inner = (
              <motion.div
                key={label}
                custom={custom} variants={fadeUp} initial="hidden" animate="visible"
                whileHover={isLink ? { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } : undefined}
                whileTap={isLink ? { scale: 0.97 } : undefined}
                aria-busy={loading}
                className={`bg-white rounded-[16px] p-4 md:p-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col justify-between ${
                  isLink ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-platinum flex items-center justify-center mb-3 md:mb-2">
                  <Icon size={13} className="text-accent-dark" strokeWidth={2} />
                </div>
                <div>
                  {loading ? (
                    <div className="h-5 w-8 bg-platinum/70 rounded animate-pulse mb-1" aria-hidden="true" />
                  ) : (
                    <p className="text-xl md:text-lg font-bold text-accent-dark leading-none mb-0.5 truncate">{value}</p>
                  )}
                  <p className="text-xs text-olive truncate">{label}</p>
                </div>
              </motion.div>
            );
            return to ? (
              <Link
                key={label}
                to={to}
                className="rounded-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/30"
              >
                {inner}
              </Link>
            ) : inner;
          })}
        </div>
      </div>

      {/* Recent orders */}
      <motion.div
        custom={6} variants={fadeUp} initial="hidden" animate="visible"
        className="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-4 pb-3 md:pb-2">
          <h2 className="font-display text-base font-semibold text-accent-dark tracking-tight">
            Recent orders
          </h2>
          <Link
            to="/orders"
            className="inline-flex items-center gap-0.5 text-sm font-semibold text-accent py-2.5 -my-2.5 transition-opacity duration-150 hover:opacity-70"
          >
            View all <ArrowUpRight size={14} strokeWidth={2.5} />
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-platinum/60" aria-busy="true" aria-label="Loading recent orders">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3.5 px-5 md:px-6 py-3.5 md:py-2.5 animate-pulse">
                <div className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-platinum/80 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-platinum/80 rounded w-1/3" />
                  <div className="h-3 bg-platinum/60 rounded w-2/3" />
                </div>
                <div className="h-3 bg-platinum/60 rounded w-16 shrink-0" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2">
            <p className="text-sm text-olive">No orders yet today.</p>
          </div>
        ) : (
          <motion.div
            className="divide-y divide-platinum/60"
            variants={listContainer} initial="hidden" animate="visible"
          >
            {recentOrders.map((order) => (
              <motion.div key={order.id} variants={listRow}>
                <Link
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-3.5 px-5 md:px-6 py-3.5 md:py-2.5 min-h-[56px] md:min-h-[48px] transition-colors duration-150 hover:bg-platinum/10 active:bg-platinum/20"
                >
                  <div className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-accent-light/40 flex items-center justify-center text-[11px] font-bold text-accent-dark shrink-0 tracking-wide">
                    {initials(order.customer_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-accent-dark truncate leading-snug">
                      {order.customer_name}
                    </p>
                    <p className="text-[13px] text-olive truncate">{order.summary}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[15px] font-bold text-accent-dark tabular-nums">
                      {formatPrice(order.total_amount)}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
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