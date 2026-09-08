// File: app/src/api/pricing.ts

import { supabase } from '../lib/supabase';

/**
 * Calculates the per-unit price (in centavos) for a variant with a
 * given set of selected option values. This calls the SAME database
 * function the AI's future pricing tool will call — the frontend and
 * the AI can never quote a different price for the same selection.
 *
 * Throws if the variant is invalid/inactive, an option value doesn't
 * belong to this product, or a required option wasn't selected.
 */
export async function calculatePrice(
  variantId: string,
  optionValueIds: string[] = []
): Promise<number> {
  const { data, error } = await supabase.rpc('calculate_price', {
    p_variant_id: variantId,
    p_option_value_ids: optionValueIds,
  });

  if (error) throw error;
  return data as number;
}