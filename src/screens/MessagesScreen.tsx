// File: app/src/screens/MessagesScreen.tsx

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Facebook, ChevronRight, Settings } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import { useAuth } from '../lib/auth-context';
import { getFacebookConnection } from '../api/facebook';
import { fetchConversationList, type ConversationListItem } from '../api/messages';
import { getAvatarPreset } from '../lib/avatarPresets';

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

export function MessagesScreen() {
  const { organizationId } = useAuth();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    const orgId = organizationId;

    async function load() {
      setLoading(true);

      const fbConnection = await getFacebookConnection(orgId);
      const isConnected = fbConnection?.status === 'connected';
      setConnected(isConnected);

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
  }, [organizationId]);

  const totalUnread = conversations.reduce((n, c) => n + c.unread_count, 0);

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
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center text-center gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center ring-4 ring-white">
            <Facebook size={22} className="text-white" />
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
                  const displayName = hasAvatar ? convo.customer_name : 'Customer';
                  const preset = getAvatarPreset(convo.customer_id);

                  return (
                    <motion.div
                      key={convo.id} variants={listRow}
                      whileTap={{ backgroundColor: 'rgba(0,0,0,0.015)' }}
                      onClick={() => navigate(`/messages/${convo.id}`)}
                      className="flex items-center gap-3.5 px-5 py-4 cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        {hasAvatar ? (
                          <img
                            src={convo.customer_avatar_url!}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover bg-platinum"
                            onError={(e) => {
                              // Facebook picture URLs can expire or 404 occasionally.
                              // Falling back to a preset avatar keeps the row from breaking.
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center text-[18px] ${
                            hasAvatar ? 'hidden' : ''
                          }`}
                          style={{ backgroundColor: preset.bg }}
                        >
                          {preset.emoji}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-white">
                          <Facebook size={10} className="text-white" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <p className={`text-[15px] truncate ${convo.unread_count > 0 ? 'font-bold text-accent-dark' : 'font-semibold text-accent-dark'}`}>
                            {displayName}
                          </p>
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

                      {convo.unread_count > 0 && (
                        <div className="w-5 h-5 rounded-full bg-accent-dark flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-white">{convo.unread_count}</span>
                        </div>
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}