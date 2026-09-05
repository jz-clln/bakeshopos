// File: app/src/screens/DashboardScreen.tsx
//
// Placeholder for now — the real dashboard content (today's orders,
// pending payments, production queue) gets built once Orders (1E) and
// Payments (1F) exist. This just proves the shell and navigation work.

import { AppShell } from '../components/layout/AppShell';

export function DashboardScreen() {
  return (
    <AppShell title="Dashboard">
      <div className="pt-4">
        <p className="text-gray-500">
          Your shop's daily overview will appear here once orders and
          payments are wired up in later phases.
        </p>
      </div>
    </AppShell>
  );
}