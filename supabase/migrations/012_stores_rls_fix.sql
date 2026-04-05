-- ================================================================
-- MIGRATION 012: Fix RLS policies for stores and related tables
-- ================================================================
-- Covers: stores, store_settings, store_sections_visibility, store_branding
-- Safe to re-run: uses DROP POLICY IF EXISTS before each CREATE POLICY
-- ================================================================

-- ── 0. has_store_access already exists — no changes needed ──────
-- The function public.has_store_access(uuid,uuid) is present in the DB
-- with existing dependent policies. We skip recreation to avoid
-- cascading drops.

-- ================================================================
-- 1. STORES
-- ================================================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Owners can read their own store
DROP POLICY IF EXISTS "Owners can view own store" ON public.stores;
CREATE POLICY "Owners can view own store"
  ON public.stores FOR SELECT
  USING (auth.uid() = owner_id);

-- Authenticated users can create their own store
DROP POLICY IF EXISTS "Authenticated users can create store" ON public.stores;
CREATE POLICY "Authenticated users can create store"
  ON public.stores FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own store
DROP POLICY IF EXISTS "Owners can update own store" ON public.stores;
CREATE POLICY "Owners can update own store"
  ON public.stores FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete their own store
DROP POLICY IF EXISTS "Owners can delete own store" ON public.stores;
CREATE POLICY "Owners can delete own store"
  ON public.stores FOR DELETE
  USING (auth.uid() = owner_id);


-- ================================================================
-- 2. STORE_SETTINGS
-- ================================================================
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own store_settings" ON public.store_settings;
CREATE POLICY "Owners can view own store_settings"
  ON public.store_settings FOR SELECT
  USING (public.has_store_access(store_id, auth.uid()));

DROP POLICY IF EXISTS "Owners can insert store_settings" ON public.store_settings;
CREATE POLICY "Owners can insert store_settings"
  ON public.store_settings FOR INSERT
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

DROP POLICY IF EXISTS "Owners can update store_settings" ON public.store_settings;
CREATE POLICY "Owners can update store_settings"
  ON public.store_settings FOR UPDATE
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));


-- ================================================================
-- 3. STORE_SECTIONS_VISIBILITY
-- ================================================================
ALTER TABLE public.store_sections_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view store_sections_visibility" ON public.store_sections_visibility;
CREATE POLICY "Owners can view store_sections_visibility"
  ON public.store_sections_visibility FOR SELECT
  USING (public.has_store_access(store_id, auth.uid()));

DROP POLICY IF EXISTS "Owners can insert store_sections_visibility" ON public.store_sections_visibility;
CREATE POLICY "Owners can insert store_sections_visibility"
  ON public.store_sections_visibility FOR INSERT
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

DROP POLICY IF EXISTS "Owners can update store_sections_visibility" ON public.store_sections_visibility;
CREATE POLICY "Owners can update store_sections_visibility"
  ON public.store_sections_visibility FOR UPDATE
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));


-- ================================================================
-- 4. STORE_BRANDING
-- ================================================================
ALTER TABLE public.store_branding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view store_branding" ON public.store_branding;
CREATE POLICY "Owners can view store_branding"
  ON public.store_branding FOR SELECT
  USING (public.has_store_access(store_id, auth.uid()));

DROP POLICY IF EXISTS "Owners can insert store_branding" ON public.store_branding;
CREATE POLICY "Owners can insert store_branding"
  ON public.store_branding FOR INSERT
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

DROP POLICY IF EXISTS "Owners can update store_branding" ON public.store_branding;
CREATE POLICY "Owners can update store_branding"
  ON public.store_branding FOR UPDATE
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));


-- ================================================================
-- 5. PUBLIC READ for storefront (stores table)
-- ================================================================
-- The storefront at /store/[slug] needs to read the store by slug
-- without auth. This is safe — only reads public store data.

DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
CREATE POLICY "Public can view active stores"
  ON public.stores FOR SELECT
  USING (is_active = true);

-- Note: this creates a second SELECT policy on stores.
-- Supabase uses OR between policies of the same command type,
-- so owners can see their store (active or not) AND
-- the public can see active stores. Both policies apply.
