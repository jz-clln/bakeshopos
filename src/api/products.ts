// File: app/src/api/products.ts

import { supabase } from '../lib/supabase';
import type { Product, ProductListItem, ProductWithDetails } from '../types/catalog';

export async function fetchProducts(
  organizationId: string,
  options?: { categoryId?: string }
): Promise<ProductListItem[]> {
  let query = supabase
    .from('products')
    .select('*, variants:product_variants(id, price_amount, is_active)')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ProductListItem[];
}

// Pulls a single product with its variants and options+values all
// nested in one call — this is what the editor screen (1B-iii) uses.
export async function fetchProductWithDetails(id: string): Promise<ProductWithDetails> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `*,
       variants:product_variants(*),
       options:product_options(*, values:product_option_values(*))`
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ProductWithDetails;
}

export interface CreateProductInput {
  name: string;
  categoryId?: string | null;
  description?: string;
  sku?: string;
  leadTimeDays?: number;
  minQuantity?: number;
  maxQuantity?: number | null;
}

export async function createProduct(
  organizationId: string,
  input: CreateProductInput
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      organization_id: organizationId,
      name: input.name,
      category_id: input.categoryId ?? null,
      description: input.description ?? null,
      sku: input.sku ?? null,
      lead_time_days: input.leadTimeDays ?? 0,
      min_quantity: input.minQuantity ?? 1,
      max_quantity: input.maxQuantity ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export type UpdateProductInput = Partial<{
  name: string;
  category_id: string | null;
  description: string | null;
  sku: string | null;
  is_active: boolean;
  lead_time_days: number;
  min_quantity: number;
  max_quantity: number | null;
}>;

export async function updateProduct(
  id: string,
  updates: UpdateProductInput
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}