// File: app/src/screens/ConversationDetailScreen.tsx
//
// Read-only thread view for now — there's no send capability yet
// (the AI reply pipeline is 4B, manual owner replies would come with
// human handoff in 4D). This screen's job right now is just proving
// the stored messages are readable in order, and marking the
// conversation as viewed so the unread badge clears correctly.

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Facebook } from 'lucide-react';
import { ScreenShell } from '../components/layout/ScreenShell';
import { fetchMessages, markConversationViewed, type MessageRow } from '../api/messages';
import { supabase } from '../lib/supabase';

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

  const [customerName, setCustomerName] = useState<string>('');
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;

    async function load() {
      setLoading(true);

      // Pulled directly here rather than through conversation_list_view,
      // since this screen only needs the customer's name, not the
      // whole list-row shape (preview text, unread count, etc.).
      const { data: convo } = await supabase
        .from('conversations')
        .select('customer_id, customers(full_name)')
        .eq('id', conversationId)
        .single();

      setCustomerName((convo as any)?.customers?.full_name ?? 'Customer');

      const rows = await fetchMessages(conversationId!);
      setMessages(rows);

      // Mark viewed AFTER loading messages, not before — so this
      // visit itself correctly clears the badge for what was just read.
      await markConversationViewed(conversationId!);

      setLoading(false);
    }

    load();
  }, [conversationId]);

  return (
    <ScreenShell>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: EASE }}
        className="flex items-center gap-3 mb-6"
      >
        <button
          onClick={() => navigate('/messages')}
          className="w-10 h-10 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center justify-center transition-transform duration-150 active:scale-90 shrink-0"
          aria-label="Back to Messages"
        >
          <ArrowLeft size={17} className="text-olive" />
        </button>
        <div className="min-w-0">
          <p className="font-display text-[19px] font-bold tracking-tight text-accent-dark truncate">
            {loading ? 'Loading…' : customerName}
          </p>
          <div className="flex items-center gap-1.5">
            <Facebook size={11} className="text-blue-600" />
            <span className="text-[12px] text-olive">Facebook Messenger</span>
          </div>
        </div>
      </motion.div>

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
                    : 'bg-accent-dark text-white rounded-br-[4px]'
                }`}>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  <div className={`flex items-center gap-1.5 mt-1 ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                    {!isCustomer && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        {msg.sender_type === 'ai' ? 'AI' : 'You'}
                      </span>
                    )}
                    <span className={`text-[11px] ${isCustomer ? 'text-olive' : 'text-white/60'}`}>
                      {formatTimestamp(msg.created_at)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </ScreenShell>
  );
}