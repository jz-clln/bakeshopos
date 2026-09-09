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
import { Switch } from '../ui/Switch';
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
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
        Options
      </h2>
      <div className="space-y-3">
        {options.length === 0 && !showAddOption && (
          <p className="px-1 text-sm text-olive">No options yet. Try "Flavor" or "Color."</p>
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
            className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-[16px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-accent-dark text-[14px] font-semibold transition-colors duration-150 hover:bg-platinum/10 active:scale-[0.99]"
          >
            <Plus size={16} strokeWidth={2.5} /> Add Option
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
    <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-platinum/60">
        <div className="flex items-center gap-2">
          <p className="text-[15px] text-accent-dark font-medium">{option.name}</p>
          {option.is_required && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent-light/30 text-accent-dark">
              Required
            </span>
          )}
        </div>
        <button
          onClick={onDelete}
          aria-label={`Delete ${option.name}`}
          className="w-8 h-8 rounded-full flex items-center justify-center text-olive transition-colors duration-150 hover:bg-red-50 hover:text-red-500 active:scale-90"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="divide-y divide-platinum/60">
        {option.values.map((value) => (
          <div
            key={value.id}
            className="flex items-center justify-between px-5 py-3 min-h-[48px]"
          >
            <p className="text-[14px] text-accent-dark">{value.value}</p>
            <div className="flex items-center gap-2">
              {value.price_adjustment_amount !== 0 && (
                <span className="text-[13px] text-olive">
                  +{formatPrice(value.price_adjustment_amount)}
                </span>
              )}
              <button
                onClick={() => deleteValue.mutate(value.id)}
                aria-label={`Delete ${value.value}`}
                className="w-8 h-8 rounded-full flex items-center justify-center text-olive transition-colors duration-150 hover:bg-red-50 hover:text-red-500 active:scale-90"
              >
                <Trash2 size={15} />
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
          className="w-full flex items-center gap-2 px-5 py-3 min-h-[44px] text-accent-dark text-[14px] font-semibold transition-colors duration-150 hover:bg-platinum/20 active:bg-platinum/30"
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
  const canSubmit = name.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(name.trim(), isRequired);
  }

  return (
    <div className="bg-white rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 space-y-3">
      <input
        type="text"
        placeholder="Option name (e.g. Flavor)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full h-11 px-3.5 rounded-[10px] border border-platinum text-[15px] text-accent-dark placeholder:text-olive/50 focus:outline-none focus:border-accent-dark/40"
      />
      <div className="flex items-center justify-between py-1">
        <span className="text-[14px] text-olive">Customer must choose one</span>
        <Switch checked={isRequired} onChange={setIsRequired} ariaLabel="Customer must choose one" />
      </div>
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
  const canSubmit = value.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    const priceAdjustmentAmount =
      Math.round(parseFloat(adjustmentPesos || '0') * 100) || 0;
    onSubmit(value.trim(), priceAdjustmentAmount);
  }

  return (
    <div className="px-5 py-3.5 space-y-2 border-t border-platinum/60">
      <input
        type="text"
        placeholder="Choice (e.g. Chocolate)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full h-11 px-3.5 rounded-[10px] border border-platinum text-[15px] text-accent-dark placeholder:text-olive/50 focus:outline-none focus:border-accent-dark/40"
      />
      <input
        type="number"
        inputMode="decimal"
        placeholder="Extra cost (₱, optional)"
        value={adjustmentPesos}
        onChange={(e) => setAdjustmentPesos(e.target.value)}
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