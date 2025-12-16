import { TerminalCode } from '../../shared/types/terminal';

// ==========================================
// ENUMS
// ==========================================

export type AuthStatus = 'PENDIENTE' | 'AUTORIZADO' | 'RECHAZADO';
export type EntryExit = 'ENTRADA' | 'SALIDA';

export const AUTH_STATUS_OPTIONS: { value: AuthStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'AUTORIZADO', label: 'Autorizado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
];

export const ENTRY_EXIT_OPTIONS: { value: EntryExit; label: string }[] = [
  { value: 'ENTRADA', label: 'Llegada Tardía' },
  { value: 'SALIDA', label: 'Retiro Anticipado' },
];

// ==========================================
// BASE INTERFACE (shared fields)
// ==========================================

export interface AttendanceBase {
  id: string;
  rut: string;
  nombre: string;
  terminal_code: TerminalCode;
  auth_status: AuthStatus;
  authorized_by: string | null;
  authorized_at: string | null;
  rejection_reason: string | null;
  created_by_supervisor: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// NO MARCACIONES
// ==========================================

export interface NoMarcacion extends AttendanceBase {
  area: string | null;
  cargo: string | null;
  jefe_terminal: string | null;
  cabezal: string | null;
  incident_state: string | null;
  schedule_in_out: string | null;
  date: string;
  time_range: string | null;
  observations: string | null;
  informed_by: string | null;
}

export interface NoMarcacionFormValues {
  rut: string;
  nombre: string;
  area: string;
  cargo: string;
  jefe_terminal: string;
  terminal_code: TerminalCode;
  cabezal: string;
  incident_state: string;
  schedule_in_out: string;
  date: string;
  time_range: string;
  observations: string;
  informed_by: string;
}

// ==========================================
// SIN CREDENCIALES
// ==========================================

export interface SinCredencial extends AttendanceBase {
  cabezal: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  cargo: string | null;
  supervisor_autoriza: string | null;
  area: string | null;
  responsable: string | null;
  observacion: string | null;
}

export interface SinCredencialFormValues {
  rut: string;
  nombre: string;
  terminal_code: TerminalCode;
  cabezal: string;
  date: string;
  start_time: string;
  end_time: string;
  cargo: string;
  supervisor_autoriza: string;
  area: string;
  responsable: string;
  observacion: string;
}

// ==========================================
// CAMBIOS DE DÍA
// ==========================================

export interface CambioDia extends AttendanceBase {
  cabezal: string | null;
  date: string;
  prog_start: string | null;
  prog_end: string | null;
  reprogram_start: string | null;
  reprogram_end: string | null;
  day_off_date: string | null;
  day_off_start: string | null;
  day_off_end: string | null;
  day_on_date: string | null;
  day_on_start: string | null;
  day_on_end: string | null;
  document_path: string | null;
}

export interface CambioDiaFormValues {
  rut: string;
  nombre: string;
  terminal_code: TerminalCode;
  cabezal: string;
  date: string;
  prog_start: string;
  prog_end: string;
  reprogram_start: string;
  reprogram_end: string;
  day_off_date: string;
  day_off_start: string;
  day_off_end: string;
  day_on_date: string;
  day_on_start: string;
  day_on_end: string;
  document: File | null;
}

// ==========================================
// AUTORIZACIONES
// ==========================================

export interface Autorizacion extends AttendanceBase {
  cargo: string | null;
  turno: string | null;
  horario: string | null;
  authorization_date: string;
  entry_or_exit: EntryExit;
  motivo: string;
}

export interface AutorizacionFormValues {
  rut: string;
  nombre: string;
  cargo: string;
  terminal_code: TerminalCode;
  turno: string;
  horario: string;
  authorization_date: string;
  entry_or_exit: EntryExit;
  motivo: string;
}

// ==========================================
// FILTERS
// ==========================================

export interface AttendanceFilters {
  auth_status?: AuthStatus | 'todos';
  search?: string;
  date_from?: string;
  date_to?: string;
}

// ==========================================
// KPIs
// ==========================================

export interface AttendanceKPIs {
  pendingToday: number;
  pendingTotal: number;
  authorizedRange: number;
  rejectedRange: number;
}

// ==========================================
// SUBSECTION TYPES
// ==========================================

export type AttendanceSubsection =
  | 'no-marcaciones'
  | 'sin-credenciales'
  | 'cambios-dia'
  | 'autorizaciones';

export const SUBSECTION_LABELS: Record<AttendanceSubsection, string> = {
  'no-marcaciones': 'No Marcaciones',
  'sin-credenciales': 'Sin Credenciales',
  'cambios-dia': 'Cambios de Día',
  'autorizaciones': 'Autorizaciones',
};
