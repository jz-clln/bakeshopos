// File: app/src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth-context';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { CatalogScreen } from './screens/CatalogScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    // Deliberately blank rather than a spinner — this only shows for a
    // moment while Supabase checks for an existing session on load.
    return <div className="min-h-screen bg-[#FAFAF8]" />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardScreen />} />
        <Route path="/orders" element={<OrdersScreen />} />
        <Route path="/catalog" element={<CatalogScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}