// File: app/src/components/ui/Calendar.tsx

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN = [0.55, 0.06, 0.68, 0.19] as const;
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const popoverVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.13, ease: EASE_IN } },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: EASE_OUT } },
};

interface CalendarInputProps {
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string; // 'YYYY-MM-DD'
  className?: string;
}

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateString(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDisplay(s: string): string {
  const d = parseDateString(s);
  if (!d) return '';
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function CalendarInput({
  value,
  onChange,
  placeholder = 'Select a date…',
  minDate,
  className = '',
}: CalendarInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = parseDateString(value);
  const [viewMonth, setViewMonth] = useState(() => selectedDate ?? new Date());
  const minDateObj = minDate ? parseDateString(minDate) : null;

  useEffect(() => {
    if (selectedDate) setViewMonth(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: (Date | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function isDisabled(d: Date) {
    return !!minDateObj && d < minDateObj;
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border text-[14px] text-left transition-colors duration-150 bg-white ${
          open ? 'border-accent-dark/40' : 'border-platinum'
        }`}
      >
        <CalendarIcon size={15} className="text-olive shrink-0" />
        <span className={value ? 'text-accent-dark font-medium' : 'text-olive'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={popoverVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute z-20 mt-1.5 w-[280px] bg-white rounded-[16px] border border-platinum shadow-[0_10px_24px_-8px_rgba(39,76,119,0.22)] p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-platinum/50 transition-transform duration-150 active:scale-90"
                aria-label="Previous month"
              >
                <ChevronLeft size={15} className="text-accent-dark" />
              </button>
              <p className="font-display text-[14px] font-bold text-accent-dark">
                {viewMonth.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
              </p>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-platinum/50 transition-transform duration-150 active:scale-90"
                aria-label="Next month"
              >
                <ChevronRight size={15} className="text-accent-dark" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAY_LABELS.map((w, i) => (
                <p key={i} className="text-center text-[11px] font-semibold text-olive py-1">
                  {w}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const isSelected = selectedDate ? isSameDay(d, selectedDate) : false;
                const isToday = isSameDay(d, today);
                const disabled = isDisabled(d);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    aria-label={d.toLocaleDateString('en-PH', {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                    })}
                    onClick={() => {
                      onChange(toDateString(d));
                      setOpen(false);
                    }}
                    className={`h-8 rounded-[8px] text-[13px] font-medium transition-colors duration-150 relative ${
                      isSelected
                        ? 'bg-accent-dark text-white font-semibold'
                        : disabled
                          ? 'text-olive/30 cursor-not-allowed'
                          : 'text-accent-dark hover:bg-platinum/50'
                    }`}
                  >
                    {d.getDate()}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}