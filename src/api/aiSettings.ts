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