// File: app/src/types/catalog.ts
//
// Mirrors the tables from supabase/migrations/0003_products.sql, plus
// the image_url column added in
// supabase/migrations/20260923_add_product_images.sql.
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
  // Public URL in the product-images storage bucket. Shown in the
  // Catalog UI and sent as a real Messenger image attachment by the
  // AI's send_product_photo tool when a customer asks what a product
  // looks like. Null until a photo has been uploaded.
  image_url: string | null;
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

// Mirrors the ACTIVE subset of the `order_status` Postgres enum, per
// the shortened pipeline in
// supabase/migrations/20260919_shorten_order_pipeline.sql:
// inquiry -> quote -> confirmed (once paid) -> in_production ->
// completed, with cancelled reachable from any non-terminal status
// and refunded reachable from completed or cancelled.
//
// The enum itself still technically contains 'pending_payment',
// 'scheduled', and 'ready' — Postgres can't drop enum values without
// recreating the column, so they're left in place at the database
// level, unused. Every existing row was migrated off them, and
// order_status_transitions has no transition into or out of them
// anymore, so the app should never produce or need to handle these
// three again. Do not add them back here without also updating
// order_status_transitions in the database.
export type OrderStatus =
  | 'inquiry'
  | 'quote'
  | 'confirmed'
  | 'in_production'
  | 'completed'
  | 'cancelled'
  | 'refunded';