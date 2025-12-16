import { useState, FormEvent } from 'react';
import { RutLookupInput } from '../components/RutLookupInput';
import { SinCredencialFormValues } from '../types';
import { Staff } from '../../personal/types';
import { TerminalCode } from '../../../shared/types/terminal';
import { terminalOptions } from '../../../shared/utils/terminal';

interface Props {
    initialData?: Partial<SinCredencialFormValues>;
    onSubmit: (values: SinCredencialFormValues) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const SinCredencialesForm = ({ initialData, onSubmit, onCancel, isLoading }: Props) => {
    const [form, setForm] = useState<SinCredencialFormValues>({
        rut: '',
        nombre: '',
        terminal_code: 'EL_ROBLE',
        cabezal: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        cargo: '',
        supervisor_autoriza: '',
        area: '',
        responsable: '',
        observacion: '',
        ...initialData,
    });

    const handleStaffFound = (staff: Staff | null) => {
        if (staff) {
            setForm((prev) => ({
                ...prev,
                nombre: staff.nombre,
                cargo: staff.cargo,
                terminal_code: staff.terminal_code as TerminalCode,
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
                    <label className="label">Fecha</label>
                    <input type="date" className="input" value={form.date}
                        onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} required />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="label">Hora Inicio</label>
                    <input type="time" className="input" value={form.start_time}
                        onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))} />
                </div>
                <div>
                    <label className="label">Hora Fin</label>
                    <input type="time" className="input" value={form.end_time}
                        onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="label">Cargo</label>
                    <input type="text" className="input" value={form.cargo}
                        onChange={(e) => setForm((prev) => ({ ...prev, cargo: e.target.value }))} />
                </div>
                <div>
                    <label className="label">Supervisor Autoriza</label>
                    <input type="text" className="input" value={form.supervisor_autoriza}
                        onChange={(e) => setForm((prev) => ({ ...prev, supervisor_autoriza: e.target.value }))} />
                </div>
                <div>
                    <label className="label">Área</label>
                    <input type="text" className="input" value={form.area}
                        onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))} />
                </div>
            </div>

            <div>
                <label className="label">Responsable</label>
                <input type="text" className="input" value={form.responsable}
                    onChange={(e) => setForm((prev) => ({ ...prev, responsable: e.target.value }))} />
            </div>

            <div>
                <label className="label">Observación</label>
                <textarea className="input min-h-[80px]" value={form.observacion}
                    onChange={(e) => setForm((prev) => ({ ...prev, observacion: e.target.value }))} />
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
