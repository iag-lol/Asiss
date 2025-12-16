interface Props {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message = 'Ha ocurrido un error', onRetry }: Props) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-danger-200 bg-danger-50/50 px-6 py-12 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-100 mb-4">
      <svg className="h-7 w-7 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    </div>
    <p className="text-sm font-semibold text-danger-700">{message}</p>
    <p className="mt-1 text-xs text-danger-600 max-w-xs">Por favor intenta de nuevo o contacta soporte si el problema persiste.</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 btn btn-secondary text-danger-700 border-danger-300 hover:bg-danger-100"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reintentar
      </button>
    )}
  </div>
);
