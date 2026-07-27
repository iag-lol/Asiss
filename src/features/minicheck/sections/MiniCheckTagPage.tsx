import { TableColumn } from '../../../shared/components/common/DataTable';
import { fetchTags } from '../api/minicheckApi';
import { KpiItem } from '../components/MiniCheckKpis';
import { DistributionItem, MiniCheckModulePage } from '../components/MiniCheckModulePage';
import { BooleanStatus } from '../components/MiniCheckStatus';
import { Tag } from '../types';

const detailColumns: TableColumn<Tag>[] = [
  {
    key: 'tiene',
    header: 'Dispositivo TAG',
    render: (row) => (
      <BooleanStatus value={row.tiene} trueLabel="Tiene TAG" falseLabel="Sin TAG" />
    ),
    value: (row) => (row.tiene === null ? 'SIN DATO' : row.tiene ? 'TIENE TAG' : 'SIN TAG'),
  },
  {
    key: 'serie',
    header: 'N° de serie',
    render: (row) => (
      <span className="font-mono text-xs font-semibold text-slate-700">{row.serie || '—'}</span>
    ),
    value: (row) => row.serie || '',
  },
];

const getKpis = (rows: Tag[]): KpiItem[] => [
  { label: 'Registros', value: rows.length, icon: 'clipboard' },
  {
    label: 'Con TAG',
    value: rows.filter((row) => row.tiene === true).length,
    icon: 'tag',
    colorClass: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Sin TAG',
    value: rows.filter((row) => row.tiene === false).length,
    icon: 'alert-triangle',
    colorClass: 'bg-red-50 text-red-600',
  },
  {
    label: 'Sin respuesta',
    value: rows.filter((row) => row.tiene === null).length,
    icon: 'alert-circle',
    colorClass: 'bg-slate-100 text-slate-600',
  },
];

const getDistribution = (rows: Tag[]): DistributionItem[] => [
  { name: 'Con TAG', value: rows.filter((row) => row.tiene === true).length, color: '#10b981' },
  { name: 'Sin TAG', value: rows.filter((row) => row.tiene === false).length, color: '#ef4444' },
  { name: 'Sin dato', value: rows.filter((row) => row.tiene === null).length, color: '#94a3b8' },
];

export const MiniCheckTagPage = () => (
  <MiniCheckModulePage
    moduleKey="tag"
    title="Revisión de TAG"
    description="Presencia del dispositivo de peaje y trazabilidad de su número de serie."
    sheetName="TAG"
    fetcher={fetchTags}
    detailColumns={detailColumns}
    getKpis={getKpis}
    getDistribution={getDistribution}
  />
);
