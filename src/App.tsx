// File: app/src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth-context';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingShopScreen } from './screens/OnboardingShopScreen';
import { AppShell } from './components/layout/AppShell';
import { DashboardScreen } from './screens/DashboardScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { NewOrderScreen } from './screens/NewOrderScreen';
import { CatalogScreen } from './screens/CatalogScreen';
import { ProductEditorScreen } from './screens/ProductEditorScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { ConversationDetailScreen } from './screens/ConversationDetailScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ShopDetailsScreen } from './screens/ShopDetailsScreen';
import { PrivacySecurityScreen } from './screens/PrivacySecurityScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { PrivacyPolicyScreen } from './screens/PrivacyPolicyScreen';
import { TermsScreen } from './screens/TermsScreen';
import { CookiesPolicyScreen } from './screens/CookiesPolicyScreen';

export default function App() {
  const { session, organizationId, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-platinum/30" />;
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public, reachable whether signed in or not — required for
            Meta's app review (public Privacy Policy URL) and so people
            can read the Terms before creating an account. */}
        <Route path="/privacy" element={<PrivacyPolicyScreen />} />
        <Route path="/terms"   element={<TermsScreen />}         />
        <Route path="/cookies" element={<CookiesPolicyScreen />} />

        {!session ? (
          <Route path="*" element={<AuthScreen />} />
        ) : !organizationId ? (
          // Signed in but no shop yet. In practice this is almost always
          // a first-time Google/Facebook sign-up — OAuth can't carry
          // organization_name through to the 0016_auth_bootstrap.sql
          // trigger the way email/password signUp() does, so there's no
          // membership row yet. Also catches any other account that
          // ends up without one. Once invited-staff membership rows
          // exist (Phase 1), this branch may need to distinguish
          // "no shop yet" from "invite pending" — not a concern today
          // since that flow isn't built yet.
          <Route path="*" element={<OnboardingShopScreen />} />
        ) : (
          <>
            <Route element={<AppShell />}>
              <Route path="/"           element={<DashboardScreen />}    />
              <Route path="/orders"     element={<OrdersScreen />}        />
              <Route path="/orders/new" element={<NewOrderScreen />}      />
              <Route path="/catalog"    element={<CatalogScreen />}       />
              <Route path="/catalog/new"          element={<ProductEditorScreen />} />
              <Route path="/catalog/:productId"   element={<ProductEditorScreen />} />
              <Route path="/messages"   element={<MessagesScreen />}      />
              <Route path="/messages/:conversationId" element={<ConversationDetailScreen />} />
              <Route path="/settings"   element={<SettingsScreen />}      />
              <Route path="/settings/shop" element={<ShopDetailsScreen />} />
              <Route path="/settings/notifications" element={<NotificationsScreen />} />
              <Route path="/settings/privacy" element={<PrivacySecurityScreen />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}