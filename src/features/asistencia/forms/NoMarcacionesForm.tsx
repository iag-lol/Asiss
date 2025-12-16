import { useState, useEffect, FormEvent } from 'react';
import { RutLookupInput } from '../components/RutLookupInput';
import { NoMarcacionFormValues } from '../types';
import { Staff } from '../../personal/types';
import { TerminalCode } from '../../../shared/types/terminal';
import { terminalOptions } from '../../../shared/utils/terminal';
import { getTerminalChief } from '../utils/authorizers';

interface Props {
    initialData?: Partial<NoMarcacionFormValues>;
    onSubmit: (values: NoMarcacionFormValues) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const NoMarcacionesForm = ({ initialData, onSubmit, onCancel, isLoading }: Props) => {
    const [form, setForm] = useState<NoMarcacionFormValues>({
        rut: '',
        nombre: '',
        area: '',
        cargo: '',
        jefe_terminal: '',
        terminal_code: 'EL_ROBLE',
        cabezal: '',
        incident_state: '',
        schedule_in_out: '',
        date: new Date().toISOString().split('T')[0],
        time_range: '',
        observations: '',
        informed_by: '',
        ...initialData,
    });

    useEffect(() => {
        // Auto-fill jefe_terminal when terminal changes
        const chief = getTerminalChief(form.terminal_code);
        if (chief) {
            setForm((prev) => ({ ...prev, jefe_terminal: chief }));
        }
    }, [form.terminal_code]);

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
                    <input
                        type="text"
                        className="input"
                        value={form.nombre}
                        onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="label">Área</label>
                    <input
                        type="text"
                        className="input"
                        value={form.area}
                        onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="label">Cargo</label>
                    <input
                        type="text"
                        className="input"
                        value={form.cargo}
                        onChange={(e) => setForm((prev) => ({ ...prev, cargo: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="label">Terminal</label>
                    <select
                        className="input"
                        value={form.terminal_code}
                        onChange={(e) => setForm((prev) => ({ ...prev, terminal_code: e.target.value as TerminalCode }))}
                        required
                    >
                        {terminalOptions.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="label">Jefe de Terminal</label>
                    <input
                        type="text"
                        className="input"
                        value={form.jefe_terminal}
                        onChange={(e) => setForm((prev) => ({ ...prev, jefe_terminal: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="label">Cabezal</label>
                    <input
                        type="text"
                        className="input"
                        value={form.cabezal}
                        onChange={(e) => setForm((prev) => ({ ...prev, cabezal: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="label">Estado (Incidente)</label>
                    <input
                        type="text"
                        className="input"
                        value={form.incident_state}
                        onChange={(e) => setForm((prev) => ({ ...prev, incident_state: e.target.value }))}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="label">Horario Entrada/Salida</label>
                    <input
                        type="text"
                        className="input"
                        value={form.schedule_in_out}
                        onChange={(e) => setForm((prev) => ({ ...prev, schedule_in_out: e.target.value }))}
                        placeholder="08:00-18:00"
                    />
                </div>
                <div>
                    <label className="label">Fecha</label>
                    <input
                        type="date"
                        className="input"
                        value={form.date}
                        onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                        required
                    />
                </div>
                <div>
                    <label className="label">Horario (Rango)</label>
                    <input
                        type="text"
                        className="input"
                        value={form.time_range}
                        onChange={(e) => setForm((prev) => ({ ...prev, time_range: e.target.value }))}
                        placeholder="10:00-14:00"
                    />
                </div>
            </div>

            <div>
                <label className="label">Observaciones</label>
                <textarea
                    className="input min-h-[80px]"
                    value={form.observations}
                    onChange={(e) => setForm((prev) => ({ ...prev, observations: e.target.value }))}
                />
            </div>

            <div>
                <label className="label">Informado Por</label>
                <input
                    type="text"
                    className="input"
                    value={form.informed_by}
                    onChange={(e) => setForm((prev) => ({ ...prev, informed_by: e.target.value }))}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Crear Registro'}
                </button>
            </div>
        </form>
    );
};
