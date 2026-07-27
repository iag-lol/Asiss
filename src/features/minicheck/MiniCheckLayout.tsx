import { NavLink, Outlet } from 'react-router-dom';
import { Icon, IconName } from '../../shared/components/common/Icon';
import { isMiniCheckConfigured } from './api/minicheckClient';
import {
  MiniCheckFilterProvider,
  useMiniCheckFilters,
} from './context/MiniCheckFilterContext';
import { RealtimeStatus, useMiniCheckRealtime } from './hooks/useMiniCheckRealtime';
import {
  formatIsoWeekLabel,
  getIsoWeekValue,
  shiftIsoWeek,
} from './utils/week';

interface MiniCheckTab {
  label: string;
  to: string;
  icon: IconName;
  end?: boolean;
}

export const MINICHECK_TABS: MiniCheckTab[] = [
  { label: 'Informes', to: '/mini-check', icon: 'bar-chart', end: true },
  { label: 'Cámaras', to: '/mini-check/camaras', icon: 'eye' },
  { label: 'TAG', to: '/mini-check/tag', icon: 'tag' },
  { label: 'Extintores', to: '/mini-check/extintores', icon: 'alert-circle' },
  { label: 'Mobileye', to: '/mini-check/mobileye', icon: 'activity' },
  { label: 'Odómetro', to: '/mini-check/odometro', icon: 'gauge' },
  { label: 'Rack', to: '/mini-check/rack', icon: 'layers' },
  { label: 'Wi-Fi', to: '/mini-check/wifi', icon: 'sparkles' },
  { label: 'Publicidad', to: '/mini-check/publicidad', icon: 'image' },
];

const REALTIME_COPY: Record<RealtimeStatus, { label: string; className: string }> = {
  disabled: {
    label: 'Tiempo real deshabilitado',
    className: 'border-slate-300/20 bg-slate-300/10 text-slate-300',
  },
  connecting: {
    label: 'Conectando tiempo real',
    className: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
  },
  live: {
    label: 'Revisiones en vivo',
    className: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  },
  error: {
    label: 'Tiempo real sin conexión',
    className: 'border-red-300/25 bg-red-300/10 text-red-100',
  },
};

const MiniCheckLayoutContent = () => {
  const configured = isMiniCheckConfigured();
  const { week, setWeek } = useMiniCheckFilters();
  const { status, lastEvent } = useMiniCheckRealtime();
  const realtimeCopy = REALTIME_COPY[status];
  const baseWeek = week || getIsoWeekValue();

  return (
    <div className="mx-auto max-w-[1800px] space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-7 text-white shadow-xl md:px-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-400/15 blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
              <Icon name="check-circle" size={15} />
              Inspección de flota
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">Mini-Check</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
              Informes y seguimiento individual de cámaras, TAG, extintores, Mobileye,
              odómetro, rack, Wi-Fi y publicidad.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:items-stretch">
            <div
              className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                configured
                  ? 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100'
                  : 'border-amber-300/25 bg-amber-300/10 text-amber-100'
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  configured ? 'bg-cyan-300' : 'bg-amber-300'
                }`}
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Fuente de datos</p>
                <p className="text-sm font-semibold">
                  {configured ? 'Supabase Mini-Check' : 'Credenciales pendientes'}
                </p>
              </div>
            </div>

            <div className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 ${realtimeCopy.className}`}>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  status === 'live'
                    ? 'animate-pulse bg-emerald-400'
                    : status === 'error'
                      ? 'bg-red-300'
                      : 'bg-current opacity-70'
                }`}
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Sincronización</p>
                <p className="text-sm font-semibold">{realtimeCopy.label}</p>
                {lastEvent && (
                  <p className="mt-0.5 text-[11px] opacity-80">
                    {lastEvent.table} · {lastEvent.at.toLocaleTimeString('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon name="calendar-range" size={21} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Filtro semanal global
            </p>
            <p className="font-bold text-slate-900">{formatIsoWeekLabel(week)}</p>
            <p className="text-xs text-slate-500">
              Se aplica a informes y a todas las tablas del Mini-Check.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            title="Semana anterior"
            onClick={() => setWeek(shiftIsoWeek(baseWeek, -1))}
          >
            <Icon name="chevron-left" size={17} />
          </button>

          <input
            type="week"
            aria-label="Semana Mini-Check"
            className="input w-auto min-w-[170px] py-2.5 font-semibold"
            value={week}
            onChange={(event) => setWeek(event.target.value)}
          />

          <button
            type="button"
            className="btn btn-secondary btn-icon"
            title="Semana siguiente"
            onClick={() => setWeek(shiftIsoWeek(baseWeek, 1))}
          >
            <Icon name="chevron-right" size={17} />
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setWeek(getIsoWeekValue())}
          >
            Semana actual
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setWeek('')}
          >
            Todo el historial
          </button>
        </div>
      </section>

      <nav
        aria-label="Módulos Mini-Check"
        className="scrollbar-hide flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
      >
        {MINICHECK_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-brand'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon name={tab.icon} size={17} />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
};

export const MiniCheckLayout = () => (
  <MiniCheckFilterProvider>
    <MiniCheckLayoutContent />
  </MiniCheckFilterProvider>
);
