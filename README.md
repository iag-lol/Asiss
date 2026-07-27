# Asiss Dashboard

Sistema de gestión de asistencia y operaciones.

## Estado del Proyecto
- **Versión**: 1.1.0
- **Última actualización**: Implementación del centro de revisión Mini-Check.

## Características
- Gestión de Asistencia
- Dashboard de KPIs
- Centro Mini-Check con pestañas de cámaras, TAG, extintores, Mobileye, odómetro, rack, Wi-Fi y publicidad
- Informes Mini-Check con filtro ISO semanal global, cobertura de flota, tickets, gráficos y revisiones en tiempo real
- Reportes Excel

## Configuración Mini-Check

Mini-Check consume una instancia Supabase independiente de la base principal. Configura
estas variables en el entorno de desarrollo y despliegue:

```env
VITE_MINICHECK_SUPABASE_URL=https://<proyecto-mini-check>.supabase.co
VITE_MINICHECK_SUPABASE_ANON_KEY=<anon-key-o-publishable-key>
```

La aplicación no utiliza `VITE_SUPABASE_URL` ni `VITE_SUPABASE_ANON_KEY` como respaldo
para este módulo, evitando consultas accidentales a la base ASISS.

Para recibir actualizaciones automáticas, habilita las tablas Mini-Check necesarias en
la publicación Realtime de Supabase. La interfaz refleja el estado de la suscripción y
actualiza las consultas activas cuando llega un cambio en el esquema `public`.

## Despliegue
El sitio se despliega automáticamente a GitHub Pages en cada push a la rama `main`.
