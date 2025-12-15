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
import { solicitudesAdapter } from './service';
import { SolicitudFilters, SolicitudViewModel } from './types';
import { exportToXlsx } from '../../shared/utils/exportToXlsx';
import { displayTerminal } from '../../shared/utils/terminal';

export const SolicitudesPage = () => {
  const terminalContext = useTerminalStore((state) => state.context);
  const setTerminalContext = useTerminalStore((state) => state.setContext);
  const [filters, setFilters] = useState<SolicitudFilters>({ estado: 'todas' });
  const [tipo, setTipo] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [localSubmissions, setLocalSubmissions] = useState<SolicitudViewModel[]>([]);

  const query = useQuery({
    queryKey: ['solicitudes', terminalContext, filters],
    queryFn: () => solicitudesAdapter.list({ terminalContext, filters, scope: 'view' }),
  });

  const data = useMemo(
    () => [...(query.data ?? []), ...localSubmissions],
    [query.data, localSubmissions],
  );

  const columns: TableColumn<SolicitudViewModel>[] = useMemo(
    () => [
      { key: 'tipo', header: 'Tipo' },
      { key: 'solicitante', header: 'Solicitante' },
      { key: 'estado', header: 'Estado', render: (row) => <span className="badge capitalize">{row.estado}</span>, value: (row) => row.estado },
      { key: 'fecha', header: 'Fecha' },
      { key: 'terminal', header: 'Terminal', render: (row) => displayTerminal(row.terminal), value: (row) => displayTerminal(row.terminal) },
    ],
    [],
  );

  const exportColumns = columns.map((col) => ({ key: col.key, header: col.header, value: (row: SolicitudViewModel) => (col.value ? col.value(row) : (row as unknown as Record<string, unknown>)[col.key]) }));

  const handleExportView = () => {
    exportToXlsx({ filename: 'solicitudes_vista', sheetName: 'Solicitudes', rows: data, columns: exportColumns });
  };

  const handleExportAll = async () => {
    const rows = await solicitudesAdapter.list({ terminalContext, scope: 'all' });
    exportToXlsx({ filename: 'solicitudes_completo', sheetName: 'Solicitudes', rows, columns: exportColumns });
  };

  const handleSubmit = () => {
    const newEntry: SolicitudViewModel = {
      id: `local-${Date.now()}`,
      solicitante,
      tipo,
      estado: 'abierta',
      fecha: new Date().toISOString().slice(0, 10),
      terminal: (terminalContext.value as any) ?? 'EL_ROBLE',
    };
    setLocalSubmissions((prev) => [newEntry, ...prev]);
    setSolicitante('');
    setTipo('');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Solicitudes"
        description="Formulario universal para requerimientos"
        actions={
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => document.getElementById('solicitud-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Nueva solicitud
            </button>
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
            onChange={(e) => setFilters({ estado: e.target.value as SolicitudFilters['estado'] })}
          >
            <option value="todas">Todas</option>
            <option value="abierta">Abierta</option>
            <option value="en_proceso">En proceso</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </div>
      </FiltersBar>

      <div className="card p-4" id="solicitud-form">
        <p className="mb-3 text-sm font-semibold text-slate-900">Crear nueva solicitud</p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="label">Solicitante</label>
            <input className="input" value={solicitante} onChange={(e) => setSolicitante(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="label">Tipo</label>
            <input className="input" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Ej: Materiales" />
          </div>
          <div className="flex items-end justify-end">
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!solicitante || !tipo}>
              Registrar (mock)
            </button>
          </div>
        </div>
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && (
        <>
          {!data.length && <EmptyState description="Sin solicitudes" />}
          {data.length > 0 && <DataTable columns={columns} rows={data} />}
        </>
      )}
    </div>
  );
};
