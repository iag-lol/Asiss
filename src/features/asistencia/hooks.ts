import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { TerminalContext } from '../../shared/types/terminal';
import {
    fetchNoMarcaciones,
    fetchSinCredenciales,
    fetchCambiosDia,
    fetchAutorizaciones,
    createNoMarcacion,
    createSinCredencial,
    createCambioDia,
    createAutorizacion,
    updateNoMarcacion,
    updateSinCredencial,
    updateCambioDia,
    updateAutorizacion,
    authorizeRecord,
    rejectRecord,
    fetchKPIs,
    subscribeToAttendanceChanges,
    sendAuthorizationEmail,
} from './api';
import {
    AttendanceFilters,
    NoMarcacionFormValues,
    SinCredencialFormValues,
    CambioDiaFormValues,
    AutorizacionFormValues,
    AttendanceSubsection,
    SUBSECTION_LABELS,
} from './types';

// ==========================================
// QUERY KEYS
// ==========================================

export const attendanceKeys = {
    all: ['attendance'] as const,
    noMarcaciones: (ctx: TerminalContext, filters?: AttendanceFilters) =>
        [...attendanceKeys.all, 'no-marcaciones', ctx, filters] as const,
    sinCredenciales: (ctx: TerminalContext, filters?: AttendanceFilters) =>
        [...attendanceKeys.all, 'sin-credenciales', ctx, filters] as const,
    cambiosDia: (ctx: TerminalContext, filters?: AttendanceFilters) =>
        [...attendanceKeys.all, 'cambios-dia', ctx, filters] as const,
    autorizaciones: (ctx: TerminalContext, filters?: AttendanceFilters) =>
        [...attendanceKeys.all, 'autorizaciones', ctx, filters] as const,
    kpis: (subsection: AttendanceSubsection, ctx: TerminalContext) =>
        [...attendanceKeys.all, 'kpis', subsection, ctx] as const,
};

// ==========================================
// LIST QUERIES
// ==========================================

export const useNoMarcaciones = (ctx: TerminalContext, filters?: AttendanceFilters) =>
    useQuery({
        queryKey: attendanceKeys.noMarcaciones(ctx, filters),
        queryFn: () => fetchNoMarcaciones(ctx, filters),
    });

export const useSinCredenciales = (ctx: TerminalContext, filters?: AttendanceFilters) =>
    useQuery({
        queryKey: attendanceKeys.sinCredenciales(ctx, filters),
        queryFn: () => fetchSinCredenciales(ctx, filters),
    });

export const useCambiosDia = (ctx: TerminalContext, filters?: AttendanceFilters) =>
    useQuery({
        queryKey: attendanceKeys.cambiosDia(ctx, filters),
        queryFn: () => fetchCambiosDia(ctx, filters),
    });

export const useAutorizaciones = (ctx: TerminalContext, filters?: AttendanceFilters) =>
    useQuery({
        queryKey: attendanceKeys.autorizaciones(ctx, filters),
        queryFn: () => fetchAutorizaciones(ctx, filters),
    });

// ==========================================
// KPI QUERIES
// ==========================================

const TABLE_NAMES = {
    'no-marcaciones': 'attendance_no_marcaciones',
    'sin-credenciales': 'attendance_sin_credenciales',
    'cambios-dia': 'attendance_cambios_dia',
    'autorizaciones': 'attendance_autorizaciones',
} as const;

const DATE_COLUMNS = {
    'no-marcaciones': 'date',
    'sin-credenciales': 'date',
    'cambios-dia': 'date',
    'autorizaciones': 'authorization_date',
} as const;

export const useAttendanceKPIs = (subsection: AttendanceSubsection, ctx: TerminalContext) =>
    useQuery({
        queryKey: attendanceKeys.kpis(subsection, ctx),
        queryFn: () => fetchKPIs(TABLE_NAMES[subsection] as any, ctx, DATE_COLUMNS[subsection]),
    });

// ==========================================
// CREATE MUTATIONS
// ==========================================

export const useCreateNoMarcacion = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ values, createdBy }: { values: NoMarcacionFormValues; createdBy: string }) =>
            createNoMarcacion(values, createdBy),
        onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
    });
};

export const useCreateSinCredencial = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ values, createdBy }: { values: SinCredencialFormValues; createdBy: string }) =>
            createSinCredencial(values, createdBy),
        onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
    });
};

export const useCreateCambioDia = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ values, createdBy }: { values: CambioDiaFormValues; createdBy: string }) =>
            createCambioDia(values, createdBy),
        onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
    });
};

export const useCreateAutorizacion = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ values, createdBy }: { values: AutorizacionFormValues; createdBy: string }) =>
            createAutorizacion(values, createdBy),
        onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
    });
};

// ==========================================
// UPDATE MUTATIONS
// ==========================================

export const useUpdateNoMarcacion = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, values }: { id: string; values: Partial<NoMarcacionFormValues> }) =>
            updateNoMarcacion(id, values),
        onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
    });
};

export const useUpdateSinCredencial = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, values }: { id: string; values: Partial<SinCredencialFormValues> }) =>
            updateSinCredencial(id, values),
        onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
    });
};

export const useUpdateCambioDia = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, values }: { id: string; values: Partial<CambioDiaFormValues> }) =>
            updateCambioDia(id, values),
        onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
    });
};

export const useUpdateAutorizacion = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, values }: { id: string; values: Partial<AutorizacionFormValues> }) =>
            updateAutorizacion(id, values),
        onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
    });
};

// ==========================================
// AUTHORIZATION MUTATIONS
// ==========================================

export const useAuthorize = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({
            subsection,
            id,
            authorizedBy,
            rut,
            nombre,
            terminal,
            date,
        }: {
            subsection: AttendanceSubsection;
            id: string;
            authorizedBy: string;
            rut: string;
            nombre: string;
            terminal: string;
            date: string;
        }) => {
            await authorizeRecord(TABLE_NAMES[subsection] as any, id, authorizedBy);
            await sendAuthorizationEmail('AUTORIZADO', SUBSECTION_LABELS[subsection], rut, nombre, terminal, date);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
    });
};

export const useReject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({
            subsection,
            id,
            authorizedBy,
            reason,
            rut,
            nombre,
            terminal,
            date,
        }: {
            subsection: AttendanceSubsection;
            id: string;
            authorizedBy: string;
            reason: string;
            rut: string;
            nombre: string;
            terminal: string;
            date: string;
        }) => {
            await rejectRecord(TABLE_NAMES[subsection] as any, id, authorizedBy, reason);
            await sendAuthorizationEmail('RECHAZADO', SUBSECTION_LABELS[subsection], rut, nombre, terminal, date, reason);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
    });
};

// ==========================================
// REALTIME HOOK
// ==========================================

export const useAttendanceRealtime = () => {
    const qc = useQueryClient();

    useEffect(() => {
        const unsubscribe = subscribeToAttendanceChanges(
            () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
            () => qc.invalidateQueries({ queryKey: attendanceKeys.all })
        );
        return () => {
            unsubscribe();
        };
    }, [qc]);
};
