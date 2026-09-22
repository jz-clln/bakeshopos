// File: app/src/screens/MessagesScreen.tsx

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Settings, Receipt } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { ScreenShell } from '../components/layout/ScreenShell';
import { ChannelIcon } from '../components/messages/ChannelIcon';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { getFacebookConnection } from '../api/facebook';
import { fetchConversationList, type ConversationListItem } from '../api/messages';
import { getAvatarPreset } from '../lib/avatarPresets';

const EASE = [0.23, 1, 0.32, 1] as const;

// Written by the Messenger webhook when a private profile or a failed
// profile fetch means there's no real name to store. Kept as an exact
// string match against supabase/functions/facebook-messenger-webhook —
// same constant ConversationDetailScreen.tsx uses for its header.
const PLACEHOLDER_CUSTOMER_NAME = 'Facebook customer';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.26, ease: EASE, delay: i * 0.05 },
  }),
};

const listContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const listRow = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
};

export function MessagesScreen() {
  const { organizationId } = useAuth();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiToggleSaving, setAiToggleSaving] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced so a burst of events (several messages landing at once,
  // or an INSERT + UPDATE firing back to back) collapses into a
  // single refetch instead of hammering the view query.
  function scheduleListRefetch(orgId: string) {
    if (refetchTimeoutRef.current) clearTimeout(refetchTimeoutRef.current);
    refetchTimeoutRef.current = setTimeout(async () => {
      try {
        const list = await fetchConversationList(orgId);
        setConversations(list);
      } catch (err) {
        console.error('Failed to refresh conversations:', err);
      }
    }, 300);
  }

  useEffect(() => {
    if (!organizationId) return;
    const orgId = organizationId;

    async function load() {
      setLoading(true);

      const [fbConnection, orgRow] = await Promise.all([
        getFacebookConnection(orgId),
        supabase.from('organizations').select('ai_enabled').eq('id', orgId).single(),
      ]);

      const isConnected = fbConnection?.status === 'connected';
      setConnected(isConnected);
      setAiEnabled(orgRow.data?.ai_enabled ?? true);

      if (isConnected) {
        try {
          const list = await fetchConversationList(orgId);
          setConversations(list);
        } catch (err) {
          console.error('Failed to load conversations:', err);
        }
      }

      setLoading(false);
    }

    load();

    // Live inbox: a new message, a new conversation, or a handler
    // change (AI reply, handoff, another device replying) triggers a
    // debounced refetch instead of requiring a manual page refresh.
    // Also covers an order being drafted, accepted, or rejected — any
    // change to `orders` refreshes the list too, so the pending-order
    // badge below appears/disappears in sync without a manual reload.
    // Relies on RLS to scope which rows this owner actually receives.
    const channel = supabase
      .channel(`conversations-list-${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => scheduleListRefetch(orgId)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        () => scheduleListRefetch(orgId)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => scheduleListRefetch(orgId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => scheduleListRefetch(orgId)
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (refetchTimeoutRef.current) clearTimeout(refetchTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [organizationId]);

  // Global pause, not per-conversation — flips organizations.ai_enabled,
  // which facebook-ai-respond checks before replying to ANY conversation
  // for this shop. Optimistic update with a revert on failure, same
  // pattern as elsewhere in the app.
  async function handleToggleAi() {
    if (!organizationId || aiToggleSaving) return;
    const next = !aiEnabled;
    setAiEnabled(next);
    setAiToggleSaving(true);

    const { error } = await supabase
      .from('organizations')
      .update({ ai_enabled: next })
      .eq('id', organizationId);

    setAiToggleSaving(false);

    if (error) {
      console.error('Failed to update AI status:', error);
      setAiEnabled(!next);
    }
  }

  const totalUnread = conversations.reduce((n, c) => n + c.unread_count, 0);
  const pendingOrderCount = conversations.reduce((n, c) => n + (c.has_pending_order ? 1 : 0), 0);

  return (
    <ScreenShell>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-4 mb-6"
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
      >
        <div>
          <h1 className="font-display text-[26px] md:text-3xl font-bold tracking-tight text-accent-dark">
            Messages
          </h1>
          {connected && (totalUnread > 0 || pendingOrderCount > 0) && (
            <p className="text-[13px] text-olive mt-0.5">
              {[
                totalUnread > 0 ? `${totalUnread} unread` : null,
                pendingOrderCount > 0 ? `${pendingOrderCount} order${pendingOrderCount > 1 ? 's' : ''} to review` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
        <Link
          to="/settings"
          className="w-11 h-11 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center justify-center transition-transform duration-150 active:scale-90"
          aria-label="Channel settings"
        >
          <Settings size={17} className="text-olive" />
        </Link>
      </motion.div>

      {!loading && connected && (
        <motion.div
          custom={0.5} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-5 py-4 flex items-center justify-between gap-4 mb-4"
        >
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-accent-dark">AI Assistant</p>
            <p className="text-[13px] text-olive mt-0.5">
              {aiEnabled
                ? 'Automatically replying to new messages.'
                : 'Paused — new messages need your personal reply.'}
            </p>
          </div>
          <ToggleSwitch checked={aiEnabled} onChange={handleToggleAi} label="AI Assistant" />
        </motion.div>
      )}

      {loading ? (
        <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] divide-y divide-platinum/60">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3.5 px-5 py-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-platinum/80 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-platinum/80 rounded w-1/4" />
                <div className="h-3 bg-platinum/60 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : !connected ? (
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center text-center gap-4"
        >
          <div className="w-14 h-14 flex items-center justify-center">
            <ChannelIcon size={56} className="rounded-full ring-4 ring-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]" />
          </div>
          <div>
            <p className="text-[17px] font-semibold text-accent-dark mb-1">
              Connect your Facebook Page
            </p>
            <p className="text-[14px] text-olive leading-relaxed max-w-[260px]">
              See all your Facebook Messenger conversations in one inbox.
            </p>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 rounded-full bg-accent-dark text-white px-6 h-11 text-[15px] font-semibold shadow-control transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
          >
            Go to Settings
            <ChevronRight size={16} strokeWidth={2.5} />
          </Link>
        </motion.div>
      ) : (
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        >
          {conversations.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <p className="text-sm text-olive">No conversations yet.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                className="divide-y divide-platinum/60"
                variants={listContainer} initial="hidden" animate="visible"
              >
                {conversations.map((convo) => {
                  const hasAvatar = !!convo.customer_avatar_url;
                  // Decoupled from hasAvatar on purpose — a private-
                  // profile customer has no photo, but may still have
                  // a real name (fetched at creation, or set manually
                  // via the rename control on the conversation screen).
                  const hasRealName = !!convo.customer_name && convo.customer_name !== PLACEHOLDER_CUSTOMER_NAME;
                  const displayName = hasRealName ? convo.customer_name : 'Customer';
                  const preset = getAvatarPreset(convo.customer_id);

                  return (
                    <motion.div
                      key={convo.id} variants={listRow}
                      whileTap={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                      onClick={() => navigate(`/messages/${convo.id}`)}
                      className="group flex items-center gap-3.5 px-5 py-4 cursor-pointer transition-colors duration-150 hover:bg-black/[0.015]"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={hasAvatar ? convo.customer_avatar_url! : preset.src}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover bg-platinum"
                          onError={(e) => {
                            // Facebook picture URLs can expire or 404 occasionally.
                            // Falling back to the preset bear avatar keeps the row from breaking.
                            if (e.currentTarget.src !== window.location.origin + preset.src) {
                              e.currentTarget.src = preset.src;
                            }
                          }}
                        />
                        <ChannelIcon size={16} className="absolute -bottom-0.5 -right-0.5" />
                        {/* Pending-order marker on the avatar itself —
                            visible even when the row is narrow enough
                            that the name-row badge below might get
                            tight. Opposite corner from ChannelIcon so
                            the two never collide. */}
                        {convo.has_pending_order && (
                          <span
                            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 ring-2 ring-white flex items-center justify-center"
                            title="Order awaiting your confirmation"
                          >
                            <Receipt size={9} className="text-white" strokeWidth={2.5} />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className={`text-[15px] truncate ${convo.unread_count > 0 ? 'font-bold text-accent-dark' : 'font-semibold text-accent-dark'}`}>
                              {displayName}
                            </p>
                            {convo.has_pending_order && (
                              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                <Receipt size={9} strokeWidth={2.5} />
                                Order
                              </span>
                            )}
                          </div>
                          {convo.last_message_at && (
                            <span className="text-[12px] text-olive shrink-0">
                              {timeAgo(convo.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className={`text-[13px] truncate ${convo.unread_count > 0 ? 'text-accent-dark font-medium' : 'text-olive'}`}>
                          {convo.last_message_preview ?? 'No messages yet'}
                        </p>
                      </div>

                      {convo.unread_count > 0 ? (
                        <div className="w-5 h-5 rounded-full bg-accent-dark flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-white">{convo.unread_count}</span>
                        </div>
                      ) : (
                        <ChevronRight
                          size={15}
                          className="text-olive/0 group-hover:text-olive/50 transition-colors duration-150 shrink-0 hidden md:block"
                        />
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      )}
    </ScreenShell>
  );
}

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
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 ${
        checked ? 'bg-accent-dark' : 'bg-black/15'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}