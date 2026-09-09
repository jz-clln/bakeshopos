// File: app/src/components/messages/EmojiPicker.tsx
//
// A small, curated grid rather than a full searchable picker — no
// new dependency to install, and a bakeshop's Messenger replies
// don't need thousands of emoji categories. Appends to the end of
// whatever's already typed, rather than inserting at cursor position
// (a reasonable simplification for a text reply box, not a full
// document editor).

import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const EMOJIS = [
  '😀', '😊', '😍', '🥰', '😂', '🙂', '😉', '😅',
  '👍', '🙏', '👏', '💪', '✨', '🎉', '❤️', '🧡',
  '🎂', '🍰', '🧁', '🍫', '🍓', '🎈', '🎁', '🕯️',
  '😢', '😮', '🤔', '👌', '🙌', '😴', '⏰', '📅',
];

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-olive hover:text-accent-dark transition-colors duration-150"
        aria-label="Add emoji"
      >
        <Smile size={19} />
      </button>

      {open && (
        <div className="absolute bottom-11 right-0 bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.14)] border border-black/[0.06] p-2 grid grid-cols-8 gap-0.5 w-[264px] z-10">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
              className="w-8 h-8 flex items-center justify-center text-[18px] rounded-[8px] hover:bg-platinum/60 transition-colors duration-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}