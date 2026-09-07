// File: app/src/screens/MessagesScreen.tsx
//
// Unified inbox — Facebook Messenger + Instagram DMs in one place.
// When channels are not connected, shows a clear empty state with
// a prompt to connect from Settings.
// When connected, shows a conversation list grouped by channel.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Facebook, MessageSquare, ChevronRight, Settings } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';

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

/* ─── Data ─── */
type Channel = 'instagram' | 'facebook';

interface Conversation {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  channel: Channel;
}

// Mock data — replace with real API data when channels are connected
const CONVERSATIONS: Conversation[] = [
  { id: '1', name: 'Maria Santos',   preview: 'Hi! Is the Ube Cake available this Saturday?', time: '9:12 AM', unread: 2, channel: 'instagram' },
  { id: '2', name: 'Angel Reyes',    preview: 'Can I change my order to 4 cinnamon rolls?',    time: '8:30 AM', unread: 1, channel: 'instagram' },
  { id: '3', name: 'Kim Villanueva', preview: 'How much for a custom cake for 30 people?',     time: 'Yesterday', unread: 0, channel: 'facebook' },
];

const CHANNEL_TABS: { label: string; value: Channel | 'all' }[] = [
  { label: 'All',       value: 'all'       },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook',  value: 'facebook'  },
];

const CHANNEL_ICON = {
  instagram: Instagram,
  facebook: Facebook,
} as const;

const CHANNEL_COLOR = {
  instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
  facebook:  'bg-blue-600',
} as const;

// Toggle this to false to simulate connected state
const CHANNELS_CONNECTED = false;

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}

/* ─── Screen ─── */
export function MessagesScreen() {
  const [activeTab, setActiveTab] = useState<Channel | 'all'>('all');

  const filtered = activeTab === 'all'
    ? CONVERSATIONS
    : CONVERSATIONS.filter((c) => c.channel === activeTab);

  const totalUnread = CONVERSATIONS.reduce((n, c) => n + c.unread, 0);

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
          {totalUnread > 0 && (
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

      {!CHANNELS_CONNECTED ? (
        /* ── Not connected state ── */
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
        /* ── Connected: conversation list ── */
        <>
          {/* Channel filter tabs */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="flex gap-2 mb-4"
          >
            {CHANNEL_TABS.map(({ label, value }) => {
              const isActive = activeTab === value;
              return (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={`shrink-0 px-4 h-9 rounded-full text-sm font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'bg-accent-dark text-white shadow-control'
                      : 'bg-white text-olive border border-platinum/70 hover:border-accent-dark/30'
                  }`}
                >
                  {label}
                </button>
              );
            })}
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
              <motion.div
                className="divide-y divide-platinum/60"
                variants={listContainer} initial="hidden" animate="visible"
              >
                {filtered.map((convo) => {
                  const ChannelIcon = CHANNEL_ICON[convo.channel];
                  return (
                    <motion.div
                      key={convo.id}
                      variants={listRow}
                      whileTap={{ backgroundColor: 'rgba(0,0,0,0.015)' }}
                      className="flex items-center gap-3.5 px-5 py-4 cursor-default"
                    >
                      {/* Avatar with channel badge */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-accent-light/40 flex items-center justify-center text-[12px] font-bold text-accent-dark">
                          {initials(convo.name)}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${CHANNEL_COLOR[convo.channel]} flex items-center justify-center ring-2 ring-white`}>
                          <ChannelIcon size={10} className="text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <p className={`text-[15px] truncate ${convo.unread > 0 ? 'font-bold text-accent-dark' : 'font-semibold text-accent-dark'}`}>
                            {convo.name}
                          </p>
                          <span className="text-[12px] text-olive shrink-0">{convo.time}</span>
                        </div>
                        <p className={`text-[13px] truncate ${convo.unread > 0 ? 'text-accent-dark font-medium' : 'text-olive'}`}>
                          {convo.preview}
                        </p>
                      </div>

                      {/* Unread badge */}
                      {convo.unread > 0 && (
                        <div className="w-5 h-5 rounded-full bg-accent-dark flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-white">{convo.unread}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </ScreenShell>
  );
}