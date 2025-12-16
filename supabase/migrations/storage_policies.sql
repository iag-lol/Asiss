-- =============================================
-- MIGRACIÓN: STORAGE - ATTENDANCE DOCS
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Crear el bucket 'attendance-docs' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance-docs', 
  'attendance-docs', 
  true, 
  5242880, -- Límite de 5MB (bytes)
  ARRAY['image/jpeg', 'image/png', 'application/pdf'] -- Tipos permitidos
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- 2. Habilitar RLS en storage.objects (por seguridad estándar, aunque ya suele estar)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de acceso (Permisivas para este caso de uso)

-- Política para VER archivos (Público)
DROP POLICY IF EXISTS "Public Access Attendance Docs" ON storage.objects;
CREATE POLICY "Public Access Attendance Docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'attendance-docs');

-- Política para SUBIR archivos (Cualquier usuario autenticado o anónimo si la app lo permite)
-- Nota: Ajustar según necesidad. Aquí permitimos a todos (anon y authenticated)
DROP POLICY IF EXISTS "Public Upload Attendance Docs" ON storage.objects;
CREATE POLICY "Public Upload Attendance Docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attendance-docs');

-- Política para ACTUALIZAR archivos (Opcional)
DROP POLICY IF EXISTS "Public Update Attendance Docs" ON storage.objects;
CREATE POLICY "Public Update Attendance Docs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'attendance-docs');

-- VERIFICACIÓN
SELECT * FROM storage.buckets WHERE id = 'attendance-docs';
