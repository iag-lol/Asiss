import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiltersBar } from '../../../shared/components/common/FiltersBar';
import { PageHeader } from '../../../shared/components/common/PageHeader';
import { DataTable, TableColumn } from '../../../shared/components/common/DataTable';
import { EmptyState } from '../../../shared/components/common/EmptyState';
import { LoadingState } from '../../../shared/components/common/LoadingState';
import { ErrorState } from '../../../shared/components/common/ErrorState';
import { ExportMenu } from '../../../shared/components/common/ExportMenu';
import { useTerminalStore } from '../../../shared/state/terminalStore';
import { exportToXlsx } from '../../../shared/utils/exportToXlsx';
import { displayTerminal } from '../../../shared/utils/terminal';
import { getAseoAdapter } from '../service';
import { AseoFilters, AseoRegistroViewModel } from '../types';
import { formatDate } from '../../../shared/utils/dates';

interface Props {
  area: AseoRegistroViewModel['area'];
  title: string;
}

export const AseoSectionTemplate = ({ area, title }: Props) => {
  const terminalContext = useTerminalStore((state) => state.context);
  const setTerminalContext = useTerminalStore((state) => state.setContext);
  const [filters, setFilters] = useState<AseoFilters>({ estado: 'todos' });
  const adapter = useMemo(() => getAseoAdapter(area), [area]);

  const query = useQuery({
    queryKey: ['aseo', area, terminalContext, filters],
    queryFn: () => adapter.list({ terminalContext, filters, scope: 'view' }),
  });

  const columns: TableColumn<AseoRegistroViewModel>[] = useMemo(
    () => [
      { key: 'responsable', header: 'Responsable' },
      { key: 'fecha', header: 'Fecha', render: (row) => formatDate(row.fecha), value: (row) => formatDate(row.fecha) },
      { key: 'estado', header: 'Estado', render: (row) => <span className="badge capitalize">{row.estado}</span>, value: (row) => row.estado },
      {
        key: 'observaciones',
        header: 'Observaciones',
        render: (row) => row.observaciones ?? '—',
        value: (row) => row.observaciones ?? '',
      },
      { key: 'terminal', header: 'Terminal', render: (row) => displayTerminal(row.terminal), value: (row) => displayTerminal(row.terminal) },
    ],
    [],
  );

  const exportColumns = columns.map((col) => ({ key: col.key, header: col.header, value: (row: AseoRegistroViewModel) => (col.value ? col.value(row) : (row as unknown as Record<string, unknown>)[col.key]) }));

  const handleExportView = () => {
    if (!query.data) return;
    exportToXlsx({ filename: `aseo_${area}_vista`, sheetName: `Aseo ${area}`, rows: query.data, columns: exportColumns });
  };

  const handleExportAll = async () => {
    const rows = await adapter.list({ terminalContext, scope: 'all' });
    exportToXlsx({ filename: `aseo_${area}_completo`, sheetName: `Aseo ${area}`, rows, columns: exportColumns });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Aseo - ${title}`}
        description="Control de aseo por área"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-primary">Nuevo registro</button>
            <ExportMenu onExportView={handleExportView} onExportAll={handleExportAll} />
          </div>
        }
      />

      <FiltersBar terminalContext={terminalContext} onTerminalChange={setTerminalContext}>
        <div className="flex flex-col gap-1">
          <label className="label">Estado</label>
          <select
            className="input"
            value={filters.estado}
            onChange={(e) => setFilters({ estado: e.target.value as AseoFilters['estado'] })}
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="completado">Completado</option>
          </select>
        </div>
      </FiltersBar>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && (
        <>
          {!query.data?.length && <EmptyState description="Sin registros" />}
          {query.data && query.data.length > 0 && <DataTable columns={columns} rows={query.data} />}
        </>
      )}
    </div>
  );
};
