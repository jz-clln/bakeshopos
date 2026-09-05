// File: app/src/screens/SettingsScreen.tsx
//
// The one part of this shell that's actually functional right now —
// everything needs a way to sign out to be testable end to end.

import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../lib/auth-context';

export function SettingsScreen() {
  const { signOut, role } = useAuth();

  return (
    <AppShell title="Settings">
      <div className="pt-4 space-y-4">
        {role && (
          <p className="text-sm text-gray-500">
            Signed in as <span className="font-medium text-gray-700">{role}</span>
          </p>
        )}
        <button
          onClick={signOut}
          className="w-full min-h-[44px] rounded-xl border border-gray-300 text-red-600 font-medium"
        >
          Sign Out
        </button>
      </div>
    </AppShell>
  );
}