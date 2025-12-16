import { AttendanceKPIs as KPIData } from '../types';
import { Icon } from '../../../shared/components/common/Icon';

interface Props {
    data?: KPIData;
    isLoading?: boolean;
}

export const AttendanceKPIs = ({ data, isLoading }: Props) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="card p-4 animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
                        <div className="h-8 bg-slate-200 rounded w-12" />
                    </div>
                ))}
            </div>
        );
    }

    if (!data) return null;

    const kpis = [
        {
            label: 'Pendientes Hoy',
            value: data.pendingToday,
            icon: 'clock' as const,
            bgClass: 'bg-warning-50 border-warning-200',
            textClass: 'text-warning-700',
            iconClass: 'text-warning-500',
        },
        {
            label: 'Pendientes Total',
            value: data.pendingTotal,
            icon: 'inbox' as const,
            bgClass: 'bg-orange-50 border-orange-200',
            textClass: 'text-orange-700',
            iconClass: 'text-orange-500',
        },
        {
            label: 'Autorizados (30d)',
            value: data.authorizedRange,
            icon: 'check-circle' as const,
            bgClass: 'bg-success-50 border-success-200',
            textClass: 'text-success-700',
            iconClass: 'text-success-500',
        },
        {
            label: 'Rechazados (30d)',
            value: data.rejectedRange,
            icon: 'x' as const,
            bgClass: 'bg-danger-50 border-danger-200',
            textClass: 'text-danger-700',
            iconClass: 'text-danger-500',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi) => (
                <div key={kpi.label} className={`card p-4 ${kpi.bgClass}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Icon name={kpi.icon} size={18} className={kpi.iconClass} />
                        <span className="text-xs font-semibold text-slate-600 uppercase">
                            {kpi.label}
                        </span>
                    </div>
                    <p className={`text-2xl font-bold ${kpi.textClass}`}>{kpi.value}</p>
                </div>
            ))}
        </div>
    );
};
