// File: app/src/components/ui/Dropdown.tsx

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN = [0.55, 0.06, 0.68, 0.19] as const;

const popoverVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.13, ease: EASE_IN } },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: EASE_OUT } },
};

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  className = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] border text-[14px] text-left transition-colors duration-150 ${
          open ? 'border-accent-dark/40' : 'border-platinum'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'bg-white'}`}
      >
        <span className={selected ? 'text-accent-dark font-medium' : 'text-olive'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-olive shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            variants={popoverVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto bg-white rounded-[12px] border border-platinum shadow-[0_10px_24px_-8px_rgba(39,76,119,0.22)] p-1.5"
          >
            {options.length === 0 ? (
              <p className="px-3 py-2.5 text-[13px] text-olive">No options available</p>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-[10px] text-left text-[14px] transition-colors duration-150 ${
                      isSelected ? 'bg-accent-light/20' : 'hover:bg-platinum/50'
                    }`}
                  >
                    <span>
                      <span className={isSelected ? 'text-accent-dark font-semibold' : 'text-accent-dark'}>
                        {option.label}
                      </span>
                      {option.sublabel && (
                        <span className="block text-[12px] text-olive">{option.sublabel}</span>
                      )}
                    </span>
                    {isSelected && <Check size={15} className="text-accent-dark shrink-0" />}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}