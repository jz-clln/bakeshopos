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
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderListItem[];
}

export async function getValidNextStatuses(currentStatus: OrderStatus): Promise<OrderStatus[]> {
  const { data, error } = await supabase
    .from('order_status_transitions')
    .select('to_status')
    .eq('from_status', currentStatus);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.to_status as OrderStatus);
}

/**
 * IMPORTANT: Supabase's .rpc() returns a PostgrestError object on
 * failure, not a real Error — it doesn't pass `instanceof Error`
 * checks. Every catch block in the app that does
 * `err instanceof Error ? err.message : 'generic fallback'` was
 * silently discarding the actual, specific message this function
 * raises (e.g. "Full payment required before confirming this
 * order"). Wrapping it in a real Error here fixes that everywhere
 * this function is called, without needing to touch every catch
 * block separately.
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

  if (error) throw new Error(error.message);
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

  if (variantError) throw new Error(variantError.message);

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

  if (orderError) throw new Error(orderError.message);

  const { error: itemError } = await supabase.from('order_items').insert({
    organization_id: organizationId,
    order_id: order.id,
    product_id: variant.product_id,
    variant_id: input.variantId,
    quantity: input.quantity,
    unit_price_amount: unitPrice,
  });

  if (itemError) throw new Error(itemError.message);

  return order.id;
}

export interface OrderDetailItem {
  id: string;
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price_amount: number;
}

export interface OrderDetail {
  id: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  event_date: string | null;
  fulfillment_method: string | null;
  created_at: string;
  customer_name: string;
  customer_phone: string | null;
  items: OrderDetailItem[];
}

/**
 * Full breakdown for the order details popup — line items with
 * product/variant names, plus customer contact info, none of which
 * order_list_view exposes (it's built for the list row, not the
 * detail view). Two queries, same reasoning as fetchConversationList
 * fetching avatars separately: order_items needs its own query since
 * it's a one-to-many join the parent order row can't carry directly.
 */
export async function fetchOrderDetail(orderId: string): Promise<OrderDetail> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      'id, status, total_amount, currency, event_date, fulfillment_method, created_at, customers(full_name, phone_number)'
    )
    .eq('id', orderId)
    .single();

  if (orderError) throw new Error(orderError.message);

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('id, quantity, unit_price_amount, products(name), product_variants(name)')
    .eq('order_id', orderId);

  if (itemsError) throw new Error(itemsError.message);

  return {
    id: order.id,
    status: order.status,
    total_amount: order.total_amount,
    currency: order.currency,
    event_date: order.event_date,
    fulfillment_method: order.fulfillment_method,
    created_at: order.created_at,
    customer_name: (order as any).customers?.full_name ?? 'Customer',
    customer_phone: (order as any).customers?.phone_number ?? null,
    items: (items ?? []).map((it: any) => ({
      id: it.id,
      product_name: it.products?.name ?? 'Item',
      variant_name: it.product_variants?.name ?? '',
      quantity: it.quantity,
      unit_price_amount: it.unit_price_amount,
    })),
  };
}