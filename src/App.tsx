// File: app/src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth-context';
import { AuthScreen } from './screens/AuthScreen';
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
import { PrivacyPolicyScreen } from './screens/PrivacyPolicyScreen';
import { TermsScreen } from './screens/TermsScreen';
import { CookiesPolicyScreen } from './screens/CookiesPolicyScreen';
import { PrivacySecurityScreen } from './screens/PrivacySecurityScreen';

export default function App() {
  const { session, loading } = useAuth();

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
              <Route path="/settings/privacy" element={<PrivacySecurityScreen />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}