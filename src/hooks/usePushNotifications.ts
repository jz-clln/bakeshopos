// File: app/src/hooks/usePushNotifications.ts

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import {
  isPushSupported,
  isStandalone,
  isIOS,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  subscriptionToRow,
} from '../lib/push';

export type PushStatus = 'unsupported' | 'needs-install' | 'off' | 'on' | 'denied';

export function usePushNotifications() {
  const { organizationId, session } = useAuth() as {
    organizationId?: string;
    session: { user?: { id: string } } | null;
  };

  const [status, setStatus] = useState<PushStatus>('off');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    if (!isPushSupported()) {
      setStatus('unsupported');
      setLoading(false);
      return;
    }
    if (isIOS() && !isStandalone()) {
      setStatus('needs-install');
      setLoading(false);
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      setLoading(false);
      return;
    }
    const existing = await getExistingSubscription();
    setStatus(existing ? 'on' : 'off');
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  async function enable() {
    if (!organizationId || !session?.user?.id) return;
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'off');
        return;
      }

      const subscription = await subscribeToPush();
      const row = subscriptionToRow(subscription);

      const { error: dbError } = await supabase.from('push_subscriptions').upsert(
        {
          organization_id: organizationId,
          user_id: session.user.id,
          ...row,
        },
        { onConflict: 'endpoint' }
      );

      if (dbError) throw dbError;
      setStatus('on');
    } catch (err) {
      console.error('Failed to enable push notifications:', err);
      setError('Could not turn on notifications. Please try again.');
    }
  }

  async function disable() {
    setError(null);
    try {
      const subscription = await getExistingSubscription();
      if (subscription) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
        await unsubscribeFromPush(subscription);
      }
      setStatus('off');
    } catch (err) {
      console.error('Failed to disable push notifications:', err);
      setError('Could not turn off notifications. Please try again.');
    }
  }

  return { status, loading, error, enable, disable };
}