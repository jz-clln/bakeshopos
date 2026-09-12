// File: app/src/components/messages/ChannelIcon.tsx
//
// Single source of truth for the Facebook Messenger glyph shown across
// the Messages screens. Points at the icon file in app/public/icons/ —
// swap that file to change the icon everywhere at once.
//
// display: 'block' matters here — <img> is inline by default, which
// reserves a few px of "descender" space below it (the same reason
// images sometimes have a mystery gap underneath them). That extra
// space made plain wrapping <div>s (like the corner badge) slightly
// taller than they are wide, turning rounded-full into an oval instead
// of a circle — visible as a stray curved line above the icon.

const MESSENGER_ICON_SRC = '/icons/facebook.png';

interface ChannelIconProps {
  size?: number;
  className?: string;
}

export function ChannelIcon({ size = 12, className = '' }: ChannelIconProps) {
  return (
    <img
      src={MESSENGER_ICON_SRC}
      alt="Facebook Messenger"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}