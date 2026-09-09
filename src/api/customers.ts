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