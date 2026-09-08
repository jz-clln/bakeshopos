// File: app/src/api/orders.ts
//
// Order status changes always go through the transition_order_status
// database function — never a direct .update() on orders.status from
// the frontend. That function is what enforces the state machine and
// each organization's own payment policy; bypassing it here would
// let an order skip stages or confirm without payment.

import { supabase } from '../lib/supabase';
import type { OrderStatus } from '../types/catalog';

/**
 * Returns the list of statuses this order could legally move to next,
 * given its current status — used to build action menus/buttons
 * without hardcoding the state machine a second time in the frontend.
 */
export async function getValidNextStatuses(currentStatus: OrderStatus): Promise<OrderStatus[]> {
  const { data, error } = await supabase
    .from('order_status_transitions')
    .select('to_status')
    .eq('from_status', currentStatus);

  if (error) throw error;
  return (data ?? []).map((row) => row.to_status as OrderStatus);
}

/**
 * Attempts to move an order to a new status. Throws with a specific,
 * human-readable message if the transition isn't allowed or the
 * organization's payment policy isn't satisfied yet (e.g. "Full
 * payment required before confirming this order").
 */
export async function transitionOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  changedBy?: string
) {
  const { data, error } = await supabase.rpc('transition_order_status', {
    p_order_id: orderId,
    p_to_status: toStatus,
    p_changed_by: changedBy ?? null,
  });

  if (error) throw error;
  return data;
}