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
import { reunionesAdapter } from './service';
import { ReunionFilters, ReunionViewModel } from './types';
import { exportToXlsx } from '../../shared/utils/exportToXlsx';
import { formatDate } from '../../shared/utils/dates';
import { displayTerminal } from '../../shared/utils/terminal';

export const ReunionesPage = () => {
  const terminalContext = useTerminalStore((state) => state.context);
  const setTerminalContext = useTerminalStore((state) => state.setContext);
  const [filters, setFilters] = useState<ReunionFilters>({ estado: 'todas' });

  const query = useQuery({
    queryKey: ['reuniones', terminalContext, filters],
    queryFn: () => reunionesAdapter.list({ terminalContext, filters, scope: 'view' }),
  });

  const columns: TableColumn<ReunionViewModel>[] = useMemo(
    () => [
      { key: 'tema', header: 'Tema' },
      {
        key: 'fecha',
        header: 'Fecha',
        render: (row) => formatDate(row.fecha),
        value: (row) => formatDate(row.fecha),
      },
      { key: 'responsable', header: 'Responsable' },
      { key: 'participantes', header: 'Asistentes' },
      {
        key: 'estado',
        header: 'Estado',
        render: (row) => <span className="badge capitalize">{row.estado}</span>,
        value: (row) => row.estado,
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

  const exportColumns = columns.map((col) => ({ key: col.key, header: col.header, value: (row: ReunionViewModel) => (col.value ? col.value(row) : (row as unknown as Record<string, unknown>)[col.key]) }));

  const handleExportView = () => {
    if (!query.data) return;
    exportToXlsx({ filename: 'reuniones_vista', sheetName: 'Reuniones', rows: query.data, columns: exportColumns });
  };

  const handleExportAll = async () => {
    const rows = await reunionesAdapter.list({ terminalContext, scope: 'all' });
    exportToXlsx({ filename: 'reuniones_completo', sheetName: 'Reuniones', rows, columns: exportColumns });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reuniones"
        description="Agenda y seguimiento de reuniones."
        actions={
          <div className="flex gap-2">
            <button className="btn btn-primary">Nueva reunión</button>
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
            onChange={(e) => setFilters({ estado: e.target.value as ReunionFilters['estado'] })}
          >
            <option value="todas">Todas</option>
            <option value="agendada">Agendada</option>
            <option value="en_curso">En curso</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </div>
      </FiltersBar>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && (
        <>
          {!query.data?.length && <EmptyState description="No hay reuniones con estos filtros." />}
          {query.data && query.data.length > 0 && <DataTable columns={columns} rows={query.data} />}
        </>
      )}
    </div>
  );
};
