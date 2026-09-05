// File: app/src/api/categories.ts

import { supabase } from '../lib/supabase';
import type { ProductCategory } from '../types/catalog';

export async function fetchCategories(organizationId: string): Promise<ProductCategory[]> {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createCategory(
  organizationId: string,
  name: string,
  sortOrder = 0
): Promise<ProductCategory> {
  const { data, error } = await supabase
    .from('product_categories')
    .insert({ organization_id: organizationId, name, sort_order: sortOrder })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(
  id: string,
  updates: Partial<Pick<ProductCategory, 'name' | 'sort_order'>>
): Promise<ProductCategory> {
  const { data, error } = await supabase
    .from('product_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('product_categories').delete().eq('id', id);
  if (error) throw error;
}