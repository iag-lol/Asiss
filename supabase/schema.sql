-- =============================================
-- ASISS DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- SECTION: PERSONAL
-- =============================================

-- Enum para estado de staff
CREATE TYPE staff_status AS ENUM ('ACTIVO', 'DESVINCULADO');

-- Tabla principal de personal
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  cargo TEXT NOT NULL,
  terminal_code TEXT NOT NULL,
  turno TEXT NOT NULL,
  horario TEXT NOT NULL,
  contacto TEXT NOT NULL,
  status staff_status NOT NULL DEFAULT 'ACTIVO',
  terminated_at TIMESTAMPTZ,
  termination_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para staff
CREATE INDEX idx_staff_rut ON staff(rut);
CREATE INDEX idx_staff_terminal ON staff(terminal_code);
CREATE INDEX idx_staff_cargo ON staff(cargo);
CREATE INDEX idx_staff_status ON staff(status);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla de amonestaciones
CREATE TABLE staff_admonitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  admonition_date DATE NOT NULL,
  document_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admonitions_staff ON staff_admonitions(staff_id, admonition_date DESC);

-- Tabla de cupos máximos
CREATE TABLE staff_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('TERMINAL_GROUP', 'TERMINAL', 'COMPANY')),
  scope_code TEXT NOT NULL,
  cargo TEXT NOT NULL,
  max_q INT NOT NULL CHECK (max_q >= 0),
  UNIQUE(scope_type, scope_code, cargo)
);

-- Insertar cupos para ER_LR (El Roble + La Reina)
INSERT INTO staff_caps (scope_type, scope_code, cargo, max_q) VALUES
  ('TERMINAL_GROUP', 'ER_LR', 'conductor', 12),
  ('TERMINAL_GROUP', 'ER_LR', 'inspector_patio', 21),
  ('TERMINAL_GROUP', 'ER_LR', 'cleaner', 36),
  ('TERMINAL_GROUP', 'ER_LR', 'planillero', 9),
  ('TERMINAL_GROUP', 'ER_LR', 'supervisor', 7);

-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE staff;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_admonitions;

-- RLS Policies (permissive for development)
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_admonitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_caps ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for production)
CREATE POLICY "Allow all for staff" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for admonitions" ON staff_admonitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for caps" ON staff_caps FOR SELECT USING (true);

-- =============================================
-- STORAGE: Create bucket for staff documents
-- Run this separately or create via Supabase Dashboard:
-- Bucket name: staff-docs
-- Public: false
-- =============================================

-- =============================================
-- SECTION: ASISTENCIA
-- =============================================

-- Enum para estado de autorización
CREATE TYPE auth_status_enum AS ENUM ('PENDIENTE', 'AUTORIZADO', 'RECHAZADO');

-- Enum para entrada/salida
CREATE TYPE entry_exit_enum AS ENUM ('ENTRADA', 'SALIDA');

-- Tabla: No Marcaciones
CREATE TABLE attendance_no_marcaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  area TEXT,
  cargo TEXT,
  jefe_terminal TEXT,
  terminal_code TEXT NOT NULL,
  cabezal TEXT,
  incident_state TEXT,
  schedule_in_out TEXT,
  date DATE NOT NULL,
  time_range TEXT,
  observations TEXT,
  informed_by TEXT,
  auth_status auth_status_enum NOT NULL DEFAULT 'PENDIENTE',
  authorized_by TEXT,
  authorized_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_by_supervisor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_no_marcaciones_rut ON attendance_no_marcaciones(rut);
CREATE INDEX idx_no_marcaciones_terminal ON attendance_no_marcaciones(terminal_code);
CREATE INDEX idx_no_marcaciones_status ON attendance_no_marcaciones(auth_status);
CREATE INDEX idx_no_marcaciones_date ON attendance_no_marcaciones(date DESC);

CREATE TRIGGER update_no_marcaciones_updated_at
  BEFORE UPDATE ON attendance_no_marcaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla: Sin Credenciales
CREATE TABLE attendance_sin_credenciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  terminal_code TEXT NOT NULL,
  cabezal TEXT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  cargo TEXT,
  supervisor_autoriza TEXT,
  area TEXT,
  responsable TEXT,
  observacion TEXT,
  auth_status auth_status_enum NOT NULL DEFAULT 'PENDIENTE',
  authorized_by TEXT,
  authorized_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_by_supervisor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sin_credenciales_rut ON attendance_sin_credenciales(rut);
CREATE INDEX idx_sin_credenciales_terminal ON attendance_sin_credenciales(terminal_code);
CREATE INDEX idx_sin_credenciales_status ON attendance_sin_credenciales(auth_status);
CREATE INDEX idx_sin_credenciales_date ON attendance_sin_credenciales(date DESC);

CREATE TRIGGER update_sin_credenciales_updated_at
  BEFORE UPDATE ON attendance_sin_credenciales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla: Cambios de Día
CREATE TABLE attendance_cambios_dia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  terminal_code TEXT NOT NULL,
  cabezal TEXT,
  date DATE NOT NULL,
  prog_start TIME,
  prog_end TIME,
  reprogram_start TIME,
  reprogram_end TIME,
  day_off_date DATE,
  day_off_start TIME,
  day_off_end TIME,
  day_on_date DATE,
  day_on_start TIME,
  day_on_end TIME,
  document_path TEXT,
  auth_status auth_status_enum NOT NULL DEFAULT 'PENDIENTE',
  authorized_by TEXT,
  authorized_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_by_supervisor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cambios_dia_rut ON attendance_cambios_dia(rut);
CREATE INDEX idx_cambios_dia_terminal ON attendance_cambios_dia(terminal_code);
CREATE INDEX idx_cambios_dia_status ON attendance_cambios_dia(auth_status);
CREATE INDEX idx_cambios_dia_date ON attendance_cambios_dia(date DESC);

CREATE TRIGGER update_cambios_dia_updated_at
  BEFORE UPDATE ON attendance_cambios_dia
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla: Autorizaciones (retiro anticipado / llegada tardía)
CREATE TABLE attendance_autorizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  cargo TEXT,
  terminal_code TEXT NOT NULL,
  turno TEXT,
  horario TEXT,
  authorization_date DATE NOT NULL,
  entry_or_exit entry_exit_enum NOT NULL,
  motivo TEXT NOT NULL,
  auth_status auth_status_enum NOT NULL DEFAULT 'PENDIENTE',
  authorized_by TEXT,
  authorized_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_by_supervisor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_autorizaciones_rut ON attendance_autorizaciones(rut);
CREATE INDEX idx_autorizaciones_terminal ON attendance_autorizaciones(terminal_code);
CREATE INDEX idx_autorizaciones_status ON attendance_autorizaciones(auth_status);
CREATE INDEX idx_autorizaciones_date ON attendance_autorizaciones(authorization_date DESC);

CREATE TRIGGER update_autorizaciones_updated_at
  BEFORE UPDATE ON attendance_autorizaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for attendance tables
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_no_marcaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_sin_credenciales;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_cambios_dia;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_autorizaciones;

-- RLS for attendance tables
ALTER TABLE attendance_no_marcaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sin_credenciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_cambios_dia ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_autorizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for no_marcaciones" ON attendance_no_marcaciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sin_credenciales" ON attendance_sin_credenciales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for cambios_dia" ON attendance_cambios_dia FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for autorizaciones" ON attendance_autorizaciones FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- STORAGE: Create bucket for attendance documents
-- Bucket name: attendance-docs
-- Public: false
-- =============================================
