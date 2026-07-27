import { Icon, IconName } from '../../../shared/components/common/Icon';

export interface KpiItem {
    label: string;
    value: string | number;
    subtext?: string;
    icon?: IconName;
    trend?: 'up' | 'down' | 'neutral';
    colorClass?: string; // e.g. "bg-emerald-50 text-emerald-600"
    /** Porcentaje 0–100 para la barra de participación bajo el valor. */
    share?: number;
}

interface Props {
    items: KpiItem[];
}

// Barra de acento por categoría. Se usan clases literales (no interpoladas) para
// que Tailwind no las purgue del CSS final.
const ACCENT_BARS: Record<string, string> = {
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
    slate: 'bg-slate-400',
};

const accentFromColorClass = (colorClass?: string): string => {
    if (!colorClass) return 'bg-slate-400';
    const match = colorClass.match(/text-([a-z]+)-\d+/);
    return (match && ACCENT_BARS[match[1]]) || 'bg-slate-400';
};

export const MiniCheckKpis = ({ items }: Props) => {
    const columnClass = items.length >= 5 ? 'xl:grid-cols-5' : 'sm:grid-cols-2 xl:grid-cols-4';

    return (
        <div className={`grid grid-cols-2 gap-3 ${columnClass}`}>
            {items.map((item, idx) => (
                <div
                    key={`${item.label}-${idx}`}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase leading-tight tracking-wider text-slate-500">
                            {item.label}
                        </p>
                        {item.icon && (
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.colorClass || 'bg-slate-100 text-slate-600'}`}>
                                <Icon name={item.icon} size={17} />
                            </div>
                        )}
                    </div>

                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold leading-none tracking-tight text-slate-900 tabular-nums">
                            {item.value}
                        </span>
                        {item.subtext && (
                            <span className="text-xs font-medium text-slate-400">{item.subtext}</span>
                        )}
                    </div>

                    {typeof item.share === 'number' && (
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className={`h-full rounded-full ${accentFromColorClass(item.colorClass)}`}
                                style={{ width: `${Math.max(0, Math.min(100, item.share))}%` }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
