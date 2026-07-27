import { TableColumn } from '../../../shared/components/common/DataTable';
import { fetchExtintores } from '../api/minicheckApi';
import { KpiItem } from '../components/MiniCheckKpis';
import { DistributionItem, MiniCheckModulePage } from '../components/MiniCheckModulePage';
import { BooleanStatus, StatusPill, StatusTone } from '../components/MiniCheckStatus';
import { Extintor } from '../types';

const toneForState = (value: string | null | undefined, okValue: string): StatusTone => {
  if (!value) return 'neutral';
  return value === okValue ? 'success' : 'danger';
};

const getIndicatorValues = (row: Extintor) => {
  const unified = row.sonda_manometro ?? row['sonda/manometro'];
  if (unified) return [{ label: 'Indicador', value: unified }];

  return [
    { label: 'Sonda', value: row.sonda },
    { label: 'Manómetro', value: row.manometro },
  ].filter((item) => item.value !== null && item.value !== undefined);
};

const hasTechnicalFinding = (row: Extintor): boolean =>
  (row.presion !== null && row.presion !== 'OPTIMO') ||
  (row.cilindro !== null && row.cilindro !== 'OK') ||
  (row.porta !== null && row.porta !== 'TIENE') ||
  getIndicatorValues(row).some((item) => item.value !== 'OK');

const isIncomplete = (row: Extintor): boolean =>
  row.tiene === null ||
  (row.tiene === true &&
    [row.certificacion, row.presion, row.cilindro, row.porta].some(
      (value) => value === null || value === undefined,
    ));

const stateCell = (value: string | null | undefined, okValue: string) => (
  <StatusPill tone={toneForState(value, okValue)}>
    {value?.replaceAll('_', ' ') || 'Sin dato'}
  </StatusPill>
);

const detailColumns: TableColumn<Extintor>[] = [
  {
    key: 'tiene',
    header: 'Extintor',
    render: (row) => (
      <BooleanStatus value={row.tiene} trueLabel="Instalado" falseLabel="Ausente" />
    ),
    value: (row) => (row.tiene === null ? 'SIN DATO' : row.tiene ? 'INSTALADO' : 'AUSENTE'),
  },
  {
    key: 'vencimiento',
    header: 'Vencimiento',
    value: (row) =>
      row.vencimiento_mes && row.vencimiento_anio
        ? `${String(row.vencimiento_mes).padStart(2, '0')}/${row.vencimiento_anio}`
        : '—',
  },
  {
    key: 'certificacion',
    header: 'Certificación',
    render: (row) => stateCell(row.certificacion, 'VIGENTE'),
    value: (row) => row.certificacion || 'SIN DATO',
  },
  {
    key: 'sonda_manometro',
    header: 'Sonda / manómetro',
    render: (row) => {
      const values = getIndicatorValues(row);
      if (values.length === 0) return <StatusPill>Sin dato</StatusPill>;
      return (
        <div className="flex flex-wrap gap-1.5">
          {values.map((item) => (
            <StatusPill key={item.label} tone={toneForState(item.value, 'OK')}>
              {values.length > 1 ? `${item.label}: ` : ''}
              {item.value?.replaceAll('_', ' ')}
            </StatusPill>
          ))}
        </div>
      );
    },
    value: (row) => {
      const values = getIndicatorValues(row);
      return values.length > 0
        ? values.map((item) => `${item.label}: ${item.value}`).join(' · ')
        : 'SIN DATO';
    },
  },
  {
    key: 'presion',
    header: 'Presión',
    render: (row) => stateCell(row.presion, 'OPTIMO'),
    value: (row) => row.presion || 'SIN DATO',
  },
  {
    key: 'cilindro',
    header: 'Cilindro',
    render: (row) => stateCell(row.cilindro, 'OK'),
    value: (row) => row.cilindro || 'SIN DATO',
  },
  {
    key: 'porta',
    header: 'Porta extintor',
    render: (row) => stateCell(row.porta, 'TIENE'),
    value: (row) => row.porta || 'SIN DATO',
  },
];

const getKpis = (rows: Extintor[]): KpiItem[] => [
  { label: 'Registros', value: rows.length, icon: 'clipboard' },
  {
    label: 'Sin extintor',
    value: rows.filter((row) => row.tiene === false).length,
    icon: 'x-circle',
    colorClass: 'bg-red-50 text-red-600',
  },
  {
    label: 'Certificación vencida',
    value: rows.filter((row) => row.certificacion === 'VENCIDA').length,
    icon: 'alert-triangle',
    colorClass: 'bg-orange-50 text-orange-600',
  },
  {
    label: 'Hallazgo técnico',
    value: rows.filter(hasTechnicalFinding).length,
    icon: 'activity',
    colorClass: 'bg-amber-50 text-amber-600',
  },
];

const getDistribution = (rows: Extintor[]): DistributionItem[] => [
  { name: 'Sin extintor', value: rows.filter((row) => row.tiene === false).length, color: '#ef4444' },
  {
    name: 'Cert. vencida',
    value: rows.filter((row) => row.tiene !== false && row.certificacion === 'VENCIDA').length,
    color: '#f97316',
  },
  {
    name: 'Falla técnica',
    value: rows.filter(
      (row) => row.tiene !== false && row.certificacion !== 'VENCIDA' && hasTechnicalFinding(row),
    ).length,
    color: '#f59e0b',
  },
  {
    name: 'Incompleto',
    value: rows.filter(
      (row) =>
        row.tiene !== false &&
        row.certificacion !== 'VENCIDA' &&
        !hasTechnicalFinding(row) &&
        isIncomplete(row),
    ).length,
    color: '#94a3b8',
  },
  {
    name: 'Sin hallazgos',
    value: rows.filter(
      (row) =>
        row.tiene === true &&
        row.certificacion !== 'VENCIDA' &&
        !hasTechnicalFinding(row) &&
        !isIncomplete(row),
    ).length,
    color: '#10b981',
  },
];

export const MiniCheckExtintorPage = () => (
  <MiniCheckModulePage
    moduleKey="extintores"
    title="Revisión de extintores"
    description="Vencimiento, certificación, presión, cilindro, indicadores y soporte."
    sheetName="Extintores"
    fetcher={fetchExtintores}
    detailColumns={detailColumns}
    getKpis={getKpis}
    getDistribution={getDistribution}
  />
);
