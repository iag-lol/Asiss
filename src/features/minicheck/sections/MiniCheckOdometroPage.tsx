import { TableColumn } from '../../../shared/components/common/DataTable';
import { fetchOdometros } from '../api/minicheckApi';
import { KpiItem } from '../components/MiniCheckKpis';
import {
  DistributionItem,
  isPanneMarker,
  MiniCheckModulePage,
} from '../components/MiniCheckModulePage';
import { StatusPill, StatusTone } from '../components/MiniCheckStatus';
import { Odometro, OdometroEstado } from '../types';

const ODOMETER_TONES: Record<OdometroEstado, StatusTone> = {
  OK: 'success',
  INCONSISTENTE: 'warning',
  NO_FUNCIONA: 'danger',
};

const formatReading = (value: number | string): string => {
  const reading = Number(value);
  return Number.isFinite(reading)
    ? `${reading.toLocaleString('es-CL', { maximumFractionDigits: 1 })} km`
    : String(value);
};

const detailColumns: TableColumn<Odometro>[] = [
  {
    key: 'lectura',
    header: 'Lectura',
    render: (row) => (
      <span className="font-mono text-xs font-bold text-slate-700">
        {isPanneMarker(row) ? '—' : formatReading(row.lectura)}
      </span>
    ),
    value: (row) => (isPanneMarker(row) ? 'NO APLICA - BUS EN PANNE' : formatReading(row.lectura)),
  },
  {
    key: 'estado',
    header: 'Estado',
    render: (row) =>
      isPanneMarker(row) ? (
        <StatusPill>No aplica</StatusPill>
      ) : row.estado ? (
        <StatusPill tone={ODOMETER_TONES[row.estado]}>
          {row.estado.replaceAll('_', ' ')}
        </StatusPill>
      ) : (
        <StatusPill>Sin dato</StatusPill>
      ),
    value: (row) => (isPanneMarker(row) ? 'NO APLICA - BUS EN PANNE' : row.estado || 'SIN DATO'),
  },
];

const getKpis = (rows: Odometro[]): KpiItem[] => {
  const reviewed = rows.filter((row) => !isPanneMarker(row));

  return [
    { label: 'Registros', value: rows.length, icon: 'clipboard' },
    {
      label: 'Revisados',
      value: reviewed.length,
      icon: 'gauge',
      colorClass: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Inconsistentes',
      value: reviewed.filter((row) => row.estado === 'INCONSISTENTE').length,
      icon: 'alert-triangle',
      colorClass: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'No funciona',
      value: reviewed.filter((row) => row.estado === 'NO_FUNCIONA').length,
      icon: 'x-circle',
      colorClass: 'bg-red-50 text-red-600',
    },
  ];
};

const getDistribution = (rows: Odometro[]): DistributionItem[] => {
  const reviewed = rows.filter((row) => !isPanneMarker(row));

  return [
    { name: 'OK', value: reviewed.filter((row) => row.estado === 'OK').length, color: '#10b981' },
    {
      name: 'Inconsistente',
      value: reviewed.filter((row) => row.estado === 'INCONSISTENTE').length,
      color: '#f59e0b',
    },
    {
      name: 'No funciona',
      value: reviewed.filter((row) => row.estado === 'NO_FUNCIONA').length,
      color: '#ef4444',
    },
    { name: 'No revisado', value: rows.filter(isPanneMarker).length, color: '#94a3b8' },
  ];
};

export const MiniCheckOdometroPage = () => (
  <MiniCheckModulePage
    moduleKey="odometro"
    title="Revisión de odómetro"
    description="Lecturas de kilometraje y detección de valores inconsistentes o equipos sin funcionamiento."
    sheetName="Odometro"
    fetcher={fetchOdometros}
    detailColumns={detailColumns}
    getKpis={getKpis}
    getDistribution={getDistribution}
  />
);
