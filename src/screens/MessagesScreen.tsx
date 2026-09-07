// File: app/src/screens/MessagesScreen.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Facebook, ChevronRight, Settings } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

const EASE = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.26, ease: EASE, delay: i * 0.05 },
  }),
};

const listContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const listRow = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
};

/* ─── Types ─── */
type Channel = 'instagram' | 'facebook';

interface Conversation {
  id: string;
  channel: Channel;
  customer_name: string;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
}

const CHANNEL_ICON: Record<Channel, typeof Instagram> = {
  instagram: Instagram,
  facebook:  Facebook,
};

const CHANNEL_COLOR: Record<Channel, string> = {
  instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
  facebook:  'bg-blue-600',
};

type TabValue = 'all' | Channel;

const TABS: { label: string; value: TabValue }[] = [
  { label: 'All',       value: 'all'       },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook',  value: 'facebook'  },
];

function initials(name: string) {
  const p = (name ?? '').trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
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

/* ─── Screen ─── */
export function MessagesScreen() {
  const { organizationId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    async function load() {
      setLoading(true);

      // Check if any channel integration is active
      const { data: integrations } = await supabase
        .from('channel_integrations')
        .select('channel, is_active')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(1);

      const isConnected = (integrations ?? []).length > 0;
      setConnected(isConnected);

      if (isConnected) {
        let query = supabase
          .from('conversations')
          .select('id, channel, customer_name, last_message_preview, last_message_at, unread_count')
          .eq('organization_id', organizationId)
          .order('last_message_at', { ascending: false });

        if (activeTab !== 'all') {
          query = query.eq('channel', activeTab);
        }

        const { data } = await query;
        setConversations((data ?? []) as Conversation[]);
      }

      setLoading(false);
    }

    load();
  }, [organizationId, activeTab]);

  const totalUnread = conversations.reduce((n, c) => n + (c.unread_count ?? 0), 0);

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
          {connected && totalUnread > 0 && (
            <p className="text-[13px] text-olive mt-0.5">{totalUnread} unread</p>
          )}
        </div>
        <Link
          to="/settings"
          className="w-10 h-10 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center justify-center transition-transform duration-150 active:scale-90"
          aria-label="Channel settings"
        >
          <Settings size={17} className="text-olive" />
        </Link>
      </motion.div>

      {loading ? (
        /* Skeleton */
        <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] divide-y divide-platinum/60">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3.5 px-5 py-4 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-platinum/80 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-platinum/80 rounded w-1/4" />
                <div className="h-3 bg-platinum/60 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : !connected ? (
        /* Not connected */
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center text-center gap-4"
        >
          <div className="flex -space-x-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-4 ring-white">
              <Instagram size={22} className="text-white" />
            </div>
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center ring-4 ring-white">
              <Facebook size={22} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-[17px] font-semibold text-accent-dark mb-1">
              Connect your channels
            </p>
            <p className="text-[14px] text-olive leading-relaxed max-w-[260px]">
              See all your Instagram DMs and Facebook Messenger conversations in one inbox.
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
        /* Connected — conversation list */
        <>
          {/* Channel tabs */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="flex gap-2 mb-4"
          >
            {TABS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`shrink-0 px-4 h-9 rounded-full text-sm font-semibold transition-colors duration-150 ${
                  activeTab === value
                    ? 'bg-accent-dark text-white shadow-control'
                    : 'bg-white text-olive border border-platinum/70 hover:border-accent-dark/30'
                }`}
              >
                {label}
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE }}
              className="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
            >
              {conversations.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-2">
                  <p className="text-sm text-olive">No conversations yet.</p>
                </div>
              ) : (
                <motion.div
                  className="divide-y divide-platinum/60"
                  variants={listContainer} initial="hidden" animate="visible"
                >
                  {conversations.map((convo) => {
                    const ChannelIcon = CHANNEL_ICON[convo.channel];
                    return (
                      <motion.div
                        key={convo.id} variants={listRow}
                        whileTap={{ backgroundColor: 'rgba(0,0,0,0.015)' }}
                        className="flex items-center gap-3.5 px-5 py-4 cursor-default"
                      >
                        {/* Avatar + channel badge */}
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-full bg-accent-light/40 flex items-center justify-center text-[12px] font-bold text-accent-dark">
                            {initials(convo.customer_name)}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${CHANNEL_COLOR[convo.channel]} flex items-center justify-center ring-2 ring-white`}>
                            <ChannelIcon size={10} className="text-white" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2 mb-0.5">
                            <p className={`text-[15px] truncate ${convo.unread_count > 0 ? 'font-bold text-accent-dark' : 'font-semibold text-accent-dark'}`}>
                              {convo.customer_name}
                            </p>
                            <span className="text-[12px] text-olive shrink-0">
                              {timeAgo(convo.last_message_at)}
                            </span>
                          </div>
                          <p className={`text-[13px] truncate ${convo.unread_count > 0 ? 'text-accent-dark font-medium' : 'text-olive'}`}>
                            {convo.last_message_preview}
                          </p>
                        </div>

                        {/* Unread badge */}
                        {convo.unread_count > 0 && (
                          <div className="w-5 h-5 rounded-full bg-accent-dark flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-white">{convo.unread_count}</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </ScreenShell>
  );
}