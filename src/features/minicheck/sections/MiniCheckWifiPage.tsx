import { TableColumn } from '../../../shared/components/common/DataTable';
import { fetchWifi } from '../api/minicheckApi';
import { KpiItem } from '../components/MiniCheckKpis';
import {
  DistributionItem,
  isPanneMarker,
  MiniCheckModulePage,
} from '../components/MiniCheckModulePage';
import { BooleanStatus, StatusPill } from '../components/MiniCheckStatus';
import { Wifi } from '../types';

type WifiResult = 'ONLINE' | 'SIN_INTERNET' | 'NO_VISIBLE' | 'INCOMPLETO' | 'NO_APLICA';

const getResult = (row: Wifi): WifiResult => {
  if (isPanneMarker(row)) return 'NO_APLICA';
  if (row.ppu_visible === null) return 'INCOMPLETO';
  if (row.ppu_visible === false) return 'NO_VISIBLE';
  if (row.tiene_internet === true) return 'ONLINE';
  if (row.tiene_internet === false) return 'SIN_INTERNET';
  return 'INCOMPLETO';
};

const detailColumns: TableColumn<Wifi>[] = [
  {
    key: 'ppu_visible',
    header: 'Red PPU visible',
    render: (row) =>
      isPanneMarker(row) ? (
        <StatusPill>No aplica</StatusPill>
      ) : (
        <BooleanStatus value={row.ppu_visible} trueLabel="Visible" falseLabel="No visible" />
      ),
    value: (row) =>
      isPanneMarker(row)
        ? 'NO APLICA - BUS EN PANNE'
        : row.ppu_visible === null
          ? 'SIN DATO'
          : row.ppu_visible
            ? 'VISIBLE'
            : 'NO VISIBLE',
  },
  {
    key: 'bus_encendido',
    header: 'Bus encendido',
    render: (row) =>
      isPanneMarker(row) || row.ppu_visible !== false ? (
        <span className="text-xs text-slate-400">No aplica</span>
      ) : (
        <BooleanStatus
          value={row.bus_encendido}
          trueLabel="Encendido"
          falseLabel="Apagado"
          falseTone="warning"
        />
      ),
    value: (row) =>
      isPanneMarker(row) || row.ppu_visible !== false
        ? 'NO APLICA'
        : row.bus_encendido === null
          ? 'SIN DATO'
          : row.bus_encendido
            ? 'ENCENDIDO'
            : 'APAGADO',
  },
  {
    key: 'tiene_internet',
    header: 'Conexión a internet',
    render: (row) =>
      isPanneMarker(row) || row.ppu_visible !== true ? (
        <span className="text-xs text-slate-400">No aplica</span>
      ) : (
        <BooleanStatus
          value={row.tiene_internet}
          trueLabel="Con internet"
          falseLabel="Sin internet"
        />
      ),
    value: (row) =>
      isPanneMarker(row) || row.ppu_visible !== true
        ? 'NO APLICA'
        : row.tiene_internet === null
          ? 'SIN DATO'
          : row.tiene_internet
            ? 'CON INTERNET'
            : 'SIN INTERNET',
  },
];

const getKpis = (rows: Wifi[]): KpiItem[] => {
  const reviewed = rows.filter((row) => !isPanneMarker(row));

  return [
    { label: 'Revisados', value: reviewed.length, icon: 'clipboard' },
    {
      label: 'Wi-Fi operativo',
      value: reviewed.filter((row) => getResult(row) === 'ONLINE').length,
      icon: 'check-circle',
      colorClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Red no visible',
      value: reviewed.filter((row) => getResult(row) === 'NO_VISIBLE').length,
      icon: 'alert-triangle',
      colorClass: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Sin internet',
      value: reviewed.filter((row) => getResult(row) === 'SIN_INTERNET').length,
      icon: 'x-circle',
      colorClass: 'bg-red-50 text-red-600',
    },
  ];
};

const getDistribution = (rows: Wifi[]): DistributionItem[] => [
  { name: 'Operativo', value: rows.filter((row) => getResult(row) === 'ONLINE').length, color: '#10b981' },
  { name: 'No visible', value: rows.filter((row) => getResult(row) === 'NO_VISIBLE').length, color: '#f97316' },
  {
    name: 'Sin internet',
    value: rows.filter((row) => getResult(row) === 'SIN_INTERNET').length,
    color: '#ef4444',
  },
  {
    name: 'Incompleto',
    value: rows.filter((row) => getResult(row) === 'INCOMPLETO').length,
    color: '#f59e0b',
  },
  {
    name: 'No revisado',
    value: rows.filter((row) => getResult(row) === 'NO_APLICA').length,
    color: '#94a3b8',
  },
];

export const MiniCheckWifiPage = () => (
  <MiniCheckModulePage
    moduleKey="wifi"
    title="Revisión de Wi-Fi"
    description="Visibilidad de la red con nombre PPU, estado del bus y acceso efectivo a internet."
    sheetName="Wifi"
    fetcher={fetchWifi}
    detailColumns={detailColumns}
    getKpis={getKpis}
    getDistribution={getDistribution}
  />
);
