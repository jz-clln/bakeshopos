// File: app/src/components/orders/RecordPaymentSheet.tsx

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Camera, Wallet, Pencil, Plus, ArrowLeft, ExternalLink } from 'lucide-react';
import {
  recordPayment,
  updatePayment,
  fetchPaymentProofUrl,
  type PaymentMethod,
  type PaymentRecord,
} from '../../api/payments';
import { formatPrice } from '../../lib/currency';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
];

interface RecordPaymentSheetProps {
  orderId: string;
  orderTotal: number; // centavos
  payments?: PaymentRecord[]; // verified payments on this order
  allowNew?: boolean;
  onClose: () => void;
  onRecorded: (proofWarning?: string) => void | Promise<void>;
}

type SheetMode = 'list' | 'create' | 'edit';

const EASE = [0.23, 1, 0.32, 1] as const;

export function RecordPaymentSheet({
  orderId,
  orderTotal,
  payments = [],
  allowNew = true,
  onClose,
  onRecorded,
}: RecordPaymentSheetProps) {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0);
  const remaining = Math.max(0, orderTotal - totalPaid);
  const canAddPayment = allowNew && remaining > 0;
  const singlePayment = payments.length === 1 ? payments[0] : null;
  const [mode, setMode] = useState<SheetMode>(payments.length > 1 ? 'list' : singlePayment ? 'edit' : 'create');
  const [editing, setEditing] = useState<PaymentRecord | null>(singlePayment);
  const [amountPesos, setAmountPesos] = useState(((singlePayment?.amount_paid ?? remaining) / 100).toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>(singlePayment?.method ?? 'gcash');
  const [isDeposit, setIsDeposit] = useState(singlePayment?.is_deposit ?? false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [existingProofUrl, setExistingProofUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!proofFile) {
      setProofPreview(null);
      return;
    }
    const url = URL.createObjectURL(proofFile);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  useEffect(() => {
    if (mode !== 'edit' || !editing) return;
    let cancelled = false;
    fetchPaymentProofUrl(editing.id)
      .then((url) => { if (!cancelled) setExistingProofUrl(url); })
      .catch((err) => console.error('Failed to load payment proof:', err));
    return () => { cancelled = true; };
  }, [mode, editing?.id]);

  function startCreate() {
    if (!canAddPayment) return;
    setEditing(null);
    setAmountPesos((remaining / 100).toFixed(2));
    setMethod('gcash');
    setIsDeposit(false);
    setProofFile(null);
    setExistingProofUrl(null);
    setError(null);
    setMode('create');
  }

  function startEdit(payment: PaymentRecord) {
    setEditing(payment);
    setAmountPesos((payment.amount_paid / 100).toFixed(2));
    setMethod(payment.method);
    setIsDeposit(payment.is_deposit);
    setProofFile(null);
    setExistingProofUrl(null);
    setError(null);
    setMode('edit');

  }

  async function handleSubmit() {
    if (submittingRef.current) return;
    const pesos = Number(amountPesos);
    const amountCentavos = Math.round(pesos * 100);

    if (!Number.isFinite(pesos) || !Number.isSafeInteger(amountCentavos) || amountCentavos <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (mode === 'create' && amountCentavos > remaining) {
      setError('Amount exceeds the remaining balance.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const input = {
        orderId,
        amountPaid: amountCentavos,
        method,
        isDeposit,
        proofFile: proofFile ?? undefined,
      };
      const result = mode === 'edit' && editing
        ? await updatePayment({ ...input, paymentId: editing.id })
        : await recordPayment(input);

      // A payment has already been saved at this point. A proof warning is
      // forwarded rather than treating the entire transaction as failed.
      await onRecorded(result.proofWarning);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save payment.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="px-4 pb-4 pt-1 sm:px-5 xl:px-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-3 rounded-[16px] border border-[#E5DED5] bg-[#FAF8F5] p-3.5 shadow-[0_3px_12px_rgba(42,35,32,0.045)] sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {mode !== 'list' && payments.length > 0 && (
              <button
                type="button"
                onClick={() => { setMode('list'); setError(null); }}
                disabled={submitting}
                aria-label="Back to payments"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-olive hover:bg-white disabled:opacity-50"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <p className="truncate text-[13px] font-semibold text-accent-dark">
              {mode === 'list' ? 'Order payments' : mode === 'edit' ? 'Edit payment' : 'Record a payment'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close payment form"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-olive hover:bg-white disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="rounded-[12px] border border-[#E5DED5] bg-white px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 text-[11px] text-olive">
            <span>Order total</span><span className="font-semibold text-accent-dark">{formatPrice(orderTotal)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-olive">
            <span>Verified payments</span><span className="font-semibold text-accent-dark">{formatPrice(totalPaid)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-platinum/50 pt-2 text-[11px]">
            <span className="font-medium text-olive">{totalPaid > orderTotal ? 'Overpaid by' : 'Remaining'}</span>
            <span className={`font-bold ${totalPaid > orderTotal ? 'text-rose-600' : 'text-accent-dark'}`}>
              {formatPrice(totalPaid > orderTotal ? totalPaid - orderTotal : remaining)}
            </span>
          </div>
        </div>

        {mode === 'list' ? (
          <>
            <div className="space-y-2">
              {payments.map((payment, index) => (
                <div key={payment.id} className="flex min-w-0 items-center gap-2 rounded-[12px] border border-platinum/60 bg-white px-3 py-2.5">
                  <Wallet size={14} className="shrink-0 text-olive" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-accent-dark">{formatPrice(payment.amount_paid)}</p>
                    <p className="text-[10px] text-olive/70">
                      Payment {index + 1} · {PAYMENT_METHODS.find((m) => m.value === payment.method)?.label ?? payment.method}
                      {payment.is_deposit ? ' · Deposit' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(payment)}
                    className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-[#F2EDE6] px-3 text-[11px] font-semibold text-accent-dark hover:bg-[#E9E1D7]"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                </div>
              ))}
            </div>
            {totalPaid > orderTotal && (
              <p className="text-[11px] leading-4 text-rose-600">
                Multiple verified payments exceed this order total. Review each record before recording anything else.
                Editing one record does not remove duplicate records.
              </p>
            )}
            {canAddPayment && (
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-accent-dark px-3 text-[11px] font-semibold text-white"
              >
                <Plus size={13} /> Add another payment
              </button>
            )}
          </>
        ) : (
          <>
            <div>
              <label htmlFor={`payment-amount-${orderId}`} className="mb-1 block text-[11px] font-semibold text-olive">
                Amount received (₱)
              </label>
              <input
                id={`payment-amount-${orderId}`}
                type="number"
                min="0.01"
                step="0.01"
                value={amountPesos}
                onChange={(e) => setAmountPesos(e.target.value)}
                disabled={submitting}
                className="h-10 w-full rounded-[10px] border border-platinum bg-white px-3 text-[13px] text-accent-dark outline-none focus:border-accent-dark/40 disabled:opacity-50"
              />
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-olive">Method</p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value)}
                    disabled={submitting}
                    aria-pressed={method === m.value}
                    className={`min-h-9 rounded-full border px-3 text-[11px] font-semibold disabled:opacity-50 ${
                      method === m.value
                        ? 'border-accent-dark bg-accent-dark text-white'
                        : 'border-platinum bg-white text-accent-dark'
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
                disabled={submitting}
                className="h-4 w-4 accent-accent-dark"
              />
              <span className="text-[11px] text-accent-dark">This is a deposit, not full payment</span>
            </label>

            <div>
              <p className="mb-1 text-[11px] font-semibold text-olive">Proof of payment (optional)</p>
              {proofPreview ? (
                <div className="relative inline-block">
                  <img src={proofPreview} alt="Selected payment proof" className="h-16 w-16 rounded-[10px] border border-platinum object-cover" />
                  <button
                    type="button"
                    onClick={() => setProofFile(null)}
                    disabled={submitting}
                    aria-label="Remove new proof"
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent-dark text-white disabled:opacity-50"
                  >
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-semibold text-accent-dark">
                    <Camera size={14} /> {existingProofUrl ? 'Attach new screenshot' : 'Attach screenshot'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={submitting}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setProofFile(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  {existingProofUrl && (
                    <a
                      href={existingProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center gap-1 text-[11px] font-semibold text-accent-dark underline underline-offset-2"
                    >
                      Existing proof <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {error && <p role="alert" className="text-[11px] leading-4 text-rose-600">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[11px] bg-accent-dark text-[12px] font-semibold text-white disabled:opacity-45"
            >
              <Check size={14} />
              {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Record payment'}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
