import { createClient } from '@supabase/supabase-js';
import {
    ASISS_SUPABASE_ANON_KEY,
    ASISS_SUPABASE_URL,
    normalizeSupabaseProjectUrl,
} from './supabaseConfig';

const supabaseUrl = normalizeSupabaseProjectUrl(ASISS_SUPABASE_URL);
const supabaseAnonKey = ASISS_SUPABASE_ANON_KEY;

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
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
    }
);

export const isSupabaseConfigured = (): boolean => {
    return Boolean(supabaseUrl && supabaseAnonKey);
};
