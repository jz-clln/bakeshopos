// File: app/src/components/auth/IconInput.tsx

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface IconInputProps {
  icon: LucideIcon;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  trailing?: ReactNode;
}

export function IconInput({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
  trailing,
}: IconInputProps) {
  return (
    <div className="relative">
      <Icon size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-olive" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="w-full min-h-[56px] pl-12 pr-12 rounded-control border border-platinum bg-platinum/40 text-base text-accent-dark placeholder:text-olive/70 transition-colors duration-150 focus:outline-none focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/15"
      />
      {trailing && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">{trailing}</div>
      )}
    </div>
  );
}