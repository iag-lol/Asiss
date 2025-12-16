import { useState, FormEvent } from 'react';
import { RutLookupInput } from '../components/RutLookupInput';
import { AutorizacionFormValues, ENTRY_EXIT_OPTIONS, EntryExit } from '../types';
import { Staff } from '../../personal/types';
import { TerminalCode } from '../../../shared/types/terminal';
import { terminalOptions } from '../../../shared/utils/terminal';

interface Props {
    initialData?: Partial<AutorizacionFormValues>;
    onSubmit: (values: AutorizacionFormValues) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const AutorizacionesForm = ({ initialData, onSubmit, onCancel, isLoading }: Props) => {
    const [form, setForm] = useState<AutorizacionFormValues>({
        rut: '',
        nombre: '',
        cargo: '',
        terminal_code: 'EL_ROBLE',
        turno: '',
        horario: '',
        authorization_date: new Date().toISOString().split('T')[0],
        entry_or_exit: 'ENTRADA',
        motivo: '',
        ...initialData,
    });

    const handleStaffFound = (staff: Staff | null) => {
        if (staff) {
            setForm((prev) => ({
                ...prev,
                nombre: staff.nombre,
                cargo: staff.cargo,
                terminal_code: staff.terminal_code as TerminalCode,
                turno: staff.turno,
                horario: staff.horario,
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
                <div>
                    <label className="label">Turno</label>
                    <input
                        type="text"
                        className="input"
                        value={form.turno}
                        onChange={(e) => setForm((prev) => ({ ...prev, turno: e.target.value }))}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="label">Horario</label>
                    <input
                        type="text"
                        className="input"
                        value={form.horario}
                        onChange={(e) => setForm((prev) => ({ ...prev, horario: e.target.value }))}
                        placeholder="08:00-18:00"
                    />
                </div>
                <div>
                    <label className="label">Fecha de Autorización</label>
                    <input
                        type="date"
                        className="input"
                        value={form.authorization_date}
                        onChange={(e) => setForm((prev) => ({ ...prev, authorization_date: e.target.value }))}
                        required
                    />
                </div>
                <div>
                    <label className="label">Tipo</label>
                    <select
                        className="input"
                        value={form.entry_or_exit}
                        onChange={(e) => setForm((prev) => ({ ...prev, entry_or_exit: e.target.value as EntryExit }))}
                        required
                    >
                        {ENTRY_EXIT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="label">Motivo</label>
                <textarea
                    className="input min-h-[80px]"
                    value={form.motivo}
                    onChange={(e) => setForm((prev) => ({ ...prev, motivo: e.target.value }))}
                    placeholder="Describe el motivo de la autorización..."
                    required
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
