import { TableColumn } from '../../../shared/components/common/DataTable';
import { fetchMobileye } from '../api/minicheckApi';
import { KpiItem } from '../components/MiniCheckKpis';
import { DistributionItem, MiniCheckModulePage } from '../components/MiniCheckModulePage';
import { BooleanStatus } from '../components/MiniCheckStatus';
import { Mobileye } from '../types';

type MobileyeCheck = keyof Pick<
  Mobileye,
  'alerta_izq' | 'alerta_der' | 'consola' | 'sensor_frontal' | 'sensor_izq' | 'sensor_der'
>;

const mobileyeChecks: MobileyeCheck[] = [
  'alerta_izq',
  'alerta_der',
  'consola',
  'sensor_frontal',
  'sensor_izq',
  'sensor_der',
];

const hasFailure = (row: Mobileye): boolean =>
  mobileyeChecks.some((field) => row[field] === false);

const isIncomplete = (row: Mobileye): boolean =>
  mobileyeChecks.some((field) => row[field] === null || row[field] === undefined);

const checkColumn = (key: MobileyeCheck, header: string): TableColumn<Mobileye> => ({
  key,
  header,
  render: (row) => <BooleanStatus value={row[key]} />,
  value: (row) => (row[key] === null ? 'SIN DATO' : row[key] ? 'OK' : 'FALLA'),
});

const detailColumns: TableColumn<Mobileye>[] = [
  { key: 'bus_marca', header: 'Marca', value: (row) => row.bus_marca || '—' },
  checkColumn('alerta_izq', 'Alerta izq.'),
  checkColumn('alerta_der', 'Alerta der.'),
  checkColumn('consola', 'Consola'),
  checkColumn('sensor_frontal', 'Sensor frontal'),
  checkColumn('sensor_izq', 'Sensor izq.'),
  checkColumn('sensor_der', 'Sensor der.'),
];

const getKpis = (rows: Mobileye[]): KpiItem[] => [
  { label: 'Volvo revisados', value: rows.length, icon: 'truck' },
  {
    label: 'Sistema completo OK',
    value: rows.filter((row) => !hasFailure(row) && !isIncomplete(row)).length,
    icon: 'check-circle',
    colorClass: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Con fallas',
    value: rows.filter(hasFailure).length,
    icon: 'alert-triangle',
    colorClass: 'bg-red-50 text-red-600',
  },
  {
    label: 'Datos incompletos',
    value: rows.filter((row) => !hasFailure(row) && isIncomplete(row)).length,
    icon: 'alert-circle',
    colorClass: 'bg-slate-100 text-slate-600',
  },
];

const getDistribution = (rows: Mobileye[]): DistributionItem[] => [
  {
    name: 'Todo OK',
    value: rows.filter((row) => !hasFailure(row) && !isIncomplete(row)).length,
    color: '#10b981',
  },
  { name: 'Con fallas', value: rows.filter(hasFailure).length, color: '#ef4444' },
  {
    name: 'Incompleto',
    value: rows.filter((row) => !hasFailure(row) && isIncomplete(row)).length,
    color: '#94a3b8',
  },
];

export const MiniCheckMobileyePage = () => (
  <MiniCheckModulePage
    moduleKey="mobileye"
    title="Revisión de Mobileye"
    description="Estado real de alertas, consola y sensores ADAS en buses Volvo; los Scania no aplican."
    sheetName="Mobileye"
    fetcher={fetchMobileye}
    detailColumns={detailColumns}
    getKpis={getKpis}
    getDistribution={getDistribution}
  />
);
