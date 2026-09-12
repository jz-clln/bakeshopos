// File: app/src/api/customers.ts

import { supabase } from '../lib/supabase';

export interface Customer {
  id: string;
  full_name: string;
  phone_number: string | null;
  email: string | null;
}

export async function searchCustomers(organizationId: string, query: string): Promise<Customer[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone_number, email')
    .eq('organization_id', organizationId)
    .ilike('full_name', `%${query.trim()}%`)
    .order('full_name', { ascending: true })
    .limit(8);

  if (error) throw error;
  return (data ?? []) as Customer[];
}

export interface CreateCustomerInput {
  fullName: string;
  phoneNumber?: string;
}

export async function createCustomer(
  organizationId: string,
  input: CreateCustomerInput
): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      organization_id: organizationId,
      full_name: input.fullName,
      phone_number: input.phoneNumber ?? null,
    })
    .select('id, full_name, phone_number, email')
    .single();

  if (error) throw error;
  return data as Customer;
}

export class CustomerHasRecordsError extends Error {}

/**
 * Deletes a customer record — intended for cleaning up accidental
 * duplicates (e.g. one created manually via "Add a new customer" that
 * turns out to be the same person as an existing Messenger contact).
 *
 * Customers already linked to an order or conversation can't be
 * deleted outright — the foreign key on those tables blocks it
 * (Postgres error code 23503). Rather than let that surface as a raw
 * constraint error, it's caught here and turned into a clear,
 * actionable message: reassign those records to the correct customer
 * first, same as fixing an order's customer_id before removing the
 * duplicate it pointed at.
 */
export async function deleteCustomer(customerId: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', customerId);

  if (error) {
    if (error.code === '23503') {
      throw new CustomerHasRecordsError(
        'This customer already has orders or messages linked to them and can\'t be deleted. Reassign those first if this is a duplicate.'
      );
    }
    throw error;
  }
}