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
import { personalAdapter } from './service';
import { PersonalFilters, PersonalViewModel } from './types';
import { exportToXlsx } from '../../shared/utils/exportToXlsx';
import { displayTerminal } from '../../shared/utils/terminal';
import { formatDate } from '../../shared/utils/dates';

export const PersonalPage = () => {
  const terminalContext = useTerminalStore((state) => state.context);
  const setTerminalContext = useTerminalStore((state) => state.setContext);
  const [filters, setFilters] = useState<PersonalFilters>({ status: 'todos' });

  const query = useQuery({
    queryKey: ['personal', terminalContext, filters],
    queryFn: () => personalAdapter.list({ terminalContext, filters, scope: 'view' }),
  });

  const columns: TableColumn<PersonalViewModel>[] = useMemo(
    () => [
      { key: 'nombre', header: 'Nombre' },
      { key: 'rol', header: 'Rol' },
      { key: 'turno', header: 'Turno' },
      {
        key: 'status',
        header: 'Estado',
        render: (row) => <span className="badge capitalize">{row.status}</span>,
        value: (row) => row.status,
      },
      {
        key: 'terminal',
        header: 'Terminal',
        render: (row) => <span className="text-sm font-semibold text-slate-800">{displayTerminal(row.terminal)}</span>,
        value: (row) => displayTerminal(row.terminal),
      },
      {
        key: 'actualizadoEl',
        header: 'Actualizado',
        render: (row) => formatDate(row.actualizadoEl),
        value: (row) => formatDate(row.actualizadoEl),
      },
    ],
    [],
  );

  const exportColumns = useMemo(
    () =>
      columns.map((col) => ({
        key: col.key,
        header: col.header,
        value: (row: PersonalViewModel) => (col.value ? col.value(row) : (row as unknown as Record<string, string>)[col.key]),
      })),
    [columns],
  );

  const handleExportView = () => {
    if (!query.data) return;
    exportToXlsx({
      filename: 'personal_vista',
      sheetName: 'Personal',
      rows: query.data,
      columns: exportColumns,
    });
  };

  const handleExportAll = async () => {
    const rows = await personalAdapter.list({ terminalContext, scope: 'all' });
    exportToXlsx({ filename: 'personal_completo', sheetName: 'Personal', rows, columns: exportColumns });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Personal"
        description="Listado del equipo por terminal para control operativo."
        actions={
          <div className="flex gap-2">
            <button className="btn btn-primary">Nuevo</button>
            <ExportMenu onExportView={handleExportView} onExportAll={handleExportAll} />
          </div>
        }
      />

      <FiltersBar terminalContext={terminalContext} onTerminalChange={setTerminalContext}>
        <div className="flex flex-col gap-1">
          <label className="label">Estado</label>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as PersonalFilters['status'] }))}
          >
            <option value="todos">Todos</option>
            <option value="activo">Activo</option>
            <option value="licencia">Licencia</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="label">Buscar</label>
          <input
            className="input"
            placeholder="Nombre"
            value={filters.search ?? ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
        </div>
      </FiltersBar>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && (
        <>
          {!query.data?.length && <EmptyState description="No hay personal para los filtros actuales." />}
          {query.data && query.data.length > 0 && <DataTable columns={columns} rows={query.data} />}
        </>
      )}
    </div>
  );
};
