// File: app/src/lib/avatarPresets.ts
//
// Fallback avatars for customers whose Facebook profile picture isn't
// available (private profile, opted out, or fetch failed). Each
// customer gets a consistent, deterministically-assigned avatar
// instead of one that changes every time the screen reloads.
//
// Image files live in app/public/avatars/ — see the bottom of this
// file for the full list of expected filenames.

const PRESETS = [
  { src: '/avatars/bear-blue.png' },
  { src: '/avatars/bear-green.png' },
  { src: '/avatars/bear-purple.png' },
  { src: '/avatars/bear-orange.png' },
  { src: '/avatars/bear-navy.png' },
  { src: '/avatars/bear-pink.png' },
  { src: '/avatars/bear-teal.png' },
  { src: '/avatars/bear-red.png' },
] as const;

/** Simple deterministic hash so the same customer always gets the same preset. */
function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getAvatarPreset(customerId: string) {
  const index = hashId(customerId) % PRESETS.length;
  return PRESETS[index];
}

// Expected files (place in app/public/avatars/):
//   bear-blue.png    bear-green.png   bear-purple.png  bear-orange.png
//   bear-navy.png    bear-pink.png    bear-teal.png    bear-red.png