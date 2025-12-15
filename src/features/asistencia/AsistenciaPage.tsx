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
import { asistenciaAdapter } from './service';
import { AsistenciaFilters, AsistenciaViewModel } from './types';
import { exportToXlsx } from '../../shared/utils/exportToXlsx';
import { displayTerminal } from '../../shared/utils/terminal';

export const AsistenciaPage = () => {
  const terminalContext = useTerminalStore((state) => state.context);
  const setTerminalContext = useTerminalStore((state) => state.setContext);
  const [filters, setFilters] = useState<AsistenciaFilters>({ estado: 'todos' });

  const query = useQuery({
    queryKey: ['asistencia', terminalContext, filters],
    queryFn: () => asistenciaAdapter.list({ terminalContext, filters, scope: 'view' }),
  });

  const columns: TableColumn<AsistenciaViewModel>[] = useMemo(
    () => [
      { key: 'colaborador', header: 'Colaborador' },
      { key: 'fecha', header: 'Fecha' },
      { key: 'turno', header: 'Turno' },
      { key: 'estado', header: 'Estado', render: (row) => <span className="badge capitalize">{row.estado}</span>, value: (row) => row.estado },
      { key: 'terminal', header: 'Terminal', render: (row) => displayTerminal(row.terminal), value: (row) => displayTerminal(row.terminal) },
    ],
    [],
  );

  const exportColumns = columns.map((col) => ({ key: col.key, header: col.header, value: (row: AsistenciaViewModel) => (col.value ? col.value(row) : (row as unknown as Record<string, unknown>)[col.key]) }));

  const handleExportView = () => {
    if (!query.data) return;
    exportToXlsx({ filename: 'asistencia_vista', sheetName: 'Asistencia', rows: query.data, columns: exportColumns });
  };

  const handleExportAll = async () => {
    const rows = await asistenciaAdapter.list({ terminalContext, scope: 'all' });
    exportToXlsx({ filename: 'asistencia_completo', sheetName: 'Asistencia', rows, columns: exportColumns });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Asistencia"
        description="Control diario de asistencia."
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
            onChange={(e) => setFilters({ estado: e.target.value as AsistenciaFilters['estado'] })}
          >
            <option value="todos">Todos</option>
            <option value="presente">Presente</option>
            <option value="atraso">Atraso</option>
            <option value="ausente">Ausente</option>
          </select>
        </div>
      </FiltersBar>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && (
        <>
          {!query.data?.length && <EmptyState description="No hay registros" />}
          {query.data && query.data.length > 0 && <DataTable columns={columns} rows={query.data} />}
        </>
      )}
    </div>
  );
};
