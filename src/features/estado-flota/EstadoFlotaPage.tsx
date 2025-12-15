import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { FiltersBar } from '../../shared/components/common/FiltersBar';
import { DataTable, TableColumn } from '../../shared/components/common/DataTable';
import { EmptyState } from '../../shared/components/common/EmptyState';
import { LoadingState } from '../../shared/components/common/LoadingState';
import { ErrorState } from '../../shared/components/common/ErrorState';
import { ExportMenu } from '../../shared/components/common/ExportMenu';
import { useTerminalStore } from '../../shared/state/terminalStore';
import { flotaAdapter } from './service';
import { FlotaFilters, VehiculoViewModel } from './types';
import { exportToXlsx } from '../../shared/utils/exportToXlsx';
import { displayTerminal } from '../../shared/utils/terminal';
import { formatDate } from '../../shared/utils/dates';

export const EstadoFlotaPage = () => {
  const terminalContext = useTerminalStore((state) => state.context);
  const setTerminalContext = useTerminalStore((state) => state.setContext);
  const [filters, setFilters] = useState<FlotaFilters>({ estado: 'todos' });
  const [selectedPpu, setSelectedPpu] = useState<string>('');

  const query = useQuery({
    queryKey: ['flota', terminalContext, filters],
    queryFn: () => flotaAdapter.list({ terminalContext, filters, scope: 'view' }),
  });

  const vehicles = query.data ?? [];

  const columns: TableColumn<VehiculoViewModel>[] = useMemo(
    () => [
      { key: 'ppu', header: 'PPU' },
      { key: 'modelo', header: 'Modelo' },
      { key: 'estado', header: 'Estado', render: (row) => <span className="badge capitalize">{row.estado}</span>, value: (row) => row.estado },
      { key: 'odometro', header: 'Odómetro' },
      { key: 'proximaMantencion', header: 'Mantención', render: (row) => formatDate(row.proximaMantencion), value: (row) => formatDate(row.proximaMantencion) },
      { key: 'terminal', header: 'Terminal', render: (row) => displayTerminal(row.terminal), value: (row) => displayTerminal(row.terminal) },
    ],
    [],
  );

  const exportColumns = columns.map((col) => ({ key: col.key, header: col.header, value: (row: VehiculoViewModel) => (col.value ? col.value(row) : (row as unknown as Record<string, unknown>)[col.key]) }));

  const handleExportView = () => {
    exportToXlsx({ filename: 'flota_vista', sheetName: 'Flota', rows: vehicles, columns: exportColumns });
  };

  const handleExportAll = async () => {
    const rows = await flotaAdapter.list({ terminalContext, scope: 'all' });
    exportToXlsx({ filename: 'flota_completo', sheetName: 'Flota', rows, columns: exportColumns });
  };

  const summaryData = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach((v) => {
      counts[v.estado] = (counts[v.estado] ?? 0) + 1;
    });
    return Object.entries(counts).map(([estado, count]) => ({ estado, count }));
  }, [vehicles]);

  const selectedVehicle = vehicles.find((v) => v.ppu === selectedPpu) ?? vehicles[0];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Estado de Flota"
        description="Vista por PPU con ficha y gráficas"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-primary">Agregar unidad</button>
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
            onChange={(e) => setFilters({ estado: e.target.value as FlotaFilters['estado'] })}
          >
            <option value="todos">Todos</option>
            <option value="operativo">Operativo</option>
            <option value="en_taller">En taller</option>
            <option value="fuera_servicio">Fuera de servicio</option>
          </select>
        </div>
      </FiltersBar>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && vehicles.length === 0 && <EmptyState description="Sin unidades" />}

      {!query.isLoading && !query.isError && vehicles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-3">
            <DataTable columns={columns} rows={vehicles} />
          </div>
          <div className="space-y-3">
            <div className="card p-4">
              <p className="text-sm font-semibold text-slate-900">Resumen por estado</p>
              <div className="mt-2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="estado" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3c5eff" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {selectedVehicle && (
              <div className="card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Ficha rápida</p>
                  <select
                    className="input w-32"
                    value={selectedVehicle.ppu}
                    onChange={(e) => setSelectedPpu(e.target.value)}
                  >
                    {vehicles.map((v) => (
                      <option key={v.ppu} value={v.ppu}>
                        {v.ppu}
                      </option>
                    ))}
                  </select>
                </div>
                <dl className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold">Modelo</dt>
                    <dd>{selectedVehicle.modelo}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold">Estado</dt>
                    <dd className="badge capitalize">{selectedVehicle.estado}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold">Odómetro</dt>
                    <dd>{selectedVehicle.odometro.toLocaleString('es-CL')}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold">Próxima mantención</dt>
                    <dd>{formatDate(selectedVehicle.proximaMantencion)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold">Terminal</dt>
                    <dd>{displayTerminal(selectedVehicle.terminal)}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
