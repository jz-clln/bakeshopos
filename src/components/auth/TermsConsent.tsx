// File: app/src/components/auth/TermsConsent.tsx

import { Link } from 'react-router-dom';

interface TermsConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function TermsConsent({ checked, onChange }: TermsConsentProps) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-accent-dark shrink-0"
      />
      <span className="text-[13px] text-olive leading-relaxed">
        I agree to the{' '}
        <Link to="/terms" className="text-accent-dark font-semibold underline">
          Terms and Conditions
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-accent-dark font-semibold underline">
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );
}