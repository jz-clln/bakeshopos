// File: app/src/api/messages.ts

import { supabase } from '../lib/supabase';

export interface ConversationListItem {
  id: string;
  customer_id: string;
  channel: 'facebook_messenger' | 'instagram' | 'manual';
  handler: 'ai' | 'human' | 'paused';
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

export interface MessageRow {
  id: string;
  sender_type: 'customer' | 'ai' | 'owner';
  body: string | null;
  created_at: string;
}

export async function fetchMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_type, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

/**
 * Marks a conversation as viewed right now — call this when the owner
 * opens the thread. Every customer message with a timestamp before
 * this counts as read from that point on.
 */
export async function markConversationViewed(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ owner_last_viewed_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) throw error;
}