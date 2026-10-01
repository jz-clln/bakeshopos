// File: app/src/api/variants.ts

import { supabase } from '../lib/supabase';
import type { ProductVariant } from '../types/catalog';

export interface CreateVariantInput {
  name: string;
  priceAmount: number; // centavos
  // Optional. What it costs to make one unit, in centavos. Omit or pass
  // null when the owner hasn't entered one — stored as null (unknown),
  // never as 0, so profit calculations can tell "not entered" apart
  // from "free".
  costAmount?: number | null;
  priceCurrency?: string;
}

export async function createVariant(
  organizationId: string,
  productId: string,
  input: CreateVariantInput
): Promise<ProductVariant> {
  const { data, error } = await supabase
    .from('product_variants')
    .insert({
      organization_id: organizationId,
      product_id: productId,
      name: input.name,
      price_amount: input.priceAmount,
      cost_amount: input.costAmount ?? null,
      price_currency: input.priceCurrency ?? 'PHP',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVariant(
  id: string,
  updates: Partial<Pick<ProductVariant, 'name' | 'price_amount' | 'cost_amount' | 'is_active'>>
): Promise<ProductVariant> {
  const { data, error } = await supabase
    .from('product_variants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVariant(id: string): Promise<void> {
  const { error } = await supabase.from('product_variants').delete().eq('id', id);
  if (error) throw error;
}