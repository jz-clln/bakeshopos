// File: app/src/lib/push.ts
//
// Thin wrapper around the browser's Push API. Doesn't know about
// Supabase directly — callers pass in what to save or delete.

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

// Confirms VITE_VAPID_PUBLIC_KEY is actually usable before we ever try
// to decode it. Web Push's applicationServerKey must be a base64url-
// encoded, uncompressed P-256 public key — which always decodes to
// exactly 65 raw bytes starting with 0x04. Catching a malformed value
// here, instead of letting atob() throw a cryptic InvalidCharacterError
// deep inside subscribeToPush(), turns a silent misconfiguration (wrong
// value pasted into Vercel, stale build after rotating keys, a stray
// quote mark from copy-pasting) into an error message that actually
// says what's wrong and what to do about it.
function validateVapidKeyFormat(base64String: string): void {
  if (!base64String || base64String.trim().length === 0) {
    throw new Error(
      'VAPID key is misconfigured: VITE_VAPID_PUBLIC_KEY is empty or missing. Check your environment variables and redeploy.'
    );
  }

  if (!/^[A-Za-z0-9\-_]+$/.test(base64String)) {
    throw new Error(
      "VAPID key is misconfigured: VITE_VAPID_PUBLIC_KEY contains characters that aren't valid base64url (check for stray quotes, spaces, or line breaks from copy-pasting). Check your environment variables and redeploy."
    );
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  validateVapidKeyFormat(base64String);

  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  let rawData: string;
  try {
    rawData = window.atob(base64);
  } catch {
    throw new Error(
      'VAPID key is misconfigured: VITE_VAPID_PUBLIC_KEY could not be decoded. It may be truncated or corrupted — copy it fresh from where the key pair was generated, rather than from a place it may have been re-pasted before. Check your environment variables and redeploy.'
    );
  }

  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  // A valid Web Push VAPID public key always decodes to a 65-byte
  // uncompressed P-256 point starting with 0x04. Anything else means
  // the wrong value ended up in VITE_VAPID_PUBLIC_KEY — e.g. the
  // private key was pasted in by mistake, or the key was truncated
  // during copy-paste.
  if (outputArray.length !== 65 || outputArray[0] !== 4) {
    throw new Error(
      `VAPID key is misconfigured: VITE_VAPID_PUBLIC_KEY decoded to ${outputArray.length} bytes instead of the expected 65 — this usually means the wrong value, or a truncated one, is set. Check your environment variables and redeploy.`
    );
  }

  return outputArray;
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export function isStandalone(): boolean {
  // iOS Safari exposes navigator.standalone; other browsers use the
  // display-mode media query. Checking both covers every platform.
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js');
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  // Registering here (not just inside subscribeToPush) is what fixes
  // this — navigator.serviceWorker.ready hangs forever if no service
  // worker has EVER been registered yet, which is exactly the state
  // of a fresh page load before anyone has clicked "enable." register()
  // is idempotent: if one's already active, this just returns it
  // immediately instead of registering a duplicate.
  await registerServiceWorker();

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<PushSubscription> {
  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    // TypeScript's lib.dom types require the applicationServerKey to
    // be backed by a plain ArrayBuffer, not the wider ArrayBufferLike
    // that Uint8Array's type now allows (a TS 5.6+ strictness change,
    // not a real runtime concern — new Uint8Array() here is never
    // actually SharedArrayBuffer-backed).
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
  });
}

export async function unsubscribeFromPush(subscription: PushSubscription): Promise<void> {
  await subscription.unsubscribe();
}

export function subscriptionToRow(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh,
    auth_key: json.keys!.auth,
  };
}