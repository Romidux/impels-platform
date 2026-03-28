-- ================================================================
-- IMPELS COMMERCE — Complete Database Schema (Clean Version)
-- Run this in Supabase SQL Editor for a fresh install.
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

-- ================================================================
-- 1. FUNCTIONS (must exist before triggers reference them)
-- ================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate product stock status
CREATE OR REPLACE FUNCTION update_product_stock_status()
RETURNS TRIGGER AS $$
DECLARE
  v_has_stock BOOLEAN;
BEGIN
  IF NOT NEW.track_inventory THEN
    NEW.stock_status := 'available';
    RETURN NEW;
  END IF;

  IF NEW.allow_backorder THEN
    NEW.stock_status := 'available';
    RETURN NEW;
  END IF;

  IF NEW.manage_stock_by_variant THEN
    SELECT EXISTS (
      SELECT 1
      FROM product_variant_combinations
      WHERE product_id = NEW.id
        AND stock > 0
        AND is_active = TRUE
    ) INTO v_has_stock;

    IF v_has_stock THEN
      NEW.stock_status := 'available';
    ELSE
      NEW.stock_status := 'out_of_stock';
    END IF;
  ELSE
    IF NEW.stock_quantity > 0 THEN
      NEW.stock_status := 'available';
    ELSE
      NEW.stock_status := 'out_of_stock';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: when variant stock changes, touch the parent product
CREATE OR REPLACE FUNCTION trigger_variant_update_product()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 2. TABLES (in FK dependency order)
-- ================================================================

-- ── STORES ──────────────────────────────────────────────────────
CREATE TABLE public.stores (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL,
  description text NULL,
  logo_url text NULL,
  owner_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free'::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stores_pkey PRIMARY KEY (id),
  CONSTRAINT stores_slug_key UNIQUE (slug),
  CONSTRAINT stores_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT stores_plan_check CHECK (plan = ANY (ARRAY['free','pro']))
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON public.stores USING btree (owner_id);

CREATE TRIGGER trg_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── STORE MEMBERS ───────────────────────────────────────────────
CREATE TABLE public.store_members (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  store_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'editor'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_members_pkey PRIMARY KEY (id),
  CONSTRAINT store_members_store_id_user_id_key UNIQUE (store_id, user_id),
  CONSTRAINT store_members_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT store_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT store_members_role_check CHECK (role = ANY (ARRAY['owner','admin','editor']))
) TABLESPACE pg_default;

-- ── STORE SETTINGS ──────────────────────────────────────────────
CREATE TABLE public.store_settings (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  store_id uuid NOT NULL,
  currency text NOT NULL DEFAULT 'Gs'::text,
  whatsapp_number text NULL,
  contact_email text NULL,
  instagram_url text NULL,
  facebook_url text NULL,
  tiktok_url text NULL,
  twitter_url text NULL,
  template text NOT NULL DEFAULT 'modern'::text,
  primary_color text NOT NULL DEFAULT '#2563eb'::text,
  secondary_color text NOT NULL DEFAULT '#7c3aed'::text,
  hero_title text NULL,
  hero_subtitle text NULL,
  benefits_bar_items jsonb NULL DEFAULT '[]'::jsonb,
  google_analytics_id text NULL,
  meta_pixel_id text NULL,
  CONSTRAINT store_settings_pkey PRIMARY KEY (id),
  CONSTRAINT store_settings_store_id_key UNIQUE (store_id),
  CONSTRAINT store_settings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT store_settings_template_check CHECK (template = ANY (ARRAY['minimal','modern','brand']))
) TABLESPACE pg_default;

-- ── STORE BRANDING ──────────────────────────────────────────────
CREATE TABLE public.store_branding (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  store_id uuid NOT NULL,
  logo_url text NULL,
  favicon_url text NULL,
  hero_banner_url text NULL,
  promo_banner_url text NULL,
  promo_banner_title text NULL,
  promo_banner_subtitle text NULL,
  promo_banner_cta text NULL,
  promo_banner_url_link text NULL,
  footer_categories_label text NULL DEFAULT 'Productos'::text,
  footer_contact_label text NULL DEFAULT 'Contacto'::text,
  CONSTRAINT store_branding_pkey PRIMARY KEY (id),
  CONSTRAINT store_branding_store_id_key UNIQUE (store_id),
  CONSTRAINT store_branding_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ── STORE SECTIONS VISIBILITY ───────────────────────────────────
CREATE TABLE public.store_sections_visibility (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  store_id uuid NOT NULL,
  section text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT store_sections_visibility_pkey PRIMARY KEY (id),
  CONSTRAINT store_sections_visibility_store_id_section_key UNIQUE (store_id, section),
  CONSTRAINT store_sections_visibility_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ── STORE NAVIGATION ────────────────────────────────────────────
CREATE TABLE public.store_navigation (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  store_id uuid NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT store_navigation_pkey PRIMARY KEY (id),
  CONSTRAINT store_navigation_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_store_navigation_store ON public.store_navigation USING btree (store_id);

-- ── CATEGORIES ──────────────────────────────────────────────────
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  store_id uuid NOT NULL,
  parent_id uuid NULL,
  name text NOT NULL,
  slug text NOT NULL,
  image_url text NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_store_id_slug_key UNIQUE (store_id, slug),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL,
  CONSTRAINT categories_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_categories_store ON public.categories USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories USING btree (parent_id);

-- ── PRODUCTS ────────────────────────────────────────────────────
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  store_id uuid NOT NULL,
  category_id uuid NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text NULL,
  price numeric(12, 2) NOT NULL DEFAULT 0,
  compare_at_price numeric(12, 2) NULL,
  show_price boolean NOT NULL DEFAULT true,
  visibility text NOT NULL DEFAULT 'visible'::text,
  stock_status text NOT NULL DEFAULT 'available'::text,
  is_featured boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  has_variants boolean NOT NULL DEFAULT false,
  stock_quantity integer NOT NULL DEFAULT 0,
  track_inventory boolean NOT NULL DEFAULT false,
  allow_backorder boolean NOT NULL DEFAULT false,
  manage_stock_by_variant boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_store_id_slug_key UNIQUE (store_id, slug),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
  CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT products_stock_status_check CHECK (stock_status = ANY (ARRAY['available','out_of_stock'])),
  CONSTRAINT products_visibility_check CHECK (visibility = ANY (ARRAY['visible','hidden']))
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_products_store ON public.products USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_products_visibility ON public.products USING btree (visibility);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products USING btree (is_featured);

CREATE TRIGGER trg_products_stock_status
  BEFORE INSERT OR UPDATE OF stock_quantity, track_inventory, allow_backorder, manage_stock_by_variant
  ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_status();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── PRODUCT IMAGES ──────────────────────────────────────────────
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  product_id uuid NOT NULL,
  url text NOT NULL,
  alt text NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images USING btree (product_id);

-- ── PRODUCT OPTION TYPES ────────────────────────────────────────
CREATE TABLE public.product_option_types (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  product_id uuid NOT NULL,
  store_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT product_option_types_pkey PRIMARY KEY (id),
  CONSTRAINT product_option_types_product_id_fkey FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT product_option_types_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ── PRODUCT OPTION VALUES ───────────────────────────────────────
CREATE TABLE public.product_option_values (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  option_type_id uuid NOT NULL,
  value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT product_option_values_pkey PRIMARY KEY (id),
  CONSTRAINT product_option_values_option_type_id_fkey FOREIGN KEY (option_type_id) REFERENCES product_option_types (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ── PRODUCT VARIANT COMBINATIONS ────────────────────────────────
CREATE TABLE public.product_variant_combinations (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  product_id uuid NOT NULL,
  option_values uuid[] NOT NULL DEFAULT '{}'::uuid[],
  price numeric(12, 2) NULL,
  stock integer NOT NULL DEFAULT 0,
  sku text NULL,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT product_variant_combinations_pkey PRIMARY KEY (id),
  CONSTRAINT product_variant_combinations_product_id_fkey FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE TRIGGER trg_variant_stock_change
  AFTER UPDATE OF stock, is_active ON product_variant_combinations
  FOR EACH ROW EXECUTE FUNCTION trigger_variant_update_product();

-- ── CUSTOMERS ───────────────────────────────────────────────────
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  store_id uuid NOT NULL,
  name text NOT NULL,
  email text NULL,
  phone text NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_customers_store ON public.customers USING btree (store_id);

-- ── ORDERS ──────────────────────────────────────────────────────
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  store_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NULL,
  customer_address text NULL,
  customer_notes text NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new'::text,
  customer_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['new','confirmed','processing','delivered','cancelled']))
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_orders_store ON public.orders USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders USING btree (created_at DESC);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 3. ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_sections_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 4. SECURITY DEFINER HELPER FUNCTIONS
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

-- ================================================================
-- 5. RLS POLICIES
-- ================================================================

-- ── STORES ──────────────────────────────────────────────────────
CREATE POLICY "Public can view active stores"
  ON stores FOR SELECT
  USING (is_active = TRUE);

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

CREATE POLICY "Members can view their stores"
  ON stores FOR SELECT
  USING (
    auth.uid() = owner_id OR
    public.is_store_member(id, auth.uid())
  );

-- ── STORE MEMBERS ───────────────────────────────────────────────
CREATE POLICY "Owners can manage team"
  ON store_members FOR ALL
  USING (public.is_store_owner(store_id, auth.uid()))
  WITH CHECK (public.is_store_owner(store_id, auth.uid()));

CREATE POLICY "Members can view team"
  ON store_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.is_store_owner(store_id, auth.uid())
  );

-- ── STORE SETTINGS ──────────────────────────────────────────────
CREATE POLICY "Public can view store settings"
  ON store_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_settings.store_id AND s.is_active = TRUE
    )
  );

CREATE POLICY "Owner and admin manage settings"
  ON store_settings FOR ALL
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

-- ── STORE BRANDING ──────────────────────────────────────────────
CREATE POLICY "Public can view branding"
  ON store_branding FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_branding.store_id AND s.is_active = TRUE
    )
  );

CREATE POLICY "Owner admin manage branding"
  ON store_branding FOR ALL
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

-- ── STORE SECTIONS VISIBILITY ───────────────────────────────────
CREATE POLICY "Public can view sections"
  ON store_sections_visibility FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_sections_visibility.store_id AND s.is_active = TRUE
    )
  );

CREATE POLICY "Owner admin manage sections"
  ON store_sections_visibility FOR ALL
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

-- ── STORE NAVIGATION ────────────────────────────────────────────
CREATE POLICY "Public can view navigation"
  ON store_navigation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_navigation.store_id AND s.is_active = TRUE
    )
  );

CREATE POLICY "Owner admin manage navigation"
  ON store_navigation FOR ALL
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

-- ── CATEGORIES ──────────────────────────────────────────────────
CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Store members can manage categories"
  ON categories FOR ALL
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

-- ── PRODUCTS ────────────────────────────────────────────────────
CREATE POLICY "Public can view visible products"
  ON products FOR SELECT
  USING (visibility = 'visible');

CREATE POLICY "Store members can manage products"
  ON products FOR ALL
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

-- ── PRODUCT IMAGES ──────────────────────────────────────────────
CREATE POLICY "Public can view product images"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_images.product_id
        AND p.visibility = 'visible'
        AND s.is_active = TRUE
    )
  );

CREATE POLICY "Store members manage images"
  ON product_images FOR ALL
  USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.product_id AND public.has_store_access(p.store_id, auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.product_id AND public.has_store_access(p.store_id, auth.uid()))
  );

-- ── PRODUCT OPTION TYPES ────────────────────────────────────────
CREATE POLICY "Public can view option types"
  ON product_option_types FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_option_types.product_id
        AND p.visibility = 'visible'
        AND s.is_active = TRUE
    )
  );

CREATE POLICY "Store members manage option types"
  ON product_option_types FOR ALL
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

-- ── PRODUCT OPTION VALUES ───────────────────────────────────────
CREATE POLICY "Public can view option values"
  ON product_option_values FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_option_types pot
      JOIN public.products p ON p.id = pot.product_id
      JOIN public.stores s ON s.id = p.store_id
      WHERE pot.id = product_option_values.option_type_id
        AND p.visibility = 'visible'
        AND s.is_active = TRUE
    )
  );

CREATE POLICY "Members manage option values"
  ON product_option_values FOR ALL
  USING (
    EXISTS (SELECT 1 FROM product_option_types ot WHERE ot.id = product_option_values.option_type_id AND public.has_store_access(ot.store_id, auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM product_option_types ot WHERE ot.id = product_option_values.option_type_id AND public.has_store_access(ot.store_id, auth.uid()))
  );

-- ── PRODUCT VARIANT COMBINATIONS ────────────────────────────────
CREATE POLICY "Public can view variants"
  ON product_variant_combinations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_variant_combinations.product_id
        AND p.visibility = 'visible'
        AND s.is_active = TRUE
    )
  );

CREATE POLICY "Members manage variants"
  ON product_variant_combinations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_variant_combinations.product_id AND public.has_store_access(p.store_id, auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_variant_combinations.product_id AND public.has_store_access(p.store_id, auth.uid()))
  );

-- ── CUSTOMERS ───────────────────────────────────────────────────
CREATE POLICY "Store members can manage customers"
  ON customers FOR ALL
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

-- ── ORDERS ──────────────────────────────────────────────────────
-- Public inserts go through the RPC; direct inserts only for service_role
CREATE POLICY "Service role can create orders directly"
  ON orders FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Store members can view orders"
  ON orders FOR SELECT
  USING (public.has_store_access(store_id, auth.uid()));

CREATE POLICY "Store members can update orders"
  ON orders FOR UPDATE
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

-- ================================================================
-- 6. STORAGE BUCKETS
-- ================================================================

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
-- 7. RPC: ATOMIC CHECKOUT WITH STOCK DEDUCTION
-- ================================================================

CREATE OR REPLACE FUNCTION public.create_order_and_deduct_stock(
  p_store_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_customer_address TEXT,
  p_customer_notes TEXT,
  p_items JSONB,
  p_subtotal NUMERIC,
  p_total NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;

  v_product_id UUID;
  v_variant_id UUID;
  v_variant_id_str TEXT;
  v_quantity INT;

  v_product_store_id UUID;
  v_has_variants BOOLEAN;
  v_track_inventory BOOLEAN;
  v_allow_backorder BOOLEAN;
  v_stock_quantity INT;

  v_variant_product_id UUID;
  v_variant_stock INT;
BEGIN
  -- Validate active store
  IF NOT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = p_store_id AND s.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'La tienda no existe o no está activa';
  END IF;

  -- Validate items
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido no tiene items válidos';
  END IF;

  -- Create order in processing status (will be set to 'new' at end)
  INSERT INTO public.orders (
    store_id, customer_name, customer_phone, customer_email,
    customer_address, customer_notes, items, subtotal, total, status
  )
  VALUES (
    p_store_id, p_customer_name, p_customer_phone, p_customer_email,
    p_customer_address, p_customer_notes, p_items, p_subtotal, p_total, 'processing'
  )
  RETURNING id INTO v_order_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INT;
    v_variant_id_str := v_item->>'variant_combination_id';
    v_variant_id := NULL;

    IF COALESCE(v_variant_id_str, '') NOT IN ('', 'null') THEN
      v_variant_id := v_variant_id_str::UUID;
    END IF;

    IF v_product_id IS NULL OR v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Item inválido en el pedido';
    END IF;

    -- Lock product row and validate it belongs to this store
    SELECT p.store_id, p.has_variants, p.track_inventory, p.allow_backorder, p.stock_quantity
    INTO v_product_store_id, v_has_variants, v_track_inventory, v_allow_backorder, v_stock_quantity
    FROM public.products p
    WHERE p.id = v_product_id AND p.store_id = p_store_id AND p.visibility = 'visible'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado para esta tienda';
    END IF;

    -- Variant validation
    IF v_has_variants THEN
      IF v_variant_id IS NULL THEN
        RAISE EXCEPTION 'Debe elegir una variante para este producto';
      END IF;

      SELECT pvc.product_id, pvc.stock
      INTO v_variant_product_id, v_variant_stock
      FROM public.product_variant_combinations pvc
      WHERE pvc.id = v_variant_id AND pvc.product_id = v_product_id AND pvc.is_active = TRUE
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Variante inválida para este producto';
      END IF;
    ELSE
      IF v_variant_id IS NOT NULL THEN
        RAISE EXCEPTION 'Este producto no usa variantes';
      END IF;
    END IF;

    -- Stock deduction
    IF v_track_inventory THEN
      IF v_has_variants THEN
        IF v_variant_stock < v_quantity AND v_allow_backorder = FALSE THEN
          RAISE EXCEPTION 'Stock insuficiente para la variante';
        END IF;
        UPDATE public.product_variant_combinations SET stock = stock - v_quantity WHERE id = v_variant_id;
      ELSE
        IF v_stock_quantity < v_quantity AND v_allow_backorder = FALSE THEN
          RAISE EXCEPTION 'Stock insuficiente para el producto';
        END IF;
        UPDATE public.products SET stock_quantity = stock_quantity - v_quantity WHERE id = v_product_id AND store_id = p_store_id;
      END IF;
    END IF;
  END LOOP;

  -- Finalize: set status to 'new'
  UPDATE public.orders SET status = 'new' WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;
