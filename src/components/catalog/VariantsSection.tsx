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
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
        Sizes & Prices
      </h2>
      <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] divide-y divide-platinum/60 overflow-hidden">
        {variants.length === 0 && !showAddForm && (
          <p className="px-5 py-3.5 text-[14px] text-olive">No sizes added yet.</p>
        )}
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
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center gap-2 px-5 py-3.5 text-accent-dark text-[14px] font-semibold min-h-[44px] transition-colors duration-150 hover:bg-platinum/20 active:bg-platinum/30"
          >
            <Plus size={16} /> Add Size
          </button>
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
    <div className="flex items-center justify-between px-5 py-3 min-h-[52px]">
      <div>
        <p className="text-[15px] text-accent-dark font-medium">{variant.name}</p>
        <p className="text-[13px] text-olive">{formatPrice(variant.price_amount)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleActive}
          className={`text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-colors duration-150 active:scale-95 ${
            variant.is_active
              ? 'bg-accent-dark text-white border-accent-dark hover:bg-accent-dark/90'
              : 'bg-white text-olive border-platinum hover:bg-platinum/20'
          }`}
        >
          {variant.is_active ? 'Active' : 'Inactive'}
        </button>
        <button
          onClick={onDelete}
          aria-label={`Delete ${variant.name}`}
          className="w-8 h-8 rounded-full flex items-center justify-center text-olive transition-colors duration-150 hover:bg-red-50 hover:text-red-500 active:scale-90"
        >
          <Trash2 size={16} />
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
  const canSubmit = name.trim().length > 0 && !Number.isNaN(priceAmount) && priceAmount > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(name.trim(), priceAmount);
  }

  return (
    <div className="px-5 py-3.5 space-y-2">
      <input
        type="text"
        placeholder="Size name (e.g. 8-inch)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full h-11 px-3.5 rounded-[10px] border border-platinum text-[15px] text-accent-dark placeholder:text-olive/50 focus:outline-none focus:border-accent-dark/40"
      />
      <input
        type="number"
        inputMode="decimal"
        placeholder="Price (₱)"
        value={pricePesos}
        onChange={(e) => setPricePesos(e.target.value)}
        className="w-full h-11 px-3.5 rounded-[10px] border border-platinum text-[15px] text-accent-dark placeholder:text-olive/50 focus:outline-none focus:border-accent-dark/40"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="flex-1 h-11 rounded-[10px] bg-accent-dark text-white text-[14px] font-semibold disabled:opacity-40 transition-opacity duration-150 active:scale-[0.98]"
        >
          {submitting ? 'Adding…' : 'Add'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 h-11 rounded-[10px] bg-platinum/60 text-[14px] font-semibold text-accent-dark transition-colors duration-150 hover:bg-platinum active:scale-[0.98]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}