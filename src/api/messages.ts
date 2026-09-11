// File: app/src/api/messages.ts

import { supabase } from '../lib/supabase';

export interface ConversationListItem {
  id: string;
  customer_id: string;
  channel: 'facebook_messenger' | 'instagram' | 'manual';
  handler: 'ai' | 'human' | 'paused' | 'handoff_required';
  customer_name: string;
  customer_avatar_url: string | null;
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
  const conversations = (data ?? []) as Array<Omit<ConversationListItem, 'customer_avatar_url'>>;

  if (conversations.length === 0) return [];

  // conversation_list_view doesn't expose the customer's avatar, so
  // fetch it directly from customers and merge it in here rather than
  // touching a view whose full query we don't have on hand.
  const customerIds = [...new Set(conversations.map((c) => c.customer_id))];
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, facebook_profile_pic_url')
    .in('id', customerIds);

  if (customersError) throw customersError;
  const avatarByCustomerId = new Map(
    (customers ?? []).map((c) => [c.id, c.facebook_profile_pic_url as string | null])
  );

  return conversations.map((c) => ({
    ...c,
    customer_avatar_url: avatarByCustomerId.get(c.customer_id) ?? null,
  }));
}

export interface ConversationDetail {
  id: string;
  handler: 'ai' | 'human' | 'paused' | 'handoff_required';
  customer_id: string;
  customer_name: string;
  customer_avatar_url: string | null;
}

export async function fetchConversationDetail(conversationId: string): Promise<ConversationDetail> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, handler, customer_id, customers(full_name, facebook_profile_pic_url)')
    .eq('id', conversationId)
    .single();

  if (error) throw error;
  return {
    id: data.id,
    handler: data.handler,
    customer_id: data.customer_id,
    customer_name: (data as any).customers?.full_name ?? 'Customer',
    customer_avatar_url: (data as any).customers?.facebook_profile_pic_url ?? null,
  };
}

export interface MessageRow {
  id: string;
  sender_type: 'customer' | 'ai' | 'owner';
  body: string | null;
  media_url: string | null;
  created_at: string;
  delivery_status: 'sent' | 'blocked_window' | 'failed';
}

export async function fetchMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_type, body, media_url, created_at, delivery_status')
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
 * Sends a message as the shop owner — text, an image, or both (as
 * two separate Facebook messages, per the platform's own constraint).
 * Goes through facebook-send-message, so the same 24-hour window
 * rule applies to owners as it does to the AI.
 */
export async function sendOwnerMessage(
  conversationId: string,
  options: { body?: string; mediaUrl?: string }
): Promise<SendMessageResult> {
  const { data, error } = await supabase.functions.invoke('facebook-send-message', {
    body: { conversationId, senderType: 'owner', body: options.body, mediaUrl: options.mediaUrl },
  });

  if (error) throw error;
  return data as SendMessageResult;
}