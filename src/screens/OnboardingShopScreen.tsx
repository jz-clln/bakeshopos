// File: app/src/screens/OnboardingShopScreen.tsx
//
// Shown when someone is authenticated but has no organization yet —
// in practice, almost always a first-time Google/Facebook sign-up,
// since OAuth can't carry organization_name into the
// 0016_auth_bootstrap.sql trigger the way email/password signUp()
// does. Calls create_organization_for_current_user (see
// 0017_create_organization_rpc.sql) to create the shop, then refreshes
// auth-context so App.tsx routes into the normal app on its own —
// no manual navigation needed here.

import { useState } from 'react';
import { Store, Loader2 } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { IconInput } from '../components/auth/IconInput';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

export function OnboardingShopScreen() {
  const { refreshOrganization, signOut } = useAuth();
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!shopName.trim()) {
      setError('Enter your shop name to continue.');
      return;
    }

    setSubmitting(true);
    const { error: rpcError } = await supabase.rpc(
      'create_organization_for_current_user',
      { org_name: shopName.trim() }
    );

    if (rpcError) {
      setSubmitting(false);
      setError(rpcError.message);
      return;
    }

    await refreshOrganization();
    setSubmitting(false);
  }

  return (
    <AuthLayout>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-accent-dark mb-1.5">
            One last step
          </h1>
          <p className="text-olive text-[15px]">
            You're signed in — now let's set up your shop.
          </p>
        </div>

        <IconInput
          icon={Store}
          type="text"
          placeholder="e.g. Sweet Treats by Maria"
          value={shopName}
          onChange={setShopName}
          required
        />

        {error && (
          <p className="text-sm text-red-600 motion-safe:animate-fadeInUp" role="alert">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full min-h-[56px] rounded-control bg-accent-dark text-white font-semibold shadow-control transition-transform active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 size={18} className="animate-spin" />}
          {submitting ? 'Creating your shop…' : 'Create Shop'}
        </button>

        {/* Escape hatch — someone could land here by mistake, or want
            to try a different account instead of naming a shop now. */}
        <button
          type="button"
          onClick={signOut}
          className="w-full text-center text-sm text-olive"
        >
          Sign out
        </button>
      </div>
    </AuthLayout>
  );
}