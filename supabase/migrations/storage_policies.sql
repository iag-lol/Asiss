-- =============================================
-- MIGRACIÓN: STORAGE - ATTENDANCE DOCS (FIX PERMISOS ANÓNIMOS)
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
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- 2. Habilitar RLS (Seguridad estándar)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR POLÍTICAS ANTIQUAS (Para evitar conflictos)
DROP POLICY IF EXISTS "Public Access Attendance Docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Attendance Docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Attendance Docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to files" ON storage.objects;

-- 4. CREAR POLÍTICAS EXPLÍCITAS PARA 'public' (Usuario Anonimo y Autenticado)

-- PERMITIR VER ARCHIVOS (SELECT) a TODOS (public)
CREATE POLICY "Public Access Attendance Docs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attendance-docs');

-- PERMITIR SUBIR ARCHIVOS (INSERT) a TODOS (public)
-- Importante: 'TO public' permite que usuarios sin sesión de Supabase Auth (solo key anon) suban archivos.
CREATE POLICY "Public Upload Attendance Docs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'attendance-docs');

-- PERMITIR ACTUALIZAR ARCHIVOS (UPDATE) a TODOS (public)
CREATE POLICY "Public Update Attendance Docs"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'attendance-docs');

-- VERIFICACIÓN
SELECT name, public FROM storage.buckets WHERE id = 'attendance-docs';
