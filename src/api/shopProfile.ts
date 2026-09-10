// File: app/src/api/shopProfile.ts

import { supabase } from '../lib/supabase';

export interface ShopProfile {
  id: string;
  name: string;
  phone_number: string | null;
  address: string | null;
  business_hours: string | null;
  pickup_available: boolean;
  delivery_available: boolean;
  accepting_orders: boolean;
}

export async function fetchShopProfile(organizationId: string): Promise<ShopProfile> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, phone_number, address, business_hours, pickup_available, delivery_available, accepting_orders')
    .eq('id', organizationId)
    .single();

  if (error) throw error;
  return data as ShopProfile;
}

export type UpdateShopProfileInput = Partial<{
  name: string;
  phone_number: string | null;
  address: string | null;
  business_hours: string | null;
  pickup_available: boolean;
  delivery_available: boolean;
}>;

export async function updateShopProfile(
  organizationId: string,
  updates: UpdateShopProfileInput
): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', organizationId);

  if (error) throw error;
}

/**
 * Separate, single-purpose function for the accepting_orders toggle —
 * kept distinct from the general profile update so the Dashboard's
 * quick-access card doesn't need to load or touch the rest of the
 * profile just to flip one switch.
 */
export async function setAcceptingOrders(organizationId: string, accepting: boolean): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({ accepting_orders: accepting })
    .eq('id', organizationId);

  if (error) throw error;
}