-- ================================================================
-- Migration 014: Atomic store creation RPC + data repair
-- ================================================================
-- Purpose:
--   1. Create RPC create_store_complete() for atomic store creation
--   2. Restrict execution to service_role only (never from browser)
--   3. Repair any existing stores with missing related records
-- ================================================================

-- ================================================================
-- 1. RPC: create_store_complete
-- ================================================================
-- Creates a store with ALL required related records in a single
-- atomic transaction. If any step fails, nothing is committed.
--
-- Security model:
--   - SECURITY DEFINER: runs as DB owner, bypasses RLS
--   - SET search_path = public: prevents search_path injection
--   - EXECUTE restricted to service_role only (see REVOKE below)
--   - Only callable from Server Actions via admin client
-- ================================================================

CREATE OR REPLACE FUNCTION public.create_store_complete(
  p_owner_id uuid,
  p_name text,
  p_slug text,
  p_description text DEFAULT NULL,
  p_currency text DEFAULT 'Gs',
  p_whatsapp text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid;
BEGIN
  -- ── Input validation ────────────────────────────────────────────
  IF p_owner_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT: owner_id is required';
  END IF;

  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'INVALID_INPUT: Store name is required';
  END IF;

  IF p_slug IS NULL OR btrim(p_slug) = '' THEN
    RAISE EXCEPTION 'INVALID_INPUT: Store slug is required';
  END IF;

  -- ── Prevent duplicate stores per user ───────────────────────────
  IF EXISTS (SELECT 1 FROM public.stores WHERE owner_id = p_owner_id) THEN
    RAISE EXCEPTION 'USER_ALREADY_HAS_STORE';
  END IF;

  -- ── 1. Create store ─────────────────────────────────────────────
  INSERT INTO public.stores (name, slug, description, owner_id, plan, is_active)
  VALUES (
    btrim(p_name),
    btrim(p_slug),
    nullif(btrim(coalesce(p_description, '')), ''),
    p_owner_id,
    'free',
    true
  )
  RETURNING id INTO v_store_id;

  -- ── 2. Create store_settings ────────────────────────────────────
  -- Uses schema defaults for template ('modern'), colors, etc.
  INSERT INTO public.store_settings (
    store_id, currency, whatsapp_number, template, primary_color, secondary_color
  ) VALUES (
    v_store_id,
    coalesce(nullif(btrim(coalesce(p_currency, '')), ''), 'Gs'),
    nullif(btrim(coalesce(p_whatsapp, '')), ''),
    'modern',       -- schema default
    '#2563eb',      -- schema default
    '#7c3aed'       -- schema default
  );

  -- ── 3. Create default section visibility ────────────────────────
  INSERT INTO public.store_sections_visibility (store_id, section, is_visible, sort_order)
  VALUES
    (v_store_id, 'hero_banner',            true, 0),
    (v_store_id, 'featured_categories',    true, 1),
    (v_store_id, 'featured_products',      true, 2),
    (v_store_id, 'main_catalog',           true, 3),
    (v_store_id, 'promo_banner',           true, 4),
    (v_store_id, 'recommended_products',   true, 5);

  -- ── 4. Create empty branding record ─────────────────────────────
  -- footer defaults come from column DEFAULTs ('Productos', 'Contacto')
  INSERT INTO public.store_branding (store_id) VALUES (v_store_id);

  -- ── 5. Register owner as store member ───────────────────────────
  INSERT INTO public.store_members (store_id, user_id, role)
  VALUES (v_store_id, p_owner_id, 'owner');

  RETURN v_store_id;
END;
$$;

-- ── Restrict execution: only service_role can call this ───────────
-- This prevents any browser client (anon/authenticated) from calling
-- the function directly. It can ONLY be invoked from Server Actions
-- using the admin client (SUPABASE_SERVICE_ROLE_KEY).
REVOKE EXECUTE ON FUNCTION public.create_store_complete(uuid, text, text, text, text, text)
  FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_store_complete(uuid, text, text, text, text, text)
  TO service_role;


-- ================================================================
-- 2. REPAIR: Fix existing stores with missing related records
-- ================================================================
-- All queries use LEFT JOIN ... WHERE IS NULL pattern to be
-- idempotent — safe to run multiple times without duplicating data.
-- UNIQUE constraints provide an additional safety net.
-- ================================================================

-- ── 2a. Repair missing store_settings ─────────────────────────────
-- store_settings has UNIQUE(store_id), so duplicates are impossible.
INSERT INTO public.store_settings (store_id, currency, template, primary_color, secondary_color)
SELECT s.id, 'Gs', 'modern', '#2563eb', '#7c3aed'
FROM public.stores s
LEFT JOIN public.store_settings ss ON ss.store_id = s.id
WHERE ss.id IS NULL;

-- ── 2b. Repair missing store_branding ─────────────────────────────
-- store_branding has UNIQUE(store_id), so duplicates are impossible.
INSERT INTO public.store_branding (store_id)
SELECT s.id
FROM public.stores s
LEFT JOIN public.store_branding sb ON sb.store_id = s.id
WHERE sb.id IS NULL;

-- ── 2c. Repair missing store_sections_visibility ──────────────────
-- Has UNIQUE(store_id, section), so only truly missing sections
-- are inserted. Existing sections are preserved as-is.
INSERT INTO public.store_sections_visibility (store_id, section, is_visible, sort_order)
SELECT s.id, sec.section, true, sec.sort_order
FROM public.stores s
CROSS JOIN (VALUES
  ('hero_banner',            0),
  ('featured_categories',    1),
  ('featured_products',      2),
  ('main_catalog',           3),
  ('promo_banner',           4),
  ('recommended_products',   5)
) AS sec(section, sort_order)
LEFT JOIN public.store_sections_visibility ssv
  ON ssv.store_id = s.id AND ssv.section = sec.section
WHERE ssv.id IS NULL;

-- ── 2d. Repair missing owner in store_members ─────────────────────
-- Has UNIQUE(store_id, user_id), so duplicates are impossible.
INSERT INTO public.store_members (store_id, user_id, role)
SELECT s.id, s.owner_id, 'owner'
FROM public.stores s
LEFT JOIN public.store_members sm
  ON sm.store_id = s.id AND sm.user_id = s.owner_id
WHERE sm.id IS NULL;
