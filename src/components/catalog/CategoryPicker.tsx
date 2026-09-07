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
  const { data: categories = [] } = useCategories();
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
        className="flex items-center justify-between w-full text-left"
      >
        <span className={`text-[15px] ${selected ? 'text-accent-dark' : 'text-olive/60'}`}>
          {displayLabel}
        </span>
        <ChevronRight size={16} className="text-olive/50 shrink-0" />
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
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Sheet panel */}
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.8 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.14)]"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-platinum" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-platinum/60">
                <p className="text-[17px] font-semibold text-accent-dark">Category</p>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-platinum/60 flex items-center justify-center"
                >
                  <X size={15} className="text-olive" />
                </button>
              </div>

              {/* Options list */}
              <div className="overflow-y-auto max-h-64">
                {/* None option */}
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false); }}
                  className="w-full flex items-center justify-between px-5 py-3.5 min-h-[52px] border-b border-platinum/40 transition-colors duration-150 active:bg-platinum/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-platinum/60 flex items-center justify-center">
                      <Tag size={14} className="text-olive" />
                    </div>
                    <span className="text-[15px] text-olive">Uncategorized</span>
                  </div>
                  {!value && <Check size={16} className="text-accent-dark" strokeWidth={2.5} />}
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { onChange(cat.id); setOpen(false); }}
                    className="w-full flex items-center justify-between px-5 py-3.5 min-h-[52px] border-b border-platinum/40 last:border-0 transition-colors duration-150 active:bg-platinum/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-light/30 flex items-center justify-center">
                        <span className="text-[13px] font-bold text-accent-dark">
                          {cat.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[15px] text-accent-dark">{cat.name}</span>
                    </div>
                    {value === cat.id && (
                      <Check size={16} className="text-accent-dark" strokeWidth={2.5} />
                    )}
                  </button>
                ))}
              </div>

              {/* Add new category */}
              <div className="px-5 pt-3 border-t border-platinum/60">
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
                      className="w-full flex items-center gap-3 py-3 text-accent-dark transition-opacity duration-150 hover:opacity-70"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent-dark/10 flex items-center justify-center">
                        <Plus size={15} className="text-accent-dark" strokeWidth={2.5} />
                      </div>
                      <span className="text-[15px] font-semibold">Add new category</span>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="add-form"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: EASE }}
                      className="flex items-center gap-3 py-2"
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCategory();
                          if (e.key === 'Escape') { setAdding(false); setNewName(''); }
                        }}
                        placeholder="Category name"
                        className="flex-1 h-11 bg-platinum/40 rounded-[12px] px-4 text-[15px] text-accent-dark placeholder:text-olive/50 focus:outline-none focus:ring-2 focus:ring-accent-dark/20"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={!newName.trim() || saving}
                        className="h-11 px-4 rounded-[12px] bg-accent-dark text-white text-[14px] font-semibold disabled:opacity-40 transition-opacity duration-150 shrink-0"
                      >
                        {saving ? 'Adding…' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAdding(false); setNewName(''); }}
                        className="w-11 h-11 rounded-[12px] bg-platinum/40 flex items-center justify-center shrink-0"
                      >
                        <X size={15} className="text-olive" />
                      </button>
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