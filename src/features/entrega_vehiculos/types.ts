export interface VehicleHandoverRequest {
  id: string;
  vehicleModel: string;
  plate: string;
  date: string;
  startTime: string;
  endTime: string;
  driverName: string;
  driverRut: string;
  cargo: string;
  gerencia: string;
}

export interface VehicleTableParseResult {
  requests: VehicleHandoverRequest[];
  warnings: string[];
}

