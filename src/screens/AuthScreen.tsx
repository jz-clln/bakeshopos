// File: app/src/screens/AuthScreen.tsx

import { useState } from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { SignInForm } from '../components/auth/SignInForm';
import { SignUpFlow } from '../components/auth/SignUpFlow';

export function AuthScreen() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <AuthLayout>
      {mode === 'sign-in' ? (
        <SignInForm onSwitchToSignUp={() => setMode('sign-up')} />
      ) : (
        <SignUpFlow onSwitchToSignIn={() => setMode('sign-in')} />
      )}
    </AuthLayout>
  );
}