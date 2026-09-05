// File: app/src/lib/catalog-helpers.ts

import type { VariantSummary } from '../types/catalog';

// Cheapest active variant's price — what a catalog card shows as "From ₱X".
// Returns null if a product has no active (purchasable) variants yet.
export function getStartingPrice(variants: VariantSummary[]): number | null {
  const activePrices = variants
    .filter((variant) => variant.is_active)
    .map((variant) => variant.price_amount);

  if (activePrices.length === 0) return null;
  return Math.min(...activePrices);
}