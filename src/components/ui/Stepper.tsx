// File: app/src/components/ui/Stepper.tsx

import { Minus, Plus } from 'lucide-react';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel: string;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  ariaLabel,
}: StepperProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label={`Decrease ${ariaLabel}`}
        className="w-8 h-8 rounded-full bg-platinum flex items-center justify-center text-accent-dark transition-transform duration-150 active:scale-90 disabled:opacity-30 disabled:active:scale-100"
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <span className="text-[15px] font-semibold text-accent-dark w-6 text-center tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        aria-label={`Increase ${ariaLabel}`}
        className="w-8 h-8 rounded-full bg-platinum flex items-center justify-center text-accent-dark transition-transform duration-150 active:scale-90 disabled:opacity-30 disabled:active:scale-100"
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}