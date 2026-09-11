// File: app/src/screens/NotificationsScreen.tsx

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Share, SquarePlus, ShieldAlert } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import { Switch } from '../components/ui/Switch';
import { usePushNotifications } from '../hooks/usePushNotifications';

const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.26, ease: EASE, delay: i * 0.06 },
  }),
};

export function NotificationsScreen() {
  const navigate = useNavigate();
  const { status, loading, error, enable, disable } = usePushNotifications();

  return (
    <ScreenShell>
      <motion.div
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
        className="flex items-center gap-3 mb-6"
      >
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center justify-center transition-transform duration-150 active:scale-90 shrink-0"
          aria-label="Back to Settings"
        >
          <ArrowLeft size={17} className="text-olive" />
        </button>
        <h1 className="font-display text-[22px] font-bold tracking-tight text-accent-dark">
          Notifications
        </h1>
      </motion.div>

      <div className="space-y-5 max-w-lg">
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5"
        >
          {loading ? (
            <div className="h-14 rounded-[14px] bg-platinum/60 animate-pulse" />
          ) : status === 'needs-install' ? (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-accent-light/30 flex items-center justify-center shrink-0">
                <Bell size={17} className="text-accent-dark" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-accent-dark mb-1">
                  Add Keki to your Home Screen first
                </p>
                <p className="text-[13px] text-olive leading-relaxed">
                  On iPhone, notifications only work once Keki is installed. Tap the{' '}
                  <Share size={13} className="inline -mt-0.5" /> Share button in Safari, then{' '}
                  <span className="inline-flex items-center gap-1 font-medium text-accent-dark">
                    "Add to Home Screen" <SquarePlus size={13} />
                  </span>
                  . Open Keki from the new icon on your Home Screen, then come back here.
                </p>
              </div>
            </div>
          ) : status === 'unsupported' ? (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-platinum/60 flex items-center justify-center shrink-0">
                <ShieldAlert size={17} className="text-olive" />
              </div>
              <p className="text-[14px] text-olive leading-relaxed">
                This browser doesn't support push notifications. Try Chrome on Android, or Safari
                on iOS 16.4 or later.
              </p>
            </div>
          ) : status === 'denied' ? (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-red-50 flex items-center justify-center shrink-0">
                <ShieldAlert size={17} className="text-red-500" />
              </div>
              <p className="text-[14px] text-olive leading-relaxed">
                Notifications are blocked for Keki in your browser settings. Enable them from your
                browser or phone's notification settings for this site, then reopen this page.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-[10px] bg-accent-light/30 flex items-center justify-center shrink-0">
                  <Bell size={17} className="text-accent-dark" />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-accent-dark">Push notifications</p>
                  <p className="text-[13px] text-olive">
                    New orders and customers needing you
                  </p>
                </div>
              </div>
              <Switch
                checked={status === 'on'}
                onChange={(checked) => (checked ? enable() : disable())}
                ariaLabel="Push notifications"
              />
            </div>
          )}
          {error && <p className="text-[13px] text-red-600 mt-3">{error}</p>}
        </motion.div>

        <motion.p
          custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="text-[12px] text-olive px-1 leading-relaxed"
        >
          You'll be notified when a new order comes in through Messenger, or when a customer's
          question needs your personal attention.
        </motion.p>
      </div>
    </ScreenShell>
  );
}