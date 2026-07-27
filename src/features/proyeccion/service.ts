import { supabase, isSupabaseConfigured } from '../../shared/lib/supabaseClient';
import { ExcelRow, FlotaBus } from './types';

/**
 * Tabla de Supabase con la flota principal.
 *
 * ⚠️  ÚNICO punto a ajustar si la flota vive en otra tabla o proyecto:
 * cambia el nombre aquí. La normalización de columnas más abajo es tolerante,
 * así que acepta los nombres de la especificación (cod, ppu, terminal, zona,
 * servicio, modelo, asignacion, tipo, estado, ubicacion, oper) y variantes
 * comunes (codigo, patente, operatividad, etc.).
 */
export const FLOTA_TABLE = 'buses';

const norm = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Devuelve el primer valor cuyo encabezado coincida con alguno de los candidatos. */
const pick = (row: ExcelRow, candidates: string[]): string => {
  const keys = Object.keys(row);
  const wanted = candidates.map((c) => norm(c));
  // 1. Coincidencia exacta (sin acentos ni mayúsculas).
  for (const key of keys) {
    if (wanted.includes(norm(key))) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
    }
  }
  // 2. Coincidencia parcial.
  for (const key of keys) {
    const nk = norm(key);
    if (wanted.some((w) => nk.includes(w))) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
    }
  }
  return '';
};

const normalizeTipo = (value: string): FlotaBus['tipo'] => {
  const t = norm(value);
  if (t.startsWith('rigi')) return 'RIGIDO';
  if (t.startsWith('artic')) return 'ARTICULADO';
  return value.toUpperCase();
};

/** Convierte una fila cruda de la tabla en un {@link FlotaBus} normalizado. */
export const toFlotaBus = (row: ExcelRow): FlotaBus => ({
  cod: pick(row, ['cod', 'codigo', 'n_interno', 'interno', 'numero_interno']),
  ppu: pick(row, ['ppu', 'patente', 'placa']),
  terminal: pick(row, ['terminal', 'taller']),
  zona: pick(row, ['zona']),
  servicio: pick(row, ['servicio']),
  modelo: pick(row, ['modelo']),
  asignacion: pick(row, ['asignacion']),
  tipo: normalizeTipo(pick(row, ['tipo'])),
  estado: pick(row, ['estado']),
  ubicacion: pick(row, ['ubicacion']),
  oper: pick(row, ['oper', 'operatividad', 'operativo']),
});

export interface FlotaResult {
  rows: FlotaBus[];
  error: string | null;
}

/** Trae la flota principal desde Supabase, ya normalizada. */
export const fetchFlota = async (): Promise<FlotaResult> => {
  if (!isSupabaseConfigured()) {
    return { rows: [], error: 'Supabase no está configurado en este entorno.' };
  }
  const { data, error } = await supabase.from(FLOTA_TABLE).select('*');
  if (error) {
    const missing = /could not find the table|does not exist|PGRST205/i.test(error.message);
    return {
      rows: [],
      error: missing
        ? `No se encontró la tabla «${FLOTA_TABLE}» en Supabase. Ajusta FLOTA_TABLE en proyeccion/service.ts.`
        : `Error al leer la flota: ${error.message}`,
    };
  }
  return { rows: (data ?? []).map((row) => toFlotaBus(row as ExcelRow)), error: null };
};
