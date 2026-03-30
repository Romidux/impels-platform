-- ============================================================
-- admin_actions_log — Auditoría de acciones críticas (FINAL)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_actions_log (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  action text NOT NULL,
  store_id uuid NULL,
  performed_by uuid NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_actions_log_pkey PRIMARY KEY (id)
);

-- ============================================================
-- Foreign Keys (consistencia + no romper logs)
-- ============================================================

-- FK a stores (mantener logs aunque la tienda se elimine)
ALTER TABLE public.admin_actions_log
DROP CONSTRAINT IF EXISTS admin_actions_log_store_id_fkey;

ALTER TABLE public.admin_actions_log
ADD CONSTRAINT admin_actions_log_store_id_fkey
FOREIGN KEY (store_id)
REFERENCES public.stores(id)
ON DELETE SET NULL;

-- FK a usuarios (mantener logs aunque el usuario se elimine)
ALTER TABLE public.admin_actions_log
DROP CONSTRAINT IF EXISTS admin_actions_log_user_fkey;

ALTER TABLE public.admin_actions_log
ADD CONSTRAINT admin_actions_log_user_fkey
FOREIGN KEY (performed_by)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Policies (reejecutables y seguras)
-- ============================================================

-- Limpieza previa
DROP POLICY IF EXISTS "Authenticated users can view admin action logs" ON public.admin_actions_log;
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.admin_actions_log;

-- Lectura (puedes endurecer más adelante a solo super admin)
CREATE POLICY "Authenticated users can view admin action logs"
ON public.admin_actions_log
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Inserción (Server Action / backend)
CREATE POLICY "Authenticated users can insert logs"
ON public.admin_actions_log
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
