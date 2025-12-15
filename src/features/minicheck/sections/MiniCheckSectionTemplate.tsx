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
import { getMiniCheckAdapter } from '../service';
import { MiniCheckFilters, MiniCheckTipo, MiniCheckViewModel } from '../types';
import { formatDate } from '../../../shared/utils/dates';

interface Props {
  tipo: MiniCheckTipo;
  title: string;
}

export const MiniCheckSectionTemplate = ({ tipo, title }: Props) => {
  const terminalContext = useTerminalStore((state) => state.context);
  const setTerminalContext = useTerminalStore((state) => state.setContext);
  const [filters, setFilters] = useState<MiniCheckFilters>({ estado: 'todas' });
  const adapter = useMemo(() => getMiniCheckAdapter(tipo), [tipo]);

  const query = useQuery({
    queryKey: ['minicheck', tipo, terminalContext, filters],
    queryFn: () => adapter.list({ terminalContext, filters, scope: 'view' }),
  });

  const columns: TableColumn<MiniCheckViewModel>[] = useMemo(
    () => [
      { key: 'ppu', header: 'PPU' },
      { key: 'responsable', header: 'Responsable' },
      { key: 'estado', header: 'Estado', render: (row) => <span className="badge capitalize">{row.estado}</span>, value: (row) => row.estado },
      { key: 'fecha', header: 'Fecha', render: (row) => formatDate(row.fecha), value: (row) => formatDate(row.fecha) },
      { key: 'observaciones', header: 'Notas', render: (row) => row.observaciones ?? '—', value: (row) => row.observaciones ?? '' },
      { key: 'terminal', header: 'Terminal', render: (row) => displayTerminal(row.terminal), value: (row) => displayTerminal(row.terminal) },
    ],
    [],
  );

  const exportColumns = columns.map((col) => ({ key: col.key, header: col.header, value: (row: MiniCheckViewModel) => (col.value ? col.value(row) : (row as unknown as Record<string, unknown>)[col.key]) }));

  const handleExportView = () => {
    if (!query.data) return;
    exportToXlsx({ filename: `minicheck_${tipo}_vista`, sheetName: title, rows: query.data, columns: exportColumns });
  };

  const handleExportAll = async () => {
    const rows = await adapter.list({ terminalContext, scope: 'all' });
    exportToXlsx({ filename: `minicheck_${tipo}_completo`, sheetName: title, rows, columns: exportColumns });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={`MiniCheck - ${title}`}
        description="Validación rápida de equipos"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-primary">Nuevo control</button>
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
            onChange={(e) => setFilters({ estado: e.target.value as MiniCheckFilters['estado'] })}
          >
            <option value="todas">Todos</option>
            <option value="ok">OK</option>
            <option value="alerta">Alerta</option>
          </select>
        </div>
      </FiltersBar>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && (
        <>
          {!query.data?.length && <EmptyState description="Sin controles" />}
          {query.data && query.data.length > 0 && <DataTable columns={columns} rows={query.data} />}
        </>
      )}
    </div>
  );
};
