// File: app/src/components/orders/OrderDetailModal.tsx

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { fetchOrderDetail, type OrderDetail } from '../../api/orders';
import { formatPrice } from '../../lib/currency';
import type { OrderStatus } from '../../types/catalog';

const EASE = [0.23, 1, 0.32, 1] as const;

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

const FULFILLMENT_LABEL: Record<string, string> = {
  pickup: 'Pickup',
  delivery: 'Delivery',
};

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

// event_date is a plain date with no time/timezone — parsing it with
// `new Date(iso)` directly can shift it a day depending on the
// browser's local timezone, same issue OrdersScreen.tsx's
// formatEventDate already works around for the list row's date label.
function formatEventDate(iso: string | null): string {
  if (!iso) return 'Not set';
  const [year, month, day] = iso.split(/[-T]/).map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

// created_at IS a real timestamp, so regular Date parsing is fine here.
function formatPlacedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchOrderDetail(orderId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err) => {
        console.error('Failed to load order detail:', err);
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load this order.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-t-[24px] sm:rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        {/* Drag handle — mobile bottom-sheet affordance only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-platinum" />
        </div>

        <div className="px-5 sm:px-6 pt-3 sm:pt-6 pb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="font-display text-[19px] font-bold tracking-tight text-accent-dark truncate">
              {loading ? 'Loading…' : detail?.customer_name ?? 'Order'}
            </p>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 w-8 h-8 rounded-full bg-platinum/60 flex items-center justify-center text-olive transition-transform duration-150 active:scale-90"
            >
              <X size={15} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-4 bg-platinum/60 rounded animate-pulse" />
              ))}
            </div>
          ) : error || !detail ? (
            <p className="text-sm text-olive py-6 text-center">{error ?? "Couldn't load this order."}</p>
          ) : (
            <>
              <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full mb-4 ${STATUS_STYLES[detail.status]}`}>
                {STATUS_LABEL[detail.status]}
              </span>

              <div className="divide-y divide-platinum/60 border-y border-platinum/60 mb-4">
                {detail.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-accent-dark truncate">
                        {item.product_name}
                        {item.variant_name && <span className="text-olive font-normal"> · {item.variant_name}</span>}
                      </p>
                      <p className="text-[12px] text-olive">Qty {item.quantity}</p>
                    </div>
                    <span className="text-[14px] font-semibold text-accent-dark tabular-nums shrink-0">
                      {formatPrice(item.unit_price_amount * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-baseline justify-between mb-5">
                <span className="text-[13px] text-olive">Total</span>
                <span className="text-[22px] font-bold text-accent-dark tabular-nums">
                  {formatPrice(detail.total_amount)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-olive">Event date</span>
                  <span className="text-accent-dark font-medium">{formatEventDate(detail.event_date)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-olive">Fulfillment</span>
                  <span className="text-accent-dark font-medium">
                    {detail.fulfillment_method ? FULFILLMENT_LABEL[detail.fulfillment_method] ?? detail.fulfillment_method : 'Not set'}
                  </span>
                </div>
                {detail.customer_phone && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-olive">Phone</span>
                    <span className="text-accent-dark font-medium">{detail.customer_phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-olive">Placed</span>
                  <span className="text-accent-dark font-medium">{formatPlacedAt(detail.created_at)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}