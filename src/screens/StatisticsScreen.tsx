import { useEffect, useState } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import { TrendingUp, Package, PieChart, RefreshCw, WifiOff } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/currency';
import type { OrderStatus } from '../types/catalog';

const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.26, ease: EASE, delay: i * 0.06 },
  }),
};

const SHIMMER_LIGHT =
  'bg-[linear-gradient(90deg,rgba(42,35,32,0.07)_25%,rgba(42,35,32,0.14)_37%,rgba(42,35,32,0.07)_63%)] bg-[length:400%_100%] animate-shimmer motion-reduce:animate-none';

const SHIMMER_DARK =
  'bg-[linear-gradient(90deg,rgba(255,255,255,0.09)_25%,rgba(255,255,255,0.20)_37%,rgba(255,255,255,0.09)_63%)] bg-[length:400%_100%] animate-shimmer motion-reduce:animate-none';

// Match the Orders screen, where these statuses are managed.
const STATUS_LABEL: Record<OrderStatus, string> = {
  inquiry: 'Inquiry',
  quote: 'Quote sent',
  confirmed: 'Confirmed',
  in_production: 'In production',
  completed: 'Done',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_DOT_COLOR: Record<OrderStatus, string> = {
  inquiry: 'bg-olive/50',
  quote: 'bg-accent-light',
  confirmed: 'bg-accent',
  in_production: 'bg-accent-dark',
  completed: 'bg-emerald-500',
  cancelled: 'bg-rose-400',
  refunded: 'bg-rose-400',
};

type RangeValue = 7 | 30;

interface DayBucket {
  dateKey: string;
  date: Date;
  amountCentavos: number;
}

interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  orderValueCentavos: number;
}

interface ProductItem {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
  unit_price_amount: number;
  products: { name: string } | null;
  product_variants: { name: string } | null;
  orders: {
    total_amount: number;
    payments: { amount_paid: number; status: string }[];
  };
}

function toDateKey(d: Date): string {
  // Local calendar day, not UTC — these are all real timestamptz
  // values (unlike the bare event_date strings elsewhere in the app
  // that need the UTC-midnight workaround), so getFullYear/getMonth/
  // getDate already give the correct local day with no shifting.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function StatisticsScreen() {
  const { organizationId } = useAuth();
  const [range, setRange] = useState<RangeValue>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const [revenueByDay, setRevenueByDay] = useState<DayBucket[]>([]);
  const [totalRevenueCentavos, setTotalRevenueCentavos] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [statusCounts, setStatusCounts] = useState<Partial<Record<OrderStatus, number>>>({});
  const [totalOrdersInRange, setTotalOrdersInRange] = useState(0);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);

      const today = startOfDay(new Date());
      const since = new Date(today);
      since.setDate(since.getDate() - (range - 1));
      const sinceIso = since.toISOString();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const untilIso = tomorrow.toISOString();

      try {
        const [ordersRes, itemsRes, paymentsRes, refundedOrdersRes] = await Promise.all([
          supabase
            .from('orders')
            .select('id, status, created_at')
            .eq('organization_id', organizationId)
            .gte('created_at', sinceIso)
            .lt('created_at', untilIso),
          supabase
            .from('order_items')
            .select('id, product_id, variant_id, quantity, unit_price_amount, products(name), product_variants(name), orders!inner(total_amount, created_at, status, payments(amount_paid, status))')
            .eq('organization_id', organizationId)
            .in('orders.status', ['confirmed', 'in_production', 'completed'])
            .gte('orders.created_at', sinceIso)
            .lt('orders.created_at', untilIso),
          supabase
            .from('payments')
            .select('amount_paid, verified_at')
            .eq('organization_id', organizationId)
            .eq('status', 'verified')
            .gte('verified_at', sinceIso)
            .lt('verified_at', untilIso),
          supabase
            .from('orders')
            .select('id, updated_at')
            .eq('organization_id', organizationId)
            .eq('status', 'refunded')
            .gte('updated_at', sinceIso)
            .lt('updated_at', untilIso),
        ]);

        if (ordersRes.error) throw ordersRes.error;
        if (itemsRes.error) throw itemsRes.error;
        if (paymentsRes.error) throw paymentsRes.error;
        if (refundedOrdersRes.error) throw refundedOrdersRes.error;

        // Refunded orders' verified payments — same logic Dashboard
        // uses: whatever was verified-paid on an order that got
        // refunded during this window counts against the day the
        // refund happened, not the day the payment was originally
        // verified.
        const refundedOrders = refundedOrdersRes.data ?? [];
        const refundedPaymentByOrderId = new Map<string, number>();
        if (refundedOrders.length > 0) {
          const { data: refundedPayments, error: refundedPaymentsError } = await supabase
            .from('payments')
            .select('order_id, amount_paid')
            .eq('organization_id', organizationId)
            .in('order_id', refundedOrders.map((o) => o.id))
            .eq('status', 'verified');
          if (refundedPaymentsError) throw refundedPaymentsError;
          for (const p of refundedPayments ?? []) {
            refundedPaymentByOrderId.set(p.order_id, (refundedPaymentByOrderId.get(p.order_id) ?? 0) + (p.amount_paid ?? 0));
          }
        }

        // Pre-seed every day in the range with 0 so days with no
        // activity still show up as a (zero-height) bar in the right
        // chronological position.
        const buckets = new Map<string, DayBucket>();
        for (let i = 0; i < range; i++) {
          const d = new Date(since);
          d.setDate(d.getDate() + i);
          const key = toDateKey(d);
          buckets.set(key, { dateKey: key, date: d, amountCentavos: 0 });
        }

        for (const p of paymentsRes.data ?? []) {
          if (!p.verified_at) continue;
          const key = toDateKey(new Date(p.verified_at));
          const bucket = buckets.get(key);
          if (bucket) bucket.amountCentavos += p.amount_paid ?? 0;
        }

        for (const o of refundedOrders) {
          const key = toDateKey(new Date(o.updated_at));
          const bucket = buckets.get(key);
          const refundedAmount = refundedPaymentByOrderId.get(o.id) ?? 0;
          if (bucket) bucket.amountCentavos -= refundedAmount;
        }

        const dayBuckets = [...buckets.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
        const total = dayBuckets.reduce((sum, b) => sum + b.amountCentavos, 0);

        // Product value is a separate metric from cash revenue: only fully
        // paid, non-cancelled orders placed in the selected period qualify.
        // Group by stable IDs so equally named products stay separate.
        const productMap = new Map<string, TopProduct>();
        for (const item of (itemsRes.data ?? []) as unknown as ProductItem[]) {
          const paid = item.orders.payments
            .filter((payment) => payment.status === 'verified')
            .reduce((sum, payment) => sum + (payment.amount_paid ?? 0), 0);
          if (paid <= 0 || paid < item.orders.total_amount) continue;
          const productName = item.products?.name ?? 'Deleted product';
          const variantName = item.product_variants?.name ?? '';
          const name = variantName ? `${productName} (${variantName})` : productName;
          const key = `${item.product_id ?? item.id}:${item.variant_id ?? ''}`;
          const existing = productMap.get(key) ?? { id: key, name, quantity: 0, orderValueCentavos: 0 };
          existing.quantity += item.quantity ?? 0;
          existing.orderValueCentavos += (item.quantity ?? 0) * (item.unit_price_amount ?? 0);
          productMap.set(key, existing);
        }
        const topFive = [...productMap.values()].sort((a, b) => b.orderValueCentavos - a.orderValueCentavos).slice(0, 5);

        const counts: Partial<Record<OrderStatus, number>> = {};
        for (const o of ordersRes.data ?? []) {
          counts[o.status as OrderStatus] = (counts[o.status as OrderStatus] ?? 0) + 1;
        }

        if (cancelled) return;
        setRevenueByDay(dayBuckets);
        setTotalRevenueCentavos(total);
        setTopProducts(topFive);
        setStatusCounts(counts);
        setTotalOrdersInRange((ordersRes.data ?? []).length);
      } catch (err) {
        console.error('Failed to load statistics:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [organizationId, range, retryKey]);

  const maxDayAmount = Math.max(1, ...revenueByDay.map((b) => Math.abs(b.amountCentavos)));
  const hasNegativeRevenue = revenueByDay.some((bucket) => bucket.amountCentavos < 0);
  // Sparse date labels under the bars — every day for the 7-day view,
  // roughly every 5th day for the 30-day view, so labels never
  // overlap regardless of range.
  const labelEvery = range === 7 ? 1 : 5;

  const statusEntries = (Object.keys(statusCounts) as OrderStatus[])
    .filter((s) => (statusCounts[s] ?? 0) > 0)
    .sort((a, b) => (statusCounts[b] ?? 0) - (statusCounts[a] ?? 0));

  return (
    <ScreenShell>
      <MotionConfig reducedMotion="user">
        <div className="mx-auto w-full min-w-0 max-w-[1200px] pb-6">
          <motion.div
            custom={0} variants={fadeUp} initial="hidden" animate="visible"
            className="mb-5 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[23px] font-bold leading-tight tracking-[-0.035em] text-accent-dark sm:text-[26px]">
                Statistics
              </h1>
              <p className="mt-1 text-[11px] font-medium text-olive/60 sm:text-[12px]">How your shop's been doing</p>
            </div>
            <div role="group" aria-label="Statistics date range" className="inline-flex gap-1 p-1 rounded-full bg-platinum/40 shrink-0">
              {([7, 30] as RangeValue[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={range === value}
                  onClick={() => {
                    if (range === value) return;
                    setLoading(true);
                    setError(false);
                    setRange(value);
                  }}
                  className={`relative px-3 h-10 rounded-full text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 font-semibold whitespace-nowrap transition-colors duration-200 ${
                    range === value ? 'text-accent-dark' : 'text-olive hover:text-accent-dark/80'
                  }`}
                >
                  {range === value && (
                    <motion.span
                      layoutId="statsRangePill"
                      className="absolute inset-0 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{value} days</span>
                </button>
              ))}
            </div>
          </motion.div>

          {error ? (
            <div role="alert" className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] min-h-[220px] py-8 flex flex-col items-center justify-center text-center px-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-platinum/40"><WifiOff size={19} className="text-olive" /></div>
              <p className="text-[13px] font-semibold text-accent-dark">Couldn't load statistics</p>
              <p className="mt-1 text-[11px] leading-5 text-olive/60">Check your connection and try again.</p>
              <button type="button" onClick={() => { setLoading(true); setError(false); setRetryKey((key) => key + 1); }} className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#F2EDE6] px-4 text-[12px] font-semibold text-accent-dark transition-colors hover:bg-[#E9E1D7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25">
                <RefreshCw size={14} /> Try again
              </button>
            </div>
          ) : (
            <div aria-busy={loading} className="flex flex-col gap-4">
              {/* Revenue trend hero — same dark-card language as
                  DashboardScreen's revenue hero, so this page feels
                  like part of the same app rather than a bolted-on
                  screen. */}
              <motion.div
                custom={1} variants={fadeUp} initial="hidden" animate="visible"
                className="relative isolate overflow-hidden rounded-[20px] bg-accent-dark px-5 py-5 text-white shadow-[0_8px_24px_rgba(42,35,32,0.13)]"
              >
                <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/[0.035] blur-[50px]" />

                <div className="relative flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-white/60" />
                  <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-white/45">
                    Revenue, last {range} days
                  </p>
                </div>

                {loading ? (
                  <div className={`relative h-9 w-40 rounded-[8px] ${SHIMMER_DARK}`} />
                ) : (
                  <p className="relative break-words font-display text-[clamp(1.75rem,5vw,2.625rem)] font-bold leading-[1.1] tracking-[-0.04em] text-white">
                    {formatPrice(totalRevenueCentavos)}
                  </p>
                )}
                <p className="relative mt-1.5 text-[10px] font-medium text-white/45">
                  Verified payments less refunds — same figure Dashboard uses
                </p>

                {/* Bar chart */}
                <div className="relative mt-5">
                  {loading ? (
                    <div className={`h-24 rounded-[10px] ${SHIMMER_DARK}`} />
                  ) : (
                    <>
                      <div className="relative flex gap-[3px] h-24" role="group" aria-label="Daily net revenue">
                        <div aria-hidden="true" className="absolute inset-x-0 border-t border-white/20" style={{ top: hasNegativeRevenue ? '50%' : '100%' }} />
                        {revenueByDay.map((bucket, i) => {
                          const isNegative = bucket.amountCentavos < 0;
                          const heightPct = (Math.abs(bucket.amountCentavos) / maxDayAmount) * (hasNegativeRevenue ? 50 : 100);
                          const label = `${bucket.date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}: ${formatPrice(bucket.amountCentavos)}`;
                          return (
                            <div key={bucket.dateKey} tabIndex={0} aria-label={label} title={label} className="relative flex-1 min-w-0 h-full rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPct}%` }}
                                transition={{ duration: 0.4, ease: EASE, delay: Math.min(i * 0.01, 0.3) }}
                                className={`absolute w-full ${isNegative ? 'rounded-b-[3px] bg-rose-400/80' : 'rounded-t-[3px] bg-white/85'}`}
                                style={isNegative ? { top: '50%' } : { bottom: hasNegativeRevenue ? '50%' : 0 }}
                                title={`${bucket.date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}: ${formatPrice(bucket.amountCentavos)}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-[3px] mt-1.5" aria-hidden="true">
                        {revenueByDay.map((bucket, i) => (
                          <div key={bucket.dateKey} className="flex-1 min-w-0 text-center">
                            {i % labelEvery === 0 && (
                              <span className="text-[9px] text-white/40 whitespace-nowrap">
                                {range === 7
                                  ? bucket.date.toLocaleDateString('en-PH', { weekday: 'short' })
                                  : bucket.date.toLocaleDateString('en-PH', { day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-[10px] text-white/60">
                        {revenueByDay[0]?.date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        {' ? '}{revenueByDay[revenueByDay.length - 1]?.date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        {hasNegativeRevenue && ' ? Bars below zero show net refunds.'}
                      </p>
                      {revenueByDay.every((bucket) => bucket.amountCentavos === 0) && (
                        <p className="mt-2 text-[12px] text-white/60">No net revenue in this period.</p>
                      )}
                    </>
                  )}
                </div>
              </motion.div>

              {/* Top products + orders by status — stacked on mobile,
                  side by side on larger screens. */}
              <div className="grid md:grid-cols-2 gap-4">
                <motion.div
                  custom={2} variants={fadeUp} initial="hidden" animate="visible"
                  className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-5 py-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-[10px] bg-accent-light/30 flex items-center justify-center shrink-0">
                      <Package size={16} className="text-accent-dark" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-accent-dark">Top products</p>
                      <p className="text-[12px] text-olive">By paid order value</p>
                      <p className="text-[11px] text-olive/60">Orders placed in the last {range} days; excludes cancellations and refunds.</p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className={`h-10 rounded-[10px] ${SHIMMER_LIGHT}`} />
                      ))}
                    </div>
                  ) : topProducts.length === 0 ? (
                    <p className="text-[13px] text-olive py-6 text-center">No fully paid orders in this period yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {topProducts.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-platinum flex items-center justify-center text-[11px] font-bold text-olive shrink-0">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-accent-dark truncate">{p.name}</p>
                            <p className="text-[11px] text-olive">{p.quantity} paid {p.quantity === 1 ? 'item' : 'items'}</p>
                          </div>
                          <span className="text-[13px] font-semibold text-accent-dark tabular-nums shrink-0">
                            {formatPrice(p.orderValueCentavos)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                <motion.div
                  custom={3} variants={fadeUp} initial="hidden" animate="visible"
                  className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-5 py-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-[10px] bg-accent-light/30 flex items-center justify-center shrink-0">
                      <PieChart size={16} className="text-accent-dark" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-accent-dark">Orders by status</p>
                      {loading ? (
                        <div aria-label="Loading order count" className={`mt-1 h-3 w-32 rounded-full ${SHIMMER_LIGHT}`} />
                      ) : (
                        <p className="text-[12px] text-olive">{totalOrdersInRange} {totalOrdersInRange === 1 ? 'order' : 'orders'} placed, last {range} days</p>
                      )}
                    </div>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className={`h-8 rounded-[10px] ${SHIMMER_LIGHT}`} />
                      ))}
                    </div>
                  ) : statusEntries.length === 0 ? (
                    <p className="text-[13px] text-olive py-6 text-center">No orders in this period yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {statusEntries.map((status) => {
                        const count = statusCounts[status] ?? 0;
                        const pct = totalOrdersInRange > 0 ? Math.round((count / totalOrdersInRange) * 100) : 0;
                        return (
                          <div key={status}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="inline-flex items-center gap-1.5 text-[13px] text-accent-dark">
                                <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLOR[status]}`} />
                                {STATUS_LABEL[status]}
                              </span>
                              <span className="text-[12px] text-olive tabular-nums">{count} · {pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-platinum overflow-hidden">
                              <div className={`h-full rounded-full ${STATUS_DOT_COLOR[status]}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </MotionConfig>
    </ScreenShell>
  );
}