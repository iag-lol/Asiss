import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { FiltersBar } from '../../shared/components/common/FiltersBar';
import { DataTable, TableColumn } from '../../shared/components/common/DataTable';
import { EmptyState } from '../../shared/components/common/EmptyState';
import { LoadingState } from '../../shared/components/common/LoadingState';
import { ErrorState } from '../../shared/components/common/ErrorState';
import { ExportMenu } from '../../shared/components/common/ExportMenu';
import { useTerminalStore } from '../../shared/state/terminalStore';
import { tareasAdapter } from './service';
import { TareaFilters, TareaViewModel } from './types';
import { exportToXlsx } from '../../shared/utils/exportToXlsx';
import { formatDate } from '../../shared/utils/dates';
import { displayTerminal } from '../../shared/utils/terminal';

export const TareasPage = () => {
  const terminalContext = useTerminalStore((state) => state.context);
  const setTerminalContext = useTerminalStore((state) => state.setContext);
  const [filters, setFilters] = useState<TareaFilters>({ estado: 'todas', prioridad: 'todas' });

  const query = useQuery({
    queryKey: ['tareas', terminalContext, filters],
    queryFn: () => tareasAdapter.list({ terminalContext, filters, scope: 'view' }),
  });

  const columns: TableColumn<TareaViewModel>[] = useMemo(
    () => [
      { key: 'titulo', header: 'Tarea' },
      { key: 'responsable', header: 'Responsable' },
      {
        key: 'prioridad',
        header: 'Prioridad',
        render: (row) => <span className="badge capitalize">{row.prioridad}</span>,
        value: (row) => row.prioridad,
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (row) => <span className="badge capitalize">{row.estado}</span>,
        value: (row) => row.estado,
      },
      {
        key: 'vencimiento',
        header: 'Vencimiento',
        render: (row) => formatDate(row.vencimiento),
        value: (row) => formatDate(row.vencimiento),
      },
      {
        key: 'terminal',
        header: 'Terminal',
        render: (row) => displayTerminal(row.terminal),
        value: (row) => displayTerminal(row.terminal),
      },
    ],
    [],
  );

  const exportColumns = columns.map((col) => ({ key: col.key, header: col.header, value: (row: TareaViewModel) => (col.value ? col.value(row) : (row as unknown as Record<string, unknown>)[col.key]) }));

  const handleExportView = () => {
    if (!query.data) return;
    exportToXlsx({ filename: 'tareas_vista', sheetName: 'Tareas', rows: query.data, columns: exportColumns });
  };

  const handleExportAll = async () => {
    const rows = await tareasAdapter.list({ terminalContext, scope: 'all' });
    exportToXlsx({ filename: 'tareas_completo', sheetName: 'Tareas', rows, columns: exportColumns });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tareas"
        description="Seguimiento de pendientes y compromisos."
        actions={
          <div className="flex gap-2">
            <button className="btn btn-primary">Nueva tarea</button>
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
            onChange={(e) => setFilters((prev) => ({ ...prev, estado: e.target.value as TareaFilters['estado'] }))}
          >
            <option value="todas">Todas</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="completada">Completada</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="label">Prioridad</label>
          <select
            className="input"
            value={filters.prioridad}
            onChange={(e) => setFilters((prev) => ({ ...prev, prioridad: e.target.value as TareaFilters['prioridad'] }))}
          >
            <option value="todas">Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </FiltersBar>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && (
        <>
          {!query.data?.length && <EmptyState description="No hay tareas para mostrar." />}
          {query.data && query.data.length > 0 && <DataTable columns={columns} rows={query.data} />}
        </>
      )}
    </div>
  );
};
