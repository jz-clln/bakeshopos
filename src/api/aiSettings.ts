// File: app/src/api/aiSettings.ts

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

export const MONTHLY_AI_TOKEN_LIMIT = 1_000_000;

export interface AiTokenUsage {
  tokensThisMonth: number;
  tokensThisWeek: number;
}

/**
 * Token counts only — no cost figures. The monthly total is checked
 * against MONTHLY_AI_TOKEN_LIMIT purely for display (the actual
 * enforcement that stops the AI happens server-side in
 * facebook-ai-respond, using the same underlying ai_events data).
 */
export async function fetchAiTokenUsage(organizationId: string): Promise<AiTokenUsage> {
  const { data, error } = await supabase
    .rpc('get_ai_token_usage', { p_organization_id: organizationId })
    .single();

  if (error) throw error;

  return {
    tokensThisMonth: Number((data as any)?.tokens_this_month ?? 0),
    tokensThisWeek: Number((data as any)?.tokens_this_week ?? 0),
  };
}