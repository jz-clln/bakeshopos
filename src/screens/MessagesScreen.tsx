// File: app/src/screens/MessagesScreen.tsx

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Settings,
  Receipt,
  MessageCircle,
  Bot,
} from 'lucide-react';

import type { RealtimeChannel } from '@supabase/supabase-js';

import { ScreenShell } from '../components/layout/ScreenShell';
import { ChannelIcon } from '../components/messages/ChannelIcon';

import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

import { getFacebookConnection } from '../api/facebook';

import {
  fetchConversationList,
  type ConversationListItem,
} from '../api/messages';

import { getAvatarPreset } from '../lib/avatarPresets';

/* ============================================================
   DESIGN & MOTION
============================================================ */

const EASE = [0.23, 1, 0.32, 1] as const;

const PLACEHOLDER_CUSTOMER_NAME = 'Facebook customer';

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

const listContainer = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const listRow = {
  hidden: {
    opacity: 0,
    y: 6,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.22,
      ease: EASE,
    },
  },
};

/* ============================================================
   SHARED STYLES
============================================================ */

const CARD_STYLE =
  'overflow-hidden rounded-[20px] border border-platinum/60 bg-white shadow-[0_3px_16px_rgba(42,35,32,0.035)]';

const PRIMARY_BUTTON =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent-dark px-4 text-[12px] font-semibold text-white shadow-[0_3px_10px_rgba(42,35,32,0.12)] transition-all duration-150 hover:bg-accent-dark/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 focus-visible:ring-offset-2';

/* ============================================================
   MESSAGES SCREEN
============================================================ */

export function MessagesScreen() {
  const { organizationId } = useAuth();

  const navigate = useNavigate();

  /* ==========================================================
     STATE
  ========================================================== */

  const [connected, setConnected] = useState(false);

  const [conversations, setConversations] = useState<
    ConversationListItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [aiEnabled, setAiEnabled] = useState(true);

  const [aiToggleSaving, setAiToggleSaving] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const refetchTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  /* ==========================================================
     REALTIME REFRESH
  ========================================================== */

  function scheduleListRefetch(orgId: string) {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    refetchTimeoutRef.current = setTimeout(async () => {
      try {
        const list = await fetchConversationList(orgId);

        setConversations(list);
      } catch (err) {
        console.error(
          'Failed to refresh conversations:',
          err
        );
      }
    }, 300);
  }

  /* ==========================================================
     INITIAL LOAD & SUBSCRIPTIONS
  ========================================================== */

  useEffect(() => {
    if (!organizationId) return;

    const orgId = organizationId;

    async function load() {
      setLoading(true);

      const [fbConnection, orgRow] = await Promise.all([
        getFacebookConnection(orgId),

        supabase
          .from('organizations')
          .select('ai_enabled')
          .eq('id', orgId)
          .single(),
      ]);

      const isConnected =
        fbConnection?.status === 'connected';

      setConnected(isConnected);

      setAiEnabled(
        orgRow.data?.ai_enabled ?? true
      );

      if (isConnected) {
        try {
          const list = await fetchConversationList(orgId);

          setConversations(list);
        } catch (err) {
          console.error(
            'Failed to load conversations:',
            err
          );
        }
      }

      setLoading(false);
    }

    load();

    /* Realtime conversation updates */

    const channel = supabase
      .channel(`conversations-list-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => scheduleListRefetch(orgId)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        () => scheduleListRefetch(orgId)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        () => scheduleListRefetch(orgId)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => scheduleListRefetch(orgId)
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }

      supabase.removeChannel(channel);

      channelRef.current = null;
    };
  }, [organizationId]);

  /* ==========================================================
     AI ASSISTANT TOGGLE
  ========================================================== */

  async function handleToggleAi() {
    if (!organizationId || aiToggleSaving) return;

    const next = !aiEnabled;

    setAiEnabled(next);

    setAiToggleSaving(true);

    const { error } = await supabase
      .from('organizations')
      .update({
        ai_enabled: next,
      })
      .eq('id', organizationId);

    setAiToggleSaving(false);

    if (error) {
      console.error(
        'Failed to update AI status:',
        error
      );

      setAiEnabled(!next);
    }
  }

  /* ==========================================================
     INBOX COUNTS
  ========================================================== */

  const totalUnread = conversations.reduce(
    (n, c) => n + c.unread_count,
    0
  );

  const pendingOrderCount = conversations.reduce(
    (n, c) => n + (c.has_pending_order ? 1 : 0),
    0
  );

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
          className="mb-5 flex items-center justify-between gap-3"
        >

          {/* Title */}

          <div className="min-w-0 flex-1">

            <h1 className="font-display text-[23px] font-bold leading-tight tracking-[-0.035em] text-accent-dark sm:text-[26px]">
              Messages
            </h1>

            {/* Inbox summary */}

            {connected &&
              (totalUnread > 0 || pendingOrderCount > 0) && (

                <p className="mt-1 text-[11px] font-medium leading-4 text-olive/65 sm:text-[12px]">

                  {[
                    totalUnread > 0
                      ? `${totalUnread} unread`
                      : null,

                    pendingOrderCount > 0
                      ? `${pendingOrderCount} ${
                          pendingOrderCount === 1
                            ? 'order'
                            : 'orders'
                        } to review`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}

                </p>

              )}

          </div>

          {/* Settings */}

          <Link
            to="/settings"
            aria-label="Channel settings"
            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-platinum/60 bg-white text-olive shadow-[0_2px_8px_rgba(42,35,32,0.035)] transition-all duration-150 hover:border-platinum hover:bg-platinum/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25"
          >

            <Settings
              size={16}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:rotate-12"
            />

          </Link>

        </motion.header>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <div className="w-full min-w-0 max-w-[900px]">

          {/* ==================================================
              AI ASSISTANT STATUS
          ================================================== */}

          {!loading && connected && (

            <motion.div
              custom={0.5}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-4 overflow-hidden rounded-[18px] border border-platinum/60 bg-white px-4 py-3 shadow-[0_2px_10px_rgba(42,35,32,0.025)] sm:px-5"
            >

              <div className="flex min-w-0 items-center justify-between gap-3">

                {/* Assistant information */}

                <div className="flex min-w-0 flex-1 items-center gap-3">

                  {/* AI icon */}

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition-colors duration-200 ${
                      aiEnabled
                        ? 'bg-[#F2EDE6]'
                        : 'bg-platinum/45'
                    }`}
                  >

                    <Bot
                      size={17}
                      strokeWidth={1.8}
                      className={
                        aiEnabled
                          ? 'text-accent-dark'
                          : 'text-olive/60'
                      }
                    />

                  </div>

                  {/* Text */}

                  <div className="min-w-0 flex-1">

                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">

                      <p className="text-[12px] font-semibold leading-4 text-accent-dark sm:text-[13px]">
                        AI Assistant
                      </p>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                          aiEnabled
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-platinum/55 text-olive'
                        }`}
                      >

                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            aiEnabled
                              ? 'bg-emerald-500'
                              : 'bg-olive/40'
                          }`}
                        />

                        {aiEnabled ? 'On' : 'Paused'}

                      </span>

                    </div>

                    <p className="mt-1 text-[10px] leading-4 text-olive/60 sm:text-[11px]">

                      {aiEnabled
                        ? 'Automatically replying to new messages.'
                        : 'Paused — new messages need your personal reply.'}

                    </p>

                  </div>

                </div>

                {/* Toggle */}

                <ToggleSwitch
                  checked={aiEnabled}
                  onChange={handleToggleAi}
                  label="AI Assistant"
                />

              </div>

            </motion.div>

          )}

          {/* ==================================================
              LOADING STATE
          ================================================== */}

          {loading ? (

            <LoadingState />

          ) : !connected ? (

            /* ==================================================
                FACEBOOK NOT CONNECTED
            ================================================== */

            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className={`${CARD_STYLE} flex min-h-[230px] flex-col items-center justify-center px-5 py-8 text-center`}
            >

              {/* Channel icon */}

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#F2EDE6]">

                <ChannelIcon
                  size={31}
                />

              </div>

              {/* Text */}

              <h2 className="font-display text-[14px] font-semibold tracking-[-0.015em] text-accent-dark">
                Connect your Facebook Page
              </h2>

              <p className="mt-1.5 max-w-[265px] text-[11px] leading-5 text-olive/65 sm:text-[12px]">
                See all your Facebook Messenger conversations in one inbox.
              </p>

              {/* Settings action */}

              <Link
                to="/settings"
                className={`${PRIMARY_BUTTON} mt-5`}
              >

                Go to Settings

                <ChevronRight
                  size={14}
                  strokeWidth={2.2}
                />

              </Link>

            </motion.div>

          ) : (

            /* ==================================================
                CONVERSATION LIST
            ================================================== */

            <motion.section
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className={CARD_STYLE}
            >

              {/* Inbox header */}

              <div className="flex min-h-[55px] items-center justify-between gap-3 border-b border-platinum/50 px-4 py-3 sm:px-5">

                <div className="flex min-w-0 items-center gap-2">

                  <MessageCircle
                    size={15}
                    strokeWidth={1.8}
                    className="shrink-0 text-olive/65"
                  />

                  <h2 className="text-[12px] font-semibold tracking-[-0.01em] text-accent-dark sm:text-[13px]">
                    Conversations
                  </h2>

                </div>

                {/* Conversation count */}

                {conversations.length > 0 && (

                  <span className="shrink-0 rounded-full bg-[#F2EDE6] px-2.5 py-1 text-[10px] font-semibold tabular-nums text-olive">
                    {conversations.length}
                  </span>

                )}

              </div>

              {/* ==================================================
                  EMPTY INBOX
              ================================================== */}

              {conversations.length === 0 ? (

                <div className="flex min-h-[180px] flex-col items-center justify-center px-5 py-8 text-center">

                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#F2EDE6]">

                    <MessageCircle
                      size={19}
                      strokeWidth={1.7}
                      className="text-olive"
                    />

                  </div>

                  <p className="text-[13px] font-semibold text-accent-dark">
                    No conversations yet
                  </p>

                  <p className="mt-1 max-w-[240px] text-[11px] leading-5 text-olive/60">
                    Your customer conversations will appear here.
                  </p>

                </div>

              ) : (

                /* ==================================================
                    CONVERSATIONS
                ================================================== */

                <AnimatePresence mode="wait">

                  <motion.div
                    className="divide-y divide-platinum/45"
                    variants={listContainer}
                    initial="hidden"
                    animate="visible"
                  >

                    {conversations.map((convo) => {

                      /* Customer information */

                      const hasAvatar =
                        !!convo.customer_avatar_url;

                      const hasRealName =
                        !!convo.customer_name &&
                        convo.customer_name !==
                          PLACEHOLDER_CUSTOMER_NAME;

                      const displayName = hasRealName
                        ? convo.customer_name
                        : 'Customer';

                      const preset = getAvatarPreset(
                        convo.customer_id
                      );

                      const hasUnread =
                        convo.unread_count > 0;

                      return (

                        <motion.div
                          key={convo.id}
                          variants={listRow}
                          whileTap={{
                            backgroundColor:
                              'rgba(42,35,32,0.035)',
                          }}
                          onClick={() =>
                            navigate(`/messages/${convo.id}`)
                          }
                          className={`group flex min-h-[70px] cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[#F7F4F0] active:bg-[#F2EDE6] sm:min-h-[76px] sm:gap-3.5 sm:px-5 ${
                            hasUnread
                              ? 'bg-[#FAF8F5]'
                              : 'bg-white'
                          }`}
                        >

                          {/* ==================================================
                              CUSTOMER AVATAR
                          ================================================== */}

                          <div className="relative shrink-0">

                            <img
                              src={
                                hasAvatar
                                  ? convo.customer_avatar_url!
                                  : preset.src
                              }
                              alt=""
                              className="h-10 w-10 rounded-full bg-platinum object-cover ring-1 ring-black/[0.04] sm:h-11 sm:w-11"
                              onError={(e) => {

                                // Facebook picture URLs may expire.

                                if (
                                  e.currentTarget.src !==
                                  window.location.origin +
                                    preset.src
                                ) {
                                  e.currentTarget.src =
                                    preset.src;
                                }

                              }}
                            />

                            {/* Messenger channel indicator */}

                            <div className="absolute -bottom-1 -right-1 flex h-[19px] w-[19px] items-center justify-center rounded-full bg-white ring-2 ring-white">

                              <ChannelIcon
                                size={15}
                              />

                            </div>

                            {/* Pending order indicator */}

                            {convo.has_pending_order && (

                              <span
                                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white"
                                title="Order awaiting your confirmation"
                              >

                                <Receipt
                                  size={9}
                                  strokeWidth={2.5}
                                />

                              </span>

                            )}

                          </div>

                          {/* ==================================================
                              CUSTOMER INFORMATION
                          ================================================== */}

                          <div className="min-w-0 flex-1">

                            {/* Customer name and time */}

                            <div className="mb-1 flex min-w-0 items-center justify-between gap-2">

                              <div className="flex min-w-0 items-center gap-1.5">

                                <p
                                  className={`min-w-0 truncate text-[13px] leading-5 tracking-[-0.01em] sm:text-[14px] ${
                                    hasUnread
                                      ? 'font-bold text-accent-dark'
                                      : 'font-semibold text-accent-dark'
                                  }`}
                                >
                                  {displayName}
                                </p>

                                {/* Pending order badge */}

                                {convo.has_pending_order && (

                                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">

                                    <Receipt
                                      size={9}
                                      strokeWidth={2.2}
                                    />

                                    Order

                                  </span>

                                )}

                              </div>

                              {/* Last message time */}

                              {convo.last_message_at && (

                                <span
                                  className={`shrink-0 text-[10px] tabular-nums sm:text-[11px] ${
                                    hasUnread
                                      ? 'font-semibold text-accent-dark'
                                      : 'font-medium text-olive/50'
                                  }`}
                                >

                                  {timeAgo(
                                    convo.last_message_at
                                  )}

                                </span>

                              )}

                            </div>

                            {/* Message preview */}

                            <div className="flex min-w-0 items-center justify-between gap-3">

                              <p
                                className={`min-w-0 flex-1 truncate text-[11px] leading-5 sm:text-[12px] ${
                                  hasUnread
                                    ? 'font-medium text-accent-dark'
                                    : 'text-olive/65'
                                }`}
                              >

                                {convo.last_message_preview ??
                                  'No messages yet'}

                              </p>

                              {/* Unread badge */}

                              {hasUnread && (

                                <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-accent-dark px-1.5 text-[10px] font-bold tabular-nums text-white">

                                  {convo.unread_count}

                                </span>

                              )}

                            </div>

                          </div>

                          {/* Desktop navigation indicator */}

                          {!hasUnread && (

                            <ChevronRight
                              size={14}
                              strokeWidth={1.8}
                              className="hidden shrink-0 text-olive/0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-olive/45 md:block"
                            />

                          )}

                        </motion.div>

                      );

                    })}

                  </motion.div>

                </AnimatePresence>

              )}

            </motion.section>

          )}

        </div>

      </div>
    </ScreenShell>
  );
}

/* ============================================================
   LOADING STATE
============================================================ */

function LoadingState() {
  return (
    <div
      className={CARD_STYLE}
      aria-label="Loading conversations"
    >

      <div className="divide-y divide-platinum/45">

        {[0, 1, 2].map((i) => (

          <div
            key={i}
            className="flex min-h-[76px] animate-pulse items-center gap-3 px-4 py-3 motion-reduce:animate-none sm:px-5"
          >

            {/* Avatar placeholder */}

            <div className="h-11 w-11 shrink-0 rounded-full bg-platinum/65" />

            {/* Text placeholders */}

            <div className="min-w-0 flex-1 space-y-2">

              <div className="h-3 w-28 max-w-full rounded-full bg-platinum/65" />

              <div className="h-2.5 w-44 max-w-full rounded-full bg-platinum/45" />

            </div>

            {/* Time placeholder */}

            <div className="h-2.5 w-10 shrink-0 rounded-full bg-platinum/45" />

          </div>

        ))}

      </div>

    </div>
  );
}

/* ============================================================
   AI TOGGLE
============================================================ */

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25 focus-visible:ring-offset-2 ${
        checked
          ? 'bg-accent-dark'
          : 'bg-black/15'
      }`}
    >

      <span
        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition-transform duration-200 ${
          checked
            ? 'translate-x-5'
            : 'translate-x-0'
        }`}
      />

    </button>
  );
}

/* ============================================================
   TIME FORMATTING
============================================================ */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();

  const mins = Math.floor(diff / 60000);

  if (mins < 1) return 'Just now';

  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);

  if (hrs < 24) return `${hrs}h ago`;

  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });
}