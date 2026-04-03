# Fase 4B — Iteración 1 (Backend/Database) Runbook

Este documento deja **exactamente** qué ejecutar en Supabase para implementar Iteración 1 sin tocar checkout ni cupones.

## Alcance de esta iteración

1. Estados core de pedido (`new`, `confirmed`, `in_transit`, `delivered`, `cancelled` + compat con `processing`).
2. Historial/timeline de estados.
3. Tracking público básico por `tracking_token`.
4. WhatsApp automático solo para `confirmed`, `in_transit`, `delivered` (vía cola `outbound_messages`).
5. Compatibilidad con estados heredados (`completed`) para no romper datos existentes.

## SQL exacto a ejecutar

Ejecutar el archivo completo:

- `migration_009_phase4b_iteration1_backend.sql`

> Si vas a correrlo manualmente en el SQL Editor de Supabase, copiá y pegá **todo** el contenido del archivo y ejecutalo en una sola corrida transaccional (o por bloques en el mismo orden del archivo).

## Orden de migración (importante)

1. Extensión de `orders` (`status_updated_at`, `tracking_token`, índices y status check).
2. Creación de `order_status_history`.
3. Creación de `outbound_messages`.
4. RLS/policies para tablas nuevas.
5. RPCs:
   - `get_order_tracking_public(text)`
   - `get_order_timeline(uuid)`
   - `update_order_status(uuid, text, text)`
6. Bootstrap del historial inicial para órdenes existentes.

## Verificaciones rápidas post-migración

```sql
-- 0) dependencia crítica para RLS/RPC
select proname
from pg_proc
where proname = 'has_store_access';

-- 1) columnas nuevas en orders
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'orders'
  and column_name in ('status_updated_at','tracking_token','last_whatsapp_status_enqueued','last_whatsapp_enqueued_at');

-- 2) tablas creadas
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in ('order_status_history','outbound_messages');

-- 3) funciones creadas
select routine_name
from information_schema.routines
where routine_schema='public'
  and routine_name in ('get_order_tracking_public','get_order_timeline','update_order_status');

-- 4) validar tracking público
select public.get_order_tracking_public((select tracking_token from public.orders limit 1));
```

## Nota operativa

- Esta iteración crea la cola y el encolado automático.
- El worker/proceso que consume `outbound_messages` y marca `sent/failed` puede implementarse a continuación (sin cambiar el contrato de esta migración).
