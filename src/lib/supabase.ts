// File: app/src/lib/supabase.ts
//
// Vite only exposes env vars prefixed with VITE_ to client code — this
// is a deliberate safety boundary, so double-check any new env var
// actually needs that prefix before adding it (anon key: yes, service
// role key: never).

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check your app/.env.development file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);