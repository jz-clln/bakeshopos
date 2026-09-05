// File: app/src/lib/currency.ts
//
// All prices in the database are stored as whole-number centavos, so
// this is the one place that turns that into a display string. Reused
// anywhere money shows up — catalog, orders, payments.

export function formatPrice(centavos: number, currency = 'PHP'): string {
  const wholeAmount = centavos / 100;
  const hasCents = centavos % 100 !== 0;

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(wholeAmount);
}