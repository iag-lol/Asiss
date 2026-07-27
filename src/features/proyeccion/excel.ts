import * as XLSX from 'xlsx';
import { ExcelRow } from './types';

/**
 * Lee un Excel (.xlsx/.xls) y devuelve las filas de la PRIMERA hoja como
 * objetos {encabezado: valor}. Busca la fila de encabezado dentro de las
 * primeras 10 filas (por ppu/patente/interno/folio); si no la encuentra usa
 * la primera fila. Sólo se procesa en el navegador.
 */
export const parseExcelFile = (file: File): Promise<ExcelRow[]> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        if (!(buffer instanceof ArrayBuffer)) throw new Error('No se pudo leer el archivo.');
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        const jsonRaw = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(10, jsonRaw.length); i += 1) {
          const rowStr = (jsonRaw[i] || []).join(' ').toLowerCase();
          if (
            rowStr.includes('ppu') ||
            rowStr.includes('patente') ||
            rowStr.includes('interno') ||
            rowStr.includes('folio')
          ) {
            headerRowIndex = i;
            break;
          }
        }

        const sheetData = XLSX.utils.sheet_to_json<ExcelRow>(firstSheet, {
          range: headerRowIndex,
          raw: true,
          defval: '',
        });
        resolve(sheetData);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Error al procesar el Excel.'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsArrayBuffer(file);
  });

export const removeAccents = (value: string): string =>
  (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Normaliza PPU: minúsculas y sólo alfanuméricos (AB-CD-12 → abcd12). */
export const normalizePpu = (value: unknown): string =>
  String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Busca una clave de columna cuyo nombre (sin acentos) matchee la regex. */
export const findColumnKeyRegex = (rowKeys: string[], regex: RegExp): string | undefined =>
  rowKeys.find((key) => regex.test(removeAccents(key).toLowerCase().trim()));

/** Normaliza una fecha a DD-MM-YYYY desde Date, serial de Excel o texto. */
export const formatDateToDDMMYYYY = (val: unknown): string => {
  if (val === null || val === undefined || val === '') return '';

  const formatOut = (d: number | string, m: number | string, y: number | string) =>
    `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;

  if (Object.prototype.toString.call(val) === '[object Date]') {
    const date = val as Date;
    return formatOut(date.getUTCDate(), date.getUTCMonth() + 1, date.getUTCFullYear());
  }
  if (typeof val === 'number') {
    const utcDate = new Date((Math.floor(val) - 25569) * 86400 * 1000);
    return formatOut(utcDate.getUTCDate(), utcDate.getUTCMonth() + 1, utcDate.getUTCFullYear());
  }

  const str = String(val).trim().split('T')[0].split(' ')[0];
  const parts = str.split(/[-/]/);
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      return formatOut(parts[2], parts[1], parts[0]);
    }
    const d = parts[0];
    const m = parts[1];
    let y = parts[2];
    if (y.length === 2) y = `20${y}`;
    if (parseInt(m, 10) > 12 && parseInt(d, 10) <= 12) {
      return formatOut(m, d, y);
    }
    return formatOut(d, m, y);
  }
  return str;
};

/** Convierte DD-MM-YYYY (o con /) a Date local, o null. */
export const parseDateString = (value: string): Date | null => {
  if (!value) return null;
  const parts = value.split(/[-/]/);
  if (parts.length === 3) {
    return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  }
  return null;
};

/** Si la hora viene como decimal de Excel (<1) la formatea a HH:MM. */
export const formatExcelTime = (value: unknown): string => {
  if (typeof value === 'number' && value < 1) {
    const totalSeconds = Math.round(value * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  return String(value ?? '');
};
