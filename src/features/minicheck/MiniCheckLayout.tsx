import { NavLink, Outlet } from 'react-router-dom';
import { Icon, IconName } from '../../shared/components/common/Icon';
import { isMiniCheckConfigured } from './api/minicheckClient';

interface MiniCheckTab {
  label: string;
  to: string;
  icon: IconName;
}

export const MINICHECK_TABS: MiniCheckTab[] = [
  { label: 'Cámaras', to: '/mini-check/camaras', icon: 'eye' },
  { label: 'TAG', to: '/mini-check/tag', icon: 'tag' },
  { label: 'Extintores', to: '/mini-check/extintores', icon: 'alert-circle' },
  { label: 'Mobileye', to: '/mini-check/mobileye', icon: 'activity' },
  { label: 'Odómetro', to: '/mini-check/odometro', icon: 'gauge' },
  { label: 'Rack', to: '/mini-check/rack', icon: 'layers' },
  { label: 'Wi-Fi', to: '/mini-check/wifi', icon: 'sparkles' },
  { label: 'Publicidad', to: '/mini-check/publicidad', icon: 'image' },
];

export const MiniCheckLayout = () => {
  const configured = isMiniCheckConfigured();

  return (
    <div className="mx-auto max-w-[1800px] space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-7 text-white shadow-xl md:px-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-400/15 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
              <Icon name="check-circle" size={15} />
              Inspección de flota
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">Mini-Check</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
              Seguimiento individual de cámaras, TAG, extintores, Mobileye, odómetro,
              rack, Wi-Fi y publicidad desde la base operativa independiente.
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-3 rounded-2xl border px-4 py-3 ${
              configured
                ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
                : 'border-amber-300/25 bg-amber-300/10 text-amber-100'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                configured ? 'animate-pulse bg-emerald-400' : 'bg-amber-300'
              }`}
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                Fuente de datos
              </p>
              <p className="text-sm font-semibold">
                {configured ? 'Supabase Mini-Check configurado' : 'Credenciales pendientes'}
              </p>
            </div>
          </div>
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
