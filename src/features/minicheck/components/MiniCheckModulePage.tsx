import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DataTable, TableColumn } from '../../../shared/components/common/DataTable';
import { EmptyState } from '../../../shared/components/common/EmptyState';
import { ErrorState } from '../../../shared/components/common/ErrorState';
import { ExportMenu } from '../../../shared/components/common/ExportMenu';
import { Icon } from '../../../shared/components/common/Icon';
import { LoadingState } from '../../../shared/components/common/LoadingState';
import { PageHeader } from '../../../shared/components/common/PageHeader';
import { exportToXlsx } from '../../../shared/utils/exportToXlsx';
import { showErrorToast, showSuccessToast } from '../../../shared/state/toastStore';
import { isMiniCheckConfigured } from '../api/minicheckClient';
import { MiniCheckBase, MiniCheckFilters } from '../types';
import { MiniCheckFilters as Filters } from './MiniCheckFilters';
import { KpiItem, MiniCheckKpis } from './MiniCheckKpis';
import { StatusPill } from './MiniCheckStatus';

export interface DistributionItem {
  name: string;
  value: number;
  color: string;
}

interface Props<T extends MiniCheckBase> {
  moduleKey: string;
  title: string;
  description: string;
  sheetName: string;
  fetcher: (filters: MiniCheckFilters) => Promise<T[]>;
  detailColumns: TableColumn<T>[];
  getKpis: (rows: T[]) => KpiItem[];
  getDistribution: (rows: T[]) => DistributionItem[];
}

const formatTimestamp = (value: string): string =>
  new Date(value).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const displayTerminal = (terminal: string): string =>
  terminal === 'SIN_TERMINAL' ? 'Fuera de geocerca' : terminal;

export const isPanneMarker = (row: MiniCheckBase): boolean =>
  row.observacion?.trim().toLocaleLowerCase('es-CL') ===
  'bus en panne - no revisado';

export const MiniCheckModulePage = <T extends MiniCheckBase>({
  moduleKey,
  title,
  description,
  sheetName,
  fetcher,
  detailColumns,
  getKpis,
  getDistribution,
}: Props<T>) => {
  const configured = isMiniCheckConfigured();
  const [terminal, setTerminal] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exportingAll, setExportingAll] = useState(false);

  const filters = useMemo<MiniCheckFilters>(
    () => ({
      terminal: terminal || undefined,
      search: search.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [dateFrom, dateTo, search, terminal],
  );

  const { data = [], isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['minicheck', moduleKey, filters],
    queryFn: () => fetcher(filters),
    enabled: configured,
  });

  const columns = useMemo<TableColumn<T>[]>(
    () => [
      {
        key: 'bus_ppu',
        header: 'PPU',
        render: (row) => (
          <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-white">
            {row.bus_ppu}
          </span>
        ),
        value: (row) => row.bus_ppu,
      },
      {
        key: 'terminal',
        header: 'Terminal',
        value: (row) => displayTerminal(row.terminal),
      },
      ...detailColumns,
      {
        key: 'observacion',
        header: 'Observación',
        render: (row) =>
          isPanneMarker(row) ? (
            <StatusPill tone="neutral">Bus en panne · No revisado</StatusPill>
          ) : (
            <span className="block max-w-xs whitespace-normal text-slate-600">
              {row.observacion || '—'}
            </span>
          ),
        value: (row) => row.observacion || '',
      },
      {
        key: 'created_at',
        header: 'Fecha de revisión',
        render: (row) => (
          <span className="text-xs font-medium text-slate-600">{formatTimestamp(row.created_at)}</span>
        ),
        value: (row) => formatTimestamp(row.created_at),
      },
    ],
    [detailColumns],
  );

  const kpis = useMemo(() => getKpis(data), [data, getKpis]);
  const distribution = useMemo(
    () => getDistribution(data).filter((item) => item.value > 0),
    [data, getDistribution],
  );

  const exportRows = (rows: T[], suffix: string) => {
    exportToXlsx({
      filename: `mini-check_${moduleKey}_${suffix}_${new Date().toISOString().slice(0, 10)}`,
      sheetName,
      rows,
      columns: columns.map((column) => ({
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
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
      />

      {!configured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-bold">Fuente Mini-Check pendiente de configuración</p>
          <p className="mt-1 text-amber-800">
            Agrega la URL y la anon key independientes en las variables
            {' '}
            <code className="font-semibold">VITE_MINICHECK_SUPABASE_URL</code>
            {' '}y{' '}
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

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(260px,0.7fr)_minmax(0,2.3fr)]">
            <div className="card min-h-[310px] p-5">
              <div className="mb-4">
                <h3 className="font-bold text-slate-900">Distribución del estado</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Calculada sobre los registros filtrados
                </p>
              </div>

              {distribution.length > 0 ? (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={distribution}
                      layout="vertical"
                      margin={{ top: 0, right: 18, bottom: 0, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={112}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="value" name="Buses" radius={[0, 6, 6, 0]}>
                        {distribution.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">
                  Sin datos para graficar
                </div>
              )}
            </div>

            <div className="min-w-0">
              {data.length > 0 ? (
                <DataTable columns={columns} rows={data} />
              ) : (
                <EmptyState
                  label="Sin revisiones"
                  description="No hay registros que coincidan con los filtros seleccionados."
                />
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};
