// File: app/src/screens/LoginScreen.tsx

import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth-context';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div
      className="min-h-screen flex flex-col justify-center px-6"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <h1 className="text-3xl font-semibold text-gray-900 mb-1">
        BakeShopOS
      </h1>
      <p className="text-gray-500 mb-8">Sign in to your shop</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-[44px] px-4 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-accent"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full min-h-[44px] px-4 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-accent"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[44px] rounded-xl bg-accent text-white font-medium disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}