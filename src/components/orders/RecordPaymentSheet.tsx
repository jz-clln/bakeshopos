// File: app/src/components/orders/RecordPaymentSheet.tsx
//
// A bottom-sheet-style inline form, matching the existing inline
// next-status menu pattern in OrdersScreen.tsx rather than a full
// modal or a separate screen, per the "add it as an action in the
// existing list" decision.

import { useState } from 'react';
import { X, Check, Camera } from 'lucide-react';
import { recordPayment, type PaymentMethod } from '../../api/payments';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
];

interface RecordPaymentSheetProps {
  orderId: string;
  orderTotal: number; // centavos, for the placeholder/default amount
  onClose: () => void;
  onRecorded: () => void;
}

export function RecordPaymentSheet({ orderId, orderTotal, onClose, onRecorded }: RecordPaymentSheetProps) {
  const [amountPesos, setAmountPesos] = useState((orderTotal / 100).toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>('gcash');
  const [isDeposit, setIsDeposit] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    const amountCentavos = Math.round(parseFloat(amountPesos) * 100);
    if (!amountCentavos || amountCentavos <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await recordPayment({
        orderId,
        amountPaid: amountCentavos,
        method,
        isDeposit,
        proofFile: proofFile ?? undefined,
      });
      onRecorded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record payment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-5 md:px-6 pb-4 pt-1">
      <div className="bg-platinum/40 rounded-[16px] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-accent-dark">Record a payment</p>
          <button onClick={onClose} className="text-olive" aria-label="Cancel">
            <X size={16} />
          </button>
        </div>

        <div>
          <label className="text-[12px] font-semibold text-olive mb-1 block">Amount received (₱)</label>
          <input
            type="number"
            step="0.01"
            value={amountPesos}
            onChange={(e) => setAmountPesos(e.target.value)}
            className="w-full px-3 py-2 rounded-[10px] border border-platinum text-[14px] bg-white focus:outline-none focus:border-accent-dark/40"
          />
        </div>

        <div>
          <label className="text-[12px] font-semibold text-olive mb-1 block">Method</label>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border ${
                  method === m.value
                    ? 'bg-accent-dark text-white border-accent-dark'
                    : 'bg-white text-accent-dark border-platinum'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isDeposit}
            onChange={(e) => setIsDeposit(e.target.checked)}
            className="w-4 h-4 accent-accent-dark"
          />
          <span className="text-[13px] text-accent-dark">This is a deposit, not full payment</span>
        </label>

        <div>
          <label className="text-[12px] font-semibold text-olive mb-1 block">Proof of payment (optional)</label>
          {proofPreview ? (
            <div className="relative inline-block">
              <img src={proofPreview} alt="Payment proof" className="h-16 w-16 object-cover rounded-[10px] border border-platinum" />
              <button
                onClick={() => { setProofFile(null); setProofPreview(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent-dark text-white flex items-center justify-center"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent-dark cursor-pointer">
              <Camera size={14} />
              Attach screenshot
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          )}
        </div>

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px] bg-accent-dark text-white text-[13px] font-semibold disabled:opacity-40"
        >
          <Check size={14} />
          {submitting ? 'Recording…' : 'Record payment'}
        </button>
      </div>
    </div>
  );
}