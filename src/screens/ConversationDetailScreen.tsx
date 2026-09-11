// File: app/src/screens/ConversationDetailScreen.tsx

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Facebook, Bot, Send, AlertTriangle, Image as ImageIcon, X } from 'lucide-react';
import {
  fetchConversationDetail,
  fetchMessages,
  markConversationViewed,
  setConversationHandler,
  sendOwnerMessage,
  type ConversationDetail,
  type MessageRow,
} from '../api/messages';
import { uploadMessageAttachment } from '../api/attachments';
import { useAuth } from '../lib/auth-context';
import { EmojiPicker } from '../components/messages/EmojiPicker';
import { getAvatarPreset } from '../lib/avatarPresets';

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
  const { organizationId } = useAuth();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [switchingHandler, setSwitchingHandler] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Selected image staged for sending, plus a local preview URL —
  // separate from the uploaded state, since the file isn't uploaded
  // to Storage until the moment "send" is actually pressed.
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    loadAll();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [loading]);

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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSendError('Only image files can be sent.');
      return;
    }

    setSendError(null);
    setPendingImage(file);
    setPendingImagePreview(URL.createObjectURL(file));
    e.target.value = ''; // allows selecting the same file again later
  }

  function clearPendingImage() {
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImage(null);
    setPendingImagePreview(null);
  }

  function handleEmojiSelect(emoji: string) {
    setDraft((prev) => prev + emoji);
  }

  async function handleSend() {
    if (!conversationId || !organizationId || sending) return;
    if (!draft.trim() && !pendingImage) return;

    setSending(true);
    setSendError(null);

    try {
      let mediaUrl: string | undefined;
      if (pendingImage) {
        mediaUrl = await uploadMessageAttachment(organizationId, pendingImage);
      }

      const result = await sendOwnerMessage(conversationId, {
        body: draft.trim() || undefined,
        mediaUrl,
      });

      if (!result.sent) {
        setSendError(result.reason ?? 'Could not send message.');
      }

      setDraft('');
      clearPendingImage();
      const rows = await fetchMessages(conversationId);
      setMessages(rows);
      setConversation((prev) => (prev ? { ...prev, handler: 'human' } : prev));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      console.error('Failed to send message:', err);
      setSendError(err instanceof Error ? err.message : 'Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const showLetAiHandle = conversation && conversation.handler !== 'ai';
  const canSend = (draft.trim().length > 0 || !!pendingImage) && !sending;

  const hasAvatar = !!conversation?.customer_avatar_url && !avatarFailed;
  const headerName = loading ? 'Loading…' : hasAvatar ? conversation?.customer_name : 'Customer';
  const preset = conversation ? getAvatarPreset(conversation.customer_id) : null;

  return (
    <div className="fixed inset-0 md:left-64 z-30 flex flex-col bg-platinum/30">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: EASE }}
        className="shrink-0 border-b border-black/[0.04] bg-white/80 backdrop-blur-xl"
      >
        <div
          className="flex items-center gap-3 px-5 md:px-10 max-w-5xl mx-auto w-full"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)', paddingBottom: '16px' }}
        >
          <button
            onClick={() => navigate('/messages')}
            className="w-10 h-10 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center justify-center transition-transform duration-150 active:scale-90 shrink-0"
            aria-label="Back to Messages"
          >
            <ArrowLeft size={17} className="text-olive" />
          </button>

          {!loading && conversation && (
            <div className="relative shrink-0">
              {hasAvatar ? (
                <img
                  src={conversation.customer_avatar_url!}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover bg-platinum"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[15px]"
                  style={{ backgroundColor: preset?.bg }}
                >
                  {preset?.emoji}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-white">
                <Facebook size={8} className="text-white" />
              </div>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="font-display text-[19px] font-bold tracking-tight text-accent-dark truncate">
              {headerName}
            </p>
            <div className="flex items-center gap-1.5">
              <Facebook size={11} className="text-blue-600" />
              <span className="text-[12px] text-olive">Facebook Messenger</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Handler status banner */}
      {!loading && conversation && showLetAiHandle && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="shrink-0 px-5 md:px-10 pt-3 max-w-5xl mx-auto w-full"
        >
          <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-[14px] ${
            conversation.handler === 'handoff_required' ? 'bg-amber-50' : 'bg-platinum'
          }`}>
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
          </div>
        </motion.div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-5 md:px-10">
        <div className="max-w-5xl mx-auto w-full">
          {loading ? (
            <div className="space-y-3 pt-4">
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
            <div className="space-y-3 pt-4 pb-4">
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
                    <div className={`max-w-[75%] rounded-[18px] overflow-hidden ${
                      msg.media_url ? 'p-1.5' : 'px-4 py-2.5'
                    } ${
                      isCustomer
                        ? 'bg-white text-accent-dark shadow-[0_1px_4px_rgba(0,0,0,0.06)] rounded-bl-[4px]'
                        : notDelivered
                        ? 'bg-platinum text-accent-dark rounded-br-[4px] border border-dashed border-olive/40'
                        : 'bg-accent-dark text-white rounded-br-[4px]'
                    }`}>
                      {msg.media_url && (
                        <img
                          src={msg.media_url}
                          alt="Attachment"
                          className="rounded-[13px] max-w-full max-h-[280px] object-cover"
                        />
                      )}
                      {msg.body && (
                        <p className={`text-[14px] leading-relaxed whitespace-pre-wrap ${msg.media_url ? 'px-2.5 pt-2' : ''}`}>
                          {msg.body}
                        </p>
                      )}
                      <div className={`flex items-center gap-1.5 mt-1 ${msg.media_url ? 'px-2.5 pb-1' : ''} ${isCustomer ? 'justify-start' : 'justify-end'}`}>
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
                        <p className={`text-[11px] text-amber-700 ${msg.media_url ? 'px-2.5 pb-1.5' : 'mt-1'}`}>
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
        </div>
      </div>

      {/* Compose bar */}
      <div
        className="shrink-0 border-t border-black/[0.04] bg-white/80 backdrop-blur-xl px-5 md:px-10 pt-3"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
      >
        <div className="max-w-5xl mx-auto w-full">
          {sendError && (
            <p className="text-[12px] text-red-600 mb-1.5 px-1">{sendError}</p>
          )}

          {/* Pending image preview — shown above the input when a
              photo is staged but not yet sent. */}
          {pendingImagePreview && (
            <div className="mb-2 relative inline-block">
              <img
                src={pendingImagePreview}
                alt="Selected"
                className="h-16 w-16 object-cover rounded-[10px] border border-black/[0.08]"
              />
              <button
                onClick={clearPendingImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent-dark text-white flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
                aria-label="Remove image"
              >
                <X size={11} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-1 bg-platinum/50 border border-black/[0.06] rounded-[22px] p-1.5 transition-colors duration-150 focus-within:bg-white focus-within:border-accent-dark/25">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-olive hover:text-accent-dark transition-colors duration-150"
              aria-label="Attach image"
            >
              <ImageIcon size={18} />
            </button>

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
              className="flex-1 resize-none bg-transparent px-2 py-2 text-[14px] text-accent-dark placeholder:text-olive/70 focus:outline-none max-h-24"
            />

            <EmojiPicker onSelect={handleEmojiSelect} />

            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-9 h-9 rounded-full bg-accent-dark text-white flex items-center justify-center shrink-0 transition-all duration-150 active:scale-90 disabled:opacity-30 disabled:bg-olive/30"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}