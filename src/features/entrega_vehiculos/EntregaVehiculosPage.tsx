import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '../../shared/components/common/ConfirmDialog';
import { Icon } from '../../shared/components/common/Icon';
import { showErrorToast, showSuccessToast, showWarningToast } from '../../shared/state/toastStore';
import {
  downloadAllVehiclePdfs,
  downloadVehiclePdf,
  printAllVehiclePdfs,
  printVehiclePdf,
} from './pdfGenerator';
import { parseVehicleTableText } from './parser';
import { VehicleHandoverRequest } from './types';

const STORAGE_KEY = 'asiss:entrega-vehiculos:v1';

interface StoredState {
  rawText: string;
  requests: VehicleHandoverRequest[];
  updatedAt: string;
}

const loadStoredState = (): StoredState => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { rawText: '', requests: [], updatedAt: '' };
    const parsed = JSON.parse(saved) as Partial<StoredState>;
    return {
      rawText: typeof parsed.rawText === 'string' ? parsed.rawText : '',
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return { rawText: '', requests: [], updatedAt: '' };
  }
};

const isComplete = (request: VehicleHandoverRequest) => Boolean(
  request.plate.trim()
  && request.driverName.trim()
  && request.date.trim()
  && request.startTime.trim()
  && request.endTime.trim()
  && request.cargo.trim()
  && request.gerencia.trim()
);

const formatSavedAt = (value: string) => {
  if (!value) return 'Aún no hay datos guardados';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Datos guardados en este equipo';
  return `Guardado ${date.toLocaleDateString('es-CL')} a las ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
};

interface RecordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'time';
  required?: boolean;
  emphasis?: boolean;
}

const RecordInput = ({ label, value, onChange, type = 'text', required, emphasis }: RecordInputProps) => (
  <label className="block min-w-0">
    <span className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
      {label}
      {required && <span className="text-red-500">*</span>}
    </span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:ring-2 ${
        emphasis
          ? 'border-amber-300 bg-amber-50/70 focus:border-amber-500 focus:ring-amber-500/15'
          : 'border-slate-200 bg-white focus:border-brand-500 focus:ring-brand-500/15'
      }`}
    />
  </label>
);

export const EntregaVehiculosPage = () => {
  const initial = useMemo(loadStoredState, []);
  const [rawText, setRawText] = useState(initial.rawText);
  const [requests, setRequests] = useState<VehicleHandoverRequest[]>(initial.requests);
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [bulkCargo, setBulkCargo] = useState('');
  const [bulkGerencia, setBulkGerencia] = useState('');
  const [showRawInput, setShowRawInput] = useState(!initial.requests.length);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  useEffect(() => {
    if (!rawText.trim() && !requests.length) return;
    const nextUpdatedAt = new Date().toISOString();
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ rawText, requests, updatedAt: nextUpdatedAt }));
      setUpdatedAt(nextUpdatedAt);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [rawText, requests]);

  const completedCount = requests.filter(isComplete).length;
  const totalPages = requests.length * 2;
  const allReady = requests.length > 0 && completedCount === requests.length;

  const analyzeTable = () => {
    if (!rawText.trim()) {
      showWarningToast('Falta la tabla', 'Pega primero la información copiada desde la tabla de solicitudes.');
      return;
    }

    const result = parseVehicleTableText(rawText);
    setWarnings(result.warnings);
    if (!result.requests.length) {
      showErrorToast('No fue posible analizar la tabla', result.warnings[0]);
      return;
    }

    const existing = new Map(requests.map((request) => [`${request.id}-${request.plate}`, request]));
    const merged = result.requests.map((request) => {
      const previous = existing.get(`${request.id}-${request.plate}`);
      return {
        ...request,
        cargo: previous?.cargo || bulkCargo,
        gerencia: previous?.gerencia || bulkGerencia,
      };
    });

    setRequests(merged);
    setShowRawInput(false);
    showSuccessToast('Tabla analizada y guardada', `Se prepararon ${merged.length} solicitudes y ${merged.length * 2} hojas.`);
  };

  const updateRequest = (index: number, field: keyof VehicleHandoverRequest, value: string) => {
    setRequests((current) => current.map((request, requestIndex) => (
      requestIndex === index ? { ...request, [field]: value } : request
    )));
  };

  const applyManualFields = () => {
    if (!bulkCargo.trim() && !bulkGerencia.trim()) {
      showWarningToast('Campos vacíos', 'Escribe un cargo, una gerencia o ambos antes de aplicar.');
      return;
    }
    setRequests((current) => current.map((request) => ({
      ...request,
      cargo: bulkCargo.trim() || request.cargo,
      gerencia: bulkGerencia.trim() || request.gerencia,
    })));
    showSuccessToast('Datos aplicados', 'Los campos manuales se actualizaron en todas las solicitudes.');
  };

  const removeRequest = (index: number) => {
    setRequests((current) => current.filter((_, requestIndex) => requestIndex !== index));
  };

  const ensureReady = (request: VehicleHandoverRequest) => {
    if (isComplete(request)) return true;
    showWarningToast('Solicitud incompleta', 'Completa cargo y gerencia antes de generar sus documentos.');
    return false;
  };

  const handleDownloadOne = (request: VehicleHandoverRequest) => {
    if (!ensureReady(request)) return;
    try {
      downloadVehiclePdf(request);
      showSuccessToast('PDF generado', `Entrega y recepción de ${request.plate} se descargaron en un archivo de 2 páginas.`);
    } catch (error) {
      showErrorToast('No se pudo generar el PDF', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    }
  };

  const handlePrintOne = (request: VehicleHandoverRequest) => {
    if (!ensureReady(request)) return;
    try {
      printVehiclePdf(request);
    } catch (error) {
      showErrorToast('No se pudo abrir la impresión', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    }
  };

  const requireAllReady = () => {
    if (allReady) return true;
    showWarningToast('Hay solicitudes incompletas', `Completa cargo y gerencia en las ${requests.length - completedCount} solicitudes pendientes.`);
    return false;
  };

  const clearAll = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setRawText('');
    setRequests([]);
    setWarnings([]);
    setUpdatedAt('');
    setBulkCargo('');
    setBulkGerencia('');
    setShowRawInput(true);
    setClearDialogOpen(false);
    showSuccessToast('Datos eliminados', 'La tabla principal y los documentos preparados se borraron de este equipo.');
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-5 py-6 text-white shadow-xl sm:px-8 sm:py-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100">
              <Icon name="truck" size={15} />
              Gestión documental de vehículos nuevos
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Entrega y recepción de móviles</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Pega la tabla operacional, revisa los datos recuperados y genera de inmediato las dos hojas oficiales por solicitud.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { value: requests.length, label: 'Solicitudes' },
              { value: totalPages, label: 'Hojas PDF' },
              { value: completedCount, label: 'Listas' },
            ].map((stat) => (
              <div key={stat.label} className="min-w-[88px] rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur sm:min-w-[104px]">
                <p className="text-xl font-bold sm:text-2xl">{stat.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRawInput((current) => !current)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <Icon name="clipboard" size={20} />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-slate-900">1. Tabla principal</span>
                <span className="block truncate text-xs text-slate-500">{formatSavedAt(updatedAt)} · permanece guardada en este equipo</span>
              </span>
            </span>
            <Icon name="chevron-down" size={18} className={`shrink-0 text-slate-400 transition-transform ${showRawInput ? '' : '-rotate-90'}`} />
          </button>

          {showRawInput && (
            <div className="border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <label className="label" htmlFor="vehicle-table-input">Pega aquí la tabla completa</label>
              <textarea
                id="vehicle-table-input"
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
                rows={9}
                spellCheck={false}
                placeholder={'Copia todas las filas desde la tabla operacional y pégalas aquí.\n\nSe detectarán automáticamente: ID, modelo, patente, fecha, hora de inicio, hora de cierre, conductor y RUT.'}
                className="input resize-y font-mono text-xs leading-relaxed"
              />
              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                  <Icon name="save" size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  El contenido se guarda automáticamente y solo se elimina con el botón “Borrar información”.
                </p>
                <button type="button" onClick={analyzeTable} className="btn btn-primary shrink-0">
                  <Icon name="sparkles" size={17} />
                  Analizar y preparar
                </button>
              </div>
              {warnings.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {warnings.map((warning) => <p key={warning}>{warning}</p>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Icon name="briefcase" size={20} />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">2. Datos manuales</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Úsalos cuando cargo y gerencia sean iguales para todas las filas.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <RecordInput label="Cargo" value={bulkCargo} onChange={setBulkCargo} emphasis />
            <RecordInput label="Gerencia" value={bulkGerencia} onChange={setBulkGerencia} emphasis />
          </div>
          <button type="button" onClick={applyManualFields} disabled={!requests.length} className="btn btn-secondary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50">
            <Icon name="check" size={16} />
            Aplicar a todas
          </button>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">3. Revisión y documentos</h2>
              {requests.length > 0 && (
                <span className={`badge ${allReady ? 'badge-success' : 'badge-warning'}`}>
                  {allReady ? 'Listo para imprimir' : `${requests.length - completedCount} pendiente(s)`}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">Cada PDF contiene entrega en la página 1 y recepción en la página 2.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!requests.length}
              onClick={() => {
                if (!requireAllReady()) return;
                try {
                  printAllVehiclePdfs(requests);
                } catch (error) {
                  showErrorToast('No se pudo abrir la impresión', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
                }
              }}
              className="btn btn-secondary flex-1 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <Icon name="file-text" size={17} />
              Imprimir todo
            </button>
            <button
              type="button"
              disabled={!requests.length}
              onClick={() => {
                if (!requireAllReady()) return;
                try {
                  downloadAllVehiclePdfs(requests);
                  showSuccessToast('PDF consolidado generado', `${requests.length} solicitudes y ${totalPages} páginas listas para imprimir.`);
                } catch (error) {
                  showErrorToast('No se pudo generar el PDF', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
                }
              }}
              className="btn btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <Icon name="download" size={17} />
              Descargar todo
            </button>
          </div>
        </div>

        {!requests.length ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Icon name="truck" size={30} />
            </span>
            <h3 className="mt-4 font-bold text-slate-800">Aún no hay solicitudes preparadas</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">Pega la tabla principal y pulsa “Analizar y preparar”. Los datos detectados aparecerán aquí para su revisión.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {requests.map((request, index) => {
              const ready = isComplete(request);
              return (
                <article key={`${request.id}-${request.plate}-${index}`} className="px-5 py-5 transition hover:bg-slate-50/60 sm:px-6">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                          <Icon name="truck" size={21} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{request.plate || 'Sin patente'}</h3>
                            <span className="badge badge-primary">Solicitud {request.id}</span>
                            <span className="badge badge-success">Vehículo nuevo</span>
                            {!ready && <span className="badge badge-warning">Completar campos</span>}
                          </div>
                          <p className="mt-1 truncate text-sm text-slate-500">{request.vehicleModel || 'Modelo no informado'} · {request.date}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button type="button" onClick={() => handlePrintOne(request)} className="btn btn-secondary px-3 py-2">
                          <Icon name="file-text" size={16} />
                          Imprimir
                        </button>
                        <button type="button" onClick={() => handleDownloadOne(request)} className="btn btn-primary px-3 py-2">
                          <Icon name="download" size={16} />
                          PDF 2 hojas
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRequest(index)}
                          className="btn btn-ghost px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                          title="Quitar esta solicitud"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                      <RecordInput label="Patente" value={request.plate} onChange={(value) => updateRequest(index, 'plate', value.toUpperCase())} required />
                      <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
                        <RecordInput label="Nombre" value={request.driverName} onChange={(value) => updateRequest(index, 'driverName', value)} required />
                      </div>
                      <RecordInput label="Cargo manual" value={request.cargo} onChange={(value) => updateRequest(index, 'cargo', value)} required emphasis />
                      <RecordInput label="Gerencia manual" value={request.gerencia} onChange={(value) => updateRequest(index, 'gerencia', value)} required emphasis />
                      <RecordInput label="Hora entrega" type="time" value={request.startTime} onChange={(value) => updateRequest(index, 'startTime', value)} required />
                      <RecordInput label="Hora recepción" type="time" value={request.endTime} onChange={(value) => updateRequest(index, 'endTime', value)} required />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {(rawText.trim() || requests.length > 0) && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-red-900">Zona de eliminación</p>
            <p className="mt-0.5 text-xs text-red-700">Esta es la única acción que borra la tabla principal y todos los cambios guardados.</p>
          </div>
          <button type="button" onClick={() => setClearDialogOpen(true)} className="btn btn-danger shrink-0">
            <Icon name="trash" size={16} />
            Borrar información
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={clearDialogOpen}
        title="¿Borrar toda la información?"
        message="Se eliminarán la tabla pegada, los datos analizados y los campos manuales guardados en este equipo. Los PDF que ya hayas descargado no se verán afectados."
        confirmLabel="Sí, borrar todo"
        onConfirm={clearAll}
        onClose={() => setClearDialogOpen(false)}
      />
    </div>
  );
};
