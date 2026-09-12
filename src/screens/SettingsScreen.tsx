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
  Languages,
  Gauge,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScreenShell } from '../components/layout/ScreenShell';
import { useAuth } from '../lib/auth-context';
import { getFacebookConnection, startFacebookConnect, disconnectFacebook, type FacebookConnection } from '../api/facebook';
import { fetchShopIdentity, type ShopIdentity } from '../api/shopProfile';
import { fetchAiLanguage, setAiLanguage, fetchAiTokenUsage, type AiLanguage, type AiTokenUsage } from '../api/aiSettings';
import { UsageMeter } from '../components/settings/UsageMeter';

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

  const shopName =
    identity?.name?.trim() ||
    session?.user?.user_metadata?.organization_name?.trim() ||
    'Your Shop';
  const logoUrl = identity?.logo_url ?? null;

  const [fbConnection, setFbConnection] = useState<FacebookConnection | null>(null);
  const [loadingFb, setLoadingFb] = useState(true);
  const [fbError, setFbError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

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
      setFbError('Could not start Facebook connection. Please try again.');
    }
  }

  async function handleDisconnectFacebook() {
    if (!organizationId) return;
    setDisconnecting(true);
    setFbError(null);
    try {
      await disconnectFacebook(organizationId);
      setFbConnection(null);
    } catch (err) {
      console.error('Failed to disconnect Facebook:', err);
      setFbError('Could not disconnect. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  }

  const fbDescription = loadingFb
    ? 'Checking…'
    : fbConnection?.status === 'connected'
    ? `Connected | ${fbConnection.pageName}`
    : fbConnection?.status === 'needs_reconnect'
    ? 'Needs reconnecting'
    : 'Not connected';

  const isFbConnected = fbConnection?.status === 'connected';

  const [aiLanguage, setAiLanguageState] = useState<AiLanguage>('en');
  const [aiLanguageLoaded, setAiLanguageLoaded] = useState(false);
  const [savingAiLanguage, setSavingAiLanguage] = useState(false);
  const [aiLanguageError, setAiLanguageError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    fetchAiLanguage(organizationId)
      .then((lang) => {
        if (!cancelled) {
          setAiLanguageState(lang);
          setAiLanguageLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load AI language:', err);
        if (!cancelled) setAiLanguageLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  async function handleSetAiLanguage(lang: AiLanguage) {
    if (!organizationId || savingAiLanguage || lang === aiLanguage) return;
    const previous = aiLanguage;
    setAiLanguageState(lang);
    setSavingAiLanguage(true);
    setAiLanguageError(null);
    try {
      await setAiLanguage(organizationId, lang);
    } catch (err) {
      console.error('Failed to update AI language:', err);
      setAiLanguageState(previous);
      setAiLanguageError('Could not update. Please try again.');
    } finally {
      setSavingAiLanguage(false);
    }
  }

  // AI token usage — separate loading state from the language toggle
  // above, since one loading indicator failing shouldn't block the other.
  const [tokenUsage, setTokenUsage] = useState<AiTokenUsage | null>(null);
  const [tokenUsageError, setTokenUsageError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    fetchAiTokenUsage(organizationId)
      .then((usage) => {
        if (!cancelled) setTokenUsage(usage);
      })
      .catch((err) => {
        console.error('Failed to load AI token usage:', err);
        if (!cancelled) setTokenUsageError('Could not load usage.');
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

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
      <Link to="/settings/shop" className="block mb-5 group">
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="relative overflow-hidden bg-accent-dark rounded-[20px] px-5 py-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-transform duration-150 active:scale-[0.99]"
        >
          <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-12 -right-2 w-40 h-40 rounded-full bg-white/[0.03]" />

          <div className="relative w-14 h-14 rounded-full bg-white/15 ring-2 ring-white/20 flex items-center justify-center text-xl font-bold text-white shrink-0 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={`${shopName} logo`} className="w-full h-full object-cover" />
            ) : (
              shopName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="relative min-w-0 flex-1">
            <p className="text-white font-semibold text-[18px] truncate">{shopName}</p>
            {role && (
              <p className="text-white/60 text-[13px] capitalize">{role}</p>
            )}
          </div>
          <ChevronRight
            size={16}
            className="relative text-white/40 group-active:text-white/70 transition-colors duration-150 shrink-0"
          />
        </motion.div>
      </Link>

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

          {isFbConnected ? (
            <div className="px-5 py-3">
              <div className="flex items-center gap-4 min-h-[40px]">
                <div className="w-8 h-8 rounded-[10px] bg-accent-light/30 flex items-center justify-center shrink-0">
                  <Facebook size={17} className="text-accent-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-accent-dark">Facebook & Messenger</p>
                  <p className="text-[13px] text-olive">{fbError ?? fbDescription}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-2 pl-12">
                <button
                  onClick={handleConnectFacebook}
                  className="text-[13px] font-semibold text-accent-dark"
                >
                  Switch Page
                </button>
                <button
                  onClick={handleDisconnectFacebook}
                  disabled={disconnecting}
                  className="text-[13px] font-semibold text-red-500 disabled:opacity-50"
                >
                  {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                </button>
              </div>
            </div>
          ) : (
            <SettingsRow
              icon={<Facebook size={17} className="text-accent-dark" />}
              label="Facebook & Messenger"
              description={fbError ?? fbDescription}
              onClick={handleConnectFacebook}
            />
          )}
        </div>
      </motion.section>

      {/* AI assistant language */}
      <motion.section custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
          AI assistant
        </p>
        <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-5 py-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-8 h-8 rounded-[10px] bg-accent-light/30 flex items-center justify-center shrink-0">
              <Languages size={17} className="text-accent-dark" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-accent-dark">Reply language</p>
              <p className="text-[13px] text-olive">
                {aiLanguageError ?? 'Your AI assistant replies to customers in this language.'}
              </p>
            </div>
          </div>

          {!aiLanguageLoaded ? (
            <div className="h-10 rounded-full bg-platinum/60 animate-pulse" aria-hidden="true" />
          ) : (
            <div className="grid grid-cols-2 gap-1 bg-platinum/60 rounded-full p-1">
              {(['en', 'fil'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleSetAiLanguage(lang)}
                  disabled={savingAiLanguage}
                  aria-pressed={aiLanguage === lang}
                  className={`h-10 rounded-full text-[13px] font-semibold transition-all duration-150 disabled:opacity-60 ${
                    aiLanguage === lang
                      ? 'bg-white text-accent-dark shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
                      : 'text-olive active:scale-[0.98]'
                  }`}
                >
                  {lang === 'en' ? 'English' : 'Filipino'}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* AI usage */}
      <motion.section custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-olive mb-2 px-1">
          AI usage
        </p>
        <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-5 py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-accent-light/30 flex items-center justify-center shrink-0">
              <Gauge size={17} className="text-accent-dark" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-accent-dark">Token usage</p>
              <p className="text-[13px] text-olive">
                {tokenUsageError ?? 'How much your AI assistant has processed.'}
              </p>
            </div>
          </div>

          {tokenUsage === null && !tokenUsageError ? (
            <div className="space-y-3">
              <div className="h-8 rounded-[10px] bg-platinum/60 animate-pulse" aria-hidden="true" />
              <div className="h-4 rounded-[6px] bg-platinum/50 w-1/2 animate-pulse" aria-hidden="true" />
            </div>
          ) : tokenUsage ? (
            <div className="space-y-4">
              <UsageMeter
                label="This month"
                used={tokenUsage.tokensThisMonth}
                limit={tokenUsage.monthlyLimit}
              />
              <div className="flex items-center justify-between pt-3 border-t border-platinum/60">
                <p className="text-[13px] text-olive">This week</p>
                <p className="text-[13px] font-semibold text-accent-dark tabular-nums">
                  {tokenUsage.tokensThisWeek.toLocaleString()} tokens
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </motion.section>

      {/* General settings */}
      <motion.section custom={5} variants={fadeUp} initial="hidden" animate="visible" className="mb-5">
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
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
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