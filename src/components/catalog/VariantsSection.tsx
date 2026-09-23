// File: app/src/components/catalog/VariantsSection.tsx
//
// Manages a product's variants (sizes) inline: list, add, toggle
// active, delete. No separate modal/screen; everything happens right
// in this card.

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
              />
            ))}
          </div>
        )}

        {showAddForm ? (
          <AddVariantForm
            onCancel={() => setShowAddForm(false)}
            onSubmit={(name, priceAmount) => {
              createVariant.mutate(
                { name, priceAmount },
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
}: {
  variant: ProductVariant;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
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
  );
}

function AddVariantForm({
  onCancel,
  onSubmit,
  submitting,
}: {
  onCancel: () => void;
  onSubmit: (name: string, priceAmount: number) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState('');
  const [pricePesos, setPricePesos] = useState('');

  const priceAmount = Math.round(parseFloat(pricePesos || '0') * 100);
  const canSubmit =
    name.trim().length > 0 &&
    !Number.isNaN(priceAmount) &&
    priceAmount > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(name.trim(), priceAmount);
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