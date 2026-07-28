import { useEffect, useState } from 'react';
import {
    ASISS_SUPABASE_ANON_KEY,
    ASISS_SUPABASE_URL,
    buildSupabaseAuthUrl,
} from '../../lib/supabaseConfig';

type HealthState = 'checking' | 'ok' | 'invalid-key' | 'unreachable';

/**
 * Verifica al cargar la app que Supabase acepte la clave API configurada.
 * Si la clave fue rotada o el proyecto está pausado, muestra un aviso claro
 * en vez de dejar que cada módulo falle en silencio.
 */
export const SupabaseHealthBanner = () => {
    const [state, setState] = useState<HealthState>('checking');

    useEffect(() => {
        let cancelled = false;
        fetch(`${buildSupabaseAuthUrl(ASISS_SUPABASE_URL)}/health`, {
            headers: { apikey: ASISS_SUPABASE_ANON_KEY },
        })
            .then((res) => {
                if (cancelled) return;
                setState(res.status === 401 || res.status === 403 ? 'invalid-key' : 'ok');
            })
            .catch(() => {
                if (!cancelled) setState('unreachable');
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (state === 'checking' || state === 'ok') return null;

    return (
        <div className="fixed inset-x-0 top-0 z-[9999] bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg">
            {state === 'invalid-key'
                ? 'Sin conexión con la base de datos principal de Asiss: la clave API configurada en el código no es válida.'
                : 'No se pudo contactar el servidor de Supabase. Verifica tu conexión a internet o que el proyecto no esté pausado.'}
        </div>
    );
};
