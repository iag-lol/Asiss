import { isMiniCheckConfigured, minicheckSupabase } from './minicheckClient';
import {
  Camaras,
  Extintor,
  MiniCheckFilters,
  Mobileye,
  Odometro,
  Publicidad,
  Rack,
  Tag,
  Wifi,
} from '../types';

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

    if (filters.dateFrom) {
      query = query.gte('created_at', toLocalDayStartIso(filters.dateFrom));
    }

    if (filters.dateTo) {
      query = query.lt('created_at', toNextLocalDayIso(filters.dateTo));
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
