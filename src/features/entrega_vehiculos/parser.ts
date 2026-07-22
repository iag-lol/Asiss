import { VehicleHandoverRequest, VehicleTableParseResult } from './types';

const DATE_PATTERN = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/;
const TIME_RANGE_PATTERN = /\b(\d{1,2}:\d{2})\s*(?:-|–|—|a)\s*(\d{1,2}:\d{2})\b/i;
const RUT_PATTERN = /\b(\d{1,2}(?:\.\d{3}){2}-[\dkK]|\d{7,8}-[\dkK])\b/;
const PLATE_PATTERN = /\b(?=[A-Z0-9-]{5,8}\b)(?=[A-Z0-9-]*[A-Z])(?=[A-Z0-9-]*\d)[A-Z0-9-]+\b/g;
const ROW_START_PATTERN = /^\s*(\d{2,})(?=\s|\t|$)/;

const clean = (value = '') => value.replace(/\s+/g, ' ').trim();

const titleCaseName = (value: string) =>
  clean(value)
    .toLocaleLowerCase('es-CL')
    .replace(/(^|[\s'-])([a-záéíóúñü])/g, (_, separator: string, letter: string) =>
      `${separator}${letter.toLocaleUpperCase('es-CL')}`
    );

const normalizeDate = (value: string) => {
  const parts = value.split(/[/-]/);
  if (parts.length !== 3) return value;
  const [day, month, year] = parts;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year.length === 2 ? `20${year}` : year}`;
};

const normalizeTime = (value: string) => {
  const [hour, minute] = value.split(':');
  return `${hour.padStart(2, '0')}:${minute}`;
};

const isLikelyPlate = (token: string) => {
  const compact = token.replace(/-/g, '');
  return compact.length >= 5
    && compact.length <= 7
    && /[A-Z]/.test(compact)
    && /\d/.test(compact)
    && !/^\d{1,2}:\d{2}$/.test(token);
};

const findPlate = (value: string) => {
  const beforeDate = value.split(DATE_PATTERN)[0] || value;
  const candidates = beforeDate.toLocaleUpperCase('es-CL').match(PLATE_PATTERN) || [];
  return [...candidates].reverse().find(isLikelyPlate) || '';
};

const extractDriverFromText = (value: string, rut: string) => {
  if (!rut) return '';
  const beforeRut = value.slice(0, value.toLocaleUpperCase('es-CL').lastIndexOf(rut.toLocaleUpperCase('es-CL')));
  const afterTerminal = beforeRut
    .replace(/^.*?D:\s*(?:US[6E]|USE)\s+EL\s+ROBLE\s+/is, '')
    .replace(/^.*?(?:(?:US[6E]|USE)\s+EL\s+ROBLE|TERMINAL\s+[A-ZÁÉÍÓÚÑ ]+)\s+/is, '');

  const noise = /\b(?:EN PROCESO|POR INICIAR|FINALIZADO|ACCIONES|CONDUCTOR|TERMINALES|HORARIO|FECHA DE VIAJE)\b/gi;
  return titleCaseName(afterTerminal.replace(noise, ''));
};

const requestFromCells = (cells: string[]): VehicleHandoverRequest | null => {
  const normalized = cells.map(clean).filter(Boolean);
  if (!normalized.length) return null;

  const idIndex = normalized.findIndex((cell) => /^\d{2,}$/.test(cell));
  if (idIndex < 0) return null;

  const id = normalized[idIndex];
  const dateCell = normalized.find((cell) => DATE_PATTERN.test(cell)) || '';
  const scheduleCell = normalized.find((cell) => TIME_RANGE_PATTERN.test(cell)) || '';
  const dateMatch = dateCell.match(DATE_PATTERN);
  const timeMatch = scheduleCell.match(TIME_RANGE_PATTERN);

  if (!dateMatch || !timeMatch) return null;

  const vehicleCell = normalized.slice(idIndex + 1).find((cell) => {
    const plate = findPlate(cell);
    return Boolean(plate) && !DATE_PATTERN.test(cell);
  }) || normalized[idIndex + 1] || '';

  const plate = findPlate(vehicleCell) || findPlate(normalized.join(' '));
  const vehicleModel = clean(vehicleCell.replace(new RegExp(`\\b${plate}\\b`, 'i'), ''));

  const driverCell = normalized.find((cell) => RUT_PATTERN.test(cell));
  const rutMatch = driverCell?.match(RUT_PATTERN) || normalized.join(' ').match(RUT_PATTERN);
  const driverRut = rutMatch?.[1]?.toLocaleUpperCase('es-CL') || '';
  const driverName = driverCell
    ? titleCaseName(driverCell.replace(RUT_PATTERN, ''))
    : extractDriverFromText(normalized.join(' '), driverRut);

  if (!plate || !driverName) return null;

  return {
    id,
    vehicleModel,
    plate,
    date: normalizeDate(dateMatch[1]),
    startTime: normalizeTime(timeMatch[1]),
    endTime: normalizeTime(timeMatch[2]),
    driverName,
    driverRut,
    cargo: '',
    gerencia: '',
  };
};

const parseTabularRows = (rawText: string) => {
  const rows = rawText
    .split(/\r?\n/)
    .map((line) => line.split('\t'))
    .filter((cells) => cells.length >= 4);

  return rows
    .map(requestFromCells)
    .filter((request): request is VehicleHandoverRequest => Boolean(request));
};

const parseTextBlocks = (rawText: string) => {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (ROW_START_PATTERN.test(line) && current.length) {
      blocks.push(current);
      current = [line];
    } else if (ROW_START_PATTERN.test(line)) {
      current = [line];
    } else if (current.length) {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current);

  return blocks.map((blockLines) => {
    const cells = blockLines
      .flatMap((line) => line.split('\t'))
      .map(clean)
      .filter(Boolean);
    const flattened = cells.join(' ');
    const id = cells[0]?.match(ROW_START_PATTERN)?.[1] || '';
    const date = flattened.match(DATE_PATTERN)?.[1] || '';
    const schedule = flattened.match(TIME_RANGE_PATTERN);
    const rutIndex = cells.findIndex((cell) => RUT_PATTERN.test(cell));
    const rut = (rutIndex >= 0 ? cells[rutIndex].match(RUT_PATTERN)?.[1] : '')?.toLocaleUpperCase('es-CL') || '';
    const dateIndex = cells.findIndex((cell) => DATE_PATTERN.test(cell));
    const vehicleArea = cells.slice(0, dateIndex >= 0 ? dateIndex : cells.length).join(' ');
    const plate = findPlate(vehicleArea);

    if (!id || !date || !schedule || !rut || !plate) return null;

    const plateIndex = cells.findIndex((cell) => cell.toLocaleUpperCase('es-CL').includes(plate));
    const modelSection = cells
      .slice(0, plateIndex + 1)
      .join(' ')
      .replace(new RegExp(`^\\s*${id}\\b`, 'i'), '')
      .replace(new RegExp(`\\b${plate}\\b`, 'i'), '');
    const vehicleModel = clean(modelSection);

    let destinationIndex = -1;
    for (let index = 0; index < rutIndex; index += 1) {
      if (/^D\s*:/i.test(cells[index])) destinationIndex = index;
    }
    const driverParts = destinationIndex >= 0
      ? cells.slice(destinationIndex + 1, rutIndex)
      : cells.slice(Math.max(0, rutIndex - 1), rutIndex);
    const driverName = titleCaseName(driverParts.join(' ')) || extractDriverFromText(flattened, rut);
    if (!driverName) return null;

    return {
      id,
      vehicleModel,
      plate,
      date: normalizeDate(date),
      startTime: normalizeTime(schedule[1]),
      endTime: normalizeTime(schedule[2]),
      driverName,
      driverRut: rut,
      cargo: '',
      gerencia: '',
    } satisfies VehicleHandoverRequest;
  }).filter((request): request is VehicleHandoverRequest => Boolean(request));
};

export const parseVehicleTableText = (rawText: string): VehicleTableParseResult => {
  const warnings: string[] = [];
  const tabular = parseTabularRows(rawText);
  const fallback = tabular.length ? [] : parseTextBlocks(rawText);
  const parsed = tabular.length ? tabular : fallback;

  const unique = Array.from(
    new Map(parsed.map((request) => [`${request.id}-${request.plate}-${request.startTime}`, request])).values()
  );

  if (!unique.length) {
    warnings.push('No se detectaron filas completas. Verifica que cada fila incluya ID, patente, fecha, horario, nombre y RUT.');
  } else {
    const possibleRows = rawText.match(/^\s*\d{2,}(?=\s|\t|$)/gm)?.length || unique.length;
    if (possibleRows > unique.length) {
      warnings.push(`Se detectaron ${possibleRows - unique.length} fila(s) incompleta(s). Revisa el texto pegado antes de imprimir.`);
    }
  }

  return { requests: unique, warnings };
};
