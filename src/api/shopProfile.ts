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
  logo_url: string | null;
}

export async function fetchShopProfile(organizationId: string): Promise<ShopProfile> {
  const { data, error } = await supabase
    .from('organizations')
    .select(
      'id, name, phone_number, address, business_hours, pickup_available, delivery_available, accepting_orders, logo_url'
    )
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

export interface ShopIdentity {
  name: string;
  logo_url: string | null;
}

/**
 * Lightweight fetch for screens that only need the shop's display
 * identity (Settings' header card) — same reasoning as
 * setAcceptingOrders above: no need to pull the whole profile just
 * to paint a name and a logo.
 */
export async function fetchShopIdentity(organizationId: string): Promise<ShopIdentity> {
  const { data, error } = await supabase
    .from('organizations')
    .select('name, logo_url')
    .eq('id', organizationId)
    .single();

  if (error) throw error;
  return data as ShopIdentity;
}

const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export class InvalidLogoFileError extends Error {}

/**
 * Uploads a new shop logo to the `shop-logos` bucket and points the
 * organization row at it. The storage path is prefixed with the
 * organization id because shop_logos_insert_own_org reads that first
 * path segment to check membership — don't change the path shape
 * without updating the migration too.
 */
export async function uploadShopLogo(organizationId: string, file: File): Promise<string> {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    throw new InvalidLogoFileError('Please upload a PNG, JPEG, or WEBP image.');
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new InvalidLogoFileError('Image must be smaller than 5MB.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `${organizationId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('shop-logos')
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from('shop-logos').getPublicUrl(path);
  const logoUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from('organizations')
    .update({ logo_url: logoUrl })
    .eq('id', organizationId);

  if (updateError) throw updateError;

  return logoUrl;
}

/**
 * Clears the shop's logo, reverting Settings/Messenger to the
 * initial-letter fallback. Doesn't delete the old file from storage —
 * orphaned objects in shop-logos are cheap and harmless, and deleting
 * on every replace risks a race with in-flight requests still
 * pointing at the old URL.
 */
export async function removeShopLogo(organizationId: string): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({ logo_url: null })
    .eq('id', organizationId);

  if (error) throw error;
}