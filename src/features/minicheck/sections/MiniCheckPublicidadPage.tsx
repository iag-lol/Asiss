import { TableColumn } from '../../../shared/components/common/DataTable';
import { fetchPublicidad } from '../api/minicheckApi';
import { KpiItem } from '../components/MiniCheckKpis';
import { DistributionItem, MiniCheckModulePage } from '../components/MiniCheckModulePage';
import { BooleanStatus, StatusPill } from '../components/MiniCheckStatus';
import { Publicidad, PublicidadLado } from '../types';

const sideSummary = (side: PublicidadLado | undefined): string => {
  if (!side) return 'SIN DATO';
  const result = [
    side.tiene === null ? 'publicidad: sin dato' : side.tiene ? 'con publicidad' : 'sin publicidad',
    side.danio === true ? 'con daño' : side.danio === false ? 'sin daño' : 'daño: sin dato',
    side.residuos === true
      ? 'con residuos'
      : side.residuos === false
        ? 'sin residuos'
        : 'residuos: sin dato',
  ];
  if (side.observacion) result.push(side.observacion);
  return result.join(' · ');
};

const SideCell = ({ side }: { side: PublicidadLado | undefined }) => {
  if (!side) return <StatusPill>Sin dato</StatusPill>;

  return (
    <div className="min-w-[180px] space-y-1.5">
      <div className="flex flex-wrap gap-1">
        <BooleanStatus
          value={side.tiene}
          trueLabel="Con publicidad"
          falseLabel="Sin publicidad"
          falseTone="neutral"
        />
        {side.danio === true && <StatusPill tone="danger">Daño</StatusPill>}
        {side.residuos === true && <StatusPill tone="warning">Residuos</StatusPill>}
      </div>
      {side.observacion && (
        <p className="max-w-[240px] whitespace-normal text-xs leading-5 text-slate-500">
          {side.observacion}
        </p>
      )}
    </div>
  );
};

const hasFinding = (row: Publicidad): boolean => row.danio === true || row.residuos === true;

const detailColumns: TableColumn<Publicidad>[] = [
  {
    key: 'tiene',
    header: 'Publicidad',
    render: (row) => (
      <BooleanStatus
        value={row.tiene}
        trueLabel="Instalada"
        falseLabel="Sin publicidad"
        falseTone="neutral"
      />
    ),
    value: (row) =>
      row.tiene === null ? 'SIN DATO' : row.tiene ? 'INSTALADA' : 'SIN PUBLICIDAD',
  },
  {
    key: 'danio',
    header: 'Daño',
    render: (row) => (
      <BooleanStatus
        value={row.danio}
        trueLabel="Con daño"
        falseLabel="Sin daño"
        trueTone="danger"
        falseTone="success"
      />
    ),
    value: (row) => (row.danio === null ? 'SIN DATO' : row.danio ? 'CON DAÑO' : 'SIN DAÑO'),
  },
  {
    key: 'residuos',
    header: 'Residuos',
    render: (row) => (
      <BooleanStatus
        value={row.residuos}
        trueLabel="Con residuos"
        falseLabel="Sin residuos"
        trueTone="warning"
        falseTone="success"
      />
    ),
    value: (row) =>
      row.residuos === null ? 'SIN DATO' : row.residuos ? 'CON RESIDUOS' : 'SIN RESIDUOS',
  },
  {
    key: 'nombre_publicidad',
    header: 'Campaña',
    render: (row) => (
      <span className="block max-w-xs whitespace-normal font-medium text-slate-700">
        {row.nombre_publicidad || '—'}
      </span>
    ),
    value: (row) => row.nombre_publicidad || '',
  },
  {
    key: 'lado_izquierdo',
    header: 'Lado izquierdo',
    render: (row) => <SideCell side={row.detalle_lados?.izquierda} />,
    value: (row) => sideSummary(row.detalle_lados?.izquierda),
  },
  {
    key: 'lado_derecho',
    header: 'Lado derecho',
    render: (row) => <SideCell side={row.detalle_lados?.derecha} />,
    value: (row) => sideSummary(row.detalle_lados?.derecha),
  },
  {
    key: 'luneta',
    header: 'Luneta',
    render: (row) => <SideCell side={row.detalle_lados?.luneta} />,
    value: (row) => sideSummary(row.detalle_lados?.luneta),
  },
];

const getKpis = (rows: Publicidad[]): KpiItem[] => [
  { label: 'Registros', value: rows.length, icon: 'clipboard' },
  {
    label: 'Con publicidad',
    value: rows.filter((row) => row.tiene === true).length,
    icon: 'image',
    colorClass: 'bg-sky-50 text-sky-600',
  },
  {
    label: 'Con daño',
    value: rows.filter((row) => row.danio === true).length,
    icon: 'alert-triangle',
    colorClass: 'bg-red-50 text-red-600',
  },
  {
    label: 'Con residuos',
    value: rows.filter((row) => row.residuos === true).length,
    icon: 'trash',
    colorClass: 'bg-amber-50 text-amber-600',
  },
];

const getDistribution = (rows: Publicidad[]): DistributionItem[] => [
  {
    name: 'Sin hallazgos',
    value: rows.filter((row) => !hasFinding(row)).length,
    color: '#10b981',
  },
  { name: 'Con daño', value: rows.filter((row) => row.danio === true).length, color: '#ef4444' },
  {
    name: 'Con residuos',
    value: rows.filter((row) => row.residuos === true).length,
    color: '#f59e0b',
  },
];

export const MiniCheckPublicidadPage = () => (
  <MiniCheckModulePage
    moduleKey="publicidad"
    title="Revisión de publicidad"
    description="Campañas, daños y residuos por lado izquierdo, derecho y luneta."
    sheetName="Publicidad"
    fetcher={fetchPublicidad}
    detailColumns={detailColumns}
    getKpis={getKpis}
    getDistribution={getDistribution}
  />
);
