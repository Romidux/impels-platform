-- ================================================================
-- MIGRATION 010: RLS Hardening + Storage Multi-Tenant Isolation
-- ================================================================
-- This migration hardens existing RLS policies for categories and
-- products to require the parent store to be active, and tightens
-- storage policies to enforce {store_id}/ path prefix ownership.
--
-- Safe to run against existing database — uses DROP POLICY IF EXISTS
-- before CREATE POLICY to avoid conflicts.
-- ================================================================

-- ── 1. HARDEN CATEGORIES RLS ────────────────────────────────────
-- Before: any public user could read categories where is_active = TRUE,
-- even if the owning store was deactivated.
-- After: also requires store.is_active = TRUE.

DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = categories.store_id AND s.is_active = TRUE
    )
  );


-- ── 2. HARDEN PRODUCTS RLS ──────────────────────────────────────
-- Before: any public user could read products where visibility = 'visible',
-- even if the owning store was deactivated.
-- After: also requires store.is_active = TRUE.

DROP POLICY IF EXISTS "Public can view visible products" ON products;
CREATE POLICY "Public can view visible products"
  ON products FOR SELECT
  USING (
    visibility = 'visible'
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = products.store_id AND s.is_active = TRUE
    )
  );


-- ── 3. HARDEN STORAGE: UPLOAD ───────────────────────────────────
-- Before: any authenticated user could upload to product-images bucket.
-- After: user must have store access matching the {store_id}/ path prefix.
--
-- ⚠️  MANDATORY PATH CONVENTION:
--     All uploads MUST use path: {store_id}/{filename}
--     Example: "a1b2c3d4-e5f6-.../1712345678-0.jpg"
--     The first folder segment is extracted and cast to UUID.
--     If the path is flat (no folder) or the prefix is not a valid UUID,
--     the policy will DENY the operation silently.
--
-- This is enforced in ProductForm.tsx line 272:
--     const path = `${storeId}/${Date.now()}-${index}.${ext}`;

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can upload product images" ON storage.objects;
CREATE POLICY "Store owners can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    -- Guard: path must have at least one folder segment
    AND array_length(storage.foldername(name), 1) >= 1
    -- Guard: first segment must be a valid UUID (store_id)
    AND (storage.foldername(name))[1]::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    -- Ownership: user must have access to that store
    AND public.has_store_access(
      (storage.foldername(name))[1]::uuid,
      auth.uid()
    )
  );


-- ── 4. HARDEN STORAGE: DELETE ───────────────────────────────────
-- Before: any authenticated user could delete any file in product-images.
-- After: user must have store access matching the {store_id}/ path prefix.
-- Same defensive guards as upload above.

DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete own images" ON storage.objects;
CREATE POLICY "Store owners can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    -- Guard: path must have at least one folder segment
    AND array_length(storage.foldername(name), 1) >= 1
    -- Guard: first segment must be a valid UUID
    AND (storage.foldername(name))[1]::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    -- Ownership: user must have access to that store
    AND public.has_store_access(
      (storage.foldername(name))[1]::uuid,
      auth.uid()
    )
  );
