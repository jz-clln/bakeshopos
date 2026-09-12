// File: app/src/hooks/useUnreadMessageCount.ts
//
// Sums unread_count across all Facebook Messenger conversations for
// the organization. Refetches whenever the route changes — this is
// what makes the badge clear immediately after visiting a
// conversation (which calls markConversationViewed) and navigating
// back, without needing a manual refresh trigger. Also holds a
// Realtime subscription so the badge updates the moment a new
// message arrives or a conversation is marked viewed elsewhere,
// instead of waiting for the next route change.

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

async function fetchTotalUnread(organizationId: string): Promise<number> {
  const { data, error } = await supabase
    .from('conversation_list_view')
    .select('unread_count')
    .eq('organization_id', organizationId)
    .eq('channel', 'facebook_messenger');

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + (row.unread_count ?? 0), 0);
}

export function useUnreadMessageCount(organizationId: string | null | undefined): number {
  const [count, setCount] = useState(0);
  const { pathname } = useLocation();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    fetchTotalUnread(organizationId)
      .then((total) => {
        if (!cancelled) setCount(total);
      })
      .catch((err) => console.error('Failed to load unread message count:', err));

    return () => {
      cancelled = true;
    };
  }, [organizationId, pathname]);

  useEffect(() => {
    if (!organizationId) return;
    const orgId = organizationId;

    // Debounced so a burst of INSERT/UPDATE events collapses into a
    // single recount instead of one query per event.
    function scheduleRecount() {
      if (refetchTimeoutRef.current) clearTimeout(refetchTimeoutRef.current);
      refetchTimeoutRef.current = setTimeout(() => {
        fetchTotalUnread(orgId)
          .then(setCount)
          .catch((err) => console.error('Failed to refresh unread message count:', err));
      }, 300);
    }

    const channel = supabase
      .channel(`unread-count-${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        scheduleRecount
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        scheduleRecount
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (refetchTimeoutRef.current) clearTimeout(refetchTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [organizationId]);

  return count;
}