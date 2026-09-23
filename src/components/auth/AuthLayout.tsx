import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-[#F4ECE0]">
      {/* Mobile-only hero header */}
      <div
        className="md:hidden relative overflow-hidden rounded-b-surface bg-[#2A2320] px-6 pb-14 motion-safe:animate-fadeInUp"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 28px)' }}
      >
        <div className="relative z-10 flex flex-col items-center">
          <img
            src="/logo-horizontal.png"
            alt="KEKI"
            className="w-48 h-auto mb-5 mx-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
          />

          <p className="text-white/80 text-[15px] leading-relaxed text-center w-full max-w-[280px] mx-auto">
            Turn your Facebook Messenger orders into a smooth, organized shop.
          </p>
        </div>
      </div>

      {/* Desktop-only brand panel */}
      <div className="hidden md:flex md:w-1/2 bg-[#F4ECE0] items-center justify-center p-16 relative overflow-hidden">
        <div className="relative z-10 text-[#2A2320] max-w-sm motion-safe:animate-fadeInUp">
          <img
            src="/logo-horizontal.png"
            alt="KEKI"
            className="w-64 h-auto mb-6 drop-shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
          />

          <p className="text-[#2A2320]/80 text-lg leading-relaxed">
            Manage every order with ease, from the first inquiry to pickup.
          </p>
        </div>
      </div>

      {/* Form area — one wrapper, responsive classes only */}
      <div className="flex-1 flex flex-col md:items-center md:justify-center bg-[#2A2320]">
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