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