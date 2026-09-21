// File: app/src/api/aiSettings.ts
// (fetchAiTokenUsage now also returns the shop's real limit, so the
// progress bar always matches what's actually enforced — if you
// extend a shop's limit, their own Settings screen reflects it
// automatically, with no separate frontend change needed)

import { supabase } from '../lib/supabase';

export type AiLanguage = 'en' | 'fil';

export async function fetchAiLanguage(organizationId: string): Promise<AiLanguage> {
  const { data, error } = await supabase
    .from('organizations')
    .select('ai_language')
    .eq('id', organizationId)
    .single();

  if (error) throw error;
  return (data?.ai_language as AiLanguage) ?? 'en';
}

export async function setAiLanguage(organizationId: string, language: AiLanguage): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({ ai_language: language, updated_at: new Date().toISOString() })
    .eq('id', organizationId);

  if (error) throw error;
}

export interface AiTokenUsage {
  tokensThisMonth: number;
  tokensThisWeek: number;
  monthlyLimit: number;
}

export async function fetchAiTokenUsage(organizationId: string): Promise<AiTokenUsage> {
  const [{ data: usageData, error: usageError }, { data: orgData, error: orgError }] = await Promise.all([
    supabase.rpc('get_ai_token_usage', { p_organization_id: organizationId }).single(),
    supabase.from('organizations').select('monthly_ai_token_limit').eq('id', organizationId).single(),
  ]);

  if (usageError) throw usageError;
  if (orgError) throw orgError;

  return {
    tokensThisMonth: Number((usageData as any)?.tokens_this_month ?? 0),
    tokensThisWeek: Number((usageData as any)?.tokens_this_week ?? 0),
    monthlyLimit: (orgData as any)?.monthly_ai_token_limit ?? 1_000_000,
  };
}

export type GuardrailOutcome = 'corrected' | 'escalated';

export interface GuardrailEvent {
  id: string;
  createdAt: string;
  outcome: GuardrailOutcome;
  conversationId: string;
  customerName: string;
}

/**
 * Recent times Keki's order-promise guardrail fired — either it
 * caught itself and retried successfully ('corrected'), or it ran out
 * of retries and handed the conversation to handler: 'handoff_required'
 * ('escalated'). Backed by ai_events.guardrail_outcome, set from
 * facebook-ai-respond/index.ts. Ordered most recent first, capped at
 * `limit` since this is a "recent activity" glance, not a full audit
 * log.
 */
export async function fetchGuardrailEvents(
  organizationId: string,
  limit: number = 10
): Promise<GuardrailEvent[]> {
  const { data, error } = await supabase
    .from('ai_events')
    .select('id, created_at, guardrail_outcome, conversation_id, conversations(customers(full_name))')
    .eq('organization_id', organizationId)
    .not('guardrail_outcome', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    createdAt: row.created_at,
    outcome: row.guardrail_outcome as GuardrailOutcome,
    conversationId: row.conversation_id,
    customerName: row.conversations?.customers?.full_name ?? 'A customer',
  }));
}