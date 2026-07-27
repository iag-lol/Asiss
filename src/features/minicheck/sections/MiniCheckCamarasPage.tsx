import { TableColumn } from '../../../shared/components/common/DataTable';
import { KpiItem } from '../components/MiniCheckKpis';
import {
  DistributionItem,
  isPanneMarker,
  MiniCheckModulePage,
} from '../components/MiniCheckModulePage';
import { BooleanStatus, StatusPill, StatusTone } from '../components/MiniCheckStatus';
import { fetchCamaras } from '../api/minicheckApi';
import { Camaras, CamarasDetalle, MonitorEstado } from '../types';

const MONITOR_TONES: Record<MonitorEstado, StatusTone> = {
  FUNCIONA: 'success',
  APAGADO: 'warning',
  CON_DAÑO: 'danger',
  SIN_SENAL: 'danger',
};

const cameraChecks: Array<keyof CamarasDetalle> = [
  'camDelantera',
  'camCabina',
  'camInteriores',
  'camTrasera',
  'visiblesMonitor',
  'activaReversa',
  'activaPuertas',
  'visiblesPuertasCerradas',
];

const hasFailure = (row: Camaras): boolean => {
  if (isPanneMarker(row)) return false;
  return (
    (row.monitor_estado !== null && row.monitor_estado !== 'FUNCIONA') ||
    cameraChecks.some((key) => row.detalle?.[key] === false)
  );
};

const renderCheck = (row: Camaras, key: keyof CamarasDetalle) =>
  isPanneMarker(row) ? (
    <StatusPill>No aplica</StatusPill>
  ) : (
    <BooleanStatus value={row.detalle?.[key] as boolean | null | undefined} />
  );

const detailColumns: TableColumn<Camaras>[] = [
  {
    key: 'monitor_estado',
    header: 'Monitor',
    render: (row) =>
      isPanneMarker(row) ? (
        <StatusPill>No aplica</StatusPill>
      ) : row.monitor_estado ? (
        <StatusPill tone={MONITOR_TONES[row.monitor_estado]}>
          {row.monitor_estado.replaceAll('_', ' ')}
        </StatusPill>
      ) : (
        <StatusPill>Sin dato</StatusPill>
      ),
    value: (row) => (isPanneMarker(row) ? 'NO APLICA - BUS EN PANNE' : row.monitor_estado || 'SIN DATO'),
  },
  {
    key: 'monitor_detalle',
    header: 'Detalle monitor',
    value: (row) => row.detalle?.monitorDetalle || '',
  },
  {
    key: 'cam_delantera',
    header: 'Cám. delantera',
    render: (row) => renderCheck(row, 'camDelantera'),
    value: (row) => row.detalle?.camDelantera ?? '',
  },
  {
    key: 'cam_cabina',
    header: 'Cám. cabina',
    render: (row) => renderCheck(row, 'camCabina'),
    value: (row) => row.detalle?.camCabina ?? '',
  },
  {
    key: 'cam_interiores',
    header: 'Cám. interiores',
    render: (row) => renderCheck(row, 'camInteriores'),
    value: (row) => row.detalle?.camInteriores ?? '',
  },
  {
    key: 'cam_trasera',
    header: 'Cám. trasera',
    render: (row) => renderCheck(row, 'camTrasera'),
    value: (row) => row.detalle?.camTrasera ?? '',
  },
  {
    key: 'visibles_monitor',
    header: 'Visibles monitor',
    render: (row) => renderCheck(row, 'visiblesMonitor'),
    value: (row) => row.detalle?.visiblesMonitor ?? '',
  },
  {
    key: 'activa_reversa',
    header: 'Activa reversa',
    render: (row) => renderCheck(row, 'activaReversa'),
    value: (row) => row.detalle?.activaReversa ?? '',
  },
  {
    key: 'activa_puertas',
    header: 'Activa puertas',
    render: (row) => renderCheck(row, 'activaPuertas'),
    value: (row) => row.detalle?.activaPuertas ?? '',
  },
  {
    key: 'visibles_puertas_cerradas',
    header: 'Puertas cerradas',
    render: (row) => renderCheck(row, 'visiblesPuertasCerradas'),
    value: (row) => row.detalle?.visiblesPuertasCerradas ?? '',
  },
];

const getKpis = (rows: Camaras[]): KpiItem[] => {
  const panne = rows.filter(isPanneMarker).length;
  const reviewed = rows.length - panne;
  const failures = rows.filter(hasFailure).length;

  return [
    { label: 'Registros', value: rows.length, icon: 'clipboard' },
    { label: 'Revisadas', value: reviewed, icon: 'eye', colorClass: 'bg-sky-50 text-sky-600' },
    { label: 'Con hallazgos', value: failures, icon: 'alert-triangle', colorClass: 'bg-red-50 text-red-600' },
    { label: 'No aplica · Panne', value: panne, icon: 'wrench', colorClass: 'bg-slate-100 text-slate-600' },
  ];
};

const getDistribution = (rows: Camaras[]): DistributionItem[] => {
  const reviewed = rows.filter((row) => !isPanneMarker(row));

  return [
    { name: 'Funciona', value: reviewed.filter((row) => row.monitor_estado === 'FUNCIONA').length, color: '#10b981' },
    { name: 'Apagado', value: reviewed.filter((row) => row.monitor_estado === 'APAGADO').length, color: '#f59e0b' },
    { name: 'Con daño', value: reviewed.filter((row) => row.monitor_estado === 'CON_DAÑO').length, color: '#ef4444' },
    { name: 'Sin señal', value: reviewed.filter((row) => row.monitor_estado === 'SIN_SENAL').length, color: '#e11d48' },
    { name: 'No revisado', value: rows.filter(isPanneMarker).length, color: '#94a3b8' },
  ];
};

export const MiniCheckCamarasPage = () => (
  <MiniCheckModulePage
    moduleKey="camaras"
    title="Revisión de cámaras"
    description="Monitor, cobertura de cámaras y activaciones por reversa y puertas."
    sheetName="Camaras"
    fetcher={fetchCamaras}
    detailColumns={detailColumns}
    getKpis={getKpis}
    getDistribution={getDistribution}
  />
);
