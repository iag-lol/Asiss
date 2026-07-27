export type BusTipo = 'RIGIDO' | 'ARTICULADO' | string;

/**
 * Bus normalizado de la flota principal. Es la fuente oficial de identidad y
 * tipo: los Excel (OT, RTG, OTROS FS) se cruzan contra esta lista por COD o
 * PPU, y el tipo RIGIDO/ARTICULADO siempre se toma de aquí.
 */
export interface FlotaBus {
  cod: string;
  ppu: string;
  terminal: string;
  zona: string;
  servicio: string;
  modelo: string;
  asignacion: string;
  tipo: BusTipo;
  estado: string;
  ubicacion: string;
  oper: string;
}

/** Fila cruda de cualquier Excel: encabezado → valor. */
export type ExcelRow = Record<string, unknown>;

export interface FlotaFilters {
  terminal: string;
  zona: string;
  servicio: string;
  estado: string;
  oper: string;
  search: string;
}

export interface RtgVencidaRow {
  interno: string;
  patente: string;
  taller: string;
  tipo: BusTipo;
  fechaEmision: string;
  fechaVencimiento: string;
  dias: number;
}

export interface OtroFsRow {
  interno: string;
  ppu: string;
  tipo: BusTipo;
  fecha: string;
  hora: string;
  observacion: string;
}
