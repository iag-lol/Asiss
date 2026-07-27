import { useQuery } from '@tanstack/react-query';
import {
  fetchCamaras,
  fetchExtintores,
  fetchMobileye,
  fetchOdometros,
  fetchPublicidad,
  fetchRack,
  fetchTags,
  fetchWifi,
} from '../api/minicheckApi';
import { isMiniCheckConfigured } from '../api/minicheckClient';
import { MiniCheckFilters } from '../types';

const useMiniCheckQuery = <T>(
  module: string,
  filters: MiniCheckFilters,
  fetcher: (filters: MiniCheckFilters) => Promise<T[]>,
) =>
  useQuery({
    queryKey: ['minicheck', module, filters],
    queryFn: () => fetcher(filters),
    enabled: isMiniCheckConfigured(),
  });

export const useCamaras = (filters: MiniCheckFilters) =>
  useMiniCheckQuery('camaras', filters, fetchCamaras);

export const useTags = (filters: MiniCheckFilters) =>
  useMiniCheckQuery('tags', filters, fetchTags);

export const useExtintores = (filters: MiniCheckFilters) =>
  useMiniCheckQuery('extintores', filters, fetchExtintores);

export const useMobileye = (filters: MiniCheckFilters) =>
  useMiniCheckQuery('mobileye', filters, fetchMobileye);

export const useOdometros = (filters: MiniCheckFilters) =>
  useMiniCheckQuery('odometro', filters, fetchOdometros);

export const useRack = (filters: MiniCheckFilters) =>
  useMiniCheckQuery('rack', filters, fetchRack);

export const useWifi = (filters: MiniCheckFilters) =>
  useMiniCheckQuery('wifi', filters, fetchWifi);

export const usePublicidad = (filters: MiniCheckFilters) =>
  useMiniCheckQuery('publicidad', filters, fetchPublicidad);
