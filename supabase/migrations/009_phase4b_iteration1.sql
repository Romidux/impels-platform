-- ================================================================
-- MIGRATION 009: PHASE 4B ITERATION 1 (BACKEND / DATABASE CORE)
-- ================================================================
-- Scope (Iteration 1 only):
-- 1) Core order statuses
-- 2) Status timeline/history
-- 3) Public tracking (basic)
-- 4) WhatsApp auto notifications for key states:
--    confirmed, in_transit, delivered
--
-- Guardrails:
-- - Do not modify checkout RPC flow
-- - Do not modify coupon logic
-- - Keep idempotent and simple

-- Preflight dependency check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'has_store_access'
      AND pg_function_is_visible(oid)
  ) THEN
    RAISE EXCEPTION 'Dependencia faltante: public.has_store_access(uuid, uuid)';
  END IF;
END $$;

-- ------------------------------------------------
-- 1) Extend orders table for Iteration 1
-- ------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tracking_token text,
  ADD COLUMN IF NOT EXISTS last_whatsapp_status_enqueued text,
  ADD COLUMN IF NOT EXISTS last_whatsapp_enqueued_at timestamptz;

-- Backfill tracking token for old rows
UPDATE public.orders
SET tracking_token = lower(replace(gen_random_uuid()::text, '-', ''))
WHERE tracking_token IS NULL;

-- enforce non-null after backfill
ALTER TABLE public.orders
  ALTER COLUMN tracking_token SET NOT NULL;

-- unique token to avoid public URL collisions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_tracking_token_key'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_tracking_token_key UNIQUE (tracking_token);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_store_status_created
  ON public.orders (store_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_tracking_token
  ON public.orders (tracking_token);

-- widen status check without breaking existing data/flow
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_status_check'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (
    status = ANY (
      ARRAY[
        'new',
        'confirmed',
        'processing',
        'in_transit',
        'delivered',
        'completed',
        'cancelled'
      ]
    )
  );

-- ------------------------------------------------
-- 2) Order status history (timeline)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  change_reason text,
  notification_enqueued boolean NOT NULL DEFAULT false,
  notification_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_status_history_to_status_check
    CHECK (
      to_status = ANY (
        ARRAY[
          'new',
          'confirmed',
          'processing',
          'in_transit',
          'delivered',
          'completed',
          'cancelled'
        ]
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_created
  ON public.order_status_history (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_status_history_store_created
  ON public.order_status_history (store_id, created_at DESC);

-- ------------------------------------------------
-- 3) Minimal outbound messages queue (Iteration 1)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.outbound_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  channel text NOT NULL,
  recipient text NOT NULL,
  template_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text,
  status text NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT outbound_messages_channel_check CHECK (channel IN ('whatsapp')),
  CONSTRAINT outbound_messages_status_check CHECK (status IN ('queued', 'sent', 'failed', 'skipped'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_outbound_messages_dedupe_key
  ON public.outbound_messages (dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outbound_messages_status_schedule
  ON public.outbound_messages (status, scheduled_at ASC);

-- ------------------------------------------------
-- 4) RLS / security
-- ------------------------------------------------
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store members can view order status history" ON public.order_status_history;
CREATE POLICY "Store members can view order status history"
  ON public.order_status_history FOR SELECT
  USING (public.has_store_access(store_id, auth.uid()));

DROP POLICY IF EXISTS "Store members can insert order status history" ON public.order_status_history;
CREATE POLICY "Store members can insert order status history"
  ON public.order_status_history FOR INSERT
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

DROP POLICY IF EXISTS "Store members can update order status history" ON public.order_status_history;
CREATE POLICY "Store members can update order status history"
  ON public.order_status_history FOR UPDATE
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

DROP POLICY IF EXISTS "Service role manages outbound messages" ON public.outbound_messages;
CREATE POLICY "Service role manages outbound messages"
  ON public.outbound_messages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Store members can read outbound messages" ON public.outbound_messages;
CREATE POLICY "Store members can read outbound messages"
  ON public.outbound_messages FOR SELECT
  USING (public.has_store_access(store_id, auth.uid()));

-- ------------------------------------------------
-- 5) RPCs (Iteration 1)
-- ------------------------------------------------

-- Public tracking RPC (minimal data exposure)
DROP FUNCTION IF EXISTS public.get_order_tracking_public(text);
CREATE OR REPLACE FUNCTION public.get_order_tracking_public(
  p_tracking_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_timeline jsonb;
  v_item_count integer;
BEGIN
  SELECT o.*
  INTO v_order
  FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.tracking_token = trim(p_tracking_token)
    AND s.is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'found', false,
      'message', 'Tracking no encontrado'
    );
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'from_status', h.from_status,
        'to_status', h.to_status,
        'created_at', h.created_at
      )
      ORDER BY h.created_at ASC
    ),
    '[]'::jsonb
  )
  INTO v_timeline
  FROM public.order_status_history h
  WHERE h.order_id = v_order.id;

  v_item_count := CASE
    WHEN jsonb_typeof(v_order.items) = 'array' THEN jsonb_array_length(v_order.items)
    ELSE 0
  END;

  RETURN jsonb_build_object(
    'found', true,
    'order_code', upper(substr(replace(v_order.id::text, '-', ''), 1, 8)),
    'status', v_order.status,
    'status_updated_at', v_order.status_updated_at,
    'tracking_token', v_order.tracking_token,
    'subtotal', v_order.subtotal,
    'total', v_order.total,
    'item_count', v_item_count,
    'shipping_method', v_order.shipping_method,
    'created_at', v_order.created_at,
    'timeline', v_timeline
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_tracking_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_tracking_public(text) TO anon, authenticated, service_role;

-- Dashboard timeline RPC
DROP FUNCTION IF EXISTS public.get_order_timeline(uuid);
CREATE OR REPLACE FUNCTION public.get_order_timeline(
  p_order_id uuid
)
RETURNS TABLE (
  id uuid,
  from_status text,
  to_status text,
  changed_by uuid,
  change_reason text,
  notification_enqueued boolean,
  notification_sent_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid;
BEGIN
  SELECT o.store_id
  INTO v_store_id
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF auth.uid() IS NULL OR NOT public.has_store_access(v_store_id, auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    h.id,
    h.from_status,
    h.to_status,
    h.changed_by,
    h.change_reason,
    h.notification_enqueued,
    h.notification_sent_at,
    h.created_at
  FROM public.order_status_history h
  WHERE h.order_id = p_order_id
  ORDER BY h.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_timeline(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_timeline(uuid) TO authenticated, service_role;

-- Status transition + WhatsApp enqueue (key statuses only)
DROP FUNCTION IF EXISTS public.update_order_status(uuid, text, text);
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_old_status text;
  v_should_enqueue boolean := false;
  v_template_key text;
  v_dedupe_key text;
BEGIN
  -- lock order row to avoid races / duplicates
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF auth.uid() IS NULL OR NOT public.has_store_access(v_order.store_id, auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  p_new_status := lower(trim(p_new_status));
  v_old_status := v_order.status;

  IF p_new_status = '' OR p_new_status IS NULL THEN
    RAISE EXCEPTION 'Estado inválido';
  END IF;

  IF p_new_status NOT IN ('new', 'confirmed', 'processing', 'in_transit', 'delivered', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Estado no permitido: %', p_new_status;
  END IF;

  IF p_new_status = v_old_status THEN
    RETURN jsonb_build_object(
      'ok', true,
      'order_id', v_order.id,
      'from_status', v_old_status,
      'to_status', p_new_status,
      'changed', false,
      'message_enqueued', false
    );
  END IF;

  -- transition matrix (simple + compatible with existing statuses)
  IF NOT (
    (v_old_status = 'new'        AND p_new_status IN ('confirmed', 'cancelled')) OR
    (v_old_status = 'confirmed'  AND p_new_status IN ('processing', 'in_transit', 'delivered', 'cancelled')) OR
    (v_old_status = 'processing' AND p_new_status IN ('in_transit', 'delivered', 'cancelled')) OR
    (v_old_status = 'in_transit' AND p_new_status IN ('delivered', 'cancelled')) OR
    (v_old_status = 'delivered'  AND p_new_status IN ('completed', 'cancelled')) OR
    (v_old_status = 'completed'  AND p_new_status IN ('cancelled'))
  ) THEN
    RAISE EXCEPTION 'Transición inválida: % -> %', v_old_status, p_new_status;
  END IF;

  UPDATE public.orders
  SET
    status = p_new_status,
    status_updated_at = now(),
    updated_at = now()
  WHERE id = v_order.id;

  IF p_new_status IN ('confirmed', 'in_transit', 'delivered') THEN
    v_should_enqueue := true;
    v_template_key := 'order_' || p_new_status;
    v_dedupe_key := 'order_status:' || v_order.id::text || ':' || p_new_status;

    INSERT INTO public.outbound_messages (
      store_id,
      order_id,
      channel,
      recipient,
      template_key,
      payload,
      dedupe_key,
      status,
      scheduled_at
    )
    VALUES (
      v_order.store_id,
      v_order.id,
      'whatsapp',
      v_order.customer_phone,
      v_template_key,
      jsonb_build_object(
        'order_id', v_order.id,
        'order_code', upper(substr(replace(v_order.id::text, '-', ''), 1, 8)),
        'from_status', v_old_status,
        'to_status', p_new_status,
        'tracking_token', v_order.tracking_token
      ),
      v_dedupe_key,
      'queued',
      now()
    )
    ON CONFLICT (dedupe_key) DO NOTHING;

    UPDATE public.orders
    SET
      last_whatsapp_status_enqueued = p_new_status,
      last_whatsapp_enqueued_at = now()
    WHERE id = v_order.id;
  END IF;

  INSERT INTO public.order_status_history (
    store_id,
    order_id,
    from_status,
    to_status,
    changed_by,
    change_reason,
    notification_enqueued,
    notification_sent_at,
    created_at
  )
  VALUES (
    v_order.store_id,
    v_order.id,
    v_old_status,
    p_new_status,
    auth.uid(),
    NULLIF(trim(p_reason), ''),
    v_should_enqueue,
    NULL,
    now()
  );

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', v_order.id,
    'from_status', v_old_status,
    'to_status', p_new_status,
    'changed', true,
    'message_enqueued', v_should_enqueue
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_order_status(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text, text) TO authenticated, service_role;

-- ------------------------------------------------
-- 6) Bootstrap initial history for existing orders
-- ------------------------------------------------
INSERT INTO public.order_status_history (
  store_id,
  order_id,
  from_status,
  to_status,
  changed_by,
  change_reason,
  notification_enqueued,
  notification_sent_at,
  created_at
)
SELECT
  o.store_id,
  o.id,
  NULL,
  o.status,
  NULL,
  'bootstrap_initial_status',
  false,
  NULL,
  o.created_at
FROM public.orders o
WHERE NOT EXISTS (
  SELECT 1
  FROM public.order_status_history h
  WHERE h.order_id = o.id
);
