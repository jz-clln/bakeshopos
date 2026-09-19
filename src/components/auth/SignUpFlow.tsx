// File: app/src/components/auth/SignUpFlow.tsx
//
// One field per step, with a progress bar, is a deliberate choice —
// asking for everything on one long form feels heavier and easier to
// abandon than a short guided sequence. Passing organization_name in
// the sign-up metadata triggers 0016_auth_bootstrap.sql, which creates
// the shop automatically.
//
// Google sign-up is the exception to that: signInWithOAuth() has no
// equivalent to signUp()'s options.data, so there's no way to hand it
// organization_name before the redirect. A first-time Google user will
// authenticate fine but won't get a shop created by the trigger — see
// OnboardingShopScreen.tsx / create_organization_for_current_user for
// how that's handled after they land back in the app.

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
type OAuthProvider = 'google';

// A lightweight shape check, not full RFC 5322 validation — that's
// intentionally overkill for a signup form. Real deliverability is
// already verified downstream by Supabase's confirmation email; this
// just catches obvious non-emails before they get that far. There's
// no <form> element wrapping these steps, so the input's
// type="email" never gets a chance to trigger the browser's own
// format validation (that only fires on an actual form submission) —
// "Continue" is a plain onClick, so this check has to happen here.
const EMAIL_SHAPE_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  function goNext() {
    setError(null);
    if (step === 1 && !shopName.trim()) {
      setError('Enter your shop name to continue.');
      return;
    }
    if (step === 2) {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError('Enter your email to continue.');
        return;
      }
      if (!EMAIL_SHAPE_REGEX.test(trimmedEmail)) {
        setError('Enter a valid email address.');
        return;
      }
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

  // Same explicit redirectTo as SignInForm — relying on Supabase's
  // configured Site URL default was sending people to a Vercel auth
  // wall instead of back into the app. This origin also needs to be
  // in Supabase Dashboard -> Authentication -> URL Configuration ->
  // Redirect URLs, or Supabase rejects it regardless of what's sent here.
  async function handleOAuthSignUp(provider: OAuthProvider) {
    setError(null);
    setOauthLoading(provider);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
    }
    // On success the browser navigates away to the provider's consent
    // screen, so there's no "success" branch here to reset loading state.
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
          <>
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => handleOAuthSignUp('google')}
                disabled={oauthLoading !== null}
                className="w-full min-h-[52px] rounded-control border border-black/10 bg-white text-[15px] font-medium text-accent-dark flex items-center justify-center gap-3 transition-colors hover:bg-black/[0.03] disabled:opacity-50"
              >
                {oauthLoading === 'google' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Sign up with Google
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-black/10" />
              <span className="text-[11px] tracking-wide text-olive/70 font-semibold">
                OR SIGN UP WITH EMAIL
              </span>
              <div className="flex-1 h-px bg-black/10" />
            </div>

            <StepShopName value={shopName} onChange={setShopName} onNext={goNext} />
          </>
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
      <p className="text-center text-[12px] text-olive/80 leading-relaxed">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.87-3.04.87-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.73A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.19.29-1.73V4.94H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.06l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}