# Asiss – Dashboard logístico (SPA)

Base modular para una SPA React + TypeScript + Vite. Estructura lista para conectar con Supabase (Edge Functions + Realtime) y crecer por módulos.

## Requisitos
- Node 18+
- npm

## Instalación y uso
1. `npm install`
2. `npm run dev`
3. Abrir el puerto indicado (Vite).

Scripts:
- `npm run dev` – entorno local
- `npm run build` – build de producción
- `npm run preview` – vista previa del build

Variables de entorno (futuras conexiones):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_EMAIL_API_URL=
RESEND_API_KEY=
RESEND_FROM=notificaciones@asiss.online
RESEND_FALLBACK_TO=tu@correo.com,otro@correo.com
RESEND_BRAND_URL=https://asiss.online
```

## Arquitectura
- `src/app` – layout, router, providers (React Query, etc.).
- `src/features/*` – módulos de negocio (personal, reuniones, tareas, aseo, miniCheck, etc.). Cada módulo contiene sus tipos (`types.ts`), servicios/adapters y la página.
- `src/shared` – componentes UI reutilizables (PageHeader, FiltersBar, DataTable, estados), stores Zustand, servicios (sesión/notifications/email mocks), utilidades (xlsx, terminales, fechas).
- `src/mock` – helpers para adapters mock (`createMockListAdapter`).

Layout tipo dashboard: header fijo con selector global de terminal, notificaciones (badge, dropdown y toast), sidebar colapsable y contenido principal responsive. Sin almacenamiento cliente (solo memoria en stores/adapters).

### Terminales y grupos
Configuración en `src/shared/utils/terminal.ts` con terminales, grupo El Roble + La Reina y helpers para filtrar `terminalContext`. Selector global en header + filtros por página.

### Adapters mock y Supabase después
Cada módulo usa un adapter mock (`createMockListAdapter`) que acepta `terminalContext`, `filters` y `scope` (`view`/`all`). Para conectar Supabase:
1. Implementar un adapter que cumpla la misma firma (`list(params) => Promise<T[]>`).
2. Usar Supabase client o Edge Functions dentro del adapter y devolver view/all según corresponda.
3. Mantener el uso de React Query en las páginas.

### Sesión y seguridad
Contratos en `src/shared/types/session.ts` y mock en `services/sessionService.ts`. Pensado para Edge Functions con cookie HttpOnly; actualmente en memoria.

### Excel XLSX
Utilidad genérica `exportToXlsx({ filename, sheetName, rows, columns })` en `src/shared/utils/exportToXlsx.ts`. Cada tabla usa `ExportMenu` para exportar vista filtrada o todo (scope `all`).

### Notificaciones realtime (estructura)
Interfaces en `shared/types/notification.ts` y mock provider en `shared/services/notificationService.ts`. `NotificationCenter` se suscribe y muestra badge + dropdown + toast. Listo para reemplazar publish/subscribe por Supabase Realtime.

### Correo interno (Resend)
Formulario en `features/informativos/InformativosPage.tsx` usa `emailService.sendEmail(payload)` contra `VITE_EMAIL_API_URL` (por defecto `/functions/v1/send-email`). Incluye función Edge Supabase en `supabase/functions/send-email` que usa Resend con template responsivo premium.

Para habilitar envíos reales:
1. Añade al `.env.local` las claves de arriba (usa tu API key de Resend; no la expongas en el frontend).
2. `RESEND_FROM` debe ser una casilla verificada en el dominio `asiss.online`.
3. `RESEND_FALLBACK_TO` define destinatarios por defecto (coma).
4. Ejecuta la función localmente con Supabase CLI: `supabase functions serve send-email --env-file .env.local`.
5. En producción, publica la función y configura `VITE_EMAIL_API_URL` a la URL de la función (ej. `https://<project>.functions.supabase.co/send-email`).

## Agregar una nueva sección
1. Crear carpeta en `src/features/nueva-seccion` con `types.ts` y `service.ts` (adapter con `list(params)` siguiendo `ListAdapter`).
2. Crear la página React usando componentes compartidos (`PageHeader`, `FiltersBar`, `DataTable`, `ExportMenu`) y `useTerminalStore` + React Query.
3. Añadir la ruta en `src/app/router/AppRouter.tsx` y la entrada en el sidebar (`src/shared/components/layout/Sidebar.tsx`).
4. (Opcional) Añadir mocks en `src/mock` si necesitas datos de prueba.

## Estado global y datos
- Zustand sólo en memoria: `sessionStore`, `terminalStore`, `notificationStore`.
- React Query para data fetching (mocks ahora, Supabase después).
- Prohibido usar localStorage/sessionStorage/IndexedDB (no implementado).

## UI reusable
Componentes en `src/shared/components/common`: PageHeader, FiltersBar, DataTable, Empty/Loading/ErrorState, ExportMenu, TerminalSelector, NotificationCenter. Diseño responsivo y listo para tablas/listados con botón “Nuevo” y exportar Excel.
