// File: app/src/api/facebook.ts
//
// Frontend never sees page_access_token. This file only ever reads
// page_id / page_name / status, and only ever *starts* the OAuth
// redirect — the actual token exchange happens server-side in the
// Edge Function built in 3B.

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

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
const FACEBOOK_OAUTH_REDIRECT_URI = import.meta.env.VITE_FACEBOOK_OAUTH_REDIRECT_URI;

// pages_show_list: list the Pages the owner manages, so they can pick one
// pages_messaging: send/receive Messenger messages as the Page
// pages_manage_metadata: required by Meta to subscribe the Page to webhooks
const FACEBOOK_OAUTH_SCOPES = [
  'pages_show_list',
  'pages_messaging',
  'pages_manage_metadata',
].join(',');

/**
 * Redirects the owner to Facebook's own login/permission screen.
 * Nothing here touches a token — Facebook redirects back to our
 * Edge Function callback URL with a short-lived code, and that
 * function (built in 3B) does the actual exchange.
 *
 * SECURITY NOTE (to finish in 3B): `state` is currently just the raw
 * organization ID so the UI has something to send today. Before 3B
 * ships, this needs to become a short-lived, signed/opaque value that
 * the callback function verifies — otherwise the state param could be
 * tampered with in the browser. Flagging so it isn't forgotten.
 */
export function startFacebookConnect(organizationId: string) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_OAUTH_REDIRECT_URI) {
    throw new Error(
      'Missing VITE_FACEBOOK_APP_ID or VITE_FACEBOOK_OAUTH_REDIRECT_URI. Check your app/.env file.'
    );
  }

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: FACEBOOK_OAUTH_REDIRECT_URI,
    scope: FACEBOOK_OAUTH_SCOPES,
    response_type: 'code',
    state: organizationId,
  });

  window.location.href = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}