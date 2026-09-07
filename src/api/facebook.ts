// File: app/src/api/facebook.ts
//
// Frontend never sees page_access_token, and never sees the Facebook
// App ID either — it just asks the backend to start a connection and
// redirects to whatever URL comes back.

import { supabase } from '../lib/supabase';

export type FacebookConnectionStatus = 'connected' | 'needs_reconnect' | 'disconnected';

export interface FacebookConnection {
  pageId: string;
  pageName: string;
  status: FacebookConnectionStatus;
}

/**
 * Reads the current Facebook Page connection for an organization.
 * Returns null if nothing is connected yet.
 */
export async function getFacebookConnection(
  organizationId: string
): Promise<FacebookConnection | null> {
  const { data, error } = await supabase
    .from('facebook_pages')
    .select('page_id, page_name, status')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load Facebook connection:', error);
    return null;
  }
  if (!data) return null;

  return {
    pageId: data.page_id,
    pageName: data.page_name,
    status: data.status as FacebookConnectionStatus,
  };
}

/**
 * Starts the Facebook OAuth flow. Asks the facebook-oauth-start Edge
 * Function to mint a one-time state token and build the full OAuth
 * URL server-side, then redirects the browser to it.
 */
export async function startFacebookConnect(organizationId: string) {
  const { data, error } = await supabase.functions.invoke('facebook-oauth-start', {
    body: { organizationId },
  });

  if (error || !data?.oauthUrl) {
    console.error('Failed to start Facebook connect:', error);
    throw new Error('Could not start Facebook connection. Please try again.');
  }

  window.location.href = data.oauthUrl;
}