-- =============================================
-- MIGRACIÓN: STORAGE - FIX PERMISOS (VERSIÓN SEGURA)
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Asegurar que el bucket 'attendance-docs' exista y sea público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance-docs', 
  'attendance-docs', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- NOTA: Hemos eliminado 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY' 
-- porque causa errores de permisos y RLS ya viene activado por defecto.

-- 2. ELIMINAR POLÍTICAS ANTIQUAS (Para limpiar)
DROP POLICY IF EXISTS "Public Upload Attendance Docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Attendance Docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Attendance Docs" ON storage.objects;

-- 3. CREAR POLÍTICAS DE ACCESO PÚBLICO
-- Permitir INSERT a cualquier usuario (incluyendo anon)
CREATE POLICY "Public Upload Attendance Docs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'attendance-docs');

-- Permitir SELECT a cualquier usuario
CREATE POLICY "Public Access Attendance Docs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attendance-docs');

-- Permitir UPDATE a cualquier usuario
CREATE POLICY "Public Update Attendance Docs"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'attendance-docs');

-- VERIFICACIÓN
SELECT name, public FROM storage.buckets WHERE id = 'attendance-docs';
