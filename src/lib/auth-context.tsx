// File: app/src/lib/auth-context.tsx
//
// Wraps Supabase's own session state and adds the one thing every
// screen actually needs: which organization the logged-in user
// belongs to, and what role they have there (owner or staff).

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextValue {
  session: Session | null;
  organizationId: string | null;
  role: 'owner' | 'staff' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [role, setRole] = useState<'owner' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMembership(currentSession: Session | null) {
    if (!currentSession) {
      setOrganizationId(null);
      setRole(null);
      return;
    }

    const { data, error } = await supabase
      .from('memberships')
      .select('organization_id, role')
      .limit(1)
      .single();

    if (error || !data) {
      setOrganizationId(null);
      setRole(null);
      return;
    }

    setOrganizationId(data.organization_id);
    setRole(data.role as 'owner' | 'staff');
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      loadMembership(currentSession).finally(() => setLoading(false));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        loadMembership(currentSession);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ session, organizationId, role, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}