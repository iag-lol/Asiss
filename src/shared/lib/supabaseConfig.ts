const SUPABASE_REST_PATH = '/rest/v1';

// Backend principal de ASISS. Estas credenciales públicas forman parte del
// bundle web y no deben reemplazarse con las variables de GitHub de MiniCheck.
export const ASISS_SUPABASE_URL = 'https://kzslhhctjfxsdvcrqvvs.supabase.co';
export const ASISS_SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6c2xoaGN0amZ4c2R2Y3JxdnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDAzODQsImV4cCI6MjA4MTQxNjM4NH0.NQ1maFD5Nl8y-5TxJFjeSdhOSzOi-6Hd8o4VcrmLUKo';

export const normalizeSupabaseProjectUrl = (rawUrl?: string | null): string => {
    if (!rawUrl) return '';

    const trimmedUrl = rawUrl.trim().replace(/\/+$/, '');
    return trimmedUrl.replace(/\/rest\/v1$/, '');
};

export const buildSupabaseAuthUrl = (rawUrl?: string | null): string => {
    const projectUrl = normalizeSupabaseProjectUrl(rawUrl);
    return projectUrl ? `${projectUrl}/auth/v1` : '';
};

export const buildSupabaseFunctionsUrl = (rawUrl?: string | null): string => {
    const projectUrl = normalizeSupabaseProjectUrl(rawUrl);
    return projectUrl ? `${projectUrl}/functions/v1` : '';
};

export const buildSupabaseRestUrl = (rawUrl?: string | null): string => {
    const projectUrl = normalizeSupabaseProjectUrl(rawUrl);
    return projectUrl ? `${projectUrl}${SUPABASE_REST_PATH}` : '';
};
