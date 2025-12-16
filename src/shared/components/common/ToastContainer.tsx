import { useToastStore, Toast as ToastType } from '../../state/toastStore';
import { Icon } from './Icon';

const ToastItem = ({ toast }: { toast: ToastType }) => {
    const { removeToast } = useToastStore();

    const bgColors = {
        success: 'bg-gradient-to-r from-success-500 to-success-600',
        error: 'bg-gradient-to-r from-danger-500 to-danger-600',
        warning: 'bg-gradient-to-r from-warning-500 to-warning-600',
        info: 'bg-gradient-to-r from-brand-500 to-brand-600',
    };

    const icons = {
        success: 'check-circle',
        error: 'alert-circle',
        warning: 'alert-triangle',
        info: 'info',
    } as const;

    return (
        <div
            className={`${bgColors[toast.type]} text-white rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[420px] animate-slide-in-right flex items-start gap-3`}
            style={{
                animation: 'slideInRight 0.3s ease-out',
            }}
        >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon name={icons[toast.type]} size={22} className="text-white" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-base">{toast.title}</h4>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">{toast.message}</p>
                {toast.createdBy && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/80">
                        <Icon name="user" size={14} />
                        <span>Registrado por: <strong className="text-white">{toast.createdBy}</strong></span>
                    </div>
                )}
            </div>

            {/* Close Button */}
            <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
                <Icon name="x" size={18} className="text-white/80" />
            </button>
        </div>
    );
};

export const ToastContainer = () => {
    const { toasts } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <>
            {/* CSS Animations */}
            <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} />
                ))}
            </div>
        </>
    );
};
