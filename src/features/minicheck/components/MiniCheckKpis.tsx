import { Icon, IconName } from '../../../shared/components/common/Icon';

export interface KpiItem {
    label: string;
    value: string | number;
    subtext?: string;
    icon?: IconName;
    trend?: 'up' | 'down' | 'neutral'; // Optional trend indicator
    colorClass?: string; // e.g. "text-emerald-600 bg-emerald-50"
}

interface Props {
    items: KpiItem[];
}

export const MiniCheckKpis = ({ items }: Props) => {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item, idx) => (
                <div key={`${item.label}-${idx}`} className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                        <h3 className="text-2xl font-bold text-slate-900">{item.value}</h3>
                        {item.subtext && (
                            <p className="text-xs text-slate-400 mt-1 font-medium">{item.subtext}</p>
                        )}
                    </div>
                    {item.icon && (
                        <div className={`p-2 rounded-lg ${item.colorClass || 'bg-slate-100 text-slate-600'}`}>
                            <Icon name={item.icon} size={20} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
