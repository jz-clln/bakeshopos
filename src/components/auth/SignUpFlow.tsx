// File: app/src/components/auth/SignUpFlow.tsx
//
// One field per step, with a progress bar, is a deliberate choice —
// asking for everything on one long form feels heavier and easier to
// abandon than a short guided sequence. Passing organization_name in
// the sign-up metadata triggers 0016_auth_bootstrap.sql, which creates
// the shop automatically.

import { useState } from 'react';
import { ChevronLeft, Loader2, Mail, Lock, Store } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ProgressBar } from './ProgressBar';
import { IconInput } from './IconInput';
import { TermsConsent } from './TermsConsent';

interface SignUpFlowProps {
  onSwitchToSignIn: () => void;
}

type Step = 1 | 2 | 3;
const TOTAL_STEPS = 3;

export function SignUpFlow({ onSwitchToSignIn }: SignUpFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  function goNext() {
    setError(null);
    if (step === 1 && !shopName.trim()) {
      setError('Enter your shop name to continue.');
      return;
    }
    if (step === 2 && !email.trim()) {
      setError('Enter your email to continue.');
      return;
    }
    setStep((s) => (s + 1) as Step);
  }

  function goBack() {
    setError(null);
    if (step === 1) {
      onSwitchToSignIn();
      return;
    }
    setStep((s) => (s - 1) as Step);
  }

  async function handleCreateAccount() {
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!termsAccepted) {
      setError('Please agree to the Terms and Conditions and Privacy Policy to continue.');
      return;
    }

    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          organization_name: shopName.trim(),
          terms_accepted: termsAccepted,
        },
      },
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setAwaitingConfirmation(true);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="text-center motion-safe:animate-fadeInUp">
        <div className="w-16 h-16 rounded-control bg-accent-light/30 flex items-center justify-center mx-auto mb-6">
          <Mail size={28} className="text-accent-dark" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-accent-dark mb-2">
          Check your email
        </h1>
        <p className="text-olive text-[15px] mb-8 leading-relaxed">
          We sent a confirmation link to{' '}
          <span className="font-medium text-accent-dark">{email}</span>. Tap it to
          finish setting up {shopName}.
        </p>
        <button onClick={onSwitchToSignIn} className="text-accent font-semibold">
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={goBack}
        aria-label="Back"
        className="mb-7 -ml-1 text-olive min-w-[32px] min-h-[32px] flex items-center"
      >
        <ChevronLeft size={22} />
      </button>

      <div className="mb-8">
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
      </div>

      <div key={step} className="motion-safe:animate-slideInRight">
        {step === 1 && (
          <StepShopName value={shopName} onChange={setShopName} onNext={goNext} />
        )}
        {step === 2 && <StepEmail value={email} onChange={setEmail} onNext={goNext} />}
        {step === 3 && (
          <StepPassword
            password={password}
            confirmPassword={confirmPassword}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            termsAccepted={termsAccepted}
            onTermsAcceptedChange={setTermsAccepted}
            onSubmit={handleCreateAccount}
            submitting={submitting}
          />
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 motion-safe:animate-fadeInUp" role="alert">
          {error}
        </p>
      )}

      <p className="mt-8 text-center text-sm text-olive">
        Already have a shop?{' '}
        <button type="button" onClick={onSwitchToSignIn} className="text-accent font-semibold">
          Sign in
        </button>
      </p>
    </div>
  );
}

function StepShopName({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-accent-dark mb-1.5">
          What's your shop called?
        </h1>
        <p className="text-olive text-[15px]">This is how customers will see you.</p>
      </div>
      <IconInput
        icon={Store}
        type="text"
        placeholder="e.g. Sweet Treats by Maria"
        value={value}
        onChange={onChange}
        required
      />
      <button
        onClick={onNext}
        className="w-full min-h-[56px] rounded-control bg-accent-dark text-white font-semibold shadow-control transition-transform active:scale-[0.98]"
      >
        Continue
      </button>
    </div>
  );
}

function StepEmail({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-accent-dark mb-1.5">
          What's your email?
        </h1>
        <p className="text-olive text-[15px]">You'll use this to sign in.</p>
      </div>
      <IconInput
        icon={Mail}
        type="email"
        placeholder="Email"
        value={value}
        onChange={onChange}
        autoComplete="email"
        required
      />
      <button
        onClick={onNext}
        className="w-full min-h-[56px] rounded-control bg-accent-dark text-white font-semibold shadow-control transition-transform active:scale-[0.98]"
      >
        Continue
      </button>
    </div>
  );
}

function StepPassword({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  termsAccepted,
  onTermsAcceptedChange,
  onSubmit,
  submitting,
}: {
  password: string;
  confirmPassword: string;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  termsAccepted: boolean;
  onTermsAcceptedChange: (v: boolean) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-accent-dark mb-1.5">
          Create a password
        </h1>
        <p className="text-olive text-[15px]">At least 8 characters.</p>
      </div>
      <IconInput
        icon={Lock}
        type="password"
        placeholder="Password"
        value={password}
        onChange={onPasswordChange}
        autoComplete="new-password"
        required
      />
      <IconInput
        icon={Lock}
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        autoComplete="new-password"
        required
      />
      <TermsConsent checked={termsAccepted} onChange={onTermsAcceptedChange} />
      <button
        onClick={onSubmit}
        disabled={submitting || !termsAccepted}
        className="w-full min-h-[56px] rounded-control bg-accent-dark text-white font-semibold shadow-control transition-transform active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 size={18} className="animate-spin" />}
        {submitting ? 'Creating your shop…' : 'Create Shop'}
      </button>
    </div>
  );
}