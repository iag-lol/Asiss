interface Props {
  label?: string;
}

export const LoadingState = ({ label = 'Cargando...' }: Props) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative">
      {/* Outer ring */}
      <div className="h-12 w-12 rounded-full border-[3px] border-slate-200"></div>
      {/* Spinning gradient ring */}
      <div className="absolute inset-0 h-12 w-12 rounded-full border-[3px] border-transparent border-t-brand-500 animate-spin"></div>
    </div>
    <p className="mt-4 text-sm font-medium text-slate-600">{label}</p>
  </div>
);
