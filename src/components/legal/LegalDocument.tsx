// File: app/src/components/legal/LegalDocument.tsx

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { ScreenShell } from '../layout/ScreenShell';

const EASE = [0.23, 1, 0.32, 1] as const;

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalDocument({ title, lastUpdated, children }: LegalDocumentProps) {
  const navigate = useNavigate();

  function handleBack() {
    // window.history.state.idx is set by React Router's own history
    // stack (via the "history" package under BrowserRouter). idx > 0
    // means there's a real previous entry within this app to return
    // to. If this page was opened directly, a bookmark, a fresh tab,
    // a link from outside the app, idx is 0 and there's nothing to go
    // back to, so fall back to the dashboard instead of doing nothing.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }

  return (
    <ScreenShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: EASE }}
        className="flex items-center gap-3 mb-6"
      >
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center justify-center transition-transform duration-150 active:scale-90 shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft size={17} className="text-olive" />
        </button>
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight text-accent-dark">
            {title}
          </h1>
          <p className="text-[12px] text-olive">Last updated: {lastUpdated}</p>
        </div>
      </motion.div>

      <div className="max-w-2xl bg-white rounded-[18px] p-5 md:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div
          className="
            space-y-4
            [&_h2]:font-display [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-accent-dark [&_h2]:mt-6 [&_h2]:mb-2 [&_h2:first-child]:mt-0
            [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:text-accent-dark [&_h3]:mt-4 [&_h3]:mb-1.5
            [&_p]:text-[14px] [&_p]:text-olive [&_p]:leading-relaxed
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:text-[14px] [&_ul]:text-olive
            [&_li]:leading-relaxed
            [&_a]:text-accent-dark [&_a]:font-semibold [&_a]:underline
            [&_strong]:text-accent-dark [&_strong]:font-semibold
          "
        >
          {children}
        </div>
      </div>
    </ScreenShell>
  );
}