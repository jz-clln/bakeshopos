// File: app/src/screens/AuthScreen.tsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cake } from 'lucide-react';
import { SignInForm } from '../components/auth/SignInForm';
import { SignUpFlow } from '../components/auth/SignUpFlow';

const EASE = [0.23, 1, 0.32, 1] as const;

export function AuthScreen() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#FAFAF8] px-5"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Brand mark */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="flex flex-col items-center gap-3 mb-10"
      >
        <div className="w-16 h-16 rounded-[20px] bg-accent-dark flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
          <Cake size={28} className="text-white" strokeWidth={1.75} />
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-accent-dark">Keki</h1>
          <p className="text-sm text-olive mt-0.5">Your bakery, beautifully managed.</p>
        </div>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.08 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-[24px] shadow-[0_4px_32px_rgba(0,0,0,0.10)] overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-platinum/60">
            {(['sign-in', 'sign-up'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-4 text-sm font-semibold transition-colors duration-200 relative ${
                  mode === m ? 'text-accent-dark' : 'text-olive'
                }`}
              >
                {m === 'sign-in' ? 'Sign in' : 'Create account'}
                {mode === m && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-dark rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Form body */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === 'sign-in' ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'sign-in' ? 12 : -12 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                {mode === 'sign-in' ? (
                  <SignInForm onSwitchToSignUp={() => setMode('sign-up')} />
                ) : (
                  <SignUpFlow onSwitchToSignIn={() => setMode('sign-in')} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}