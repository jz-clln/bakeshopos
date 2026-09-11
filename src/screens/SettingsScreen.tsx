// File: app/src/screens/SettingsScreen.tsx

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Instagram,
  Facebook,
  ChevronRight,
  LogOut,
  Store,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScreenShell } from '../components/layout/ScreenShell';
import { useAuth } from '../lib/auth-context';
import { getFacebookConnection, startFacebookConnect, type FacebookConnection } from '../api/facebook';
import { fetchShopIdentity, type ShopIdentity } from '../api/shopProfile';

const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.26, ease: EASE, delay: i * 0.07 },
  }),
};

export function SettingsScreen() {
  const { signOut, role, session, organizationId } = useAuth() as {
    signOut?: () => void;
    role?: string;
    session: { user?: { user_metadata?: { organization_name?: string } } } | null;
    organizationId?: string;
  };

  const [identity, setIdentity] = useState<ShopIdentity | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    fetchShopIdentity(organizationId)
      .then((data) => {
        if (!cancelled) setIdentity(data);
      })
      .catch((err) => {
        console.error('Failed to load shop identity:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  // Falls back to the org name captured at sign-up (and then to a
  // generic label) while the real profile is still loading, so the
  // card never renders blank.
  const shopName =
    identity?.name?.trim() ||
    session?.user?.user_metadata?.organization_name?.trim() ||
    'Your Shop';
  const logoUrl = identity?.logo_url ?? null;

  const [fbConnection, setFbConnection] = useState<FacebookConnection | null>(null);
  const [loadingFb, setLoadingFb] = useState(true);
  const [fbError, setFbError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    getFacebookConnection(organizationId).then((conn) => {
      if (!cancelled) {
        setFbConnection(conn);
        setLoadingFb(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  async function handleConnectFacebook() {
    if (!organizationId) return;
    setFbError(null);
    try {
      await startFacebookConnect(organizationId);
    } catch (err) {
      console.error(err);
      // TODO: replace with a real toast/snackbar component once one
      // exists in the codebase — for now this renders as inline text
      // under the Facebook row (see SettingsRow usage below).
      setFbError('Could not start Facebook connection. Please try again.');
    }
  }

  const fbDescription = loadingFb
    ? 'Checking…'
    : fbConnection?.status === 'connected'
    ? `Connected — ${fbConnection.pageName}`
    : fbConnection?.status === 'needs_reconnect'
    ? 'Needs reconnecting'
    : 'Not connected';

  return (
    <ScreenShell>
      {/* Header */}
      <motion.h1
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
        className="font-display text-[26px] md:text-3xl font-bold tracking-tight text-accent-dark mb-6"
      >
        Settings
      </motion.h1>

      {/* Shop identity card */}
      <motion.div
        custom={1} variants={fadeUp} initial="hidden" animate="visible"
        className="bg-accent-dark rounded-[20px] px-5 py-5 flex items-center gap-4 mb-5 shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
      >
        <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-lg font-bold text-white shrink-0 overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt={`${shopName} logo`} className="w-full h-full object-cover" />
          ) : (
            shopName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-[17px] truncate">{shopName}</p>
          {role && (
            <p className="text-white/60 text-sm capitalize">{role}</p>
          )}
        </div>
      </motion.div>

      {/* Channels */}
      <motion.section custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
          Sales channels
        </p>
        <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-platinum/60">
          <SettingsRow
            icon={<Instagram size={17} className="text-accent-dark" />}
            label="Instagram"
            description="Coming soon"
            disabled
          />
          <SettingsRow
            icon={<Facebook size={17} className="text-accent-dark" />}
            label="Facebook & Messenger"
            description={fbError ?? fbDescription}
            onClick={fbConnection?.status === 'connected' ? undefined : handleConnectFacebook}
          />
        </div>
      </motion.section>

      {/* General settings */}
      <motion.section custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
          General
        </p>
        <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-platinum/60">
          <SettingsRow
            icon={<Store size={17} className="text-accent-dark" />}
            label="Shop details"
            to="/settings/shop"
          />
          <SettingsRow
            icon={<Bell size={17} className="text-accent-dark" />}
            label="Notifications"
            to="/settings/notifications"
          />
          <SettingsRow
            icon={<ShieldCheck size={17} className="text-accent-dark" />}
            label="Privacy & security"
            to="/settings/privacy"
          />
        </div>
      </motion.section>

      {/* Sign out */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
        <button
          onClick={() => signOut?.()}
          className="w-full flex items-center justify-center gap-2 min-h-[52px] rounded-[16px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-red-500 text-[15px] font-semibold transition-colors duration-150 hover:bg-red-50 active:scale-[0.98]"
        >
          <LogOut size={17} strokeWidth={2} />
          Sign out
        </button>
      </motion.div>
    </ScreenShell>
  );
}

function SettingsRow({
  icon,
  label,
  description,
  to,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const inner = (
    <div
      className={`flex items-center gap-4 px-5 min-h-[56px] py-3 transition-colors duration-150 ${
        disabled ? 'opacity-45' : 'active:bg-platinum/30'
      }`}
    >
      <div className="w-8 h-8 rounded-[10px] bg-accent-light/30 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-accent-dark">{label}</p>
        {description && <p className="text-[13px] text-olive">{description}</p>}
      </div>
      {!disabled && <ChevronRight size={15} className="text-olive/50 shrink-0" />}
    </div>
  );

  if (disabled) {
    return <div aria-disabled="true">{inner}</div>;
  }

  if (to) {
    return <Link to={to}>{inner}</Link>;
  }

  return (
    <button className="w-full text-left" onClick={onClick}>
      {inner}
    </button>
  );
}