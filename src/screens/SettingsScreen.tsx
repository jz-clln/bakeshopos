// File: app/src/screens/SettingsScreen.tsx

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

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

import { ScreenShell } from '../components/layout/ScreenShell';
import { useAuth } from '../lib/auth-context';

import {
  getFacebookConnection,
  startFacebookConnect,
  disconnectFacebook,
  type FacebookConnection,
} from '../api/facebook';

import {
  fetchShopIdentity,
  type ShopIdentity,
} from '../api/shopProfile';

import {
  fetchAiLanguage,
  setAiLanguage,
  fetchAiTokenUsage,
  fetchGuardrailEvents,
  type AiLanguage,
  type AiTokenUsage,
  type GuardrailEvent,
} from '../api/aiSettings';

import { UsageMeter } from '../components/settings/UsageMeter';
import { GuardrailActivity } from '../components/settings/GuardrailActivity';

/* ============================================================
   DESIGN & MOTION
============================================================ */

const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 8,
  },

  visible: (i: number) => ({
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.26,
      ease: EASE,
      delay: i * 0.05,
    },
  }),
};

/* ============================================================
   SHARED STYLES
============================================================ */

const CARD_STYLE =
  'overflow-hidden rounded-[20px] border border-platinum/60 bg-white shadow-[0_3px_16px_rgba(42,35,32,0.035)]';

const SECTION_TITLE =
  'mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-olive/75';

const ICON_STYLE =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#F2EDE6] text-accent-dark';

const SECONDARY_BUTTON =
  'inline-flex min-h-9 items-center justify-center rounded-full border border-[#E5DED5] bg-white px-3 text-[11px] font-semibold text-accent-dark transition-all duration-150 hover:bg-[#F7F4F0] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/20';

/* ============================================================
   SETTINGS SCREEN
============================================================ */

export function SettingsScreen() {
  const { signOut, role, session, organizationId } = useAuth() as {
    signOut?: () => void;
    role?: string;
    session: {
      user?: {
        user_metadata?: {
          organization_name?: string;
        };
      };
    } | null;
    organizationId?: string;
  };

  /* ==========================================================
     SHOP IDENTITY
  ========================================================== */

  const [identity, setIdentity] = useState<ShopIdentity | null>(
    null
  );

  useEffect(() => {
    if (!organizationId) return;

    let cancelled = false;

    fetchShopIdentity(organizationId)
      .then((data) => {
        if (!cancelled) {
          setIdentity(data);
        }
      })
      .catch((err) => {
        console.error(
          'Failed to load shop identity:',
          err
        );
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

  /* ==========================================================
     FACEBOOK CONNECTION
  ========================================================== */

  const [fbConnection, setFbConnection] =
    useState<FacebookConnection | null>(null);

  const [loadingFb, setLoadingFb] = useState(true);

  const [fbError, setFbError] = useState<string | null>(null);

  const [connectingFb, setConnectingFb] = useState(false);

  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!organizationId) return;

    let cancelled = false;

    getFacebookConnection(organizationId)
      .then((conn) => {
        if (!cancelled) {
          setFbConnection(conn);
          setLoadingFb(false);
        }
      })
      .catch((err) => {
        console.error(
          'Failed to load Facebook connection:',
          err
        );

        if (!cancelled) {
          setFbError(
            'Could not check the connection. Please try again.'
          );
          setLoadingFb(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  async function handleConnectFacebook() {
    if (
      !organizationId ||
      connectingFb ||
      disconnecting
    ) {
      return;
    }

    setFbError(null);
    setConnectingFb(true);

    try {
      await startFacebookConnect(organizationId);

      // The connection flow redirects away from this page.
      // Keep the button disabled until that navigation occurs.
    } catch (err) {
      console.error(
        'Failed to start Facebook connection:',
        err
      );

      setFbError(
        'Could not start Facebook connection. Please try again.'
      );

      setConnectingFb(false);
    }
  }

  async function handleDisconnectFacebook() {
    if (
      !organizationId ||
      disconnecting ||
      connectingFb
    ) {
      return;
    }

    setDisconnecting(true);
    setFbError(null);

    try {
      await disconnectFacebook(organizationId);
      setFbConnection(null);
    } catch (err) {
      console.error(
        'Failed to disconnect Facebook:',
        err
      );

      setFbError(
        'Could not disconnect. Please try again.'
      );
    } finally {
      setDisconnecting(false);
    }
  }

  const isFbConnected =
    fbConnection?.status === 'connected';

  const fbDescription = loadingFb
    ? 'Checking connection…'
    : connectingFb
      ? 'Connecting…'
      : fbConnection?.status === 'connected'
        ? `Connected · ${fbConnection.pageName}`
        : fbConnection?.status === 'needs_reconnect'
          ? 'Needs reconnecting'
          : 'Not connected';

  /* ==========================================================
     AI LANGUAGE
  ========================================================== */

  const [aiLanguage, setAiLanguageState] =
    useState<AiLanguage>('en');

  const [aiLanguageLoaded, setAiLanguageLoaded] =
    useState(false);

  const [savingAiLanguage, setSavingAiLanguage] =
    useState(false);

  const [aiLanguageError, setAiLanguageError] =
    useState<string | null>(null);

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
        console.error(
          'Failed to load AI language:',
          err
        );

        if (!cancelled) {
          setAiLanguageLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  async function handleSetAiLanguage(lang: AiLanguage) {
    if (
      !organizationId ||
      savingAiLanguage ||
      lang === aiLanguage
    ) {
      return;
    }

    const previous = aiLanguage;

    setAiLanguageState(lang);
    setSavingAiLanguage(true);
    setAiLanguageError(null);

    try {
      await setAiLanguage(organizationId, lang);
    } catch (err) {
      console.error(
        'Failed to update AI language:',
        err
      );

      setAiLanguageState(previous);

      setAiLanguageError(
        'Could not update. Please try again.'
      );
    } finally {
      setSavingAiLanguage(false);
    }
  }

  /* ==========================================================
     AI TOKEN USAGE
  ========================================================== */

  const [tokenUsage, setTokenUsage] =
    useState<AiTokenUsage | null>(null);

  const [tokenUsageError, setTokenUsageError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    let cancelled = false;

    fetchAiTokenUsage(organizationId)
      .then((usage) => {
        if (!cancelled) {
          setTokenUsage(usage);
        }
      })
      .catch((err) => {
        console.error(
          'Failed to load AI token usage:',
          err
        );

        if (!cancelled) {
          setTokenUsageError(
            'Could not load usage.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  /* ==========================================================
     GUARDRAIL ACTIVITY
  ========================================================== */

  const [guardrailEvents, setGuardrailEvents] =
    useState<GuardrailEvent[] | null>(null);

  const [guardrailError, setGuardrailError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    let cancelled = false;

    fetchGuardrailEvents(organizationId)
      .then((events) => {
        if (!cancelled) {
          setGuardrailEvents(events);
        }
      })
      .catch((err) => {
        console.error(
          'Failed to load guardrail activity:',
          err
        );

        if (!cancelled) {
          setGuardrailError(
            'Could not load recent activity.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  /* ==========================================================
     VIEW
  ========================================================== */

  return (
    <ScreenShell>
      <div className="mx-auto w-full min-w-0 max-w-[1200px] pb-6">

        {/* ==================================================
            HEADER
        ================================================== */}

        <motion.header
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-5"
        >
          <h1 className="font-display text-[23px] font-bold leading-tight tracking-[-0.035em] text-accent-dark sm:text-[26px]">
            Settings
          </h1>

          <p className="mt-1 text-[11px] font-medium text-olive/60 sm:text-[12px]">
            Manage your shop and preferences
          </p>
        </motion.header>

        <div className="w-full min-w-0 max-w-[900px]">

          {/* ==================================================
              SHOP PROFILE
          ================================================== */}

          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-5"
          >
            <Link
              to="/settings/shop"
              aria-label={`Open ${shopName} shop profile`}
              className="group block rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 focus-visible:ring-offset-2"
            >
              <div className="relative flex min-w-0 items-center gap-3 overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#2A2320] px-4 py-4 shadow-[0_6px_22px_rgba(42,35,32,0.14)] transition-shadow duration-200 hover:shadow-[0_8px_28px_rgba(42,35,32,0.18)] sm:gap-4 sm:px-5">

                {/* Subtle decorative highlight */}

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/[0.025] blur-2xl"
                />

                {/* Shop logo */}

                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-white/10 bg-white/[0.08] sm:h-[52px] sm:w-[52px]">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={`${shopName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-[19px] font-semibold text-white">
                      {shopName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Shop information */}

                <div className="relative min-w-0 flex-1">

                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/45">
                    Shop profile
                  </p>

                  <p className="truncate font-display text-[16px] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[18px]">
                    {shopName}
                  </p>

                  {role && (
                    <p className="mt-1 text-[11px] capitalize text-white/55">
                      {role}
                    </p>
                  )}

                </div>

                {/* Navigation */}

                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-white/65 transition-all duration-150 group-hover:bg-white/[0.12] group-hover:text-white">
                  <ChevronRight
                    size={17}
                    strokeWidth={1.8}
                  />
                </div>

              </div>
            </Link>
          </motion.div>

          {/* ==================================================
              SALES CHANNELS
          ================================================== */}

          <motion.section
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-5"
          >
            <h2 className={SECTION_TITLE}>
              Sales channels
            </h2>

            <div className={`${CARD_STYLE} divide-y divide-platinum/45`}>

              {/* Instagram */}

              <SettingsRow
                icon={<Instagram size={17} strokeWidth={1.8} />}
                label="Instagram"
                description="Coming soon"
                disabled
              />

              {/* Facebook & Messenger */}

              {isFbConnected ? (

                <div className="px-4 py-3.5 sm:px-5">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className={ICON_STYLE}>
                      <Facebook
                        size={17}
                        strokeWidth={1.8}
                      />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex min-w-0 flex-wrap items-center gap-2">

                        <p className="text-[13px] font-semibold leading-5 text-accent-dark sm:text-[14px]">
                          Facebook & Messenger
                        </p>

                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Connected
                        </span>

                      </div>

                      <p className={`mt-0.5 break-words text-[11px] leading-4 sm:text-[12px] ${
                        fbError
                          ? 'text-rose-600'
                          : 'text-olive/65'
                      }`}>
                        {fbError ?? fbDescription}
                      </p>

                    </div>

                  </div>

                  {/* Connection actions */}

                  <div className="mt-3 flex flex-wrap items-center gap-2 pl-12">

                    <button
                      type="button"
                      onClick={handleConnectFacebook}
                      disabled={connectingFb || disconnecting}
                      className={SECONDARY_BUTTON}
                    >
                      {connectingFb
                        ? 'Connecting…'
                        : 'Switch Page'}
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnectFacebook}
                      disabled={disconnecting || connectingFb}
                      className="inline-flex min-h-9 items-center justify-center rounded-full border border-rose-100 bg-rose-50/65 px-3 text-[11px] font-semibold text-rose-600 transition-colors duration-150 hover:bg-rose-100/70 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                    >
                      {disconnecting
                        ? 'Disconnecting…'
                        : 'Disconnect'}
                    </button>

                  </div>

                </div>

              ) : (

                <SettingsRow
                  icon={<Facebook size={17} strokeWidth={1.8} />}
                  label="Facebook & Messenger"
                  description={fbError ?? fbDescription}
                  onClick={handleConnectFacebook}
                  disabled={connectingFb || loadingFb}
                  status={
                    fbConnection?.status === 'needs_reconnect'
                      ? 'Reconnect'
                      : undefined
                  }
                />

              )}

            </div>
          </motion.section>

          {/* ==================================================
              AI ASSISTANT
          ================================================== */}

          <motion.section
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-5"
          >
            <h2 className={SECTION_TITLE}>
              AI assistant
            </h2>

            <div className={`${CARD_STYLE} px-4 py-4 sm:px-5`}>

              {/* Language information */}

              <div className="flex min-w-0 items-center gap-3">

                <div className={ICON_STYLE}>
                  <Languages
                    size={17}
                    strokeWidth={1.8}
                  />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-[13px] font-semibold leading-5 text-accent-dark sm:text-[14px]">
                    Reply language
                  </p>

                  <p className={`mt-0.5 text-[11px] leading-4 sm:text-[12px] ${
                    aiLanguageError
                      ? 'text-rose-600'
                      : 'text-olive/65'
                  }`}>
                    {aiLanguageError ??
                      'Choose the language your AI uses when replying to customers.'}
                  </p>

                </div>

              </div>

              {/* Language segmented control */}

              <div className="mt-4">

                {!aiLanguageLoaded ? (

                  <div
                    aria-hidden="true"
                    className="h-11 animate-pulse rounded-[14px] bg-platinum/45 motion-reduce:animate-none"
                  />

                ) : (

                  <div className="grid grid-cols-2 gap-1 rounded-[14px] border border-platinum/45 bg-[#F2EDE6]/75 p-1">

                    {(['en', 'fil'] as const).map((lang) => {
                      const selected =
                        aiLanguage === lang;

                      return (

                        <button
                          key={lang}
                          type="button"
                          onClick={() =>
                            handleSetAiLanguage(lang)
                          }
                          disabled={savingAiLanguage}
                          aria-pressed={selected}
                          className={`relative flex h-9 items-center justify-center rounded-[10px] text-[12px] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 ${
                            selected
                              ? 'text-accent-dark'
                              : 'text-olive/70 hover:text-accent-dark'
                          }`}
                        >

                          {selected && (

                            <motion.span
                              layoutId="selectedAiLanguage"
                              className="absolute inset-0 rounded-[10px] border border-platinum/40 bg-white shadow-[0_2px_6px_rgba(42,35,32,0.075)]"
                              transition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 35,
                              }}
                            />

                          )}

                          <span className="relative z-10">
                            {lang === 'en'
                              ? 'English'
                              : 'Filipino'}
                          </span>

                        </button>

                      );
                    })}

                  </div>

                )}

              </div>

            </div>
          </motion.section>

          {/* ==================================================
              AI USAGE
          ================================================== */}

          <motion.section
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-5"
          >
            <h2 className={SECTION_TITLE}>
              AI usage
            </h2>

            <div className={`${CARD_STYLE} px-4 py-4 sm:px-5`}>

              {/* Usage heading */}

              <div className="flex min-w-0 items-center gap-3">

                <div className={ICON_STYLE}>
                  <Gauge
                    size={17}
                    strokeWidth={1.8}
                  />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-[13px] font-semibold leading-5 text-accent-dark sm:text-[14px]">
                    Token usage
                  </p>

                  <p className={`mt-0.5 text-[11px] leading-4 sm:text-[12px] ${
                    tokenUsageError
                      ? 'text-rose-600'
                      : 'text-olive/65'
                  }`}>
                    {tokenUsageError ??
                      'How much your AI assistant has processed.'}
                  </p>

                </div>

              </div>

              {/* Usage information */}

              <div className="mt-4">

                {tokenUsage === null && !tokenUsageError ? (

                  <div
                    aria-hidden="true"
                    className="space-y-3 motion-reduce:animate-none"
                  >
                    <div className="h-8 animate-pulse rounded-[10px] bg-platinum/50 motion-reduce:animate-none" />

                    <div className="h-3 w-1/2 animate-pulse rounded-full bg-platinum/35 motion-reduce:animate-none" />
                  </div>

                ) : tokenUsage ? (

                  <div className="space-y-4">

                    <UsageMeter
                      label="This month"
                      used={tokenUsage.tokensThisMonth}
                      limit={tokenUsage.monthlyLimit}
                    />

                    <div className="flex min-w-0 items-center justify-between gap-3 border-t border-platinum/50 pt-3">

                      <p className="shrink-0 text-[11px] font-medium text-olive/65 sm:text-[12px]">
                        This week
                      </p>

                      <p className="min-w-0 text-right text-[11px] font-semibold tabular-nums text-accent-dark sm:text-[12px]">
                        {tokenUsage.tokensThisWeek.toLocaleString()}{' '}
                        tokens
                      </p>

                    </div>

                  </div>

                ) : null}

              </div>

              {/* Recent activity */}

              <div className="mt-4 border-t border-platinum/50 pt-4">

                <div className="mb-3 flex min-w-0 items-center justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-2">

                    <ShieldCheck
                      size={15}
                      strokeWidth={1.8}
                      className="shrink-0 text-olive/70"
                    />

                    <h3 className="text-[12px] font-semibold text-accent-dark sm:text-[13px]">
                      Recent activity
                    </h3>

                  </div>

                </div>

                {guardrailEvents === null && !guardrailError ? (

                  <div
                    aria-hidden="true"
                    className="space-y-2"
                  >
                    <div className="h-10 animate-pulse rounded-[10px] bg-platinum/45 motion-reduce:animate-none" />

                    <div className="h-10 animate-pulse rounded-[10px] bg-platinum/35 motion-reduce:animate-none" />
                  </div>

                ) : guardrailError ? (

                  <p className="text-[11px] text-rose-600 sm:text-[12px]">
                    {guardrailError}
                  </p>

                ) : (

                  <GuardrailActivity
                    events={guardrailEvents ?? []}
                  />

                )}

              </div>

            </div>
          </motion.section>

          {/* ==================================================
              GENERAL SETTINGS
          ================================================== */}

          <motion.section
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-5"
          >
            <h2 className={SECTION_TITLE}>
              General
            </h2>

            <div className={`${CARD_STYLE} divide-y divide-platinum/45`}>

              <SettingsRow
                icon={<Store size={17} strokeWidth={1.8} />}
                label="Shop details"
                to="/settings/shop"
              />

              <SettingsRow
                icon={<Bell size={17} strokeWidth={1.8} />}
                label="Notifications"
                to="/settings/notifications"
              />

              <SettingsRow
                icon={
                  <ShieldCheck
                    size={17}
                    strokeWidth={1.8}
                  />
                }
                label="Privacy & security"
                to="/settings/privacy"
              />

            </div>
          </motion.section>

          {/* ==================================================
              SIGN OUT
          ================================================== */}

          <motion.div
            custom={6}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <button
              type="button"
              onClick={() => signOut?.()}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[16px] border border-platinum/60 bg-white px-4 text-[12px] font-semibold text-rose-600 shadow-[0_2px_10px_rgba(42,35,32,0.035)] transition-colors duration-150 hover:border-rose-100 hover:bg-rose-50/60 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
            >
              <LogOut
                size={16}
                strokeWidth={1.9}
              />

              Sign out
            </button>
          </motion.div>

        </div>
      </div>
    </ScreenShell>
  );
}

/* ============================================================
   SETTINGS ROW
============================================================ */

function SettingsRow({
  icon,
  label,
  description,
  to,
  onClick,
  disabled = false,
  status,
}: {
  icon: ReactNode;
  label: string;
  description?: string;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  status?: string;
}) {
  const inner = (

    <div
      className={`flex min-h-[60px] min-w-0 items-center gap-3 px-4 py-3 sm:px-5 ${
        disabled ? 'opacity-45' : ''
      }`}
    >

      {/* Icon */}

      <div className={ICON_STYLE}>
        {icon}
      </div>

      {/* Label and description */}

      <div className="min-w-0 flex-1">

        <p className="text-[13px] font-semibold leading-5 text-accent-dark sm:text-[14px]">
          {label}
        </p>

        {description && (

          <p className="mt-0.5 break-words text-[11px] leading-4 text-olive/65 sm:text-[12px]">
            {description}
          </p>

        )}

      </div>

      {/* Status or navigation */}

      {status && !disabled && (

        <span className="shrink-0 rounded-full bg-[#F2EDE6] px-2.5 py-1 text-[10px] font-semibold text-accent-dark">
          {status}
        </span>

      )}

      {!disabled && (

        <ChevronRight
          size={15}
          strokeWidth={1.8}
          className="shrink-0 text-olive/35"
        />

      )}

    </div>
  );

  if (disabled) {
    return (
      <div aria-disabled="true">
        {inner}
      </div>
    );
  }

  if (to) {
    return (
      <Link
        to={to}
        className="block min-w-0 transition-colors duration-150 hover:bg-[#FAF8F5] focus-visible:outline-none focus-visible:bg-[#F2EDE6]/45"
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="block w-full min-w-0 text-left transition-colors duration-150 hover:bg-[#FAF8F5] disabled:cursor-not-allowed focus-visible:outline-none focus-visible:bg-[#F2EDE6]/45"
    >
      {inner}
    </button>
  );
}