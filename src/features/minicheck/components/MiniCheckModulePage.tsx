import { ReactNode, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TableColumn } from '../../../shared/components/common/DataTable';
import { EmptyState } from '../../../shared/components/common/EmptyState';
import { ErrorState } from '../../../shared/components/common/ErrorState';
import { ExportMenu } from '../../../shared/components/common/ExportMenu';
import { Icon, IconName } from '../../../shared/components/common/Icon';
import { LoadingState } from '../../../shared/components/common/LoadingState';
import { PageHeader } from '../../../shared/components/common/PageHeader';
import { exportToXlsx } from '../../../shared/utils/exportToXlsx';
import { showErrorToast, showSuccessToast } from '../../../shared/state/toastStore';
import { isMiniCheckConfigured } from '../api/minicheckClient';
import { useMiniCheckFilters } from '../context/MiniCheckFilterContext';
import { MiniCheckBase, MiniCheckFilters } from '../types';
import { MiniCheckFilters as Filters } from './MiniCheckFilters';
import { KpiItem, MiniCheckKpis } from './MiniCheckKpis';
import { StatusPill } from './MiniCheckStatus';

export interface DistributionItem {
  name: string;
  value: number;
  color: string;
}

/** Estado de salud de un bus para una revisión. */
export type RowHealth = 'ok' | 'warning' | 'danger' | 'unknown' | 'na';

interface HealthMeta {
  label: string;
  short: string;
  color: string;
  icon: IconName;
  rank: number; // orden de severidad (menor = más urgente)
  chip: string; // clases del pill
}

export const HEALTH: Record<RowHealth, HealthMeta> = {
  danger: {
    label: 'Crítico',
    short: 'Crítico',
    color: '#ef4444',
    icon: 'x-circle',
    rank: 0,
    chip: 'border-red-200 bg-red-50 text-red-700',
  },
  warning: {
    label: 'Advertencia',
    short: 'Advertencia',
    color: '#f59e0b',
    icon: 'alert-triangle',
    rank: 1,
    chip: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  unknown: {
    label: 'Dato incompleto',
    short: 'Incompleto',
    color: '#64748b',
    icon: 'alert-circle',
    rank: 2,
    chip: 'border-slate-200 bg-slate-50 text-slate-600',
  },
  ok: {
    label: 'Sin hallazgos',
    short: 'Sin hallazgos',
    color: '#10b981',
    icon: 'check-circle',
    rank: 3,
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  na: {
    label: 'No aplica',
    short: 'No aplica',
    color: '#cbd5e1',
    icon: 'wrench',
    rank: 4,
    chip: 'border-slate-200 bg-slate-100 text-slate-500',
  },
};

interface Props<T extends MiniCheckBase> {
  moduleKey: string;
  title: string;
  description: string;
  sheetName: string;
  fetcher: (filters: MiniCheckFilters) => Promise<T[]>;
  detailColumns: TableColumn<T>[];
  getKpis: (rows: T[]) => KpiItem[];
  getDistribution: (rows: T[]) => DistributionItem[];
  /** Clasifica cada revisión para el semáforo de salud de la tarjeta. */
  getRowStatus?: (row: T) => RowHealth;
}

const formatTimestamp = (value: string): string =>
  new Date(value).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });

const displayTerminal = (terminal: string): string =>
  terminal === 'SIN_TERMINAL' ? 'Fuera de geocerca' : terminal;

export const isPanneMarker = (row: MiniCheckBase): boolean =>
  row.observacion?.trim().toLocaleLowerCase('es-CL') === 'bus en panne - no revisado';

type SortKey = 'severity' | 'ppu' | 'recent';

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'severity', label: 'Hallazgos primero' },
  { key: 'recent', label: 'Más recientes' },
  { key: 'ppu', label: 'Patente A–Z' },
];

// ---- Tooltips de gráficos ---------------------------------------------------

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number; payload?: { name?: string; color?: string } }> }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const color = item.payload?.color;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        {color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
        <span className="text-xs font-semibold text-slate-700">{item.payload?.name ?? item.name}</span>
      </div>
      <p className="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">{item.value} buses</p>
    </div>
  );
};

// ---- Donut de cumplimiento --------------------------------------------------

const ComplianceDonut = ({
  counts,
  total,
  compliance,
}: {
  counts: Array<{ key: RowHealth; value: number }>;
  total: number;
  compliance: number | null;
}) => {
  const data = counts.filter((c) => c.value > 0);

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-slate-900">Cumplimiento de la flota</h3>
      <p className="mt-0.5 text-xs text-slate-500">Sobre {total} revisiones filtradas</p>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[132px] w-[132px] shrink-0">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={46}
                  outerRadius={64}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={2}
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((c) => (
                    <Cell key={c.key} fill={HEALTH[c.key].color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-dashed border-slate-200" />
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none text-slate-900 tabular-nums">
              {compliance === null ? '—' : `${compliance}%`}
            </span>
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Conforme
            </span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {counts.map((c) => (
            <li key={c.key} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: HEALTH[c.key].color }} />
              <span className="truncate text-slate-600">{HEALTH[c.key].label}</span>
              <span className="ml-auto font-bold tabular-nums text-slate-900">{c.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ---- Desglose por terminal (barras HTML compactas) --------------------------

const TerminalBreakdown = ({
  rows,
}: {
  rows: Array<{ terminal: string; findings: number; total: number }>;
}) => {
  const max = Math.max(1, ...rows.map((r) => r.total));

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-slate-900">Distribución por terminal</h3>
      <p className="mt-0.5 text-xs text-slate-500">Revisiones y hallazgos por terminal</p>

      <ul className="mt-3 space-y-2.5">
        {rows.length === 0 && <li className="text-xs text-slate-400">Sin datos.</li>}
        {rows.map((r) => {
          const ratio = r.total ? r.findings / r.total : 0;
          const barColor = ratio >= 0.34 ? '#ef4444' : ratio > 0 ? '#f59e0b' : '#10b981';
          return (
            <li key={r.terminal}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-semibold text-slate-700">{displayTerminal(r.terminal)}</span>
                <span className="shrink-0 tabular-nums text-slate-500">
                  {r.findings > 0 && <span className="font-bold text-red-600">{r.findings}</span>}
                  {r.findings > 0 && <span className="text-slate-400"> / </span>}
                  <span className="font-bold text-slate-900">{r.total}</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(r.total / max) * 100}%`, backgroundColor: barColor }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ---- Tarjeta de bus ---------------------------------------------------------

const BusCard = <T extends MiniCheckBase>({
  row,
  columns,
  health,
}: {
  row: T;
  columns: TableColumn<T>[];
  health: RowHealth;
}) => {
  const meta = HEALTH[health];
  const panne = isPanneMarker(row);

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      style={{ borderLeft: `4px solid ${meta.color}` }}
    >
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-5">
        {/* Identidad del bus */}
        <div className="flex shrink-0 items-center gap-3 lg:w-56">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
            <Icon name="truck" size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <span className="block font-mono text-sm font-bold tracking-wider text-slate-900">
              {row.bus_ppu}
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <Icon name="building" size={12} />
              <span className="truncate">{displayTerminal(row.terminal)}</span>
            </span>
          </div>
        </div>

        {/* Campos del módulo */}
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {columns.map((col) => {
              const node: ReactNode = col.render
                ? col.render(row)
                : (
                  <span className="text-sm font-medium text-slate-700">
                    {String(col.value ? col.value(row) ?? '—' : '—')}
                  </span>
                );
              return (
                <div key={col.key} className="min-w-0">
                  <p className="mb-1 truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {col.header}
                  </p>
                  <div className="min-w-0">{node}</div>
                </div>
              );
            })}
          </div>

          {(panne || row.observacion) && (
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              {panne ? (
                <StatusPill tone="neutral">Bus en panne · No revisado</StatusPill>
              ) : (
                <p className="text-xs leading-5 text-slate-500">
                  <span className="font-semibold text-slate-600">Observación: </span>
                  {row.observacion}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Salud + fecha */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-3 lg:w-44 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${meta.chip}`}>
            <Icon name={meta.icon} size={13} />
            {meta.label}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <Icon name="clock" size={12} />
            {formatTimestamp(row.created_at)}
          </span>
        </div>
      </div>
    </article>
  );
};

// ---- Página del módulo ------------------------------------------------------

export const MiniCheckModulePage = <T extends MiniCheckBase>({
  moduleKey,
  title,
  description,
  sheetName,
  fetcher,
  detailColumns,
  getKpis,
  getDistribution,
  getRowStatus,
}: Props<T>) => {
  const configured = isMiniCheckConfigured();
  const { week } = useMiniCheckFilters();
  const [terminal, setTerminal] = useState('');
  const [search, setSearch] = useState('');
  const [exportingAll, setExportingAll] = useState(false);
  const [sort, setSort] = useState<SortKey>('severity');
  const [onlyFindings, setOnlyFindings] = useState(false);

  const filters = useMemo<MiniCheckFilters>(
    () => ({
      week: week || undefined,
      terminal: terminal || undefined,
      search: search.trim() || undefined,
    }),
    [search, terminal, week],
  );

  const { data = [], isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['minicheck', moduleKey, filters],
    queryFn: () => fetcher(filters),
    enabled: configured,
  });

  const statusOf = useMemo(
    () => (row: T): RowHealth => {
      if (getRowStatus) return getRowStatus(row);
      return isPanneMarker(row) ? 'na' : 'unknown';
    },
    [getRowStatus],
  );

  // Columnas para exportación (incluye PPU/terminal/observación/fecha).
  const exportColumns = useMemo<TableColumn<T>[]>(
    () => [
      { key: 'bus_ppu', header: 'PPU', value: (row) => row.bus_ppu },
      { key: 'terminal', header: 'Terminal', value: (row) => displayTerminal(row.terminal) },
      ...detailColumns,
      {
        key: 'observacion',
        header: 'Observación',
        value: (row) => (isPanneMarker(row) ? 'BUS EN PANNE - NO REVISADO' : row.observacion || ''),
      },
      { key: 'created_at', header: 'Fecha de revisión', value: (row) => formatTimestamp(row.created_at) },
    ],
    [detailColumns],
  );

  const kpis = useMemo(() => getKpis(data), [data, getKpis]);
  const distribution = useMemo(
    () => getDistribution(data).filter((item) => item.value > 0),
    [data, getDistribution],
  );

  // Conteo por estado de salud + cumplimiento.
  const { healthCounts, compliance, findingsTotal } = useMemo(() => {
    const tally: Record<RowHealth, number> = { danger: 0, warning: 0, unknown: 0, ok: 0, na: 0 };
    data.forEach((row) => {
      tally[statusOf(row)] += 1;
    });
    const applicable = tally.ok + tally.warning + tally.danger + tally.unknown;
    return {
      healthCounts: (['ok', 'warning', 'danger', 'unknown', 'na'] as RowHealth[]).map((key) => ({
        key,
        value: tally[key],
      })),
      compliance: applicable > 0 ? Math.round((tally.ok / applicable) * 100) : null,
      findingsTotal: tally.danger + tally.warning,
    };
  }, [data, statusOf]);

  // Desglose por terminal.
  const terminalRows = useMemo(() => {
    const map = new Map<string, { total: number; findings: number }>();
    data.forEach((row) => {
      const key = row.terminal || 'SIN_TERMINAL';
      const entry = map.get(key) || { total: 0, findings: 0 };
      entry.total += 1;
      const s = statusOf(row);
      if (s === 'danger' || s === 'warning') entry.findings += 1;
      map.set(key, entry);
    });
    return [...map.entries()]
      .map(([terminalKey, v]) => ({ terminal: terminalKey, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [data, statusOf]);

  // Filtrado + orden de las tarjetas.
  const visibleRows = useMemo(() => {
    const withStatus = data.map((row) => ({ row, health: statusOf(row) }));
    const filtered = onlyFindings
      ? withStatus.filter((r) => r.health === 'danger' || r.health === 'warning')
      : withStatus;

    const sorted = [...filtered];
    if (sort === 'severity') {
      sorted.sort(
        (a, b) =>
          HEALTH[a.health].rank - HEALTH[b.health].rank ||
          new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime(),
      );
    } else if (sort === 'recent') {
      sorted.sort((a, b) => new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime());
    } else {
      sorted.sort((a, b) => a.row.bus_ppu.localeCompare(b.row.bus_ppu));
    }
    return sorted;
  }, [data, onlyFindings, sort, statusOf]);

  const exportRows = (rows: T[], suffix: string) => {
    exportToXlsx({
      filename: `mini-check_${moduleKey}_${week || 'historial'}_${suffix}_${new Date().toISOString().slice(0, 10)}`,
      sheetName,
      rows,
      columns: exportColumns.map((column) => ({
        key: column.key,
        header: column.header,
        value: column.value,
      })),
    });
  };

  const handleExportView = () => {
    exportRows(data, 'vista');
    showSuccessToast('Exportación lista', `Se exportaron ${data.length} registros de ${title}.`);
  };

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      const allRows = await fetcher({});
      exportRows(allRows, 'completo');
      showSuccessToast('Exportación completa', `Se exportaron ${allRows.length} registros de ${title}.`);
    } catch {
      showErrorToast('No se pudo exportar', 'Revisa la conexión con la base Mini-Check.');
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          configured ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                <Icon
                  name={isFetching ? 'loader' : 'activity'}
                  size={16}
                  className={isFetching ? 'animate-spin' : ''}
                />
                Actualizar
              </button>
              <div className={exportingAll ? 'pointer-events-none opacity-60' : ''}>
                <ExportMenu onExportView={handleExportView} onExportAll={() => void handleExportAll()} />
              </div>
            </div>
          ) : undefined
        }
      />

      <Filters
        terminal={terminal}
        onTerminalChange={setTerminal}
        search={search}
        onSearchChange={setSearch}
      />

      {!configured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-bold">Fuente Mini-Check pendiente de configuración</p>
          <p className="mt-1 text-amber-800">
            Agrega la URL y la anon key independientes en las variables{' '}
            <code className="font-semibold">VITE_MINICHECK_SUPABASE_URL</code> y{' '}
            <code className="font-semibold">VITE_MINICHECK_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      )}

      {configured && isLoading && <LoadingState label={`Cargando ${title.toLowerCase()}...`} />}

      {configured && isError && (
        <ErrorState
          message="No se pudieron obtener los registros desde la base Mini-Check."
          onRetry={() => void refetch()}
        />
      )}

      {configured && !isLoading && !isError && (
        <>
          <MiniCheckKpis items={kpis} />

          {/* Banda analítica */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ComplianceDonut counts={healthCounts} total={data.length} compliance={compliance} />

            <div className="card p-5">
              <h3 className="text-sm font-bold text-slate-900">Desglose de la revisión</h3>
              <p className="mt-0.5 text-xs text-slate-500">Registros por resultado del módulo</p>
              {distribution.length > 0 ? (
                <div className="mt-2 h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distribution} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 4 }}>
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={108} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Buses" radius={[0, 4, 4, 0]} barSize={16}>
                        {distribution.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[180px] items-center justify-center text-sm text-slate-400">
                  Sin datos para graficar
                </div>
              )}
            </div>

            <TerminalBreakdown rows={terminalRows} />
          </div>

          {/* Toolbar de las tarjetas */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-slate-900">
                {visibleRows.length}
                <span className="font-medium text-slate-400"> de {data.length} buses</span>
              </span>
              {findingsTotal > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                  <Icon name="alert-triangle" size={12} />
                  {findingsTotal} con hallazgos
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyFindings((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                  onlyFindings
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon name="alert-triangle" size={14} />
                Solo con hallazgos
              </button>

              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
                <Icon name="layers" size={14} className="text-slate-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                >
                  {SORTS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tarjetas apiladas */}
          {visibleRows.length > 0 ? (
            <div className="space-y-3">
              {visibleRows.map(({ row, health }) => (
                <BusCard key={row.id} row={row} columns={detailColumns} health={health} />
              ))}
            </div>
          ) : (
            <EmptyState
              label={onlyFindings ? 'Sin hallazgos' : 'Sin revisiones'}
              description={
                onlyFindings
                  ? 'Ningún bus registra hallazgos críticos o de advertencia con los filtros actuales.'
                  : 'No hay registros que coincidan con los filtros seleccionados.'
              }
            />
          )}
        </>
      )}
    </section>
  );
};
