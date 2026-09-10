// File: app/src/components/auth/AuthLayout.tsx
//
// Mobile gets a hero-plus-bottom-sheet layout — a gradient header with
// the brand mark and tagline, and the form living on a rounded white
// sheet that overlaps it slightly. Desktop keeps the two-panel split.
//
// The gradient reads as a dusk-to-dawn sky (Dusk Blue -> Steel Blue)
// with a single soft Icy Blue glow standing in for first light —
// bakers are up before sunrise, so the color story is literal rather
// than decorative. One glow, not a field of blob-shapes.
//
// The form itself (`children`) is mounted exactly once — only the
// wrapper's classes change between breakpoints, never the DOM
// structure, so mobile and desktop never end up as two independent
// copies of the same form with separate state.

import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-platinum/40">
      {/* Mobile-only hero header */}
      <div
        className="md:hidden relative overflow-hidden rounded-b-surface bg-gradient-to-br from-accent-dark to-accent px-6 pb-14 motion-safe:animate-fadeInUp"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 28px)' }}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent-light/25 blur-2xl" />
        <div className="relative z-10">
          <img
            src="/logo-horizontal.png"
            alt="KEKI"
            className="w-48 h-auto mb-5 drop-shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
          />
          <p className="text-white/80 text-[15px] leading-relaxed max-w-[280px]">
            Turn your Facebook Messenger orders into a smooth, organized shop.
          </p>
        </div>
      </div>

      {/* Desktop-only brand panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-accent-dark to-accent items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-accent-light/20 blur-3xl" />
        <div className="relative z-10 text-white max-w-sm motion-safe:animate-fadeInUp">
          <img
            src="/logo-horizontal.png"
            alt="KEKI"
            className="w-64 h-auto mb-6 drop-shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
          />
          <p className="text-white/80 text-lg leading-relaxed">
            Manage every order with ease, from the first inquiry to pickup.
          </p>
        </div>
      </div>

      {/* Form area — one wrapper, responsive classes only */}
      <div className="flex-1 flex flex-col md:items-center md:justify-center">
        <div
          className="flex-1 md:flex-none -mt-8 md:mt-0 rounded-t-surface md:rounded-surface bg-white shadow-card px-6 md:px-10 pt-9 md:py-10 relative z-10 md:max-w-sm md:mx-auto motion-safe:animate-fadeInUp"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}
        >
          <div className="w-full max-w-sm mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}