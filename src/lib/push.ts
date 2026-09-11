// File: app/src/lib/push.ts
//
// Thin wrapper around the browser's Push API. Doesn't know about
// Supabase directly — callers pass in what to save or delete.

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
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
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<PushSubscription> {
  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
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