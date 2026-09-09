// File: app/src/screens/ConversationDetailScreen.tsx

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Facebook, Bot, Send, AlertTriangle } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import {
  fetchConversationDetail,
  fetchMessages,
  markConversationViewed,
  setConversationHandler,
  sendOwnerMessage,
  type ConversationDetail,
  type MessageRow,
} from '../api/messages';

const EASE = [0.23, 1, 0.32, 1] as const;

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ConversationDetailScreen() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [switchingHandler, setSwitchingHandler] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    loadAll();
  }, [conversationId]);

  async function loadAll() {
    if (!conversationId) return;
    setLoading(true);

    const [detail, rows] = await Promise.all([
      fetchConversationDetail(conversationId),
      fetchMessages(conversationId),
    ]);
    setConversation(detail);
    setMessages(rows);

    await markConversationViewed(conversationId);
    setLoading(false);
  }

  async function handleLetAiHandle() {
    if (!conversationId) return;
    setSwitchingHandler(true);
    try {
      await setConversationHandler(conversationId, 'ai');
      setConversation((prev) => (prev ? { ...prev, handler: 'ai' } : prev));
    } catch (err) {
      console.error('Failed to hand back to AI:', err);
    } finally {
      setSwitchingHandler(false);
    }
  }

  async function handleSend() {
    if (!conversationId || !draft.trim() || sending) return;
    setSending(true);
    setSendError(null);

    try {
      const result = await sendOwnerMessage(conversationId, draft.trim());
      if (!result.sent) {
        setSendError(result.reason ?? 'Could not send message.');
      }
      setDraft('');
      const rows = await fetchMessages(conversationId);
      setMessages(rows);
      setConversation((prev) => (prev ? { ...prev, handler: 'human' } : prev));
    } catch (err) {
      console.error('Failed to send message:', err);
      setSendError('Could not send message. Please try again.');
    } finally {
      setSending(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }

  const showLetAiHandle = conversation && conversation.handler !== 'ai';

  return (
    <ScreenShell>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: EASE }}
        className="flex items-center gap-3 mb-4"
      >
        <button
          onClick={() => navigate('/messages')}
          className="w-10 h-10 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center justify-center transition-transform duration-150 active:scale-90 shrink-0"
          aria-label="Back to Messages"
        >
          <ArrowLeft size={17} className="text-olive" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[19px] font-bold tracking-tight text-accent-dark truncate">
            {loading ? 'Loading…' : conversation?.customer_name}
          </p>
          <div className="flex items-center gap-1.5">
            <Facebook size={11} className="text-blue-600" />
            <span className="text-[12px] text-olive">Facebook Messenger</span>
          </div>
        </div>
      </motion.div>

      {/* Handler status banner */}
      {!loading && conversation && showLetAiHandle && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className={`mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-[14px] ${
            conversation.handler === 'handoff_required' ? 'bg-amber-50' : 'bg-platinum'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {conversation.handler === 'handoff_required' && (
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            )}
            <p className="text-[13px] font-medium text-accent-dark truncate">
              {conversation.handler === 'handoff_required'
                ? 'AI needs help with this conversation'
                : conversation.handler === 'paused'
                ? 'AI is paused for this conversation'
                : 'You\'re handling this conversation'}
            </p>
          </div>
          <button
            onClick={handleLetAiHandle}
            disabled={switchingHandler}
            className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-full bg-accent-dark text-white transition-transform duration-150 active:scale-95 disabled:opacity-50"
          >
            <Bot size={13} />
            {switchingHandler ? 'Switching…' : 'Let AI handle this'}
          </button>
        </motion.div>
      )}

      {/* Message thread */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className="h-10 w-2/3 rounded-[16px] bg-white animate-pulse shadow-[0_1px_4px_rgba(0,0,0,0.06)]" />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-2">
          <p className="text-sm text-olive">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {messages.map((msg) => {
            const isCustomer = msg.sender_type === 'customer';
            const notDelivered = msg.delivery_status !== 'sent' && !isCustomer;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[75%] rounded-[18px] px-4 py-2.5 ${
                  isCustomer
                    ? 'bg-white text-accent-dark shadow-[0_1px_4px_rgba(0,0,0,0.06)] rounded-bl-[4px]'
                    : notDelivered
                    ? 'bg-platinum text-accent-dark rounded-br-[4px] border border-dashed border-olive/40'
                    : 'bg-accent-dark text-white rounded-br-[4px]'
                }`}>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  <div className={`flex items-center gap-1.5 mt-1 ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                    {!isCustomer && (
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${notDelivered ? 'text-olive' : 'opacity-70'}`}>
                        {msg.sender_type === 'ai' ? 'AI' : 'You'}
                      </span>
                    )}
                    <span className={`text-[11px] ${isCustomer ? 'text-olive' : notDelivered ? 'text-olive' : 'text-white/60'}`}>
                      {formatTimestamp(msg.created_at)}
                    </span>
                  </div>
                  {notDelivered && (
                    <p className="text-[11px] text-amber-700 mt-1">
                      {msg.delivery_status === 'blocked_window'
                        ? 'Not delivered — outside the 24-hour messaging window'
                        : 'Not delivered — sending failed'}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Compose box */}
      <div className="sticky bottom-0 pt-2 pb-[calc(12px+env(safe-area-inset-bottom))] bg-gradient-to-t from-platinum/30 via-platinum/30 to-transparent">
        {sendError && (
          <p className="text-[12px] text-red-600 mb-1.5 px-1">{sendError}</p>
        )}
        <div className="flex items-end gap-2 bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a reply…"
            rows={1}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-[14px] text-accent-dark placeholder:text-olive/60 focus:outline-none max-h-24"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="w-9 h-9 rounded-full bg-accent-dark text-white flex items-center justify-center shrink-0 transition-transform duration-150 active:scale-90 disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}