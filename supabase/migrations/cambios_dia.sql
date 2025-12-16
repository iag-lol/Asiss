-- =============================================
-- MIGRACIÓN: ASISTENCIA - CAMBIOS DE DÍA
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Si la tabla ya existe, elimínala primero (CUIDADO: perderás datos)
-- DROP TABLE IF EXISTS attendance_cambios_dia CASCADE;

-- Tabla: Cambios de Día (ACTUALIZADA)
CREATE TABLE IF NOT EXISTS attendance_cambios_dia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  terminal_code TEXT NOT NULL,
  cabezal TEXT,
  date DATE NOT NULL,
  
  -- Jornada Programada (desde Personal)
  prog_start TEXT,  -- Hora entrada programada (ej: "08:00")
  prog_end TEXT,    -- Hora salida programada (ej: "18:00")
  
  -- Día Programado (No Trabaja)
  day_off_date DATE,
  day_off_start TEXT,
  day_off_end TEXT,
  
  -- Día ReProgramado (Trabaja)
  day_on_date DATE,
  day_on_start TEXT,
  day_on_end TEXT,
  
  -- Documento adjunto
  document_path TEXT,
  
  -- Autorización
  auth_status TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (auth_status IN ('PENDIENTE', 'AUTORIZADO', 'RECHAZADO')),
  authorized_by TEXT,
  authorized_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Metadatos
  created_by_supervisor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_cambios_dia_rut ON attendance_cambios_dia(rut);
CREATE INDEX IF NOT EXISTS idx_cambios_dia_terminal ON attendance_cambios_dia(terminal_code);
CREATE INDEX IF NOT EXISTS idx_cambios_dia_status ON attendance_cambios_dia(auth_status);
CREATE INDEX IF NOT EXISTS idx_cambios_dia_date ON attendance_cambios_dia(date DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cambios_dia_updated_at ON attendance_cambios_dia;
CREATE TRIGGER update_cambios_dia_updated_at
  BEFORE UPDATE ON attendance_cambios_dia
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Permitir acceso público para ahora
ALTER TABLE attendance_cambios_dia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON attendance_cambios_dia;
CREATE POLICY "Allow all operations" ON attendance_cambios_dia
  FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_cambios_dia;

-- VERIFICACIÓN
SELECT 'Tabla attendance_cambios_dia creada correctamente' AS status;
