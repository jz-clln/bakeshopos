// File: app/src/components/auth/SignInForm.tsx

import { useState, type FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { IconInput } from './IconInput';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
}

type OAuthProvider = 'google';

export function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) setError(signInError);
  }

  // Explicit redirectTo instead of relying on Supabase's configured Site
  // URL default — that default was what was sending people to a Vercel
  // auth wall instead of back into the app. Make sure this exact origin
  // is also added to Supabase Dashboard -> Authentication -> URL
  // Configuration -> Redirect URLs.
  async function handleOAuthSignIn(provider: OAuthProvider) {
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

  const anyLoading = submitting || oauthLoading !== null;

  return (
    <div>
      <h1 className="font-display text-[30px] leading-tight font-semibold text-accent-dark mb-1.5">
        Welcome back
      </h1>
      <p className="text-olive text-[15px] mb-8">Sign in to your shop</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <IconInput
          icon={Mail}
          type="email"
          placeholder="Email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <IconInput
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="text-olive min-w-[24px] min-h-[24px] flex items-center justify-center"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {error && (
          <p className="text-sm text-red-600 motion-safe:animate-fadeInUp" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={anyLoading}
          className="w-full min-h-[56px] rounded-control bg-accent-dark text-white font-semibold shadow-control transition-transform active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 mt-2"
        >
          {submitting && <Loader2 size={18} className="animate-spin" />}
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-black/10" />
        <span className="text-[11px] tracking-wide text-olive/70 font-semibold">
          OR CONTINUE WITH
        </span>
        <div className="flex-1 h-px bg-black/10" />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleOAuthSignIn('google')}
          disabled={anyLoading}
          className="w-full min-h-[52px] rounded-control border border-black/10 bg-white text-[15px] font-medium text-accent-dark flex items-center justify-center gap-3 transition-colors hover:bg-black/[0.03] disabled:opacity-50"
        >
          {oauthLoading === 'google' ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-olive">
        Don't have a shop yet?{' '}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-accent font-semibold"
        >
          Create one
        </button>
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