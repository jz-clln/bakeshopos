// File: app/src/types/catalog.ts
//
// Mirrors the tables from supabase/migrations/0003_products.sql.
// Keep these in sync if that schema ever changes.

export interface ProductCategory {
  id: string;
  organization_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  organization_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  is_active: boolean;
  lead_time_days: number;
  min_quantity: number;
  max_quantity: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  organization_id: string;
  product_id: string;
  name: string;
  price_amount: number; // centavos — never a float
  price_currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductOption {
  id: string;
  organization_id: string;
  product_id: string;
  name: string;
  is_required: boolean;
  sort_order: number;
}

export interface ProductOptionValue {
  id: string;
  organization_id: string;
  option_id: string;
  value: string;
  price_adjustment_amount: number; // centavos
  sort_order: number;
}

// A lightweight variant shape used for catalog list cards — just enough
// to show a starting price without pulling the full product record.
export type VariantSummary = Pick<ProductVariant, 'id' | 'price_amount' | 'is_active'>;

// What the list screen (1B-ii) works with.
export type ProductListItem = Product & { variants: VariantSummary[] };

// What the editor screen (1B-iii) works with — everything nested.
export type ProductWithDetails = Product & {
  variants: ProductVariant[];
  options: (ProductOption & { values: ProductOptionValue[] })[];
};

// Mirrors the `order_status` Postgres enum exactly (confirmed via
// SQL query against pg_enum — do not add/remove values here without
// also updating order_status_transitions in the database).
export type OrderStatus =
  | 'inquiry'
  | 'quote'
  | 'pending_payment'
  | 'confirmed'
  | 'scheduled'
  | 'in_production'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'refunded';