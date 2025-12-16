import { supabase, isSupabaseConfigured } from '../../shared/lib/supabaseClient';
import { TerminalCode, TerminalContext } from '../../shared/types/terminal';
import { resolveTerminalsForContext } from '../../shared/utils/terminal';
import { normalizeName } from './utils/authorizers';
import { showSuccessToast, showErrorToast } from '../../shared/state/toastStore';
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

    if (error) {
        showErrorToast('Error al crear registro', 'No se pudo guardar el registro de No Marcación');
        throw error;
    }

    // Send email notification
    try {
        await sendRecordCreatedEmail('No Marcaciones', {
            rut: values.rut,
            nombre: values.nombre,
            terminal: values.terminal_code,
            date: values.date,
            createdBy: createdBy,
            details: {
                'Área': values.area || '',
                'Cargo': values.cargo || '',
                'Jefe Terminal': values.jefe_terminal || '',
                'Observaciones': values.observations || '',
            }
        });
        showSuccessToast(
            'Registro creado exitosamente',
            `No Marcación para ${values.nombre} guardado y correo enviado`,
            createdBy
        );
    } catch {
        showSuccessToast(
            'Registro creado',
            `No Marcación para ${values.nombre} guardado (correo no enviado)`,
            createdBy
        );
    }

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

    if (error) {
        showErrorToast('Error al crear registro', 'No se pudo guardar el registro de Sin Credenciales');
        throw error;
    }

    // Send email notification
    try {
        await sendRecordCreatedEmail('Sin Credenciales', {
            rut: values.rut,
            nombre: values.nombre,
            terminal: values.terminal_code,
            date: values.date,
            createdBy: createdBy,
            details: {
                'Cabezal': values.cabezal || '',
                'Horario': `${values.start_time || ''} - ${values.end_time || ''}`,
                'Cargo': values.cargo || '',
                'Supervisor Autoriza': values.supervisor_autoriza || '',
            }
        });
        showSuccessToast(
            'Registro creado exitosamente',
            `Sin Credenciales para ${values.nombre} guardado y correo enviado`,
            createdBy
        );
    } catch {
        showSuccessToast(
            'Registro creado',
            `Sin Credenciales para ${values.nombre} guardado (correo no enviado)`,
            createdBy
        );
    }

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

        if (uploadError) {
            showErrorToast('Error al subir documento', 'Verifica que el archivo sea imagen o PDF y menor a 5MB');
            throw new Error('Error al subir documento');
        }
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

    if (error) {
        showErrorToast('Error al crear registro', 'No se pudo guardar el registro de Cambio de Día');
        throw error;
    }

    // Send email notification
    try {
        await sendRecordCreatedEmail('Cambios de Día', {
            rut: values.rut,
            nombre: values.nombre,
            terminal: values.terminal_code,
            date: values.date,
            createdBy: createdBy,
            details: {
                'Jornada Programada': `${values.prog_start || ''} - ${values.prog_end || ''}`,
                'Día No Trabaja': values.day_off_date || '',
                'Día Trabaja': values.day_on_date || '',
                'Documento': documentPath ? 'Sí' : 'No',
            }
        });
        showSuccessToast(
            'Registro creado exitosamente',
            `Cambio de Día para ${values.nombre} guardado y correo enviado`,
            createdBy
        );
    } catch {
        showSuccessToast(
            'Registro creado',
            `Cambio de Día para ${values.nombre} guardado (correo no enviado)`,
            createdBy
        );
    }

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

    if (error) {
        showErrorToast('Error al crear registro', 'No se pudo guardar la autorización');
        throw error;
    }

    // Send email notification
    try {
        await sendRecordCreatedEmail('Autorizaciones', {
            rut: values.rut,
            nombre: values.nombre,
            terminal: values.terminal_code,
            date: values.authorization_date,
            createdBy: createdBy,
            details: {
                'Tipo': values.entry_or_exit === 'ENTRADA' ? 'Llegada Tardía' : 'Retiro Anticipado',
                'Horario': values.horario || '',
                'Turno': values.turno || '',
                'Motivo': values.motivo || '',
            }
        });
        showSuccessToast(
            'Registro creado exitosamente',
            `Autorización para ${values.nombre} guardada y correo enviado`,
            createdBy
        );
    } catch {
        showSuccessToast(
            'Registro creado',
            `Autorización para ${values.nombre} guardada (correo no enviado)`,
            createdBy
        );
    }

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

import { emailService } from '../../shared/services/emailService';
import { displayTerminal } from '../../shared/utils/terminal';

const EMAIL_RECIPIENT = 'isaac.avila@transdev.cl';

// SVG Icons for emails (inline SVG is the most reliable for email clients)
const SVG_ICONS = {
    check: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="28" cy="28" r="26" fill="#dcfce7" stroke="#22c55e" stroke-width="3"/>
        <path d="M18 28L24 34L38 20" stroke="#16a34a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    x: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="28" cy="28" r="26" fill="#fee2e2" stroke="#ef4444" stroke-width="3"/>
        <path d="M20 20L36 36M36 20L20 36" stroke="#dc2626" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
    clock: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="28" cy="28" r="26" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"/>
        <circle cx="28" cy="28" r="3" fill="#d97706"/>
        <path d="M28 16V28L36 33" stroke="#d97706" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
    user: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="5" r="3.5" stroke="#64748b" stroke-width="1.5"/>
        <path d="M2 16C2 12.686 5.13401 10 9 10C12.866 10 16 12.686 16 16" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    id: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke="#64748b" stroke-width="1.5"/>
        <circle cx="6" cy="8" r="1.5" stroke="#64748b" stroke-width="1"/>
        <path d="M4 12C4 10.8954 4.89543 10 6 10C7.10457 10 8 10.8954 8 12" stroke="#64748b" stroke-width="1"/>
        <path d="M10.5 7.5H14.5M10.5 10H13" stroke="#64748b" stroke-width="1.2" stroke-linecap="round"/>
    </svg>`,
    building: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 16V3.5C2 3.22386 2.22386 3 2.5 3H9.5C9.77614 3 10 3.22386 10 3.5V16" stroke="#64748b" stroke-width="1.5"/>
        <path d="M10 7H14.5C14.7761 7 15 7.22386 15 7.5V16" stroke="#64748b" stroke-width="1.5"/>
        <path d="M5 6H7M5 9H7M5 12H7M12 10H13M12 13H13" stroke="#64748b" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M1 16H17" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    calendar: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3.5" width="14" height="12" rx="2" stroke="#64748b" stroke-width="1.5"/>
        <path d="M2 7H16" stroke="#64748b" stroke-width="1.5"/>
        <path d="M5.5 1.5V4.5M12.5 1.5V4.5" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
};

const formatDate = (date: string) => {
    const d = new Date(date + 'T12:00:00');
    return d.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const generateDataRow = (icon: string, label: string, value: string, highlight = false) => `
    <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; width: 40%; vertical-align: middle;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td style="padding-right: 12px; vertical-align: middle;">${icon}</td>
                    <td style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${label}</td>
                </tr>
            </table>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: ${highlight ? '700' : '500'}; color: ${highlight ? '#0f172a' : '#334155'}; text-align: right;">${value}</td>
    </tr>
`;

export const sendAuthorizationEmail = async (
    type: 'AUTORIZADO' | 'RECHAZADO',
    subsection: string,
    rut: string,
    nombre: string,
    terminal: string,
    date: string,
    reason?: string
): Promise<void> => {
    const isApproved = type === 'AUTORIZADO';
    const statusColor = isApproved ? '#16a34a' : '#dc2626';
    const statusBg = isApproved ? '#f0fdf4' : '#fef2f2'; // Very light green/red
    const statusBorder = isApproved ? '#bbf7d0' : '#fecaca';
    const statusIcon = isApproved ? SVG_ICONS.check : SVG_ICONS.x;

    const subject = `${subsection} ${type} - ${nombre}`;
    const body = `
        <!-- Status Banner -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
            <tr>
                <td style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 12px; padding: 24px; text-align: center;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td align="center" style="padding-bottom: 8px;">
                                ${statusIcon}
                            </td>
                        </tr>
                        <tr>
                            <td align="center">
                                <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Estado del Registro</span>
                                <span style="font-size: 20px; font-weight: 800; color: ${statusColor}; letter-spacing: -0.5px;">${type}</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <!-- Data Table -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; border-spacing: 0; border-collapse: separate;">
            ${generateDataRow(SVG_ICONS.id, 'Subsección', subsection, true)}
            ${generateDataRow(SVG_ICONS.id, 'RUT', rut)}
            ${generateDataRow(SVG_ICONS.user, 'Trabajador', nombre)}
            ${generateDataRow(SVG_ICONS.building, 'Terminal', displayTerminal(terminal as any))}
            ${generateDataRow(SVG_ICONS.calendar, 'Fecha', formatDate(date))}
            ${reason ? generateDataRow(SVG_ICONS.id, 'Motivo', reason, true) : ''}
        </table>
    `.trim();

    try {
        await emailService.sendEmail({
            audience: 'manual',
            manualRecipients: [EMAIL_RECIPIENT],
            subject,
            body,
        });
    } catch (err) {
        console.error('Error sending authorization email:', err);
    }
};

export const sendRecordCreatedEmail = async (
    subsection: string,
    data: {
        rut: string;
        nombre: string;
        terminal: string;
        date: string;
        createdBy: string;
        details?: Record<string, string>;
    }
): Promise<void> => {
    const detailsRows = data.details
        ? Object.entries(data.details)
            .filter(([_, v]) => v && v.trim())
            .map(([k, v]) => generateDataRow(SVG_ICONS.id, k, v))
            .join('')
        : '';

    const subject = `Nuevo Registro: ${subsection} - ${data.nombre}`;
    const body = `
        <!-- Status Banner -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
            <tr>
                <td style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 24px; text-align: center;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td align="center" style="padding-bottom: 8px;">
                                ${SVG_ICONS.clock}
                            </td>
                        </tr>
                        <tr>
                            <td align="center">
                                <span style="font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Estado del Registro</span>
                                <span style="font-size: 18px; font-weight: 800; color: #b45309; letter-spacing: -0.5px;">PENDIENTE DE AUTORIZACIÓN</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <!-- Subsection Badge -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
            <tr>
                <td align="center">
                    <span style="display: inline-block; padding: 8px 20px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 100px; color: #2563eb; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">${subsection}</span>
                </td>
            </tr>
        </table>
        
        <!-- Data Table -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; border-spacing: 0; border-collapse: separate;">
            ${generateDataRow(SVG_ICONS.id, 'RUT', data.rut)}
            ${generateDataRow(SVG_ICONS.user, 'Trabajador', data.nombre, true)}
            ${generateDataRow(SVG_ICONS.building, 'Terminal', displayTerminal(data.terminal as any))}
            ${generateDataRow(SVG_ICONS.calendar, 'Fecha', formatDate(data.date))}
            ${detailsRows}
        </table>
        
        <!-- Registered By -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px;">
            <tr>
                <td style="padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td width="40" style="padding-right: 12px; vertical-align: middle;">
                                <div style="width: 40px; height: 40px; background: #2563eb; border-radius: 50%; text-align: center; line-height: 40px; color: white; font-weight: 700; font-size: 16px;">${data.createdBy.charAt(0)}</div>
                            </td>
                            <td style="vertical-align: middle;">
                                <span style="display: block; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Registrado por</span>
                                <span style="display: block; font-size: 14px; font-weight: 700; color: #0f172a;">${data.createdBy}</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `.trim();

    try {
        await emailService.sendEmail({
            audience: 'manual',
            manualRecipients: [EMAIL_RECIPIENT],
            subject,
            body,
        });
    } catch (err) {
        console.error('Error sending record created email:', err);
    }
};
