// File: app/src/api/payments.ts

import { supabase } from '../lib/supabase';

export type PaymentMethod = 'gcash' | 'maya' | 'bank_transfer' | 'cash';

export interface RecordPaymentInput {
  orderId: string;
  amountPaid: number; // centavos
  method: PaymentMethod;
  isDeposit: boolean;
  proofFile?: File;
}

const MAX_PROOF_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * Records a payment the owner is personally entering and vouching
 * for — so it's written as already 'verified', not 'submitted'.
 * (A future customer-submitted-proof flow would need a separate,
 * unverified starting state and an explicit owner review step —
 * not what this covers.)
 *
 * amount_due is set equal to the order's own total_amount for the
 * FIRST payment recorded against an order; subsequent payments on
 * the same order reuse that existing due amount rather than
 * resetting it, so a deposit followed later by a balance payment
 * correctly accumulates toward the same total instead of each
 * payment silently redefining what's "due".
 */
export async function recordPayment(input: RecordPaymentInput): Promise<void> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('organization_id, total_amount')
    .eq('id', input.orderId)
    .single();

  if (orderError) throw new Error(orderError.message);

  const { data: existingPayments, error: existingError } = await supabase
    .from('payments')
    .select('amount_due')
    .eq('order_id', input.orderId)
    .limit(1);

  if (existingError) throw new Error(existingError.message);

  const amountDue = existingPayments?.[0]?.amount_due ?? order.total_amount;

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      organization_id: order.organization_id,
      order_id: input.orderId,
      method: input.method,
      status: 'verified',
      amount_due: amountDue,
      amount_paid: input.amountPaid,
      is_deposit: input.isDeposit,
      verified_by: (await supabase.auth.getUser()).data.user?.id,
      verified_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (paymentError) throw new Error(paymentError.message);

  if (input.proofFile) {
    if (!input.proofFile.type.startsWith('image/')) {
      throw new Error('Proof of payment must be an image file.');
    }
    if (input.proofFile.size > MAX_PROOF_SIZE_BYTES) {
      throw new Error('Image is too large (max 8MB).');
    }

    const ext = input.proofFile.name.split('.').pop() || 'jpg';
    const path = `${order.organization_id}/${payment.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(path, input.proofFile, { contentType: input.proofFile.type });

    if (uploadError) throw new Error(uploadError.message);

    const { error: proofError } = await supabase.from('payment_proofs').insert({
      organization_id: order.organization_id,
      payment_id: payment.id,
      image_url: path, // storage PATH, not a public URL — this bucket is private
    });

    if (proofError) throw new Error(proofError.message);
  }
}

export interface PaymentSummary {
  totalDue: number;
  totalPaid: number;
  hasVerifiedPayment: boolean;
}

export async function fetchPaymentSummary(orderId: string): Promise<PaymentSummary> {
  const { data, error } = await supabase
    .from('payments')
    .select('amount_due, amount_paid, status')
    .eq('order_id', orderId);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  return {
    totalDue: rows[0]?.amount_due ?? 0,
    totalPaid: rows
      .filter((p) => p.status === 'verified')
      .reduce((sum, p) => sum + p.amount_paid, 0),
    hasVerifiedPayment: rows.some((p) => p.status === 'verified'),
  };
}

/**
 * Generates a short-lived signed URL for viewing a proof image —
 * required since the bucket is private. Valid for 5 minutes, which
 * is enough time to view it in the app without leaving a
 * long-lived link sitting around.
 */
export async function getPaymentProofUrl(imagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(imagePath, 300);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}