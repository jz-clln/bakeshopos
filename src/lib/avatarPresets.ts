// File: app/src/lib/avatarPresets.ts
//
// Fallback avatars for customers whose Facebook profile picture isn't
// available (private profile, opted out, or fetch failed). Each
// customer gets a consistent, deterministically-assigned avatar
// instead of one that changes every time the screen reloads.

const PRESETS = [
  { emoji: '🧁', bg: '#FCEAEA' },
  { emoji: '🍪', bg: '#FDF2D9' },
  { emoji: '🥐', bg: '#F4E9D8' },
  { emoji: '🍩', bg: '#FBE3EE' },
  { emoji: '🎂', bg: '#E7F0FA' },
  { emoji: '☕', bg: '#EAE5DE' },
  { emoji: '🍫', bg: '#EBDAC9' },
  { emoji: '🍰', bg: '#F1E6F7' },
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