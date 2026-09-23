// File: app/src/api/payments.ts

import { supabase } from '../lib/supabase';

export type PaymentMethod = 'gcash' | 'maya' | 'bank_transfer' | 'cash';

export interface PaymentRecord {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: string;
  amount_due: number;
  amount_paid: number;
  is_deposit: boolean;
  verified_at: string | null;
}

export interface RecordPaymentInput {
  orderId: string;
  amountPaid: number; // centavos
  method: PaymentMethod;
  isDeposit: boolean;
  proofFile?: File;
}

export interface UpdatePaymentInput extends RecordPaymentInput {
  paymentId: string;
}

export interface PaymentSaveResult {
  proofWarning?: string;
}

export interface PaymentSummary {
  totalDue: number;
  totalPaid: number;
  hasVerifiedPayment: boolean;
}

const MAX_PROOF_SIZE_BYTES = 8 * 1024 * 1024;

function validatePaymentInput(input: RecordPaymentInput) {
  if (!Number.isSafeInteger(input.amountPaid) || input.amountPaid <= 0) {
    throw new Error('Enter a valid amount greater than zero.');
  }
  if (input.proofFile) {
    if (!input.proofFile.type.startsWith('image/')) {
      throw new Error('Proof of payment must be an image file.');
    }
    if (input.proofFile.size > MAX_PROOF_SIZE_BYTES) {
      throw new Error('Image is too large (max 8MB).');
    }
  }
}

export async function fetchPaymentsForOrders(orderIds: string[]): Promise<PaymentRecord[]> {
  if (orderIds.length === 0) return [];
  const { data, error } = await supabase
    .from('payments')
    .select('id, order_id, method, status, amount_due, amount_paid, is_deposit, verified_at')
    .in('order_id', orderIds)
    .eq('status', 'verified')
    .order('verified_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentRecord[];
}

async function getOrderForPayment(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('organization_id, total_amount')
    .eq('id', orderId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function getVerifiedOrderPayments(orderId: string): Promise<PaymentRecord[]> {
  return fetchPaymentsForOrders([orderId]);
}

async function saveProof(
  organizationId: string,
  paymentId: string,
  proofFile?: File
): Promise<PaymentSaveResult> {
  if (!proofFile) return {};

  // A new path on each upload prevents replacing an existing private proof
  // before the database points at its replacement.
  const ext = (proofFile.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${organizationId}/${paymentId}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(path, proofFile, { contentType: proofFile.type });

  if (uploadError) {
    return { proofWarning: 'Payment was saved, but its proof image could not be uploaded.' };
  }

  const { data: existingProof, error: lookupError } = await supabase
    .from('payment_proofs')
    .select('id, image_url')
    .eq('payment_id', paymentId)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    return { proofWarning: 'Payment was saved, but its proof image could not be linked.' };
  }

  const result = existingProof
    ? await supabase.from('payment_proofs')
        .update({ image_url: path })
        .eq('id', existingProof.id)
    : await supabase.from('payment_proofs').insert({
        organization_id: organizationId,
        payment_id: paymentId,
        image_url: path,
      });

  if (result.error) {
    return { proofWarning: 'Payment was saved, but its proof image could not be linked.' };
  }

  // Old proof images are left untouched: financial evidence should not be
  // silently deleted when a different image is attached.
  return {};
}

/**
 * A manually entered payment is already verified. Check the remaining amount
 * before inserting to prevent ordinary accidental duplicate submissions.
 * For concurrent writes across devices, enforce the balance invariant in a
 * database transaction/RPC as well: a client-side check is not atomic.
 */
export async function recordPayment(input: RecordPaymentInput): Promise<PaymentSaveResult> {
  validatePaymentInput(input);

  const order = await getOrderForPayment(input.orderId);
  const existing = await getVerifiedOrderPayments(input.orderId);
  const paid = existing.reduce((sum, p) => sum + p.amount_paid, 0);
  const remaining = Math.max(0, order.total_amount - paid);

  if (remaining === 0) {
    throw new Error('This order is already fully paid. Open Payments to review existing records.');
  }
  if (input.amountPaid > remaining) {
    throw new Error('Payment exceeds the remaining order balance.');
  }

  const { data: authData } = await supabase.auth.getUser();
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      organization_id: order.organization_id,
      order_id: input.orderId,
      method: input.method,
      status: 'verified',
      amount_due: order.total_amount,
      amount_paid: input.amountPaid,
      is_deposit: input.isDeposit,
      verified_by: authData.user?.id,
      verified_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return saveProof(order.organization_id, payment.id, input.proofFile);
}

/** Updates the selected VERIFIED payment; does not insert another payment. */
export async function updatePayment(input: UpdatePaymentInput): Promise<PaymentSaveResult> {
  validatePaymentInput(input);

  const order = await getOrderForPayment(input.orderId);
  const existing = await getVerifiedOrderPayments(input.orderId);
  const current = existing.find((p) => p.id === input.paymentId);
  if (!current) throw new Error('The payment could not be found or is no longer verified.');

  const paidByOthers = existing
    .filter((p) => p.id !== input.paymentId)
    .reduce((sum, p) => sum + p.amount_paid, 0);

  // If old duplicate payments have already overpaid an order, permit an edit
  // that reduces the total; never permit increasing the overpayment.
  const newTotal = paidByOthers + input.amountPaid;
  const oldTotal = paidByOthers + current.amount_paid;
  if (newTotal > order.total_amount && newTotal > oldTotal) {
    throw new Error('Edited amount would increase the overpayment.');
  }

  const { data: updated, error } = await supabase
    .from('payments')
    .update({
      method: input.method,
      amount_paid: input.amountPaid,
      is_deposit: input.isDeposit,
    })
    .eq('id', input.paymentId)
    .eq('order_id', input.orderId)
    .eq('status', 'verified')
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!updated) throw new Error('Payment was not updated. Check your payment edit permissions.');

  return saveProof(order.organization_id, input.paymentId, input.proofFile);
}

export async function fetchPaymentProofUrl(paymentId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('payment_proofs')
    .select('image_url')
    .eq('payment_id', paymentId)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.image_url) return null;
  return getPaymentProofUrl(data.image_url);
}

export async function fetchPaymentSummary(orderId: string): Promise<PaymentSummary> {
  const order = await getOrderForPayment(orderId);
  const rows = await getVerifiedOrderPayments(orderId);
  return {
    totalDue: order.total_amount,
    totalPaid: rows.reduce((sum, p) => sum + p.amount_paid, 0),
    hasVerifiedPayment: rows.length > 0,
  };
}

/** The payment-proofs bucket is private. Signed links expire in 5 minutes. */
export async function getPaymentProofUrl(imagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(imagePath, 300);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
