// File: app/src/lib/currency.ts

const DEFAULT_CURRENCY = 'PHP';

/**
 * Formats an amount stored in the smallest currency unit (centavos for
 * PHP) into a human-readable string, e.g. 25000 -> "₱250.00".
 */
export function formatPrice(amountInSmallestUnit: number, currency: string = DEFAULT_CURRENCY): string {
  const amount = amountInSmallestUnit / 100;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}