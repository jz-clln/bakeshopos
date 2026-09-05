// File: app/src/components/auth/SignInForm.tsx

import { useState, type FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { IconInput } from './IconInput';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
}

export function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) setError(signInError);
  }

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
          disabled={submitting}
          className="w-full min-h-[56px] rounded-control bg-accent-dark text-white font-semibold shadow-control transition-transform active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 mt-2"
        >
          {submitting && <Loader2 size={18} className="animate-spin" />}
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

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