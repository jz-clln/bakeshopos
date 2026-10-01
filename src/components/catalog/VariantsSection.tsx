// File: app/src/components/catalog/VariantsSection.tsx
//
// Manages a product's variants (sizes) inline: list, add, toggle
// active, delete. No separate modal/screen; everything happens right
// in this card.
//
// Each size can also carry a private "cost to make one" — what it costs
// the shop, used later to show profit. It's owner-only and optional:
// blank means "not entered yet" (stored as null, i.e. unknown), which
// is deliberately different from typing 0.

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  useCreateVariant,
  useDeleteVariant,
  useUpdateVariant,
} from '../../hooks/useProductVariants';
import { formatPrice } from '../../lib/currency';
import type { ProductVariant } from '../../types/catalog';

interface VariantsSectionProps {
  productId: string;
  variants: ProductVariant[];
}

// Blank input means "no cost entered" (null, unknown) — valid, and NOT
// the same as 0. Anything that isn't a finite, non-negative number is
// invalid.
function parseCostInput(raw: string): { valid: boolean; centavos: number | null } {
  const trimmed = raw.trim();
  if (trimmed === '') return { valid: true, centavos: null };
  const value = parseFloat(trimmed);
  if (!Number.isFinite(value) || value < 0) return { valid: false, centavos: null };
  return { valid: true, centavos: Math.round(value * 100) };
}

export function VariantsSection({ productId, variants }: VariantsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const createVariant = useCreateVariant(productId);
  const deleteVariant = useDeleteVariant(productId);
  const updateVariant = useUpdateVariant(productId);

  return (
    <section>
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-olive">
            Sizes & Prices
          </h2>
          <p className="mt-1 text-[12px] text-olive/60">
            Manage available sizes and pricing
          </p>
        </div>

        {variants.length > 0 && (
          <span className="rounded-full border border-platinum/70 bg-white px-2.5 py-1 text-[11px] font-semibold tabular-nums text-olive shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            {variants.length} {variants.length === 1 ? 'size' : 'sizes'}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-[22px] border border-platinum/70 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.045)]">
        {variants.length === 0 && !showAddForm && (
          <div className="px-5 py-7 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-platinum/35">
              <Plus size={17} className="text-olive" />
            </div>

            <p className="text-[14px] font-medium text-accent-dark">
              No sizes added yet
            </p>

            <p className="mx-auto mt-1 max-w-[240px] text-[12px] leading-5 text-olive/70">
              Add a size and price to start offering this product.
            </p>
          </div>
        )}

        {variants.length > 0 && (
          <div className="divide-y divide-platinum/50">
            {variants.map((variant) => (
              <VariantRow
                key={variant.id}
                variant={variant}
                onToggleActive={() =>
                  updateVariant.mutate({
                    id: variant.id,
                    updates: { is_active: !variant.is_active },
                  })
                }
                onDelete={() => deleteVariant.mutate(variant.id)}
                onSaveCost={(costAmount, onSuccess) =>
                  updateVariant.mutate(
                    { id: variant.id, updates: { cost_amount: costAmount } },
                    { onSuccess }
                  )
                }
                savingCost={updateVariant.isPending}
              />
            ))}
          </div>
        )}

        {showAddForm ? (
          <AddVariantForm
            onCancel={() => setShowAddForm(false)}
            onSubmit={(name, priceAmount, costAmount) => {
              createVariant.mutate(
                { name, priceAmount, costAmount },
                { onSuccess: () => setShowAddForm(false) }
              );
            }}
            submitting={createVariant.isPending}
          />
        ) : (
          <div
            className={
              variants.length > 0 ? 'border-t border-platinum/50' : ''
            }
          >
            <button
              onClick={() => setShowAddForm(true)}
              className="group flex min-h-[52px] w-full items-center justify-center gap-2 px-5 py-3.5 text-[13px] font-semibold text-accent-dark transition-colors duration-150 hover:bg-platinum/20 active:bg-platinum/35"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-platinum/45 transition-colors duration-150 group-hover:bg-platinum/70">
                <Plus size={14} strokeWidth={2.25} />
              </span>
              Add Size
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function VariantRow({
  variant,
  onToggleActive,
  onDelete,
  onSaveCost,
  savingCost,
}: {
  variant: ProductVariant;
  onToggleActive: () => void;
  onDelete: () => void;
  onSaveCost: (costAmount: number | null, onSuccess: () => void) => void;
  savingCost: boolean;
}) {
  const [editingCost, setEditingCost] = useState(false);
  const [costPesos, setCostPesos] = useState('');

  const parsedCost = parseCostInput(costPesos);
  const hasCost = variant.cost_amount !== null && variant.cost_amount !== undefined;
  const profit = hasCost ? variant.price_amount - (variant.cost_amount as number) : null;

  function openCostEditor() {
    // Reset from the saved value every time it opens, so a cancelled
    // edit never leaves stale text behind.
    setCostPesos(hasCost ? ((variant.cost_amount as number) / 100).toFixed(2) : '');
    setEditingCost(true);
  }

  function handleSaveCost() {
    if (!parsedCost.valid) return;
    onSaveCost(parsedCost.centavos, () => setEditingCost(false));
  }

  return (
    <div>
      <div className="group flex min-h-[68px] items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-platinum/[0.12]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-[14px] font-semibold text-accent-dark">
              {variant.name}
            </p>

            <span
              className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                variant.is_active ? 'bg-accent-dark' : 'bg-olive/35'
              }`}
            />
          </div>

          <p className="mt-0.5 text-[13px] font-medium tabular-nums text-olive">
            {formatPrice(variant.price_amount)}
          </p>

          <button
            onClick={openCostEditor}
            className="mt-1 text-left text-[12px] font-medium tabular-nums transition-opacity duration-150 hover:opacity-70"
          >
            {!hasCost ? (
              <span className="text-amber-600">
                Cost not set <span className="text-olive/60">· Add</span>
              </span>
            ) : profit !== null && profit < 0 ? (
              <span className="text-olive/70">
                Cost {formatPrice(variant.cost_amount as number)} ·{' '}
                <span className="text-red-500">Loss of {formatPrice(Math.abs(profit))}</span>
              </span>
            ) : (
              <span className="text-olive/70">
                Cost {formatPrice(variant.cost_amount as number)} · Profit {formatPrice(profit as number)}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button
            onClick={onToggleActive}
            className={`min-w-[72px] rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 active:scale-95 ${
              variant.is_active
                ? 'border-accent-dark bg-accent-dark text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:bg-accent-dark/90'
                : 'border-platinum bg-white text-olive hover:border-olive/30 hover:bg-platinum/20'
            }`}
          >
            {variant.is_active ? 'Active' : 'Inactive'}
          </button>

          <button
            onClick={onDelete}
            aria-label={`Delete ${variant.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-olive/60 transition-all duration-150 hover:bg-red-50 hover:text-red-500 active:scale-90"
          >
            <Trash2 size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {editingCost && (
        <div className="border-t border-platinum/50 bg-platinum/[0.10] px-5 py-4">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-olive/75">
            Cost to make one
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[14px] font-medium text-olive/60">
              ₱
            </span>

            <input
              type="number"
              inputMode="decimal"
              autoFocus
              placeholder="0.00"
              value={costPesos}
              onChange={(e) => setCostPesos(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleSaveCost(); }
                if (e.key === 'Escape') { e.preventDefault(); setEditingCost(false); }
              }}
              className="h-11 w-full rounded-[12px] border border-platinum bg-white pl-8 pr-3.5 text-[14px] font-medium tabular-nums text-accent-dark shadow-[0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all duration-150 placeholder:text-olive/40 hover:border-olive/25 focus:border-accent-dark/40 focus:ring-2 focus:ring-accent-dark/[0.06]"
            />
          </div>

          <p className="mt-1.5 text-[12px] text-olive/65">
            Ingredients, plus anything else you want counted. Only you can see this. Leave it blank if you're not sure yet.
          </p>

          {!parsedCost.valid && (
            <p className="mt-1.5 text-[12px] text-red-600">Enter a number, like 120 or 120.50.</p>
          )}

          <div className="mt-3 flex gap-2.5">
            <button
              onClick={() => setEditingCost(false)}
              className="h-11 flex-1 rounded-[12px] border border-platinum bg-white text-[13px] font-semibold text-accent-dark transition-all duration-150 hover:bg-platinum/25 active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              onClick={handleSaveCost}
              disabled={!parsedCost.valid || savingCost}
              className="h-11 flex-1 rounded-[12px] bg-accent-dark text-[13px] font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-all duration-150 hover:bg-accent-dark/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none active:scale-[0.98]"
            >
              {savingCost ? 'Saving…' : 'Save cost'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddVariantForm({
  onCancel,
  onSubmit,
  submitting,
}: {
  onCancel: () => void;
  onSubmit: (name: string, priceAmount: number, costAmount: number | null) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState('');
  const [pricePesos, setPricePesos] = useState('');
  const [costPesos, setCostPesos] = useState('');

  const priceAmount = Math.round(parseFloat(pricePesos || '0') * 100);
  const parsedCost = parseCostInput(costPesos);
  const canSubmit =
    name.trim().length > 0 &&
    !Number.isNaN(priceAmount) &&
    priceAmount > 0 &&
    parsedCost.valid;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(name.trim(), priceAmount, parsedCost.centavos);
  }

  return (
    <div className="border-t border-platinum/50 bg-platinum/[0.10] px-5 py-5">
      <div className="mb-4">
        <p className="text-[14px] font-semibold text-accent-dark">
          Add new size
        </p>
        <p className="mt-0.5 text-[12px] text-olive/65">
          Enter the size name and its selling price.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-olive/75">
            Size
          </label>

          <input
            type="text"
            placeholder="e.g. 8-inch"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-[12px] border border-platinum bg-white px-3.5 text-[14px] text-accent-dark shadow-[0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all duration-150 placeholder:text-olive/40 hover:border-olive/25 focus:border-accent-dark/40 focus:ring-2 focus:ring-accent-dark/[0.06]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-olive/75">
            Price
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[14px] font-medium text-olive/60">
              ₱
            </span>

            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={pricePesos}
              onChange={(e) => setPricePesos(e.target.value)}
              className="h-11 w-full rounded-[12px] border border-platinum bg-white pl-8 pr-3.5 text-[14px] font-medium tabular-nums text-accent-dark shadow-[0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all duration-150 placeholder:text-olive/40 hover:border-olive/25 focus:border-accent-dark/40 focus:ring-2 focus:ring-accent-dark/[0.06]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-olive/75">
            Cost to make one{' '}
            <span className="font-medium normal-case tracking-normal text-olive/50">(optional)</span>
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[14px] font-medium text-olive/60">
              ₱
            </span>

            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={costPesos}
              onChange={(e) => setCostPesos(e.target.value)}
              className="h-11 w-full rounded-[12px] border border-platinum bg-white pl-8 pr-3.5 text-[14px] font-medium tabular-nums text-accent-dark shadow-[0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all duration-150 placeholder:text-olive/40 hover:border-olive/25 focus:border-accent-dark/40 focus:ring-2 focus:ring-accent-dark/[0.06]"
            />
          </div>

          <p className="mt-1.5 text-[12px] text-olive/65">
            Only you can see this. It lets your dashboard show profit, not just sales.
          </p>

          {!parsedCost.valid && (
            <p className="mt-1.5 text-[12px] text-red-600">Enter a number, like 120 or 120.50.</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2.5">
        <button
          onClick={onCancel}
          className="h-11 flex-1 rounded-[12px] border border-platinum bg-white text-[13px] font-semibold text-accent-dark transition-all duration-150 hover:bg-platinum/25 active:scale-[0.98]"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="h-11 flex-1 rounded-[12px] bg-accent-dark text-[13px] font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-all duration-150 hover:bg-accent-dark/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none active:scale-[0.98]"
        >
          {submitting ? 'Adding…' : 'Add Size'}
        </button>
      </div>
    </div>
  );
}