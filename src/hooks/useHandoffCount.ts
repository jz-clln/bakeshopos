// File: app/src/hooks/useHandoffCount.ts
//
// Live count of conversations currently at handler: 'handoff_required'
// for the given organization — the same status facebook-ai-respond
// sets when it escalates (turn cap, monthly token limit, missing shop
// data, or a stuck tool-call loop). Used to badge the notification
// bell and the Messages screen so a pending handoff stays visible even
// if a push notification was missed, denied, or never enabled.
//
// Realtime requires the `conversations` table to be added to the
// supabase_realtime publication (Supabase Dashboard -> Database ->
// Replication) — without that, postgres_changes events for this table
// never fire and the count only ever updates on next page load.

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useHandoffCount(organizationId: string | null | undefined) {
  const [count, setCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setCount(0);
      return;
    }
    const orgId = organizationId;

    async function fetchCount() {
      const { count: c, error } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('handler', 'handoff_required');

      if (error) {
        console.error('Failed to load handoff count:', error);
        return;
      }
      setCount(c ?? 0);
    }

    fetchCount();

    // Debounced the same way MessagesScreen's list refetch is — a
    // burst of conversation updates collapses into one recount instead
    // of hammering the query.
    function scheduleRefetch() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchCount, 300);
    }

    const channel = supabase
      .channel(`handoff-count-${orgId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `organization_id=eq.${orgId}` },
        scheduleRefetch
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [organizationId]);

  return count;
}