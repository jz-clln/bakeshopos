// File: app/src/api/orders.ts

import { supabase } from '../lib/supabase';
import type { OrderStatus } from '../types/catalog';
import { calculatePrice } from './pricing';

export interface OrderListItem {
  id: string;
  customer_id: string;
  customer_name: string;
  summary: string;
  total_amount: number;
  currency: string;
  status: OrderStatus;
  event_date: string | null;
  created_at: string;
}

export async function fetchOrders(
  organizationId: string,
  status?: OrderStatus
): Promise<OrderListItem[]> {
  let query = supabase
    .from('order_list_view')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as OrderListItem[];
}

export async function getValidNextStatuses(currentStatus: OrderStatus): Promise<OrderStatus[]> {
  const { data, error } = await supabase
    .from('order_status_transitions')
    .select('to_status')
    .eq('from_status', currentStatus);

  if (error) throw error;
  return (data ?? []).map((row) => row.to_status as OrderStatus);
}

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

export interface CreateOrderInput {
  customerId: string;
  variantId: string;
  optionValueIds: string[];
  quantity: number;
  eventDate: string | null;
  fulfillmentMethod: 'pickup' | 'delivery';
}

/**
 * Creates a manually-entered order with a single line item. Always
 * recalculates the price server-side via calculate_price right
 * before inserting — never trusts a price the form displayed earlier,
 * in case options changed since the last preview render.
 */
export async function createOrder(organizationId: string, input: CreateOrderInput): Promise<string> {
  const unitPrice = await calculatePrice(input.variantId, input.optionValueIds);
  const totalAmount = unitPrice * input.quantity;

  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .select('product_id')
    .eq('id', input.variantId)
    .single();

  if (variantError) throw variantError;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      organization_id: organizationId,
      customer_id: input.customerId,
      status: 'inquiry',
      event_date: input.eventDate,
      fulfillment_method: input.fulfillmentMethod,
      total_amount: totalAmount,
    })
    .select('id')
    .single();

  if (orderError) throw orderError;

  const { error: itemError } = await supabase.from('order_items').insert({
    organization_id: organizationId,
    order_id: order.id,
    product_id: variant.product_id,
    variant_id: input.variantId,
    quantity: input.quantity,
    unit_price_amount: unitPrice,
  });

  if (itemError) throw itemError;

  return order.id;
}