export interface IsoWeekRange {
  start: Date;
  end: Date;
}

export const getIsoWeekValue = (date = new Date()): string => {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - weekday);

  const isoYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);

  return `${isoYear}-W${String(week).padStart(2, '0')}`;
};

export const getIsoWeekRange = (isoWeek: string): IsoWeekRange | null => {
  const match = /^(\d{4})-W(\d{2})$/.exec(isoWeek);
  if (!match) return null;

  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;

  const januaryFourth = new Date(year, 0, 4);
  januaryFourth.setHours(0, 0, 0, 0);
  const januaryFourthWeekday = januaryFourth.getDay() || 7;

  const start = new Date(januaryFourth);
  start.setDate(januaryFourth.getDate() - januaryFourthWeekday + 1 + (week - 1) * 7);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { start, end };
};

export const shiftIsoWeek = (isoWeek: string, amount: number): string => {
  const range = getIsoWeekRange(isoWeek);
  if (!range) return getIsoWeekValue();

  const shifted = new Date(range.start);
  shifted.setDate(shifted.getDate() + amount * 7);
  return getIsoWeekValue(shifted);
};

export const getWeekNumber = (isoWeek: string): number | null => {
  const match = /-W(\d{2})$/.exec(isoWeek);
  return match ? Number(match[1]) : null;
};

export const formatIsoWeekLabel = (isoWeek: string): string => {
  const range = getIsoWeekRange(isoWeek);
  const week = getWeekNumber(isoWeek);
  if (!range || week === null) return 'Todo el historial';

  const endInclusive = new Date(range.end);
  endInclusive.setDate(endInclusive.getDate() - 1);

  const startLabel = range.start.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
  });
  const endLabel = endInclusive.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `Semana ${week} · ${startLabel} al ${endLabel}`;
};
