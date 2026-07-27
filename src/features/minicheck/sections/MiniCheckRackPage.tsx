import { TableColumn } from '../../../shared/components/common/DataTable';
import { fetchRack } from '../api/minicheckApi';
import { KpiItem } from '../components/MiniCheckKpis';
import { DistributionItem, MiniCheckModulePage } from '../components/MiniCheckModulePage';
import { BooleanStatus } from '../components/MiniCheckStatus';
import { Rack } from '../types';

const hasFailure = (row: Rack): boolean =>
  row.tiene_disco_duro === false ||
  (row.tiene_disco_duro === true && row.tiene_seguridad_extra === false) ||
  row.tiene_candado === false ||
  row.cerraduras_buen_estado === false;

const isIncomplete = (row: Rack): boolean =>
  row.tiene_disco_duro === null ||
  row.tiene_candado === null ||
  row.cerraduras_buen_estado === null ||
  (row.tiene_disco_duro === true && row.tiene_seguridad_extra === null);

const detailColumns: TableColumn<Rack>[] = [
  {
    key: 'tiene_disco_duro',
    header: 'Disco duro',
    render: (row) => (
      <BooleanStatus value={row.tiene_disco_duro} trueLabel="Instalado" falseLabel="Ausente" />
    ),
    value: (row) =>
      row.tiene_disco_duro === null ? 'SIN DATO' : row.tiene_disco_duro ? 'INSTALADO' : 'AUSENTE',
  },
  {
    key: 'tiene_seguridad_extra',
    header: 'Seguridad extra',
    render: (row) =>
      row.tiene_disco_duro === false ? (
        <span className="text-xs text-slate-400">No aplica</span>
      ) : (
        <BooleanStatus
          value={row.tiene_seguridad_extra}
          trueLabel="Instalada"
          falseLabel="Ausente"
        />
      ),
    value: (row) =>
      row.tiene_disco_duro === false
        ? 'NO APLICA'
        : row.tiene_seguridad_extra === null
          ? 'SIN DATO'
          : row.tiene_seguridad_extra
            ? 'INSTALADA'
            : 'AUSENTE',
  },
  {
    key: 'tiene_candado',
    header: 'Candado',
    render: (row) => (
      <BooleanStatus value={row.tiene_candado} trueLabel="Instalado" falseLabel="Ausente" />
    ),
    value: (row) =>
      row.tiene_candado === null ? 'SIN DATO' : row.tiene_candado ? 'INSTALADO' : 'AUSENTE',
  },
  {
    key: 'cerraduras_buen_estado',
    header: 'Cerraduras',
    render: (row) => (
      <BooleanStatus
        value={row.cerraduras_buen_estado}
        trueLabel="Buen estado"
        falseLabel="Con falla"
      />
    ),
    value: (row) =>
      row.cerraduras_buen_estado === null
        ? 'SIN DATO'
        : row.cerraduras_buen_estado
          ? 'BUEN ESTADO'
          : 'CON FALLA',
  },
  {
    key: 'cantidad_cerraduras_esperada',
    header: 'Cerraduras esperadas',
    value: (row) => row.cantidad_cerraduras_esperada ?? '—',
  },
];

const getKpis = (rows: Rack[]): KpiItem[] => [
  { label: 'Registros', value: rows.length, icon: 'clipboard' },
  {
    label: 'Sin disco duro',
    value: rows.filter((row) => row.tiene_disco_duro === false).length,
    icon: 'alert-triangle',
    colorClass: 'bg-red-50 text-red-600',
  },
  {
    label: 'Sin candado',
    value: rows.filter((row) => row.tiene_candado === false).length,
    icon: 'key',
    colorClass: 'bg-orange-50 text-orange-600',
  },
  {
    label: 'Cerraduras con falla',
    value: rows.filter((row) => row.cerraduras_buen_estado === false).length,
    icon: 'wrench',
    colorClass: 'bg-amber-50 text-amber-600',
  },
];

const getDistribution = (rows: Rack[]): DistributionItem[] => [
  {
    name: 'Sin hallazgos',
    value: rows.filter((row) => !hasFailure(row) && !isIncomplete(row)).length,
    color: '#10b981',
  },
  { name: 'Con fallas', value: rows.filter(hasFailure).length, color: '#ef4444' },
  {
    name: 'Incompleto',
    value: rows.filter((row) => !hasFailure(row) && isIncomplete(row)).length,
    color: '#94a3b8',
  },
];

export const MiniCheckRackPage = () => (
  <MiniCheckModulePage
    moduleKey="rack"
    title="Revisión de rack"
    description="Disco duro, seguridad extra, candado y cerraduras del gabinete antirrobo."
    sheetName="Rack"
    fetcher={fetchRack}
    detailColumns={detailColumns}
    getKpis={getKpis}
    getDistribution={getDistribution}
  />
);
