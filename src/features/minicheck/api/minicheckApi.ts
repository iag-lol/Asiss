import { isMiniCheckConfigured, minicheckSupabase } from './minicheckClient';
import {
  Camaras,
  Extintor,
  FleetBus,
  MiniCheckFilters,
  MiniCheckTicket,
  Mobileye,
  Odometro,
  Publicidad,
  Rack,
  Revision,
  Tag,
  Wifi,
} from '../types';
import { getIsoWeekRange } from '../utils/week';

const PAGE_SIZE = 1000;

const toLocalDayStartIso = (date: string): string =>
  new Date(`${date}T00:00:00`).toISOString();

const toNextLocalDayIso = (date: string): string => {
  const nextDay = new Date(`${date}T00:00:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toISOString();
};

const fetchTable = async <T>(table: string, filters: MiniCheckFilters): Promise<T[]> => {
  if (!isMiniCheckConfigured()) return [];

  const rows: T[] = [];
  let from = 0;

  while (true) {
    let query = minicheckSupabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (filters.terminal) {
      query = query.eq('terminal', filters.terminal);
    }

    const search = filters.search?.trim();
    if (search) {
      query = query.ilike('bus_ppu', `%${search}%`);
    }

    const weekRange = filters.week ? getIsoWeekRange(filters.week) : null;
    if (weekRange) {
      query = query
        .gte('created_at', weekRange.start.toISOString())
        .lt('created_at', weekRange.end.toISOString());
    } else {
      if (filters.dateFrom) {
        query = query.gte('created_at', toLocalDayStartIso(filters.dateFrom));
      }

      if (filters.dateTo) {
        query = query.lt('created_at', toNextLocalDayIso(filters.dateTo));
      }
    }

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error(`Error al consultar Mini-Check (${table}):`, error);
      throw error;
    }

    const page = (data ?? []) as T[];
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
};

export const fetchCamaras = (filters: MiniCheckFilters) =>
  fetchTable<Camaras>('camaras', filters);

export const fetchTags = (filters: MiniCheckFilters) =>
  fetchTable<Tag>('tags', filters);

export const fetchExtintores = (filters: MiniCheckFilters) =>
  fetchTable<Extintor>('extintores', filters);

export const fetchMobileye = (filters: MiniCheckFilters) =>
  fetchTable<Mobileye>('mobileye', filters);

export const fetchOdometros = (filters: MiniCheckFilters) =>
  fetchTable<Odometro>('odometro', filters);

export const fetchRack = (filters: MiniCheckFilters) =>
  fetchTable<Rack>('rack', filters);

export const fetchWifi = (filters: MiniCheckFilters) =>
  fetchTable<Wifi>('wifi', filters);

export const fetchPublicidad = (filters: MiniCheckFilters) =>
  fetchTable<Publicidad>('publicidad', filters);

export const fetchRevisiones = async (filters: MiniCheckFilters): Promise<Revision[]> => {
  if (!isMiniCheckConfigured()) return [];

  const rows: Revision[] = [];
  let from = 0;

  while (true) {
    let query = minicheckSupabase
      .from('revisiones')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (filters.week) {
      query = query.eq('semana_iso', filters.week);
    }

    if (filters.terminal) {
      query = query.eq('terminal_reportado', filters.terminal);
    }

    const search = filters.search?.trim();
    if (search) {
      query = query.ilike('bus_ppu', `%${search}%`);
    }

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error('Error al consultar revisiones Mini-Check:', error);
      throw error;
    }

    const page = (data ?? []) as Revision[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
};

export const fetchFleet = async (terminal?: string): Promise<FleetBus[]> => {
  if (!isMiniCheckConfigured()) return [];

  const rows: FleetBus[] = [];
  let from = 0;

  while (true) {
    let query = minicheckSupabase
      .from('flota')
      .select('*')
      .order('ppu', { ascending: true });

    if (terminal) query = query.eq('terminal', terminal);

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error('Error al consultar flota Mini-Check:', error);
      throw error;
    }

    const page = (data ?? []) as FleetBus[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
};

export const fetchTickets = async (
  filters: MiniCheckFilters,
): Promise<MiniCheckTicket[]> => {
  if (!isMiniCheckConfigured()) return [];

  const rows: MiniCheckTicket[] = [];
  let from = 0;

  while (true) {
    let query = minicheckSupabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.terminal) query = query.eq('terminal', filters.terminal);

    const weekRange = filters.week ? getIsoWeekRange(filters.week) : null;
    if (weekRange) {
      query = query
        .gte('created_at', weekRange.start.toISOString())
        .lt('created_at', weekRange.end.toISOString());
    }

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error('Error al consultar tickets Mini-Check:', error);
      throw error;
    }

    const page = (data ?? []) as MiniCheckTicket[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
};
