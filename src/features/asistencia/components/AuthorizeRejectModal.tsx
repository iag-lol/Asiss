import { useState, FormEvent } from 'react';
import { Icon } from '../../../shared/components/common/Icon';

interface Props {
    mode: 'authorize' | 'reject';
    itemName: string;
    onConfirm: (reason?: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const AuthorizeRejectModal = ({ mode, itemName, onConfirm, onCancel, isLoading }: Props) => {
    const [reason, setReason] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (mode === 'reject' && !reason.trim()) return;
        onConfirm(reason.trim() || undefined);
    };

    const isAuthorize = mode === 'authorize';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

            <div className="relative w-full max-w-md card p-6 animate-scale-in">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isAuthorize ? 'bg-success-100' : 'bg-danger-100'
                        }`}>
                        <Icon
                            name={isAuthorize ? 'check-circle' : 'x'}
                            size={24}
                            className={isAuthorize ? 'text-success-600' : 'text-danger-600'}
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">
                            {isAuthorize ? 'Autorizar Registro' : 'Rechazar Registro'}
                        </h3>
                        <p className="text-sm text-slate-600">
                            {isAuthorize
                                ? `¿Confirmas la autorización de "${itemName}"?`
                                : `¿Confirmas el rechazo de "${itemName}"?`}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="label">
                            {isAuthorize ? 'Comentario (opcional)' : 'Motivo del rechazo *'}
                        </label>
                        <textarea
                            className="input min-h-[80px]"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={isAuthorize ? 'Agregar comentario...' : 'Describe el motivo del rechazo...'}
                            required={!isAuthorize}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-secondary"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`btn ${isAuthorize ? 'btn-success' : 'btn-danger'}`}
                            disabled={isLoading || (!isAuthorize && !reason.trim())}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Procesando...
                                </span>
                            ) : isAuthorize ? (
                                'Autorizar'
                            ) : (
                                'Rechazar'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
