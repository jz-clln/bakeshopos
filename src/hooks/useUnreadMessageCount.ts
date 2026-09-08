// File: app/src/hooks/useUnreadMessageCount.ts
//
// Sums unread_count across all Facebook Messenger conversations for
// the organization. Refetches whenever the route changes — this is
// what makes the badge clear immediately after visiting a
// conversation (which calls markConversationViewed) and navigating
// back, without needing a manual refresh trigger.

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useUnreadMessageCount(organizationId: string | null | undefined): number {
  const [count, setCount] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('conversation_list_view')
        .select('unread_count')
        .eq('organization_id', organizationId)
        .eq('channel', 'facebook_messenger');

      if (error) {
        console.error('Failed to load unread message count:', error);
        return;
      }
      if (!cancelled) {
        const total = (data ?? []).reduce((sum, row) => sum + (row.unread_count ?? 0), 0);
        setCount(total);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [organizationId, pathname]);

  return count;
}