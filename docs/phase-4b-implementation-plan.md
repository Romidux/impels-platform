# Impels Commerce — Fase 4B (Operación + Postventa + Retención)

> Objetivo: mejorar operación del vendedor, experiencia post-compra y retención sin romper checkout actual, ni tocar lógica crítica de cupones, con enfoque **WhatsApp-first** para comercios paraguayos.

## 1) Features principales

### 1.1 Estados de pedido mejorados (modelo simple y robusto)

Se propone un estado principal `status` en `orders` con flujo lineal y pocos desvíos:

1. `new` (pedido recién creado desde checkout)
2. `confirmed` (vendedor confirma recepción)
3. `preparing` (armado/preparación)
4. `ready_for_delivery` (listo para envío/retiro)
5. `in_transit` (si aplica envío)
6. `delivered` (entregado)
7. `completed` (cerrado administrativamente)
8. `cancelled` (cancelado)

Estados auxiliares opcionales:
- `payment_pending`, `payment_confirmed` (si ya existe lógica de pago parcial/manual)

Principios:
- Sin estados ambiguos.
- Transiciones controladas (no saltos arbitrarios de `new` a `delivered`, salvo override admin explícito).
- Compatible con flujo actual de checkout (el checkout sigue creando `new`).

### 1.2 Mensajes automáticos por cambio de estado (WhatsApp)

Notificaciones automáticas al cliente cuando:
- pedido confirmado
- pedido en preparación
- pedido listo
- pedido en camino (si envío)
- pedido entregado
- pedido cancelado (con motivo breve)

Siempre con plantillas cortas y accionables (sin texto largo ni ruido).

### 1.3 Seguimiento de pedidos

- **Para vendedor (dashboard):** timeline de eventos de estado + quién hizo el cambio + hora.
- **Para cliente (link de tracking):** estado actual + últimos hitos + resumen de pedido.
- Link de tracking público seguro por token (no por ID incremental solo).

### 1.4 Base para retención

Primeros bloques de retención (sin automatización compleja):
- mensaje post-entrega con CTA de recompra
- recordatorio de recompra X días después (opt-in / controlado)
- etiqueta básica de cliente (`first_time`, `repeat`, `high_value`)

---

## 2) Arquitectura

## 2.1 Cambios de datos (Supabase/Postgres)

### Tabla `orders` (extensión, no ruptura)
Agregar columnas:
- `status text not null default 'new'`
- `status_updated_at timestamptz not null default now()`
- `tracking_token text unique` (para vista pública)
- `last_whatsapp_status_enqueued text` (idempotencia simple)
- `last_whatsapp_enqueued_at timestamptz`

Índices sugeridos:
- `(tenant_id, status, created_at desc)`
- `(tracking_token)`

### Nueva tabla `order_status_history`
Campos sugeridos:
- `id uuid pk`
- `tenant_id uuid not null`
- `order_id uuid not null`
- `from_status text`
- `to_status text not null`
- `changed_by uuid` (admin user)
- `change_reason text`
- `created_at timestamptz default now()`
- `notification_enqueued boolean default false`
- `notification_sent_at timestamptz`

Objetivo:
- auditoría operativa
- base para timeline
- anti-debug futuro

### Nueva tabla `outbound_messages` (cola liviana)
Campos:
- `id uuid pk`
- `tenant_id uuid not null`
- `channel text not null` (`whatsapp`)
- `recipient text not null`
- `template_key text not null`
- `payload jsonb not null`
- `dedupe_key text unique`
- `status text not null default 'queued'` (`queued|sent|failed|skipped`)
- `attempts int not null default 0`
- `last_error text`
- `scheduled_at timestamptz default now()`
- `sent_at timestamptz`
- `created_at timestamptz default now()`

Con esto se evita mandar mensajes directo desde UI y se mejora idempotencia.

## 2.2 RLS y seguridad

- `orders` y `order_status_history`: acceso por `tenant_id` para admins.
- Vista tracking cliente vía RPC pública con `tracking_token` (no expone datos sensibles de otros pedidos).
- `outbound_messages` sin acceso público; sólo backend/service role.

## 2.3 RPC nuevas

1. `update_order_status(order_id, new_status, reason)`
- valida transición permitida
- actualiza `orders.status`
- inserta `order_status_history`
- encola mensaje WhatsApp si aplica
- transaccional (all-or-nothing)

2. `get_order_timeline(order_id)`
- devuelve historial ordenado para dashboard

3. `get_order_tracking_public(tracking_token)` (SECURITY DEFINER + salida mínima)
- estado actual, hitos, resumen (items resumidos, total, método envío)

4. `enqueue_post_delivery_reengagement(order_id)`
- agenda mensaje de recompra (p.ej. +7 días)

5. (Opcional) `retry_outbound_message(message_id)`
- para soporte operativo en dashboard

## 2.4 Integración con lo existente

- Checkout actual: **sin cambios de lógica crítica**. Sigue creando orden y datos de cupón tal como está.
- Flujo WhatsApp checkout actual: se mantiene (mensaje inicial de pedido).
- Fase 4B agrega notificaciones posteriores por estado, desacopladas en cola.

---

## 3) Frontend

## 3.1 Dashboard — lista de pedidos

Agregar:
- filtro por estado
- badge de estado con color consistente
- acción rápida “Cambiar estado”

## 3.2 Dashboard — Order Detail

Bloques nuevos:
1. **Estado actual** (selector + botón guardar)
2. **Timeline** (historial cronológico)
3. **Mensajería**
   - último mensaje enviado
   - estado de envío
   - botón “Reenviar último mensaje” (si failed)

## 3.3 Vista cliente (tracking)

Nueva ruta pública tipo:
- `/track/[trackingToken]`

Contenido:
- estado actual legible
- barra/timeline simple
- resumen (order_id corto, total, envío)
- CTA WhatsApp soporte

## 3.4 UX exacta del flujo (cambio de estado)

1. Vendedor abre Order Detail.
2. Selecciona nuevo estado válido.
3. (Opcional) escribe motivo corto.
4. Click en “Actualizar estado”.
5. Backend ejecuta `update_order_status`.
6. UI muestra:
   - éxito: estado actualizado + timeline refrescado + “mensaje programado/enviado”
   - error: transición inválida o fallo de mensajería (con fallback claro)

Regla UX:
- No bloquear cambio de estado por fallo de WhatsApp; sólo marcar notificación como failed para retry.

---

## 4) WhatsApp Flow

## 4.1 Mensajes automáticos propuestos

Template keys:
- `order_confirmed`
- `order_preparing`
- `order_ready`
- `order_in_transit`
- `order_delivered`
- `order_cancelled`
- `reorder_reminder`

## 4.2 Cuándo se disparan

- En transición de estado confirmada (evento en `order_status_history`).
- `reorder_reminder`: job programado tras `delivered` (+7 días, configurable por tenant).

## 4.3 Qué incluyen

Siempre incluir sólo lo útil:
- nombre del comercio
- número de pedido corto
- estado nuevo
- siguiente acción esperada
- link de tracking
- CTA soporte (WhatsApp)

Ejemplo corto:
“Tu pedido #A12B ya está en camino 🚚. Seguimiento: [link]. Si necesitás ayuda, respondé este mensaje.”

## 4.4 Anti-spam / control de frecuencia

- `dedupe_key` por `order_id + status` (evita duplicados).
- ventana anti-ruido (ej. no más de 1 mensaje de estado cada X minutos salvo cancelación).
- toggle por tenant para desactivar ciertos templates.
- respeto de horario comercial para mensajes no críticos (recompra).

---

## 5) Orden de implementación (iteraciones)

## Iteración 1 — Core operativo (MVP fuerte)

1. Migraciones:
- columnas de estado en `orders`
- tabla `order_status_history`
- tracking token

2. RPC:
- `update_order_status`
- `get_order_timeline`
- `get_order_tracking_public`

3. Frontend:
- status badge + filtro en lista
- cambio de estado en Order Detail
- timeline en Order Detail
- página pública de tracking básica

4. WhatsApp:
- enviar sólo 3 estados clave al inicio: `confirmed`, `in_transit`, `delivered`
- dedupe básico

**Resultado esperado:** operación diaria más ordenada + cliente sabe en qué etapa está.

## Iteración 2 — Calidad de operación + UX

1. Ampliar estados (`preparing`, `ready_for_delivery`, `cancelled` con motivo).
2. Cola `outbound_messages` + retry manual.
3. UI de mensajería en Order Detail (sent/failed/retry).
4. Mejorar tracking público (timeline más claro + copy amigable).

**Resultado esperado:** menos soporte manual preguntando “¿dónde está mi pedido?”.

## Iteración 3 — Pro features de retención

1. `reorder_reminder` programado por tenant.
2. Segmentación básica cliente (`first_time/repeat/high_value`).
3. Plantillas dinámicas por tipo de cliente.
4. Métricas de retención iniciales en dashboard.

**Resultado esperado:** activar recompra sin complejidad de CRM pesado.

---

## 6) Riesgos y mitigaciones

1. **Inconsistencia de estados**
- Riesgo: cambios no válidos o saltos extraños.
- Mitigación: matriz de transiciones en backend + constraints + tests de RPC.

2. **Duplicación de mensajes**
- Riesgo: doble click, retries, race conditions.
- Mitigación: `dedupe_key` único + operaciones idempotentes + locking liviano por orden.

3. **Mala UX para vendedor**
- Riesgo: demasiados estados/confusión.
- Mitigación: empezar con pocos estados en Iteración 1 y expandir gradualmente.

4. **Ruido para cliente (spam)**
- Riesgo: muchos mensajes por micro-cambios.
- Mitigación: throttling + templates activables por tenant + ventana horaria.

5. **Exposición de datos en tracking público**
- Riesgo: fuga por IDs predecibles.
- Mitigación: token aleatorio largo + RPC de salida mínima + rate limit.

6. **Dependencia de proveedor WhatsApp**
- Riesgo: errores temporales o límites.
- Mitigación: cola + reintentos + estado `failed` visible y accionable.

---

## 7) Criterio de éxito de Fase 4B

Mínimos de aceptación:
1. Vendedor puede actualizar estado en ≤ 2 clics desde Order Detail.
2. Cada cambio de estado genera historial auditable.
3. Cliente puede consultar tracking público sin login.
4. Mensajes WhatsApp salen una sola vez por estado (sin duplicados).
5. Fallo de envío no rompe operación ni bloquea cambio de estado.
6. Checkout + cupones siguen funcionando exactamente como hoy.

KPIs sugeridos (30 días):
- ↓ consultas manuales “estado del pedido” (objetivo: -25%).
- ↑ tasa de pedidos marcados `delivered` con trazabilidad completa (>90%).
- ↓ tiempo promedio desde `new` a `confirmed`.
- ↑ recompra (cohorte entregados con reorder reminder vs control).

---

## Scope guardrails (para no sobre-ingenierizar)

- No introducir motor de workflows complejo.
- No crear CRM completo en esta fase.
- No mezclar con refactors de checkout/cupones.
- Priorizar trazabilidad + comunicación + simplicidad operativa.
