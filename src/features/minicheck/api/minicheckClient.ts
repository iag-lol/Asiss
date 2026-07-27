import { createClient } from '@supabase/supabase-js';
import { normalizeSupabaseProjectUrl } from '../../../shared/lib/supabaseConfig';

const minicheckUrl = normalizeSupabaseProjectUrl(import.meta.env.VITE_MINICHECK_SUPABASE_URL);
const minicheckAnonKey = import.meta.env.VITE_MINICHECK_SUPABASE_ANON_KEY?.trim();

if (!minicheckUrl || !minicheckAnonKey) {
  console.warn(
    'Mini-Check usa una instancia independiente. Configura VITE_MINICHECK_SUPABASE_URL y VITE_MINICHECK_SUPABASE_ANON_KEY.',
  );
}

export const minicheckSupabase = createClient(
  minicheckUrl || 'https://placeholder.supabase.co',
  minicheckAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  },
);

export const isMiniCheckConfigured = (): boolean => Boolean(minicheckUrl && minicheckAnonKey);
