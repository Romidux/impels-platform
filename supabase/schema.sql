-- ================================================================
-- IMPELS COMMERCE — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ================================================================

-- 🚨 RESETEO LIMPIO: Borra todo para evitar errores de "already exists"
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Restore Supabase role permissions (lost after DROP SCHEMA)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Make sure future tables/sequences/functions also get the right permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────────
-- STORES
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url    TEXT,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);

-- ──────────────────────────────────────────────────────────────────
-- STORE MEMBERS (roles)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id   UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, user_id)
);

-- ──────────────────────────────────────────────────────────────────
-- STORE SETTINGS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_settings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id         UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  currency         TEXT NOT NULL DEFAULT 'Gs',
  whatsapp_number  TEXT,
  contact_email    TEXT,
  instagram_url    TEXT,
  facebook_url     TEXT,
  tiktok_url       TEXT,
  twitter_url      TEXT,
  template         TEXT NOT NULL DEFAULT 'modern' CHECK (template IN ('minimal', 'modern', 'brand')),
  primary_color    TEXT NOT NULL DEFAULT '#2563eb',
  secondary_color  TEXT NOT NULL DEFAULT '#7c3aed',
  hero_title       TEXT,
  hero_subtitle    TEXT,
  benefits_bar_items TEXT[] DEFAULT '{}',
  instagram_url    TEXT
);

-- ──────────────────────────────────────────────────────────────────
-- STORE BRANDING
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_branding (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id                UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  logo_url                TEXT,
  favicon_url             TEXT,
  hero_banner_url         TEXT,
  promo_banner_url        TEXT,
  promo_banner_title      TEXT,
  promo_banner_subtitle   TEXT,
  promo_banner_cta        TEXT,
  promo_banner_url_link   TEXT,
  footer_categories_label TEXT,
  footer_contact_label    TEXT
);

-- ──────────────────────────────────────────────────────────────────
-- STORE SECTIONS VISIBILITY
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_sections_visibility (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  section     TEXT NOT NULL,
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE(store_id, section)
);

-- ──────────────────────────────────────────────────────────────────
-- CATEGORIES
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- ──────────────────────────────────────────────────────────────────
-- PRODUCTS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL,
  description       TEXT,
  price             NUMERIC(12,2) NOT NULL DEFAULT 0,
  compare_at_price  NUMERIC(12,2),
  show_price        BOOLEAN NOT NULL DEFAULT TRUE,
  visibility        TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  stock_status      TEXT NOT NULL DEFAULT 'available' CHECK (stock_status IN ('available', 'out_of_stock')),
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  tags              TEXT[] NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_visibility ON products(visibility);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

-- ──────────────────────────────────────────────────────────────────
-- PRODUCT IMAGES
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt         TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- ──────────────────────────────────────────────────────────────────
-- PRODUCT OPTION TYPES (Color, Size, ML, etc.)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_option_types (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ──────────────────────────────────────────────────────────────────
-- PRODUCT OPTION VALUES (Red, XL, 100ml, etc.)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_option_values (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_type_id UUID NOT NULL REFERENCES product_option_types(id) ON DELETE CASCADE,
  value          TEXT NOT NULL,
  sort_order     INTEGER NOT NULL DEFAULT 0
);

-- ──────────────────────────────────────────────────────────────────
-- PRODUCT VARIANT COMBINATIONS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variant_combinations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_values  UUID[] NOT NULL DEFAULT '{}',  -- array of product_option_value IDs
  price          NUMERIC(12,2),
  stock          INTEGER NOT NULL DEFAULT 0,
  sku            TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ──────────────────────────────────────────────────────────────────
-- ORDERS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  customer_email    TEXT,
  customer_address  TEXT,
  customer_notes    TEXT,
  items             JSONB NOT NULL DEFAULT '[]',
  subtotal          NUMERIC(12,2) NOT NULL DEFAULT 0,
  total             NUMERIC(12,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new','confirmed','processing','delivered','cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ──────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_sections_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- These bypass RLS to break the stores <-> store_members recursion loop
-- ================================================================

CREATE OR REPLACE FUNCTION public.is_store_owner(_store_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_store_member(_store_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_members
    WHERE store_id = _store_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_store_access(_store_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.store_members WHERE store_id = _store_id AND user_id = _user_id
  );
$$;

-- ── STORES ────────────────────────────────────────────────────────
-- Anyone can read active stores (public storefront)
CREATE POLICY "Public can view active stores"
  ON stores FOR SELECT
  USING (is_active = TRUE);

-- Owners can manage their own store (direct column check = no recursion)
CREATE POLICY "Owners can insert stores"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update stores"
  ON stores FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete stores"
  ON stores FOR DELETE
  USING (auth.uid() = owner_id);

-- Members can view stores they belong to (uses SECURITY DEFINER function)
CREATE POLICY "Members can view their stores"
  ON stores FOR SELECT
  USING (
    auth.uid() = owner_id OR
    public.is_store_member(id, auth.uid())
  );

-- ── STORE MEMBERS ─────────────────────────────────────────────────
-- Uses SECURITY DEFINER function to check ownership (no recursion)
CREATE POLICY "Owners can manage team"
  ON store_members FOR ALL
  USING (
    public.is_store_owner(store_id, auth.uid())
  )
  WITH CHECK (
    public.is_store_owner(store_id, auth.uid())
  );

CREATE POLICY "Members can view team"
  ON store_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.is_store_owner(store_id, auth.uid())
  );

-- ── STORE SETTINGS ────────────────────────────────────────────────
CREATE POLICY "Public can view store settings"
  ON store_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Owner and admin manage settings"
  ON store_settings FOR ALL
  USING (
    public.has_store_access(store_id, auth.uid())
  )
  WITH CHECK (
    public.has_store_access(store_id, auth.uid())
  );

-- ── STORE BRANDING ────────────────────────────────────────────────
CREATE POLICY "Public can view branding"
  ON store_branding FOR SELECT USING (TRUE);

CREATE POLICY "Owner admin manage branding"
  ON store_branding FOR ALL
  USING (
    public.has_store_access(store_id, auth.uid())
  )
  WITH CHECK (
    public.has_store_access(store_id, auth.uid())
  );

-- ── STORE SECTIONS VISIBILITY ─────────────────────────────────────
CREATE POLICY "Public can view sections"
  ON store_sections_visibility FOR SELECT USING (TRUE);

CREATE POLICY "Owner admin manage sections"
  ON store_sections_visibility FOR ALL
  USING (
    public.has_store_access(store_id, auth.uid())
  )
  WITH CHECK (
    public.has_store_access(store_id, auth.uid())
  );

-- ── CATEGORIES ────────────────────────────────────────────────────
CREATE POLICY "Public can view categories"
  ON categories FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Store members can manage categories"
  ON categories FOR ALL
  USING (
    public.has_store_access(store_id, auth.uid())
  )
  WITH CHECK (
    public.has_store_access(store_id, auth.uid())
  );

-- ── PRODUCTS ──────────────────────────────────────────────────────
CREATE POLICY "Public can view visible products"
  ON products FOR SELECT
  USING (visibility = 'visible');

CREATE POLICY "Store members can manage products"
  ON products FOR ALL
  USING (
    public.has_store_access(store_id, auth.uid())
  )
  WITH CHECK (
    public.has_store_access(store_id, auth.uid())
  );

-- ── PRODUCT IMAGES ────────────────────────────────────────────────
CREATE POLICY "Public can view product images"
  ON product_images FOR SELECT USING (TRUE);

CREATE POLICY "Store members manage images"
  ON product_images FOR ALL
  USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.product_id AND public.has_store_access(p.store_id, auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.product_id AND public.has_store_access(p.store_id, auth.uid()))
  );

-- ── PRODUCT OPTIONS & VARIANTS ────────────────────────────────────
CREATE POLICY "Public can view option types"
  ON product_option_types FOR SELECT USING (TRUE);

CREATE POLICY "Store members manage option types"
  ON product_option_types FOR ALL
  USING (
    public.has_store_access(store_id, auth.uid())
  )
  WITH CHECK (
    public.has_store_access(store_id, auth.uid())
  );

CREATE POLICY "Public can view option values"
  ON product_option_values FOR SELECT USING (TRUE);

CREATE POLICY "Members manage option values"
  ON product_option_values FOR ALL
  USING (
    EXISTS (SELECT 1 FROM product_option_types ot WHERE ot.id = product_option_values.option_type_id AND public.has_store_access(ot.store_id, auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM product_option_types ot WHERE ot.id = product_option_values.option_type_id AND public.has_store_access(ot.store_id, auth.uid()))
  );

CREATE POLICY "Public can view variants"
  ON product_variant_combinations FOR SELECT USING (TRUE);

CREATE POLICY "Members manage variants"
  ON product_variant_combinations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_variant_combinations.product_id AND public.has_store_access(p.store_id, auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_variant_combinations.product_id AND public.has_store_access(p.store_id, auth.uid()))
  );

-- ── ORDERS ────────────────────────────────────────────────────────
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Store members can view orders"
  ON orders FOR SELECT
  USING (
    public.has_store_access(store_id, auth.uid())
  );

CREATE POLICY "Store members can update orders"
  ON orders FOR UPDATE
  USING (
    public.has_store_access(store_id, auth.uid())
  )
  WITH CHECK (
    public.has_store_access(store_id, auth.uid())
  );


-- ================================================================
-- STORAGE BUCKETS
-- (Run after creating the bucket in Supabase dashboard)
-- ================================================================

-- Create the product-images bucket policy
-- First create the bucket named "product-images" in Supabase Storage (set to Public)
-- Then run:
INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-images', 'product-images', TRUE)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
CREATE POLICY "Users can delete own product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
  );


-- ================================================================
-- SEED DEFAULT DATA
-- ================================================================
-- Default sections for new stores (can be triggered via function)
-- Example: After store creation, insert default sections:
-- INSERT INTO store_sections_visibility (store_id, section, is_visible, sort_order)
-- VALUES
--   (NEW.id, 'hero_banner', true, 1),
--   (NEW.id, 'featured_categories', true, 2),
--   (NEW.id, 'featured_products', true, 3),
--   (NEW.id, 'main_catalog', true, 4),
--   (NEW.id, 'promo_banner', true, 5),
--   (NEW.id, 'recommended_products', true, 6);
