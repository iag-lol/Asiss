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
import { credencialesAdapter } from './service';
import { CredencialFilters, CredencialViewModel } from './types';
import { exportToXlsx } from '../../shared/utils/exportToXlsx';
import { formatDate } from '../../shared/utils/dates';
import { displayTerminal } from '../../shared/utils/terminal';

export const CredencialesPage = () => {
  const terminalContext = useTerminalStore((state) => state.context);
  const setTerminalContext = useTerminalStore((state) => state.setContext);
  const [filters, setFilters] = useState<CredencialFilters>({ estado: 'todas' });

  const query = useQuery({
    queryKey: ['credenciales', terminalContext, filters],
    queryFn: () => credencialesAdapter.list({ terminalContext, filters, scope: 'view' }),
  });

  const columns: TableColumn<CredencialViewModel>[] = useMemo(
    () => [
      { key: 'sistema', header: 'Sistema' },
      { key: 'responsable', header: 'Responsable' },
      { key: 'estado', header: 'Estado', render: (row) => <span className="badge capitalize">{row.estado}</span>, value: (row) => row.estado },
      { key: 'venceEl', header: 'Vence', render: (row) => formatDate(row.venceEl), value: (row) => formatDate(row.venceEl) },
      { key: 'terminal', header: 'Terminal', render: (row) => displayTerminal(row.terminal), value: (row) => displayTerminal(row.terminal) },
    ],
    [],
  );

  const exportColumns = columns.map((col) => ({ key: col.key, header: col.header, value: (row: CredencialViewModel) => (col.value ? col.value(row) : (row as unknown as Record<string, unknown>)[col.key]) }));

  const handleExportView = () => {
    if (!query.data) return;
    exportToXlsx({ filename: 'credenciales_vista', sheetName: 'Credenciales', rows: query.data, columns: exportColumns });
  };

  const handleExportAll = async () => {
    const rows = await credencialesAdapter.list({ terminalContext, scope: 'all' });
    exportToXlsx({ filename: 'credenciales_completo', sheetName: 'Credenciales', rows, columns: exportColumns });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Credenciales de Respaldo"
        description="Control de accesos críticos"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-primary">Nueva credencial</button>
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
            onChange={(e) => setFilters({ estado: e.target.value as CredencialFilters['estado'] })}
          >
            <option value="todas">Todas</option>
            <option value="vigente">Vigente</option>
            <option value="por_vencer">Por vencer</option>
            <option value="revocada">Revocada</option>
          </select>
        </div>
      </FiltersBar>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && (
        <>
          {!query.data?.length && <EmptyState description="Sin credenciales" />}
          {query.data && query.data.length > 0 && <DataTable columns={columns} rows={query.data} />}
        </>
      )}
    </div>
  );
};
