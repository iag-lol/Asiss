import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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
import { showErrorToast, showSuccessToast } from '../../../shared/state/toastStore';
import { exportToXlsx } from '../../../shared/utils/exportToXlsx';
import { fetchFleet, fetchRevisiones, fetchTickets } from '../api/minicheckApi';
import { isMiniCheckConfigured } from '../api/minicheckClient';
import { MiniCheckFilters as Filters } from '../components/MiniCheckFilters';
import { KpiItem, MiniCheckKpis } from '../components/MiniCheckKpis';
import { StatusPill, StatusTone } from '../components/MiniCheckStatus';
import { useMiniCheckFilters } from '../context/MiniCheckFilterContext';
import {
  MiniCheckFilters,
  MiniCheckTicket,
  Revision,
  TicketPriority,
  TicketStatus,
} from '../types';
import { formatIsoWeekLabel, getIsoWeekRange } from '../utils/week';

const TERMINALS = ['El Roble', 'Los Agricultores', 'Maipú', 'Renca'];

const TICKET_TONES: Record<TicketPriority, StatusTone> = {
  ALTA: 'danger',
  MEDIA: 'warning',
  BAJA: 'info',
};

const TICKET_STATUS_TONES: Record<TicketStatus, StatusTone> = {
  PENDIENTE: 'danger',
  EN_PROCESO: 'warning',
  RESUELTO: 'success',
};

const formatTimestamp = (value: string): string =>
  new Date(value).toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

const localDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const latestRevisionByBus = (rows: Revision[]): Revision[] => {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.bus_ppu)) return false;
    seen.add(row.bus_ppu);
    return true;
  });
};

const revisionColumns: TableColumn<Revision>[] = [
  {
    key: 'created_at',
    header: 'Fecha y hora',
    value: (row) => formatTimestamp(row.created_at),
  },
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
  { key: 'bus_interno', header: 'N° interno', value: (row) => row.bus_interno },
  {
    key: 'estado_bus',
    header: 'Estado bus',
    render: (row) => (
      <StatusPill tone={row.estado_bus === 'OPERATIVO' ? 'success' : 'danger'}>
        {row.estado_bus.replaceAll('_', ' ')}
      </StatusPill>
    ),
    value: (row) => row.estado_bus,
  },
  {
    key: 'terminal_reportado',
    header: 'Terminal',
    value: (row) => row.terminal_reportado,
  },
  {
    key: 'geocerca',
    header: 'Ubicación',
    render: (row) =>
      row.terminal_detectado === 'SIN_TERMINAL' ? (
        <StatusPill tone="warning">Fuera de geocerca</StatusPill>
      ) : row.terminal_detectado !== row.terminal_reportado ? (
        <StatusPill tone="warning">
          GPS: {row.terminal_detectado}
        </StatusPill>
      ) : (
        <StatusPill tone="success">Validada</StatusPill>
      ),
    value: (row) => row.terminal_detectado,
  },
  {
    key: 'inspector_nombre',
    header: 'Inspector',
    value: (row) => row.inspector_nombre,
  },
  {
    key: 'observaciones',
    header: 'Observaciones',
    render: (row) => (
      <span className="block max-w-xs whitespace-normal text-slate-600">
        {row.observaciones || '—'}
      </span>
    ),
    value: (row) => row.observaciones || '',
  },
];

const ticketColumns: TableColumn<MiniCheckTicket>[] = [
  {
    key: 'prioridad',
    header: 'Prioridad',
    render: (row) => <StatusPill tone={TICKET_TONES[row.prioridad]}>{row.prioridad}</StatusPill>,
    value: (row) => row.prioridad,
  },
  { key: 'modulo', header: 'Módulo', value: (row) => row.modulo },
  {
    key: 'estado',
    header: 'Estado',
    render: (row) => (
      <StatusPill tone={TICKET_STATUS_TONES[row.estado]}>
        {row.estado.replaceAll('_', ' ')}
      </StatusPill>
    ),
    value: (row) => row.estado,
  },
  {
    key: 'descripcion',
    header: 'Hallazgo',
    render: (row) => (
      <span className="block max-w-md whitespace-normal text-slate-700">{row.descripcion}</span>
    ),
    value: (row) => row.descripcion,
  },
  { key: 'terminal', header: 'Terminal', value: (row) => row.terminal },
  {
    key: 'created_at',
    header: 'Creado',
    value: (row) => formatTimestamp(row.created_at),
  },
];

export const MiniCheckDashboardPage = () => {
  const configured = isMiniCheckConfigured();
  const queryClient = useQueryClient();
  const { week } = useMiniCheckFilters();
  const [terminal, setTerminal] = useState('');
  const [search, setSearch] = useState('');
  const [exportingAll, setExportingAll] = useState(false);

  const filters = useMemo<MiniCheckFilters>(
    () => ({
      week: week || undefined,
      terminal: terminal || undefined,
      search: search.trim() || undefined,
    }),
    [search, terminal, week],
  );

  const revisionsQuery = useQuery({
    queryKey: ['minicheck', 'revisiones', filters],
    queryFn: () => fetchRevisiones(filters),
    enabled: configured,
  });

  const fleetQuery = useQuery({
    queryKey: ['minicheck', 'flota', terminal],
    queryFn: () => fetchFleet(terminal || undefined),
    enabled: configured,
  });

  const ticketsQuery = useQuery({
    queryKey: ['minicheck', 'tickets', filters],
    queryFn: () => fetchTickets(filters),
    enabled: configured,
  });

  const revisions = revisionsQuery.data ?? [];
  const fleet = fleetQuery.data ?? [];
  const allTickets = ticketsQuery.data ?? [];
  const latestByBus = useMemo(() => latestRevisionByBus(revisions), [revisions]);
  const inspectedPpus = useMemo(
    () => new Set(latestByBus.map((row) => row.bus_ppu)),
    [latestByBus],
  );
  const fleetPpus = useMemo(() => new Set(fleet.map((bus) => bus.ppu)), [fleet]);
  const coveredPpus = useMemo(
    () => new Set(Array.from(inspectedPpus).filter((ppu) => fleetPpus.has(ppu))),
    [fleetPpus, inspectedPpus],
  );

  const tickets = useMemo(() => {
    if (!search) return allTickets;
    const revisionIds = new Set(revisions.map((revision) => revision.id));
    return allTickets.filter((ticket) => revisionIds.has(ticket.revision_id));
  }, [allTickets, revisions, search]);

  const openTickets = useMemo(
    () => tickets.filter((ticket) => ticket.estado !== 'RESUELTO'),
    [tickets],
  );

  const coverage =
    fleet.length > 0 && !search
      ? Math.round((coveredPpus.size / fleet.length) * 100)
      : null;

  const kpis: KpiItem[] = [
    { label: 'Revisiones enviadas', value: revisions.length, icon: 'clipboard' },
    {
      label: 'Buses únicos revisados',
      value: inspectedPpus.size,
      icon: 'truck',
      colorClass: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Cobertura de flota',
      value: fleetQuery.isError ? '—' : coverage === null ? '—' : `${coverage}%`,
      subtext: search
        ? 'Quita la búsqueda PPU para calcular'
        : `${coveredPpus.size} de ${fleet.length} buses del catálogo`,
      icon: 'gauge',
      colorClass: 'bg-brand-50 text-brand-600',
    },
    {
      label: 'Buses en panne',
      value: latestByBus.filter((row) => row.estado_bus === 'EN_PANNE').length,
      icon: 'wrench',
      colorClass: 'bg-red-50 text-red-600',
    },
    {
      label: 'Tickets abiertos',
      value: ticketsQuery.isError ? '—' : openTickets.length,
      icon: 'alert-triangle',
      colorClass: 'bg-amber-50 text-amber-600',
    },
  ];

  const dailyData = useMemo(() => {
    const counts = new Map<string, number>();
    revisions.forEach((revision) => {
      const key = localDateKey(new Date(revision.created_at));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const weekRange = week ? getIsoWeekRange(week) : null;
    if (weekRange) {
      return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(weekRange.start);
        day.setDate(day.getDate() + index);
        const key = localDateKey(day);
        return {
          dia: day.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' }),
          revisiones: counts.get(key) ?? 0,
        };
      });
    }

    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({
        dia: new Date(`${date}T00:00:00`).toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'short',
        }),
        revisiones: count,
      }));
  }, [revisions, week]);

  const operationalData = [
    {
      name: 'Operativos',
      value: latestByBus.filter((row) => row.estado_bus === 'OPERATIVO').length,
      color: '#10b981',
    },
    {
      name: 'En panne',
      value: latestByBus.filter((row) => row.estado_bus === 'EN_PANNE').length,
      color: '#ef4444',
    },
  ].filter((item) => item.value > 0);

  const terminalCoverageData = useMemo(
    () =>
      TERMINALS.map((terminalName) => {
        const terminalFleetPpus = new Set(
          fleet
            .filter((bus) => bus.terminal === terminalName)
            .map((bus) => bus.ppu),
        );
        const reviewedFleetPpus = new Set(
          latestByBus
            .filter(
              (row) =>
                row.terminal_reportado === terminalName &&
                terminalFleetPpus.has(row.bus_ppu),
            )
            .map((row) => row.bus_ppu),
        );
        return {
          terminal: terminalName,
          revisados: reviewedFleetPpus.size,
          flota: terminalFleetPpus.size,
        };
      }).filter((item) => item.revisados > 0 || item.flota > 0),
    [fleet, latestByBus],
  );

  const exportRows = (rows: Revision[], suffix: string) => {
    exportToXlsx({
      filename: `mini-check_informe_${week || 'historial'}_${suffix}_${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Revisiones',
      rows,
      columns: revisionColumns.map((column) => ({
        key: column.key,
        header: column.header,
        value: column.value,
      })),
    });
  };

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      const allRows = await fetchRevisiones({});
      exportRows(allRows, 'completo');
      showSuccessToast('Informe completo exportado', `${allRows.length} revisiones incluidas.`);
    } catch {
      showErrorToast('No se pudo exportar', 'Revisa la conexión con la base Mini-Check.');
    } finally {
      setExportingAll(false);
    }
  };

  const isFetching =
    revisionsQuery.isFetching || fleetQuery.isFetching || ticketsQuery.isFetching;

  const refreshAll = () =>
    queryClient.invalidateQueries({ queryKey: ['minicheck'] });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Informes Mini-Check"
        description={`${formatIsoWeekLabel(week)} · Consolidado operativo de revisiones y hallazgos`}
        actions={
          configured ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isFetching}
                onClick={() => void refreshAll()}
              >
                <Icon
                  name={isFetching ? 'loader' : 'activity'}
                  size={16}
                  className={isFetching ? 'animate-spin' : ''}
                />
                Actualizar
              </button>
              <div className={exportingAll ? 'pointer-events-none opacity-60' : ''}>
                <ExportMenu
                  onExportView={() => {
                    exportRows(revisions, 'filtrado');
                    showSuccessToast(
                      'Informe semanal exportado',
                      `${revisions.length} revisiones incluidas.`,
                    );
                  }}
                  onExportAll={() => void handleExportAll()}
                />
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
      />

      {!configured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-bold">Informes pendientes de conexión</p>
          <p className="mt-1">
            Configura las credenciales independientes de Supabase Mini-Check para cargar
            revisiones, flota y tickets.
          </p>
        </div>
      )}

      {configured && revisionsQuery.isLoading && (
        <LoadingState label="Construyendo informe semanal..." />
      )}

      {configured && revisionsQuery.isError && (
        <ErrorState
          message="No se pudieron cargar las revisiones para el informe."
          onRetry={() => void revisionsQuery.refetch()}
        />
      )}

      {configured && !revisionsQuery.isLoading && !revisionsQuery.isError && (
        <>
          <MiniCheckKpis items={kpis} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <article className="card p-5 xl:col-span-2">
              <div className="mb-5">
                <h3 className="font-bold text-slate-900">Ritmo de revisiones</h3>
                <p className="mt-1 text-xs text-slate-500">Envíos recibidos por día</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar
                      dataKey="revisiones"
                      name="Revisiones"
                      fill="#4f46e5"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="card p-5">
              <div className="mb-5">
                <h3 className="font-bold text-slate-900">Estado de los buses</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Última revisión de cada PPU
                </p>
              </div>
              <div className="h-72">
                {operationalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={operationalData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={90}
                        paddingAngle={4}
                      >
                        {operationalData.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Sin revisiones
                  </div>
                )}
              </div>
            </article>

            <article className="card p-5 xl:col-span-3">
              <div className="mb-5">
                <h3 className="font-bold text-slate-900">Cobertura por terminal</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Buses únicos revisados frente al catálogo de flota
                </p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={terminalCoverageData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="terminal" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Legend />
                    <Bar dataKey="flota" name="Flota total" fill="#cbd5e1" radius={[5, 5, 0, 0]} />
                    <Bar
                      dataKey="revisados"
                      name="Revisados"
                      fill="#06b6d4"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>

          <article className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                  <h3 className="text-lg font-bold text-slate-900">Revisiones recientes</h3>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Se actualizan automáticamente cuando llega una nueva revisión.
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-500">
                {revisions.length} registros en el filtro actual
              </span>
            </div>

            {revisions.length > 0 ? (
              <DataTable columns={revisionColumns} rows={revisions.slice(0, 20)} />
            ) : (
              <EmptyState
                label="Sin revisiones esta semana"
                description="Cambia el número de semana o selecciona todo el historial."
              />
            )}
          </article>

          <article className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Hallazgos accionables</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Tickets pendientes y en proceso generados por las revisiones.
                </p>
              </div>
              <div className="flex gap-2">
                <StatusPill tone="danger">
                  {openTickets.filter((ticket) => ticket.prioridad === 'ALTA').length} alta
                </StatusPill>
                <StatusPill tone="warning">{openTickets.length} abiertos</StatusPill>
              </div>
            </div>

            {ticketsQuery.isError ? (
              <ErrorState
                message="No se pudieron cargar los tickets Mini-Check."
                onRetry={() => void ticketsQuery.refetch()}
              />
            ) : openTickets.length > 0 ? (
              <DataTable columns={ticketColumns} rows={openTickets.slice(0, 15)} />
            ) : (
              <EmptyState
                label="Sin tickets abiertos"
                description="No hay hallazgos pendientes en la semana seleccionada."
              />
            )}
          </article>
        </>
      )}
    </section>
  );
};
