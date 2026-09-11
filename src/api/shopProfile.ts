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

const LOGO_BUCKET = 'shop-logos';
const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export class InvalidLogoFileError extends Error {}

/**
 * Pulls the storage path back out of a public URL so we can target it
 * for deletion. Supabase public URLs look like
 * `${SUPABASE_URL}/storage/v1/object/public/shop-logos/<path>` — if
 * that marker isn't present (e.g. a hand-edited or external URL),
 * there's nothing safe to delete, so this returns null rather than
 * guessing.
 */
function extractLogoStoragePath(logoUrl: string): string | null {
  const marker = `/storage/v1/object/public/${LOGO_BUCKET}/`;
  const idx = logoUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(logoUrl.slice(idx + marker.length));
}

/**
 * Best-effort cleanup — by the time this runs, the org row already
 * points somewhere else (a new logo, or nothing), so a failure here
 * is a storage-cost problem, not a correctness one. Logged instead of
 * thrown so it never blocks the user-facing flow. Most likely cause
 * of a failure is the shop_logos_delete_own_org policy missing.
 */
async function deleteLogoFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from(LOGO_BUCKET).remove([path]);
  if (error) {
    console.warn('Failed to delete old shop logo file:', path, error);
  }
}

/**
 * Uploads a new shop logo to the `shop-logos` bucket, points the
 * organization row at it, then deletes the previous file (if any).
 * The storage path is prefixed with the organization id because
 * shop_logos_insert_own_org / shop_logos_delete_own_org both read
 * that first path segment to check membership — don't change the
 * path shape without updating the migrations too.
 *
 * Pass the profile's current logo_url as `previousLogoUrl` so the old
 * file can be cleaned up. Deletion only happens AFTER the DB row is
 * confirmed pointing at the new file — never before — so a failed
 * update can't leave the org referencing a file that's already gone.
 */
export async function uploadShopLogo(
  organizationId: string,
  file: File,
  previousLogoUrl?: string | null
): Promise<string> {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    throw new InvalidLogoFileError('Please upload a PNG, JPEG, or WEBP image.');
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new InvalidLogoFileError('Image must be smaller than 5MB.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `${organizationId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  const logoUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from('organizations')
    .update({ logo_url: logoUrl })
    .eq('id', organizationId);

  if (updateError) throw updateError;

  if (previousLogoUrl) {
    const oldPath = extractLogoStoragePath(previousLogoUrl);
    if (oldPath && oldPath !== path) {
      await deleteLogoFile(oldPath);
    }
  }

  return logoUrl;
}

/**
 * Clears the shop's logo, reverting Settings/Messenger to the
 * initial-letter fallback, and deletes the underlying file.
 * Pass the profile's current logo_url as `previousLogoUrl` — same
 * cleanup-after-confirmed-write ordering as uploadShopLogo.
 */
export async function removeShopLogo(organizationId: string, previousLogoUrl?: string | null): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({ logo_url: null })
    .eq('id', organizationId);

  if (error) throw error;

  if (previousLogoUrl) {
    const oldPath = extractLogoStoragePath(previousLogoUrl);
    if (oldPath) {
      await deleteLogoFile(oldPath);
    }
  }
}