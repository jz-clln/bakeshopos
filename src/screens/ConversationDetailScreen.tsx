// File: app/src/screens/ConversationDetailScreen.tsx

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot, Send, AlertTriangle, Image as ImageIcon, X, Pencil, Check, Receipt, Clock, Trash2, MessageCircle } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  fetchConversationDetail,
  fetchMessages,
  markConversationViewed,
  setConversationHandler,
  sendOwnerMessage,
  deleteMessage,
  type ConversationDetail,
  type MessageRow,
} from '../api/messages';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  fetchPendingOrderForConversation,
  acceptDraftOrder,
  rejectDraftOrder,
  type PendingConversationOrder,
} from '../api/orders';
import { uploadMessageAttachment } from '../api/attachments';
import { updateCustomerName } from '../api/customers';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/currency';
import { EmojiPicker } from '../components/messages/EmojiPicker';
import { ChannelIcon } from '../components/messages/ChannelIcon';
import { OrderDetailModal } from '../components/orders/OrderDetailModal';
import { getAvatarPreset } from '../lib/avatarPresets';

const EASE = [0.23, 1, 0.32, 1] as const;

// Consecutive messages from the same sender within this window are
// visually grouped — tighter spacing, timestamp (and, for the
// customer, their avatar) shown once at the end of the cluster
// instead of on every bubble.
const GROUP_WINDOW_MS = 3 * 60 * 1000;

// Written by the Messenger webhook when a private profile or a failed
// profile fetch means there's no real name to store. Used here to
// decide whether to show it as-is or fall back to "Customer" — kept
// as an exact string match against supabase/functions/facebook-messenger-webhook.
const PLACEHOLDER_CUSTOMER_NAME = 'Facebook customer';

function isSameDay(isoA: string, isoB: string): boolean {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateDivider(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(iso, now.toISOString())) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(iso, yesterday.toISOString())) return 'Yesterday';

  return date.toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

// event_date is a plain date with no time/timezone — parsing it with
// `new Date(iso)` directly can shift it a day depending on the
// browser's local timezone, same issue OrderDetailModal.tsx's
// formatEventDate already works around.
function formatOrderEventDate(iso: string): string {
  const [year, month, day] = iso.split(/[-T]/).map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' });
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

  // Renaming the customer inline from the header — mainly for private
  // Facebook profiles that only ever gave us the placeholder name.
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Deleting a message removes it from this shop's own view only —
  // it does NOT un-send it from the customer's actual Messenger
  // inbox (Meta doesn't expose that to Pages via the API). Confirmed
  // via ConfirmDialog since it's irreversible from this dashboard's
  // side, even though it's a low-stakes "clean up my view" action.
  const [messageToDelete, setMessageToDelete] = useState<MessageRow | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Message actions appear only after a deliberate press, not on hover or tap.
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressOriginRef = useRef<{ x: number; y: number } | null>(null);

  function cancelMessagePress() {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
    pressOriginRef.current = null;
  }

  function startMessagePress(event: ReactPointerEvent<HTMLDivElement>, messageId: string) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    cancelMessagePress();
    setSelectedMessageId(null);
    pressOriginRef.current = { x: event.clientX, y: event.clientY };
    pressTimerRef.current = setTimeout(() => {
      pressTimerRef.current = null;
      pressOriginRef.current = null;
      setSelectedMessageId(messageId);
    }, 550);
  }

  function moveMessagePress(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = pressOriginRef.current;
    if (origin && (Math.abs(event.clientX - origin.x) > 8 || Math.abs(event.clientY - origin.y) > 8)) {
      cancelMessagePress();
    }
  }

  useEffect(() => () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  }, []);

  useEffect(() => {
    if (!selectedMessageId) return;
    function dismiss(event: globalThis.PointerEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-message-delete-action]')) return;
      setSelectedMessageId(null);
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedMessageId(null);
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismissOnEscape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [selectedMessageId]);

  // The AI's most recent still-undecided (status: inquiry) order for
  // this conversation, shown as a review banner until the owner
  // accepts or rejects it. viewingOrderId opens the full existing
  // OrderDetailModal on top of the banner for a closer look before
  // deciding.
  const [pendingOrder, setPendingOrder] = useState<PendingConversationOrder | null>(null);
  const [decidingOrder, setDecidingOrder] = useState(false);
  const [orderActionError, setOrderActionError] = useState<string | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);

  // Selected image staged for sending, plus a local preview URL —
  // separate from the uploaded state, since the file isn't uploaded
  // to Storage until the moment "send" is actually pressed.
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    loadAll();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [loading]);

  // Live thread: new messages (from the customer, from the AI, or
  // sent by the owner from another tab/device) drop straight into
  // the conversation without a manual refresh. Row updates cover a
  // delivery_status flipping from queued to sent/failed after the
  // fact — this is also how a message that was queued for the
  // 24-hour window (see notify-order-approved / facebook-messenger-
  // webhook) visually updates the moment it actually goes out,
  // without needing a page reload. The orders listener refreshes the
  // pending-order banner the same way: a new draft_order INSERT shows
  // the banner, and an UPDATE (accepted or rejected from another
  // tab/device) hides it in sync, since the refetch only ever returns
  // a row still sitting at status inquiry.
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          if (incoming.sender_type === 'customer') {
            markConversationViewed(conversationId).catch((err) =>
              console.error('Failed to mark conversation viewed:', err)
            );
          }
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as MessageRow;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as { handler: ConversationDetail['handler'] };
          setConversation((prev) => (prev ? { ...prev, handler: updated.handler } : prev));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchPendingOrderForConversation(conversationId)
            .then(setPendingOrder)
            .catch((err) => console.error('Failed to refresh pending order:', err));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId]);

  async function loadAll() {
    if (!conversationId) return;
    setLoading(true);

    const [detail, rows, pending] = await Promise.all([
      fetchConversationDetail(conversationId),
      fetchMessages(conversationId),
      fetchPendingOrderForConversation(conversationId),
    ]);
    setConversation(detail);
    setMessages(rows);
    setPendingOrder(pending);

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

  async function handleAcceptOrder() {
    if (!pendingOrder || decidingOrder) return;
    setDecidingOrder(true);
    setOrderActionError(null);
    try {
      await acceptDraftOrder(pendingOrder.id);
      setPendingOrder(null);
    } catch (err) {
      console.error('Failed to accept order:', err);
      setOrderActionError(err instanceof Error ? err.message : 'Could not accept this order.');
    } finally {
      setDecidingOrder(false);
    }
  }

  async function handleRejectOrder() {
    if (!pendingOrder || decidingOrder) return;
    setDecidingOrder(true);
    setOrderActionError(null);
    try {
      await rejectDraftOrder(pendingOrder.id);
      setPendingOrder(null);
    } catch (err) {
      console.error('Failed to reject order:', err);
      setOrderActionError(err instanceof Error ? err.message : 'Could not reject this order.');
    } finally {
      setDecidingOrder(false);
    }
  }

  async function handleConfirmDeleteMessage() {
    if (!messageToDelete) return;
    const id = messageToDelete.id;
    setDeletingMessageId(id);
    setDeleteError(null);
    try {
      await deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setMessageToDelete(null);
    } catch (err) {
      console.error('Failed to delete message:', err);
      setDeleteError(err instanceof Error ? err.message : 'Could not delete this message.');
    } finally {
      setDeletingMessageId(null);
    }
  }

  function handleStartEditName() {
    if (!conversation) return;
    setNameError(null);
    setNameDraft(
      conversation.customer_name && conversation.customer_name !== PLACEHOLDER_CUSTOMER_NAME
        ? conversation.customer_name
        : ''
    );
    setEditingName(true);
  }

  function handleCancelEditName() {
    setEditingName(false);
    setNameError(null);
  }

  async function handleSaveName() {
    if (!conversation) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) return;

    setSavingName(true);
    setNameError(null);
    try {
      await updateCustomerName(conversation.customer_id, trimmed);
      setConversation((prev) => (prev ? { ...prev, customer_name: trimmed } : prev));
      setEditingName(false);
    } catch (err) {
      console.error('Failed to update customer name:', err);
      setNameError(err instanceof Error ? err.message : 'Could not save name.');
    } finally {
      setSavingName(false);
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
  // Decoupled from hasAvatar on purpose: a private-profile customer
  // has no photo, but may still have a real name (either fetched
  // successfully at creation, or set manually via the rename control
  // below) — the header should show that name regardless of photo.
  const hasRealName = !!conversation?.customer_name && conversation.customer_name !== PLACEHOLDER_CUSTOMER_NAME;
  const headerName = loading ? 'Loading…' : hasRealName ? conversation!.customer_name : 'Customer';
  const preset = conversation ? getAvatarPreset(conversation.customer_id) : null;
  const customerAvatarSrc = hasAvatar ? conversation?.customer_avatar_url ?? undefined : preset?.src;

  return (
    <div className="fixed inset-0 z-30 flex min-h-0 flex-col overflow-hidden bg-[#F6EEE2] md:left-64">
      {/* Header — thin and translucent, with fixed left padding
          instead of a centered max-width wrapper. That's deliberate:
          a centered wrapper's side margins grow with the window (or
          with browser zoom, which changes how much CSS-pixel width is
          available), so the back button and name would visibly drift
          away from the sidebar edge. Fixed padding means this block
          sits at the same offset from the sidebar no matter the
          window size or zoom level. */}
      {/* 
      ============================================================
      CONVERSATION TOPBAR
      ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: EASE }}
        className="z-10 shrink-0 border-b border-[#E5DED5] bg-[#ffffff] shadow-[0_3px_12px_rgba(42,35,32,0.06)]"
      >
        <div
          className="flex w-full min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-5 md:px-6"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 10px)',
            paddingBottom: '10px',
            minHeight: '68px',
          }}
        >
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate('/messages')}
            aria-label="Back to Messages"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-olive transition-all duration-150 hover:bg-platinum/50 hover:text-accent-dark active:scale-90"
          >
            <ArrowLeft size={17} strokeWidth={2.1} />
          </button>

          {/* Customer avatar */}
          {!loading && conversation && (
            <div className="relative shrink-0">
              <img
                src={customerAvatarSrc}
                alt=""
                className="h-10 w-10 rounded-full bg-platinum object-cover ring-1 ring-black/[0.05]"
                onError={() => setAvatarFailed(true)}
              />

              {/* Green profile indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
          )}

          {/* Customer information */}
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="w-full max-w-[260px]">
                <input
                  autoFocus
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveName();
                    }

                    if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCancelEditName();
                    }
                  }}
                  placeholder="Customer's name"
                  className="h-9 w-full min-w-0 rounded-[10px] border border-platinum/80 bg-platinum/35 px-3 font-display text-[14px] font-semibold tracking-[-0.02em] text-accent-dark outline-none transition-all duration-150 placeholder:font-normal placeholder:text-olive/40 focus:border-accent-dark/25 focus:bg-white focus:ring-2 focus:ring-accent-dark/[0.06]"
                />
              </div>
            ) : (
              <p className="truncate font-display text-[16px] font-semibold leading-tight tracking-[-0.025em] text-accent-dark sm:text-[17px]">
                {headerName}
              </p>
            )}

            <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-olive/60">
              <ChannelIcon size={11} />
              Messenger
            </span>

            {nameError && (
              <p className="mt-1 text-[11px] text-red-600">
                {nameError}
              </p>
            )}
          </div>

          {/* Right-side actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {editingName ? (
              <>
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={savingName || !nameDraft.trim()}
                  aria-label="Save name"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-dark text-white transition-transform duration-150 active:scale-90 disabled:opacity-40"
                >
                  <Check size={14} strokeWidth={2.4} />
                </button>

                <button
                  type="button"
                  onClick={handleCancelEditName}
                  aria-label="Cancel editing name"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-platinum/60 text-olive transition-transform duration-150 active:scale-90"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </>
            ) : (
              conversation && (
                <button
                  type="button"
                  onClick={handleStartEditName}
                  aria-label="Edit customer name"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-olive/55 transition-colors duration-150 hover:bg-platinum/50 hover:text-accent-dark active:scale-90"
                >
                  <Pencil size={15} strokeWidth={1.8} />
                </button>
              )
            )}
          </div>
        </div>
      </motion.div>

      {/* Handler status banner */}
      {!loading && conversation && showLetAiHandle && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="w-full shrink-0 px-3 pt-2.5 sm:px-5 md:px-6"
        >
          <div className={`flex w-full min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[16px] border px-3.5 py-2.5 sm:flex-nowrap sm:px-4 ${
            conversation.handler === 'handoff_required'
              ? 'border-amber-200/70 bg-amber-50/90'
              : 'border-platinum/60 bg-white shadow-[0_2px_9px_rgba(42,35,32,0.035)]'
          }`}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {conversation.handler === 'handoff_required' && (
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              )}
              <p className="text-[12px] font-medium leading-5 text-accent-dark">
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
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 self-center rounded-full bg-accent-dark px-3.5 text-[11px] font-semibold text-white transition-colors duration-150 hover:bg-accent-dark/90 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25"
            >
              <Bot size={13} />
              {switchingHandler ? 'Switching…' : 'Let AI handle this'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Pending order banner — shown while an AI-drafted order for
          this conversation is still sitting at status: inquiry. */}
      {!loading && pendingOrder && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="w-full shrink-0 px-3 pb-0.5 pt-2.5 sm:px-5 md:px-6"
        >
          <div className="w-full min-w-0 rounded-[16px] border border-platinum/70 bg-white px-3.5 py-3 shadow-[0_3px_14px_rgba(42,35,32,0.045)] sm:px-4">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <p className="inline-flex min-w-0 items-center gap-1.5 text-[12px] font-semibold leading-5 text-accent-dark">
                <Receipt size={13} className="text-olive shrink-0" />
                New order awaiting your confirmation
              </p>
              <span className="ml-auto shrink-0 font-display text-[14px] font-bold tabular-nums text-accent-dark">
                {formatPrice(pendingOrder.total_amount)}
              </span>
            </div>

            <p className="mt-1 truncate text-[12px] text-olive/80">{pendingOrder.item_summary}</p>
            {pendingOrder.event_date && (
              <p className="text-[11px] text-olive/70 mt-0.5">
                For {formatOrderEventDate(pendingOrder.event_date)}
              </p>
            )}

            {orderActionError && (
              <p className="text-[11px] text-accent mt-2">{orderActionError}</p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-2">
              <button
                onClick={() => setViewingOrderId(pendingOrder.id)}
                className="inline-flex min-h-9 items-center text-[11px] font-semibold text-olive underline underline-offset-2 hover:text-accent-dark"
              >
                View details
              </button>
              <div className="flex-1 min-w-[8px]" />
              <button
                onClick={handleRejectOrder}
                disabled={decidingOrder}
                className="inline-flex min-h-9 items-center rounded-full bg-platinum/50 px-3.5 text-[11px] font-semibold text-olive transition-colors duration-150 hover:bg-platinum active:scale-95 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={handleAcceptOrder}
                disabled={decidingOrder}
                className="inline-flex min-h-9 items-center rounded-full bg-accent-dark px-4 text-[11px] font-semibold text-white transition-colors duration-150 hover:bg-accent-dark/90 active:scale-95 disabled:opacity-50"
              >
                {decidingOrder ? 'Saving…' : 'Accept'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Message list */}
      <div
        className="min-h-0 flex-1 overscroll-contain overflow-y-auto bg-[#F6EEE2] px-3 sm:px-5 md:px-6"
        onScroll={() => { cancelMessagePress(); setSelectedMessageId(null); }}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="w-full min-w-0">
        {loading ? (
          <div className="space-y-3 pt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="h-10 w-2/3 max-w-[340px] animate-pulse rounded-[18px] bg-white shadow-[0_1px_4px_rgba(42,35,32,0.04)] motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[15px] bg-white text-olive shadow-[0_2px_10px_rgba(42,35,32,0.035)]">
              <MessageCircle size={18} strokeWidth={1.8} />
            </div>
            <p className="text-[13px] font-semibold text-accent-dark">No messages yet</p>
            <p className="mt-1 text-[12px] leading-5 text-olive/60">Your conversation will appear here.</p>
          </div>
        ) : (
          <div className="pb-5 pt-2">
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const isCustomer = msg.sender_type === 'customer';

              // 'queued' means this is waiting for the customer to
              // message in again before it can send (see
              // notify-order-approved / facebook-messenger-webhook —
              // Meta retired the message tag that used to let this
              // through immediately outside the 24-hour window).
              // Deliberately kept distinct from notDelivered below:
              // this ISN'T a failure, it's a message that WILL send,
              // just not yet — showing the old "sending failed"
              // copy on it would be actively misleading.
              const isQueued = msg.delivery_status === 'queued' && !isCustomer;
              const notDelivered =
                msg.delivery_status !== 'sent' && msg.delivery_status !== 'queued' && !isCustomer;

              const showDateDivider = !prev || !isSameDay(msg.created_at, prev.created_at);

              const groupedWithPrev =
                !!prev &&
                !showDateDivider &&
                prev.sender_type === msg.sender_type &&
                new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS;

              const groupedWithNext =
                !!next &&
                isSameDay(msg.created_at, next.created_at) &&
                next.sender_type === msg.sender_type &&
                new Date(next.created_at).getTime() - new Date(msg.created_at).getTime() < GROUP_WINDOW_MS;

              const showTimestamp = !groupedWithNext;

              return (
                <div key={msg.id}>
                  {showDateDivider && (
                    <div className="flex items-center justify-center py-4 first:pt-2">
                      <span className="rounded-full border border-platinum/60 bg-white/80 px-3 py-1 text-[10px] font-semibold text-olive/65 shadow-[0_1px_3px_rgba(42,35,32,0.025)]">
                        {formatDateDivider(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className={`group flex items-end gap-1.5 ${isCustomer ? 'justify-start' : 'justify-end'} ${
                      groupedWithPrev ? 'mt-1' : 'mt-3.5'
                    }`}
                  >
                    {isCustomer && (
                      <div className="h-6 w-6 shrink-0">
                        {showTimestamp && (
                          <img
                            src={customerAvatarSrc}
                            alt=""
                            className="h-6 w-6 rounded-full bg-platinum object-cover ring-1 ring-black/[0.05]"
                          />
                        )}
                      </div>
                    )}
                    {/* Delete action is revealed only by a long press on the bubble. */}
                    {!isCustomer && selectedMessageId === msg.id && (
                      <button
                        type="button"
                        data-message-delete-action
                        onClick={() => { setSelectedMessageId(null); setMessageToDelete(msg); }}
                        aria-label="Delete message"
                        className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-100 bg-white text-red-500 shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    <div
                      onPointerDown={(event) => startMessagePress(event, msg.id)}
                      onPointerMove={moveMessagePress}
                      onPointerUp={cancelMessagePress}
                      onPointerCancel={cancelMessagePress}
                      onPointerLeave={cancelMessagePress}
                      onContextMenu={(event) => event.preventDefault()}
                      style={{ WebkitTouchCallout: 'none' }}
                      className={`min-w-0 max-w-[min(80%,560px)] cursor-default select-none overflow-hidden rounded-[18px] md:select-text transition-shadow duration-150 sm:max-w-[min(72%,560px)] ${
                      msg.media_url ? 'p-1.5' : 'px-3.5 py-2.5'
                    } ${
                      isCustomer
                        ? 'rounded-bl-[5px] border border-platinum/60 bg-white text-accent-dark shadow-[0_2px_8px_rgba(42,35,32,0.035)]'
                        : isQueued
                        ? 'rounded-br-[5px] border border-accent-light/70 bg-accent-light/25 text-accent-dark'
                        : notDelivered
                        ? 'rounded-br-[5px] border border-dashed border-olive/40 bg-platinum/70 text-accent-dark'
                        : 'rounded-br-[5px] bg-accent-dark text-white shadow-[0_2px_8px_rgba(42,35,32,0.09)]'
                    }`}>
                      {msg.media_url && (
                        <img
                          src={msg.media_url}
                          alt="Attachment"
                          className="max-h-[320px] max-w-full rounded-[13px] object-contain"
                        />
                      )}
                      {msg.body && (
                        <p className={`whitespace-pre-wrap break-words text-[13px] leading-[1.55] sm:text-[14px] ${msg.media_url ? 'px-2.5 pt-2' : ''}`}>
                          {msg.body}
                        </p>
                      )}
                      {showTimestamp && (
                        <div className={`mt-1.5 flex items-center gap-1.5 ${msg.media_url ? 'px-2.5 pb-1' : ''} ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                          {!isCustomer && (
                            <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                              isQueued ? 'text-accent-dark/60' : notDelivered ? 'text-olive' : 'opacity-70'
                            }`}>
                              {msg.sender_type === 'ai' ? 'AI' : 'You'}
                            </span>
                          )}
                          <span className={`text-[10px] ${
                            isCustomer ? 'text-olive' : isQueued ? 'text-accent-dark/60' : notDelivered ? 'text-olive' : 'text-white/60'
                          }`}>
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      )}
                      {isQueued && (
                        <p className={`inline-flex items-center gap-1 text-[11px] text-accent-dark/70 ${msg.media_url ? 'px-2.5 pb-1.5' : 'mt-1'}`}>
                          <Clock size={11} className="shrink-0" />
                          Waiting to send — will deliver once they message again
                        </p>
                      )}
                      {notDelivered && (
                        <p className={`text-[11px] text-amber-700 ${msg.media_url ? 'px-2.5 pb-1.5' : 'mt-1'}`}>
                          {msg.delivery_status === 'blocked_window'
                            ? 'Not delivered — outside the 24-hour messaging window'
                            : 'Not delivered — sending failed'}
                        </p>
                      )}
                    </div>
                    {isCustomer && selectedMessageId === msg.id && (
                      <button
                        type="button"
                        data-message-delete-action
                        onClick={() => { setSelectedMessageId(null); setMessageToDelete(msg); }}
                        aria-label="Delete message"
                        className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-100 bg-white text-red-500 shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </motion.div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
        </div>
      </div>

      {/* Compose bar */}
        <div
          className="relative z-10 shrink-0 border-t border-[#E5DED5] bg-white px-3 pt-2.5 shadow-[0_-5px_22px_rgba(42,35,32,0.14)] sm:px-5 md:px-6"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
        >
        <div className="w-full min-w-0">
          {sendError && (
            <p className="text-[12px] text-red-600 mb-1.5 px-1">{sendError}</p>
          )}
          {deleteError && (
            <p className="text-[12px] text-red-600 mb-1.5 px-1">{deleteError}</p>
          )}

          {pendingImagePreview && (
            <div className="relative mb-2 inline-block">
              <img
                src={pendingImagePreview}
                alt="Selected"
                className="h-16 w-16 rounded-[12px] border border-platinum/70 object-cover shadow-[0_2px_8px_rgba(42,35,32,0.06)]"
              />
              <button
                onClick={clearPendingImage}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent-dark text-white shadow-[0_2px_7px_rgba(42,35,32,0.18)]"
                aria-label="Remove image"
              >
                <X size={11} />
              </button>
            </div>
          )}

          <div className="flex min-w-0 items-end gap-0.5 rounded-[22px] border border-[#E5DED5] bg-white p-1 shadow-[inset_0_1px_2px_rgba(42,35,32,0.025)] transition-colors duration-150 focus-within:border-accent-dark/25 focus-within:ring-2 focus-within:ring-accent-dark/[0.04] sm:gap-1">
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-olive/70 transition-colors duration-150 hover:bg-platinum/60 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/20"
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
              className="max-h-24 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-1.5 py-2.5 text-[14px] leading-5 text-accent-dark outline-none placeholder:text-olive/45 sm:px-2"
            />

            <EmojiPicker onSelect={handleEmojiSelect} />

            <button
              onClick={handleSend}
              disabled={!canSend}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-dark text-white shadow-[0_2px_6px_rgba(42,35,32,0.12)] transition-all duration-150 hover:bg-accent-dark/90 active:scale-95 disabled:bg-olive/20 disabled:text-olive/45 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/25"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {viewingOrderId && (
        <OrderDetailModal orderId={viewingOrderId} onClose={() => setViewingOrderId(null)} />
      )}

      <ConfirmDialog
        open={!!messageToDelete}
        title="Delete this message?"
        description="This removes it from your view only. It will NOT be un-sent from the customer's actual Messenger inbox — Facebook doesn't allow Pages to retract messages that way."
        confirmLabel={deletingMessageId ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={handleConfirmDeleteMessage}
        onCancel={() => setMessageToDelete(null)}
      />
    </div>
  );
}