import { supabase, isSupabaseConfigured } from '../../shared/lib/supabaseClient';
import { TerminalCode, TerminalContext } from '../../shared/types/terminal';
import { resolveTerminalsForContext } from '../../shared/utils/terminal';
import { normalizeName } from './utils/authorizers';
import {
    NoMarcacion,
    NoMarcacionFormValues,
    SinCredencial,
    SinCredencialFormValues,
    CambioDia,
    CambioDiaFormValues,
    Autorizacion,
    AutorizacionFormValues,
    AttendanceFilters,
    AttendanceKPIs,
    AuthStatus,
} from './types';

// ==========================================
// TABLE NAMES
// ==========================================

type AttendanceTable =
    | 'attendance_no_marcaciones'
    | 'attendance_sin_credenciales'
    | 'attendance_cambios_dia'
    | 'attendance_autorizaciones';

// ==========================================
// NO MARCACIONES
// ==========================================

export const fetchNoMarcaciones = async (
    terminalContext: TerminalContext,
    filters?: AttendanceFilters
): Promise<NoMarcacion[]> => {
    if (!isSupabaseConfigured()) return [];

    const terminals = resolveTerminalsForContext(terminalContext);

    let query = supabase
        .from('attendance_no_marcaciones')
        .select('*')
        .in('terminal_code', terminals)
        .order('date', { ascending: false });

    if (filters?.auth_status && filters.auth_status !== 'todos') {
        query = query.eq('auth_status', filters.auth_status);
    }

    if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(`nombre.ilike.${term},rut.ilike.${term}`);
    }

    if (filters?.date_from) {
        query = query.gte('date', filters.date_from);
    }

    if (filters?.date_to) {
        query = query.lte('date', filters.date_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const createNoMarcacion = async (
    values: NoMarcacionFormValues,
    createdBy: string
): Promise<NoMarcacion> => {
    const { data, error } = await supabase
        .from('attendance_no_marcaciones')
        .insert({
            ...values,
            created_by_supervisor: normalizeName(createdBy),
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateNoMarcacion = async (
    id: string,
    values: Partial<NoMarcacionFormValues>
): Promise<NoMarcacion> => {
    const { data, error } = await supabase
        .from('attendance_no_marcaciones')
        .update(values)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// ==========================================
// SIN CREDENCIALES
// ==========================================

export const fetchSinCredenciales = async (
    terminalContext: TerminalContext,
    filters?: AttendanceFilters
): Promise<SinCredencial[]> => {
    if (!isSupabaseConfigured()) return [];

    const terminals = resolveTerminalsForContext(terminalContext);

    let query = supabase
        .from('attendance_sin_credenciales')
        .select('*')
        .in('terminal_code', terminals)
        .order('date', { ascending: false });

    if (filters?.auth_status && filters.auth_status !== 'todos') {
        query = query.eq('auth_status', filters.auth_status);
    }

    if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(`nombre.ilike.${term},rut.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const createSinCredencial = async (
    values: SinCredencialFormValues,
    createdBy: string
): Promise<SinCredencial> => {
    const { data, error } = await supabase
        .from('attendance_sin_credenciales')
        .insert({
            ...values,
            created_by_supervisor: normalizeName(createdBy),
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateSinCredencial = async (
    id: string,
    values: Partial<SinCredencialFormValues>
): Promise<SinCredencial> => {
    const { data, error } = await supabase
        .from('attendance_sin_credenciales')
        .update(values)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// ==========================================
// CAMBIOS DE DÍA
// ==========================================

export const fetchCambiosDia = async (
    terminalContext: TerminalContext,
    filters?: AttendanceFilters
): Promise<CambioDia[]> => {
    if (!isSupabaseConfigured()) return [];

    const terminals = resolveTerminalsForContext(terminalContext);

    let query = supabase
        .from('attendance_cambios_dia')
        .select('*')
        .in('terminal_code', terminals)
        .order('date', { ascending: false });

    if (filters?.auth_status && filters.auth_status !== 'todos') {
        query = query.eq('auth_status', filters.auth_status);
    }

    if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(`nombre.ilike.${term},rut.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const createCambioDia = async (
    values: CambioDiaFormValues,
    createdBy: string
): Promise<CambioDia> => {
    let documentPath: string | null = null;

    if (values.document) {
        const fileExt = values.document.name.split('.').pop();
        const filePath = `cambios-dia/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('attendance-docs')
            .upload(filePath, values.document);

        if (uploadError) throw new Error('Error al subir documento');
        documentPath = filePath;
    }

    const { document: _, ...rest } = values;

    const { data, error } = await supabase
        .from('attendance_cambios_dia')
        .insert({
            ...rest,
            document_path: documentPath,
            created_by_supervisor: normalizeName(createdBy),
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateCambioDia = async (
    id: string,
    values: Partial<CambioDiaFormValues>
): Promise<CambioDia> => {
    const { document: _, ...rest } = values;

    const { data, error } = await supabase
        .from('attendance_cambios_dia')
        .update(rest)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getDocumentUrl = async (path: string): Promise<string> => {
    const { data, error } = await supabase.storage
        .from('attendance-docs')
        .createSignedUrl(path, 3600);

    if (error) throw error;
    return data.signedUrl;
};

// ==========================================
// AUTORIZACIONES
// ==========================================

export const fetchAutorizaciones = async (
    terminalContext: TerminalContext,
    filters?: AttendanceFilters
): Promise<Autorizacion[]> => {
    if (!isSupabaseConfigured()) return [];

    const terminals = resolveTerminalsForContext(terminalContext);

    let query = supabase
        .from('attendance_autorizaciones')
        .select('*')
        .in('terminal_code', terminals)
        .order('authorization_date', { ascending: false });

    if (filters?.auth_status && filters.auth_status !== 'todos') {
        query = query.eq('auth_status', filters.auth_status);
    }

    if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(`nombre.ilike.${term},rut.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const createAutorizacion = async (
    values: AutorizacionFormValues,
    createdBy: string
): Promise<Autorizacion> => {
    const { data, error } = await supabase
        .from('attendance_autorizaciones')
        .insert({
            ...values,
            created_by_supervisor: normalizeName(createdBy),
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateAutorizacion = async (
    id: string,
    values: Partial<AutorizacionFormValues>
): Promise<Autorizacion> => {
    const { data, error } = await supabase
        .from('attendance_autorizaciones')
        .update(values)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// ==========================================
// AUTHORIZATION WORKFLOW
// ==========================================

export const authorizeRecord = async (
    table: AttendanceTable,
    id: string,
    authorizedBy: string
): Promise<void> => {
    const { error } = await supabase
        .from(table)
        .update({
            auth_status: 'AUTORIZADO' as AuthStatus,
            authorized_by: normalizeName(authorizedBy),
            authorized_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw error;
};

export const rejectRecord = async (
    table: AttendanceTable,
    id: string,
    authorizedBy: string,
    reason: string
): Promise<void> => {
    const { error } = await supabase
        .from(table)
        .update({
            auth_status: 'RECHAZADO' as AuthStatus,
            authorized_by: normalizeName(authorizedBy),
            authorized_at: new Date().toISOString(),
            rejection_reason: reason,
        })
        .eq('id', id);

    if (error) throw error;
};

// ==========================================
// KPIs
// ==========================================

export const fetchKPIs = async (
    table: AttendanceTable,
    terminalContext: TerminalContext,
    dateColumn = 'date'
): Promise<AttendanceKPIs> => {
    if (!isSupabaseConfigured()) {
        return { pendingToday: 0, pendingTotal: 0, authorizedRange: 0, rejectedRange: 0 };
    }

    const terminals = resolveTerminalsForContext(terminalContext);
    const today = new Date().toISOString().split('T')[0];

    const { count: pendingToday } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .in('terminal_code', terminals)
        .eq('auth_status', 'PENDIENTE')
        .eq(dateColumn, today);

    const { count: pendingTotal } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .in('terminal_code', terminals)
        .eq('auth_status', 'PENDIENTE');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { count: authorizedRange } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .in('terminal_code', terminals)
        .eq('auth_status', 'AUTORIZADO')
        .gte(dateColumn, thirtyDaysAgo);

    const { count: rejectedRange } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .in('terminal_code', terminals)
        .eq('auth_status', 'RECHAZADO')
        .gte(dateColumn, thirtyDaysAgo);

    return {
        pendingToday: pendingToday ?? 0,
        pendingTotal: pendingTotal ?? 0,
        authorizedRange: authorizedRange ?? 0,
        rejectedRange: rejectedRange ?? 0,
    };
};

// ==========================================
// REALTIME
// ==========================================

export const subscribeToAttendanceChanges = (
    onInsert: (table: AttendanceTable) => void,
    onUpdate: (table: AttendanceTable) => void
): (() => void) => {
    const channel = supabase
        .channel('attendance-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_no_marcaciones' }, () => onInsert('attendance_no_marcaciones'))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance_no_marcaciones' }, () => onUpdate('attendance_no_marcaciones'))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_sin_credenciales' }, () => onInsert('attendance_sin_credenciales'))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance_sin_credenciales' }, () => onUpdate('attendance_sin_credenciales'))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_cambios_dia' }, () => onInsert('attendance_cambios_dia'))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance_cambios_dia' }, () => onUpdate('attendance_cambios_dia'))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_autorizaciones' }, () => onInsert('attendance_autorizaciones'))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance_autorizaciones' }, () => onUpdate('attendance_autorizaciones'))
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

// ==========================================
// EMAIL NOTIFICATION
// ==========================================

export const sendAuthorizationEmail = async (
    type: 'AUTORIZADO' | 'RECHAZADO',
    subsection: string,
    rut: string,
    nombre: string,
    terminal: string,
    date: string,
    reason?: string
): Promise<void> => {
    const emailApiUrl = import.meta.env.VITE_EMAIL_API_URL;
    if (!emailApiUrl) {
        console.warn('Email API URL not configured');
        return;
    }

    const subject = `Asistencia ${type}: ${subsection}`;
    const body = `
Se ha ${type === 'AUTORIZADO' ? 'autorizado' : 'rechazado'} el registro:

- Tipo: ${subsection}
- RUT: ${rut}
- Nombre: ${nombre}
- Terminal: ${terminal}
- Fecha: ${date}
${reason ? `- Motivo de rechazo: ${reason}` : ''}
  `.trim();

    try {
        await fetch(emailApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, body }),
        });
    } catch (err) {
        console.error('Error sending email:', err);
    }
};
