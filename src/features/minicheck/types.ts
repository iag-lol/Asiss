export interface MiniCheckBase {
  id: string;
  revision_id: string;
  created_at: string;
  bus_ppu: string;
  terminal: string;
  observacion: string | null;
}

export interface MiniCheckFilters {
  terminal?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type NullableBoolean = boolean | null;

export type MonitorEstado = 'FUNCIONA' | 'APAGADO' | 'CON_DAÑO' | 'SIN_SENAL';

export interface CamarasDetalle {
  monitorDetalle?: string | null;
  camDelantera?: NullableBoolean;
  camCabina?: NullableBoolean;
  camInteriores?: NullableBoolean;
  camTrasera?: NullableBoolean;
  visiblesMonitor?: NullableBoolean;
  activaReversa?: NullableBoolean;
  activaPuertas?: NullableBoolean;
  visiblesPuertasCerradas?: NullableBoolean;
}

export interface Camaras extends MiniCheckBase {
  monitor_estado: MonitorEstado | null;
  detalle: CamarasDetalle | null;
}

export interface Tag extends MiniCheckBase {
  tiene: NullableBoolean;
  serie: string | null;
}

export type CertificacionEstado = 'VIGENTE' | 'VENCIDA';
export type LecturaIndicadorEstado = 'OK' | 'SIN_LECTURA' | 'FUERA_DE_RANGO';
export type PresionEstado = 'OPTIMO' | 'BAJA_CARGA' | 'SOBRECARGA';
export type CilindroEstado = 'OK' | 'ABOLLADO' | 'OXIDADO';
export type PortaEstado = 'TIENE' | 'NO_TIENE' | 'DANADO';

export interface Extintor extends MiniCheckBase {
  tiene: NullableBoolean;
  vencimiento_mes: number | null;
  vencimiento_anio: number | null;
  certificacion: CertificacionEstado | null;
  sonda?: LecturaIndicadorEstado | null;
  manometro?: LecturaIndicadorEstado | null;
  sonda_manometro?: LecturaIndicadorEstado | null;
  'sonda/manometro'?: LecturaIndicadorEstado | null;
  presion: PresionEstado | null;
  cilindro: CilindroEstado | null;
  porta: PortaEstado | null;
}

export interface Mobileye extends MiniCheckBase {
  bus_marca: string | null;
  alerta_izq: NullableBoolean;
  alerta_der: NullableBoolean;
  consola: NullableBoolean;
  sensor_frontal: NullableBoolean;
  sensor_izq: NullableBoolean;
  sensor_der: NullableBoolean;
}

export type OdometroEstado = 'OK' | 'INCONSISTENTE' | 'NO_FUNCIONA';

export interface Odometro extends MiniCheckBase {
  lectura: number | string;
  estado: OdometroEstado | null;
}

export interface Rack extends MiniCheckBase {
  tiene_disco_duro: NullableBoolean;
  tiene_seguridad_extra: NullableBoolean;
  tiene_candado: NullableBoolean;
  cerraduras_buen_estado: NullableBoolean;
  cantidad_cerraduras_esperada: number | null;
}

export interface PublicidadLado {
  tiene: NullableBoolean;
  danio: NullableBoolean;
  residuos: NullableBoolean;
  observacion: string | null;
}

export interface PublicidadDetalleLados {
  izquierda?: PublicidadLado;
  derecha?: PublicidadLado;
  luneta?: PublicidadLado;
}

export interface Publicidad extends MiniCheckBase {
  tiene: NullableBoolean;
  danio: NullableBoolean;
  residuos: NullableBoolean;
  nombre_publicidad: string | null;
  detalle_lados: PublicidadDetalleLados | null;
}

export interface Wifi extends MiniCheckBase {
  ppu_visible: NullableBoolean;
  bus_encendido: NullableBoolean;
  tiene_internet: NullableBoolean;
}
