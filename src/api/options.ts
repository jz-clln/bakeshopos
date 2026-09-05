// File: app/src/api/options.ts

import { supabase } from '../lib/supabase';
import type { ProductOption, ProductOptionValue } from '../types/catalog';

export interface CreateOptionInput {
  name: string;
  isRequired?: boolean;
  sortOrder?: number;
}

export async function createOption(
  organizationId: string,
  productId: string,
  input: CreateOptionInput
): Promise<ProductOption> {
  const { data, error } = await supabase
    .from('product_options')
    .insert({
      organization_id: organizationId,
      product_id: productId,
      name: input.name,
      is_required: input.isRequired ?? false,
      sort_order: input.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOption(
  id: string,
  updates: Partial<Pick<ProductOption, 'name' | 'is_required' | 'sort_order'>>
): Promise<ProductOption> {
  const { data, error } = await supabase
    .from('product_options')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOption(id: string): Promise<void> {
  const { error } = await supabase.from('product_options').delete().eq('id', id);
  if (error) throw error;
}

export interface CreateOptionValueInput {
  value: string;
  priceAdjustmentAmount?: number; // centavos
  sortOrder?: number;
}

export async function createOptionValue(
  organizationId: string,
  optionId: string,
  input: CreateOptionValueInput
): Promise<ProductOptionValue> {
  const { data, error } = await supabase
    .from('product_option_values')
    .insert({
      organization_id: organizationId,
      option_id: optionId,
      value: input.value,
      price_adjustment_amount: input.priceAdjustmentAmount ?? 0,
      sort_order: input.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOptionValue(
  id: string,
  updates: Partial<Pick<ProductOptionValue, 'value' | 'price_adjustment_amount' | 'sort_order'>>
): Promise<ProductOptionValue> {
  const { data, error } = await supabase
    .from('product_option_values')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOptionValue(id: string): Promise<void> {
  const { error } = await supabase.from('product_option_values').delete().eq('id', id);
  if (error) throw error;
}