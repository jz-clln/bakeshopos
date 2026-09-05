// File: app/src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth-context';
import { AuthScreen } from './screens/AuthScreen';
import { AppShell } from './components/layout/AppShell';
import { DashboardScreen } from './screens/DashboardScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { CatalogScreen } from './screens/CatalogScreen';
import { ProductEditorScreen } from './screens/ProductEditorScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    // Deliberately blank rather than a spinner — this only shows for a
    // moment while Supabase checks for an existing session on load.
    return <div className="min-h-screen bg-platinum/30" />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardScreen />} />
          <Route path="/orders" element={<OrdersScreen />} />
          <Route path="/catalog" element={<CatalogScreen />} />
          <Route path="/catalog/new" element={<ProductEditorScreen />} />
          <Route path="/catalog/:productId" element={<ProductEditorScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}