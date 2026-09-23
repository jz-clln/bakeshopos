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
      {/* Section header */}
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-olive">
            Options
          </h2>

          <p className="mt-1 text-[12px] leading-4 text-olive/60">
            Add choices customers can select
          </p>
        </div>

        {options.length > 0 && (
          <span className="shrink-0 rounded-full border border-platinum/70 bg-white px-2.5 py-1 text-[11px] font-semibold tabular-nums text-olive shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            {options.length} {options.length === 1 ? 'option' : 'options'}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Empty state */}
        {options.length === 0 && !showAddOption && (
          <div className="rounded-[22px] border border-platinum/70 bg-white px-5 py-7 text-center shadow-[0_8px_30px_rgba(0,0,0,0.045)]">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-platinum/35">
              <Plus size={17} className="text-olive" />
            </div>

            <p className="text-[14px] font-medium text-accent-dark">
              No options added yet
            </p>

            <p className="mx-auto mt-1 max-w-[260px] text-[12px] leading-5 text-olive/70">
              Add options like Flavor, Color, or Extras for customers to choose
              from.
            </p>
          </div>
        )}

        {/* Option cards */}
        {options.map((option) => (
          <OptionCard
            key={option.id}
            productId={productId}
            option={option}
            onDelete={() => deleteOption.mutate(option.id)}
          />
        ))}

        {/* Add option */}
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
            className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[18px] border border-platinum/70 bg-white px-5 py-3 text-[13px] font-semibold text-accent-dark shadow-[0_4px_18px_rgba(0,0,0,0.035)] transition-all duration-150 hover:bg-platinum/20 active:scale-[0.99] active:bg-platinum/35"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-platinum/45 transition-colors duration-150 group-hover:bg-platinum/70">
              <Plus size={14} strokeWidth={2.25} />
            </span>

            Add Option
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
    <div className="overflow-hidden rounded-[22px] border border-platinum/70 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.045)]">
      {/* Option header */}
      <div className="flex min-h-[64px] items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-[14px] font-semibold text-accent-dark">
              {option.name}
            </p>

            {option.is_required && (
              <span className="shrink-0 rounded-full bg-accent-dark/[0.07] px-2 py-0.5 text-[10px] font-semibold text-accent-dark">
                Required
              </span>
            )}
          </div>

          <p className="mt-0.5 text-[12px] text-olive/60">
            {option.values.length}{' '}
            {option.values.length === 1 ? 'choice' : 'choices'}
          </p>
        </div>

        <button
          onClick={onDelete}
          aria-label={`Delete ${option.name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-olive/55 transition-all duration-150 hover:bg-red-50 hover:text-red-500 active:scale-90"
        >
          <Trash2 size={15} strokeWidth={1.8} />
        </button>
      </div>

      {/* Choices */}
      {option.values.length > 0 && (
        <div className="border-t border-platinum/50">
          <div className="divide-y divide-platinum/50">
            {option.values.map((value) => (
              <div
                key={value.id}
                className="group flex min-h-[56px] items-center justify-between gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-platinum/[0.12] sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-accent-dark">
                    {value.value}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {value.price_adjustment_amount !== 0 && (
                    <span className="max-w-[120px] truncate rounded-full bg-platinum/35 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-olive">
                      +{formatPrice(value.price_adjustment_amount)}
                    </span>
                  )}

                  <button
                    onClick={() => deleteValue.mutate(value.id)}
                    aria-label={`Delete ${value.value}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-olive/50 transition-all duration-150 hover:bg-red-50 hover:text-red-500 active:scale-90"
                  >
                    <Trash2 size={14} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty choices */}
      {option.values.length === 0 && !showAddValue && (
        <div className="border-t border-platinum/50 px-5 py-4">
          <p className="text-[12px] leading-5 text-olive/60">
            No choices added to this option yet.
          </p>
        </div>
      )}

      {/* Add choice */}
      {showAddValue ? (
        <AddValueForm
          onCancel={() => setShowAddValue(false)}
          onSubmit={(value, priceAdjustmentAmount) => {
            createValue.mutate(
              {
                optionId: option.id,
                input: { value, priceAdjustmentAmount },
              },
              { onSuccess: () => setShowAddValue(false) }
            );
          }}
          submitting={createValue.isPending}
        />
      ) : (
        <div className="border-t border-platinum/50">
          <button
            onClick={() => setShowAddValue(true)}
            className="group flex min-h-[52px] w-full items-center gap-2 px-4 py-3 text-[13px] font-semibold text-accent-dark transition-colors duration-150 hover:bg-platinum/20 active:bg-platinum/35 sm:px-5"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-platinum/45 transition-colors duration-150 group-hover:bg-platinum/70">
              <Plus size={14} strokeWidth={2.25} />
            </span>

            Add Choice
          </button>
        </div>
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
    <div className="overflow-hidden rounded-[22px] border border-platinum/70 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.045)]">
      {/* Form heading */}
      <div className="border-b border-platinum/50 px-4 py-4 sm:px-5">
        <p className="text-[14px] font-semibold text-accent-dark">
          Add new option
        </p>

        <p className="mt-0.5 text-[12px] leading-5 text-olive/65">
          Create a group of choices for this product.
        </p>
      </div>

      <div className="space-y-4 bg-platinum/[0.08] px-4 py-4 sm:px-5 sm:py-5">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-olive/75">
            Option Name
          </label>

          <input
            type="text"
            placeholder="e.g. Flavor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-[12px] border border-platinum bg-white px-3.5 text-[14px] text-accent-dark shadow-[0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all duration-150 placeholder:text-olive/40 hover:border-olive/25 focus:border-accent-dark/40 focus:ring-2 focus:ring-accent-dark/[0.06]"
          />
        </div>

        {/* Required setting */}
        <div className="flex min-h-[56px] items-center justify-between gap-4 rounded-[14px] border border-platinum/60 bg-white px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-accent-dark">
              Required selection
            </p>

            <p className="mt-0.5 text-[11px] leading-4 text-olive/60">
              Customer must choose one option
            </p>
          </div>

          <div className="shrink-0">
            <Switch
              checked={isRequired}
              onChange={setIsRequired}
              ariaLabel="Customer must choose one"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="h-11 min-w-0 flex-1 rounded-[12px] border border-platinum bg-white px-3 text-[13px] font-semibold text-accent-dark transition-all duration-150 hover:bg-platinum/25 active:scale-[0.98]"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="h-11 min-w-0 flex-1 rounded-[12px] bg-accent-dark px-3 text-[13px] font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-all duration-150 hover:bg-accent-dark/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {submitting ? 'Adding…' : 'Add Option'}
          </button>
        </div>
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
    <div className="border-t border-platinum/50 bg-platinum/[0.08] px-4 py-4 sm:px-5 sm:py-5">
      <div className="mb-4">
        <p className="text-[14px] font-semibold text-accent-dark">
          Add new choice
        </p>

        <p className="mt-0.5 text-[12px] leading-5 text-olive/65">
          Add a choice and an optional additional cost.
        </p>
      </div>

      <div className="space-y-3">
        {/* Choice */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-olive/75">
            Choice
          </label>

          <input
            type="text"
            placeholder="e.g. Chocolate"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-11 w-full rounded-[12px] border border-platinum bg-white px-3.5 text-[14px] text-accent-dark shadow-[0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all duration-150 placeholder:text-olive/40 hover:border-olive/25 focus:border-accent-dark/40 focus:ring-2 focus:ring-accent-dark/[0.06]"
          />
        </div>

        {/* Additional price */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-olive/75">
              Extra Cost
            </label>

            <span className="text-[10px] font-medium text-olive/50">
              Optional
            </span>
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[14px] font-medium text-olive/60">
              ₱
            </span>

            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={adjustmentPesos}
              onChange={(e) => setAdjustmentPesos(e.target.value)}
              className="h-11 w-full rounded-[12px] border border-platinum bg-white pl-8 pr-3.5 text-[14px] font-medium tabular-nums text-accent-dark shadow-[0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all duration-150 placeholder:text-olive/40 hover:border-olive/25 focus:border-accent-dark/40 focus:ring-2 focus:ring-accent-dark/[0.06]"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2.5">
        <button
          onClick={onCancel}
          className="h-11 min-w-0 flex-1 rounded-[12px] border border-platinum bg-white px-3 text-[13px] font-semibold text-accent-dark transition-all duration-150 hover:bg-platinum/25 active:scale-[0.98]"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="h-11 min-w-0 flex-1 rounded-[12px] bg-accent-dark px-3 text-[13px] font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-all duration-150 hover:bg-accent-dark/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {submitting ? 'Adding…' : 'Add Choice'}
        </button>
      </div>
    </div>
  );
}