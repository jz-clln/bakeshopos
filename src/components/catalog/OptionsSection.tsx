// File: app/src/components/catalog/OptionsSection.tsx
//
// Manages a product's options (e.g. "Flavor") and each option's
// choices (e.g. "Chocolate", "+₱50") inline, same pattern as
// VariantsSection but one level deeper.

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  useCreateOption,
  useCreateOptionValue,
  useDeleteOption,
  useDeleteOptionValue,
} from '../../hooks/useProductOptions';
import { formatPrice } from '../../lib/currency';
import type { ProductOption, ProductOptionValue } from '../../types/catalog';

type OptionWithValues = ProductOption & { values: ProductOptionValue[] };

interface OptionsSectionProps {
  productId: string;
  options: OptionWithValues[];
}

export function OptionsSection({ productId, options }: OptionsSectionProps) {
  const [showAddOption, setShowAddOption] = useState(false);
  const createOption = useCreateOption(productId);
  const deleteOption = useDeleteOption(productId);

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
        Options
      </h2>
      <div className="space-y-3">
        {options.length === 0 && !showAddOption && (
          <p className="px-1 text-sm text-gray-400">
            No options yet — e.g. "Flavor" or "Color."
          </p>
        )}
        {options.map((option) => (
          <OptionCard
            key={option.id}
            productId={productId}
            option={option}
            onDelete={() => deleteOption.mutate(option.id)}
          />
        ))}
        {showAddOption ? (
          <AddOptionForm
            onCancel={() => setShowAddOption(false)}
            onSubmit={(name, isRequired) => {
              createOption.mutate(
                { name, isRequired },
                { onSuccess: () => setShowAddOption(false) }
              );
            }}
            submitting={createOption.isPending}
          />
        ) : (
          <button
            onClick={() => setShowAddOption(true)}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-accent text-sm font-medium min-h-[44px]"
          >
            <Plus size={18} /> Add Option
          </button>
        )}
      </div>
    </section>
  );
}

function OptionCard({
  productId,
  option,
  onDelete,
}: {
  productId: string;
  option: OptionWithValues;
  onDelete: () => void;
}) {
  const [showAddValue, setShowAddValue] = useState(false);
  const createValue = useCreateOptionValue(productId);
  const deleteValue = useDeleteOptionValue(productId);

  return (
    <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <p className="text-gray-900 font-medium">{option.name}</p>
          {option.is_required && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              Required
            </span>
          )}
        </div>
        <button onClick={onDelete} aria-label={`Delete ${option.name}`}>
          <Trash2 size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {option.values.map((value) => (
          <div
            key={value.id}
            className="flex items-center justify-between px-4 py-2 min-h-[44px]"
          >
            <p className="text-gray-800">{value.value}</p>
            <div className="flex items-center gap-3">
              {value.price_adjustment_amount !== 0 && (
                <span className="text-sm text-gray-500">
                  +{formatPrice(value.price_adjustment_amount)}
                </span>
              )}
              <button
                onClick={() => deleteValue.mutate(value.id)}
                aria-label={`Delete ${value.value}`}
              >
                <Trash2 size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddValue ? (
        <AddValueForm
          onCancel={() => setShowAddValue(false)}
          onSubmit={(value, priceAdjustmentAmount) => {
            createValue.mutate(
              { optionId: option.id, input: { value, priceAdjustmentAmount } },
              { onSuccess: () => setShowAddValue(false) }
            );
          }}
          submitting={createValue.isPending}
        />
      ) : (
        <button
          onClick={() => setShowAddValue(true)}
          className="w-full flex items-center gap-2 px-4 py-2 text-accent text-sm min-h-[40px]"
        >
          <Plus size={16} /> Add Choice
        </button>
      )}
    </div>
  );
}

function AddOptionForm({
  onCancel,
  onSubmit,
  submitting,
}: {
  onCancel: () => void;
  onSubmit: (name: string, isRequired: boolean) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState('');
  const [isRequired, setIsRequired] = useState(false);

  function handleSubmit() {
    if (!name.trim()) return;
    onSubmit(name.trim(), isRequired);
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-2">
      <input
        type="text"
        placeholder="Option name (e.g. Flavor)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full min-h-[44px] px-3 rounded-lg border border-gray-300 text-base"
      />
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={isRequired}
          onChange={(e) => setIsRequired(e.target.checked)}
        />
        Customer must choose one
      </label>
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

function AddValueForm({
  onCancel,
  onSubmit,
  submitting,
}: {
  onCancel: () => void;
  onSubmit: (value: string, priceAdjustmentAmount: number) => void;
  submitting: boolean;
}) {
  const [value, setValue] = useState('');
  const [adjustmentPesos, setAdjustmentPesos] = useState('');

  function handleSubmit() {
    if (!value.trim()) return;
    const priceAdjustmentAmount =
      Math.round(parseFloat(adjustmentPesos || '0') * 100) || 0;
    onSubmit(value.trim(), priceAdjustmentAmount);
  }

  return (
    <div className="px-4 py-3 space-y-2 border-t border-gray-100">
      <input
        type="text"
        placeholder="Choice (e.g. Chocolate)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full min-h-[44px] px-3 rounded-lg border border-gray-300 text-base"
      />
      <input
        type="number"
        inputMode="decimal"
        placeholder="Extra cost (₱, optional)"
        value={adjustmentPesos}
        onChange={(e) => setAdjustmentPesos(e.target.value)}
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