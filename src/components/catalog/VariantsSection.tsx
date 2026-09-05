// File: app/src/components/catalog/VariantsSection.tsx
//
// Manages a product's variants (sizes) inline — list, add, toggle
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
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
        Sizes & Prices
      </h2>
      <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {variants.length === 0 && !showAddForm && (
          <p className="px-4 py-3 text-sm text-gray-400">No sizes added yet.</p>
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
            className="w-full flex items-center gap-2 px-4 py-3 text-accent text-sm font-medium min-h-[44px]"
          >
            <Plus size={18} /> Add Size
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
    <div className="flex items-center justify-between px-4 py-3 min-h-[52px]">
      <div>
        <p className="text-gray-900">{variant.name}</p>
        <p className="text-sm text-gray-500">{formatPrice(variant.price_amount)}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleActive}
          className={`text-xs px-2 py-1 rounded-full ${
            variant.is_active
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {variant.is_active ? 'Active' : 'Inactive'}
        </button>
        <button onClick={onDelete} aria-label={`Delete ${variant.name}`}>
          <Trash2 size={18} className="text-gray-400" />
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

  function handleSubmit() {
    const priceAmount = Math.round(parseFloat(pricePesos || '0') * 100);
    if (!name.trim() || Number.isNaN(priceAmount) || priceAmount <= 0) return;
    onSubmit(name.trim(), priceAmount);
  }

  return (
    <div className="px-4 py-3 space-y-2">
      <input
        type="text"
        placeholder="Size name (e.g. 8-inch)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full min-h-[44px] px-3 rounded-lg border border-gray-300 text-base"
      />
      <input
        type="number"
        inputMode="decimal"
        placeholder="Price (₱)"
        value={pricePesos}
        onChange={(e) => setPricePesos(e.target.value)}
        className="w-full min-h-[44px] px-3 rounded-lg border border-gray-300 text-base"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 min-h-[40px] rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="flex-1 min-h-[40px] rounded-lg border border-gray-300 text-sm text-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}