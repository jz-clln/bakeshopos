// File: app/src/components/catalog/CategoryPicker.tsx
//
// A custom bottom-sheet picker for categories.
// Replaces the native <select> with a branded sheet that also lets
// the user add a new category inline without leaving the screen.

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Plus, X, Tag } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-context';
import { useCategories } from '../../hooks/useCategories';
import { createCategory } from '../../api/categories';

const EASE = [0.23, 1, 0.32, 1] as const;

interface CategoryPickerProps {
  value: string;
  onChange: (id: string) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { organizationId } = useAuth();
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useCategories();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = categories.find((c) => c.id === value);
  const displayLabel = selected ? selected.name : 'Uncategorized';

  useEffect(() => {
    if (adding) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [adding]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  async function handleAddCategory() {
    if (!newName.trim() || !organizationId) return;

    setSaving(true);

    try {
      const created = await createCategory(
        organizationId,
        newName.trim(),
        categories.length
      );

      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      onChange(created.id);
      setNewName('');
      setAdding(false);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="group flex w-full items-center justify-between text-left"
      >
        <span
          className={`text-[15px] font-medium tracking-[-0.01em] ${
            selected ? 'text-accent-dark' : 'text-olive/60'
          }`}
        >
          {displayLabel}
        </span>

        <ChevronRight
          size={16}
          strokeWidth={2}
          className="shrink-0 text-olive/35 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </button>

      {/* Sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[3px]"
              onClick={() => setOpen(false)}
            />

            {/* Sheet panel */}
            <motion.div
              key="sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-sheet-title"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                stiffness: 360,
                damping: 36,
                mass: 0.85,
              }}
              className="fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-[32px] border-t border-white/70 bg-[#F7F7F5] shadow-[0_-16px_60px_rgba(0,0,0,0.16)]"
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pb-2 pt-2.5">
                <div className="h-[5px] w-9 rounded-full bg-black/15" />
              </div>

              {/* Header */}
              <div className="relative flex min-h-[54px] items-center justify-center px-5">
                <h2
                  id="category-sheet-title"
                  className="text-[17px] font-semibold tracking-[-0.02em] text-accent-dark"
                >
                  Category
                </h2>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.055] text-olive transition-all duration-150 hover:bg-black/[0.09] active:scale-90"
                >
                  <X size={15} strokeWidth={2.2} />
                </button>
              </div>

              {/* Options */}
              <div className="px-4 pb-2 pt-1">
                <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-black/[0.035]">
                  {/* Uncategorized */}
                  <button
                    type="button"
                    onClick={() => {
                      onChange('');
                      setOpen(false);
                    }}
                    className={`flex min-h-[56px] w-full items-center justify-between px-4 text-left outline-none transition-colors duration-150 active:bg-black/[0.04] ${
                      !value ? 'bg-accent-dark/[0.035]' : 'hover:bg-black/[0.025]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-platinum/55">
                        <Tag
                          size={15}
                          strokeWidth={1.9}
                          className="text-olive"
                        />
                      </div>

                      <span className="truncate text-[15px] font-medium tracking-[-0.01em] text-olive">
                        Uncategorized
                      </span>
                    </div>

                    {!value && (
                      <div className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-dark">
                        <Check
                          size={13}
                          strokeWidth={2.8}
                          className="text-white"
                        />
                      </div>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="ml-[60px] h-px bg-platinum/55" />

                  {categoriesLoading && (
                    <div className="space-y-3 px-4 py-4">
                      {[0, 1, 2].map((item) => (
                        <div
                          key={item}
                          className="flex animate-pulse items-center gap-3"
                        >
                          <div className="h-8 w-8 rounded-[9px] bg-platinum/55" />

                          <div className="h-3.5 w-32 rounded-full bg-platinum/55" />
                        </div>
                      ))}
                    </div>
                  )}

                  {categoriesError && (
                    <div className="px-4 py-5 text-center">
                      <p className="text-[13px] font-medium text-olive">
                        Couldn't load categories.
                      </p>

                      <p className="mt-0.5 text-[12px] text-olive/60">
                        Try again in a moment.
                      </p>
                    </div>
                  )}

                  {!categoriesLoading &&
                    !categoriesError &&
                    categories.map((cat, index) => {
                      const isSelected = value === cat.id;

                      return (
                        <div key={cat.id}>
                          {index > 0 && (
                            <div className="ml-[60px] h-px bg-platinum/55" />
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              onChange(cat.id);
                              setOpen(false);
                            }}
                            className={`flex min-h-[56px] w-full items-center justify-between px-4 text-left outline-none transition-colors duration-150 active:bg-black/[0.04] ${
                              isSelected
                                ? 'bg-accent-dark/[0.035]'
                                : 'hover:bg-black/[0.025]'
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] transition-colors duration-150 ${
                                  isSelected
                                    ? 'bg-accent-dark'
                                    : 'bg-accent-light/30'
                                }`}
                              >
                                <span
                                  className={`text-[13px] font-semibold ${
                                    isSelected
                                      ? 'text-white'
                                      : 'text-accent-dark'
                                  }`}
                                >
                                  {cat.name.charAt(0).toUpperCase()}
                                </span>
                              </div>

                              <span
                                className={`truncate text-[15px] tracking-[-0.01em] ${
                                  isSelected
                                    ? 'font-semibold text-accent-dark'
                                    : 'font-medium text-accent-dark'
                                }`}
                              >
                                {cat.name}
                              </span>
                            </div>

                            {isSelected && (
                              <div className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-dark">
                                <Check
                                  size={13}
                                  strokeWidth={2.8}
                                  className="text-white"
                                />
                              </div>
                            )}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Add category */}
              <div className="px-4 pt-2">
                <AnimatePresence mode="wait">
                  {!adding ? (
                    <motion.button
                      key="add-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      type="button"
                      onClick={() => setAdding(true)}
                      className="flex min-h-[56px] w-full items-center gap-3 rounded-[18px] bg-white px-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-black/[0.035] transition-all duration-150 hover:bg-white/80 active:scale-[0.99] active:bg-black/[0.025]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent-dark">
                        <Plus
                          size={16}
                          strokeWidth={2.4}
                          className="text-white"
                        />
                      </div>

                      <span className="text-[15px] font-semibold tracking-[-0.01em] text-accent-dark">
                        Add New Category
                      </span>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="add-form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="rounded-[18px] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-black/[0.035]"
                    >
                      <p className="mb-2.5 px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-olive/65">
                        New Category
                      </p>

                      <input
                        ref={inputRef}
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCategory();

                          if (e.key === 'Escape') {
                            setAdding(false);
                            setNewName('');
                          }
                        }}
                        placeholder="Category name"
                        className="h-11 w-full rounded-[12px] border border-transparent bg-[#F2F2F0] px-3.5 text-[15px] font-medium tracking-[-0.01em] text-accent-dark outline-none transition-all duration-150 placeholder:font-normal placeholder:text-olive/45 focus:border-accent-dark/15 focus:bg-white focus:ring-2 focus:ring-accent-dark/[0.06]"
                      />

                      <div className="mt-2.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAdding(false);
                            setNewName('');
                          }}
                          className="h-11 flex-1 rounded-[12px] bg-[#F2F2F0] text-[14px] font-semibold text-accent-dark transition-all duration-150 hover:bg-platinum/70 active:scale-[0.98]"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={handleAddCategory}
                          disabled={!newName.trim() || saving}
                          className="h-11 flex-1 rounded-[12px] bg-accent-dark text-[14px] font-semibold text-white shadow-[0_2px_5px_rgba(0,0,0,0.12)] transition-all duration-150 hover:bg-accent-dark/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                        >
                          {saving ? 'Adding…' : 'Add Category'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}