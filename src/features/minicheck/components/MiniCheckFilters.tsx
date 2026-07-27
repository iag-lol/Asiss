import { Icon } from '../../../shared/components/common/Icon';

const MINICHECK_TERMINALS = [
  'El Roble',
  'Los Agricultores',
  'Maipú',
  'Renca',
  'SIN_TERMINAL',
] as const;

interface Props {
  terminal: string;
  onTerminalChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export const MiniCheckFilters = ({
  terminal,
  onTerminalChange,
  search,
  onSearchChange,
}: Props) => {
  const hasFilters = Boolean(terminal || search);

  const clearFilters = () => {
    onTerminalChange('');
    onSearchChange('');
  };

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Buscar patente
          </span>
          <span className="relative">
            <Icon
              name="search"
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              className="input py-2.5 pl-10 uppercase"
              placeholder="Ej. LXWP76"
              value={search}
              onChange={(event) => onSearchChange(event.target.value.toUpperCase())}
            />
          </span>
        </label>

        <label className="flex min-w-[210px] flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Terminal Mini-Check
          </span>
          <select
            className="select py-2.5"
            value={terminal}
            onChange={(event) => onTerminalChange(event.target.value)}
          >
            <option value="">Todos los terminales</option>
            {MINICHECK_TERMINALS.map((option) => (
              <option key={option} value={option}>
                {option === 'SIN_TERMINAL' ? 'Fuera de geocerca' : option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn btn-ghost min-h-[42px] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!hasFilters}
          onClick={clearFilters}
        >
          <Icon name="x" size={16} />
          Limpiar
        </button>
      </div>
    </div>
  );
};
