// File: app/src/api/messages.ts

import { supabase } from '../lib/supabase';

export interface ConversationListItem {
  id: string;
  customer_id: string;
  channel: 'facebook_messenger' | 'instagram' | 'manual';
  handler: 'ai' | 'human' | 'paused' | 'handoff_required';
  customer_name: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export async function fetchConversationList(organizationId: string): Promise<ConversationListItem[]> {
  const { data, error } = await supabase
    .from('conversation_list_view')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('channel', 'facebook_messenger')
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as ConversationListItem[];
}

export interface ConversationDetail {
  id: string;
  handler: 'ai' | 'human' | 'paused' | 'handoff_required';
  customer_name: string;
}

export async function fetchConversationDetail(conversationId: string): Promise<ConversationDetail> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, handler, customer_id, customers(full_name)')
    .eq('id', conversationId)
    .single();

  if (error) throw error;
  return {
    id: data.id,
    handler: data.handler,
    customer_name: (data as any).customers?.full_name ?? 'Customer',
  };
}

export interface MessageRow {
  id: string;
  sender_type: 'customer' | 'ai' | 'owner';
  body: string | null;
  created_at: string;
  delivery_status: 'sent' | 'blocked_window' | 'failed';
}

export async function fetchMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_type, body, created_at, delivery_status')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function markConversationViewed(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ owner_last_viewed_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) throw error;
}

/**
 * Sets the conversation's handler directly — used for the
 * "Let AI handle this" button. Going straight to 'ai' rather than
 * routing through facebook-send-message, since this isn't sending a
 * message, just changing who's responsible for the next one.
 */
export async function setConversationHandler(
  conversationId: string,
  handler: 'ai' | 'human' | 'paused' | 'handoff_required'
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ handler, updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) throw error;
}

export interface SendMessageResult {
  sent: boolean;
  reason?: string;
}

/**
 * Sends a message as the shop owner. Goes through the same
 * facebook-send-message function the AI uses — same 24-hour window
 * rule applies to owners too, since Meta enforces it regardless of
 * who's sending.
 */
export async function sendOwnerMessage(conversationId: string, body: string): Promise<SendMessageResult> {
  const { data, error } = await supabase.functions.invoke('facebook-send-message', {
    body: { conversationId, body, senderType: 'owner' },
  });

  if (error) throw error;
  return data as SendMessageResult;
}