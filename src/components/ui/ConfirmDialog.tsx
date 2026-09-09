// File: app/src/components/ui/ConfirmDialog.tsx

import { AnimatePresence, motion } from 'framer-motion';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-sm bg-white rounded-[20px] p-5 shadow-[0_20px_40px_-12px_rgba(39,76,119,0.3)]"
          >
            <p id="confirm-dialog-title" className="font-display text-[17px] font-bold text-accent-dark mb-1.5">
              {title}
            </p>
            <p className="text-[14px] text-olive leading-relaxed mb-5">{description}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 h-11 rounded-[12px] text-[14px] font-semibold text-accent-dark bg-platinum/60 transition-colors duration-150 hover:bg-platinum active:scale-[0.98]"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-1 h-11 rounded-[12px] text-[14px] font-semibold text-white transition-colors duration-150 active:scale-[0.98] ${
                  destructive ? 'bg-red-500 hover:bg-red-600' : 'bg-accent-dark hover:bg-accent-dark/90'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}