import { Icon } from './Icon';

interface Props {
  onExportView: () => void;
  onExportAll: () => void;
}

export const ExportMenu = ({ onExportView, onExportAll }: Props) => (
  <div className="flex items-center gap-2">
    <button onClick={onExportView} className="btn btn-secondary text-sm">
      <Icon name="clipboard" size={16} />
      <span className="hidden sm:inline">Exportar Vista</span>
      <span className="sm:hidden">Vista</span>
    </button>
    <button onClick={onExportAll} className="btn btn-primary text-sm">
      <Icon name="layers" size={16} />
      <span className="hidden sm:inline">Exportar Todo</span>
      <span className="sm:hidden">Todo</span>
    </button>
  </div>
);
