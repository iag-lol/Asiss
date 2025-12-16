import { useState, useRef, FormEvent } from 'react';
import { RutLookupInput } from '../components/RutLookupInput';
import { CambioDiaFormValues } from '../types';
import { Staff } from '../../personal/types';
import { TerminalCode } from '../../../shared/types/terminal';
import { terminalOptions } from '../../../shared/utils/terminal';
import { Icon } from '../../../shared/components/common/Icon';

interface Props {
    initialData?: Partial<CambioDiaFormValues>;
    onSubmit: (values: CambioDiaFormValues) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const CambiosDeDiaForm = ({ initialData, onSubmit, onCancel, isLoading }: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState<CambioDiaFormValues>({
        rut: '',
        nombre: '',
        terminal_code: 'EL_ROBLE',
        cabezal: '',
        date: new Date().toISOString().split('T')[0],
        prog_start: '',
        prog_end: '',
        reprogram_start: '',
        reprogram_end: '',
        day_off_date: '',
        day_off_start: '',
        day_off_end: '',
        day_on_date: '',
        day_on_start: '',
        day_on_end: '',
        document: null,
        ...initialData,
    });

    const handleStaffFound = (staff: Staff | null) => {
        if (staff) {
            // Parse horario "08:00-18:00" to get start and end
            const [startTime, endTime] = (staff.horario || '').split('-');

            setForm((prev) => ({
                ...prev,
                nombre: staff.nombre,
                terminal_code: staff.terminal_code as TerminalCode,
                prog_start: startTime?.trim() || '',
                prog_end: endTime?.trim() || '',
            }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RutLookupInput
                    value={form.rut}
                    onChange={(rut) => setForm((prev) => ({ ...prev, rut }))}
                    onStaffFound={handleStaffFound}
                    disabled={Boolean(initialData?.rut)}
                />
                <div>
                    <label className="label">Nombre</label>
                    <input type="text" className="input" value={form.nombre}
                        onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))} required />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="label">Terminal</label>
                    <select className="input" value={form.terminal_code}
                        onChange={(e) => setForm((prev) => ({ ...prev, terminal_code: e.target.value as TerminalCode }))} required>
                        {terminalOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label">Cabezal</label>
                    <input type="text" className="input" value={form.cabezal}
                        onChange={(e) => setForm((prev) => ({ ...prev, cabezal: e.target.value }))} />
                </div>
                <div>
                    <label className="label">Fecha Registro</label>
                    <input type="date" className="input" value={form.date}
                        onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} required />
                </div>
            </div>

            {/* Jornada Programada (auto-filled from Personal) */}
            <div className="card p-4 bg-brand-50 border-brand-200">
                <h4 className="font-semibold text-brand-800 mb-3">Jornada Programada (desde Personal)</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Entrada</label>
                        <input type="text" className="input bg-brand-100" value={form.prog_start}
                            onChange={(e) => setForm((prev) => ({ ...prev, prog_start: e.target.value }))}
                            placeholder="--:--" />
                    </div>
                    <div>
                        <label className="label">Salida</label>
                        <input type="text" className="input bg-brand-100" value={form.prog_end}
                            onChange={(e) => setForm((prev) => ({ ...prev, prog_end: e.target.value }))}
                            placeholder="--:--" />
                    </div>
                </div>
            </div>

            {/* Día Programado (no trabaja) */}
            <div className="card p-4 bg-slate-50">
                <h4 className="font-semibold text-slate-700 mb-3">Día Programado (No Trabaja)</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="label">Fecha</label>
                        <input type="date" className="input" value={form.day_off_date}
                            onChange={(e) => setForm((prev) => ({ ...prev, day_off_date: e.target.value }))} />
                    </div>
                    <div>
                        <label className="label">Inicio</label>
                        <input type="text" className="input" value={form.day_off_start}
                            onChange={(e) => setForm((prev) => ({ ...prev, day_off_start: e.target.value }))}
                            placeholder="--:--" />
                    </div>
                    <div>
                        <label className="label">Término</label>
                        <input type="text" className="input" value={form.day_off_end}
                            onChange={(e) => setForm((prev) => ({ ...prev, day_off_end: e.target.value }))}
                            placeholder="--:--" />
                    </div>
                </div>
            </div>

            {/* Día ReProgramado (trabaja) */}
            <div className="card p-4 bg-success-50 border-success-200">
                <h4 className="font-semibold text-success-800 mb-3">Día ReProgramado (Trabaja)</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="label">Fecha</label>
                        <input type="date" className="input" value={form.day_on_date}
                            onChange={(e) => setForm((prev) => ({ ...prev, day_on_date: e.target.value }))} />
                    </div>
                    <div>
                        <label className="label">Inicio</label>
                        <input type="text" className="input" value={form.day_on_start}
                            onChange={(e) => setForm((prev) => ({ ...prev, day_on_start: e.target.value }))}
                            placeholder="--:--" />
                    </div>
                    <div>
                        <label className="label">Término</label>
                        <input type="text" className="input" value={form.day_on_end}
                            onChange={(e) => setForm((prev) => ({ ...prev, day_on_end: e.target.value }))}
                            placeholder="--:--" />
                    </div>
                </div>
            </div>

            {/* Document Upload */}
            <div>
                <label className="label">Documento Adjunto (opcional)</label>
                <div className="border-2 border-dashed rounded-xl p-4 text-center">
                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                        onChange={(e) => setForm((prev) => ({ ...prev, document: e.target.files?.[0] || null }))} />
                    {form.document ? (
                        <div className="flex items-center justify-center gap-3">
                            <Icon name="check-circle" size={20} className="text-success-600" />
                            <span className="text-sm">{form.document.name}</span>
                            <button type="button" onClick={() => { setForm((prev) => ({ ...prev, document: null })); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                className="text-danger-600"><Icon name="x" size={18} /></button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary">
                            <Icon name="image" size={18} /> Seleccionar Archivo
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Crear Registro'}
                </button>
            </div>
        </form>
    );
};
