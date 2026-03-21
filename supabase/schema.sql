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
-- STORE_NAVIGATION
-- ──────────────────────────────────────────────────────────────────
create table public.store_navigation (
  id uuid not null default extensions.uuid_generate_v4 (),
  store_id uuid not null,
  label text not null,
  url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  constraint store_navigation_pkey primary key (id),
  constraint store_navigation_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_store_navigation_store on public.store_navigation using btree (store_id) TABLESPACE pg_default;

-- ──────────────────────────────────────────────────────────────────
-- COSTUMERS
-- ──────────────────────────────────────────────────────────────────
create table public.customers (
  id uuid not null default extensions.uuid_generate_v4 (),
  store_id uuid not null,
  name text not null,
  email text null,
  phone text null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customers_pkey primary key (id),
  constraint customers_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_customers_store on public.customers using btree (store_id) TABLESPACE pg_default;
-- ──────────────────────────────────────────────────────────────────
-- STORES
-- ──────────────────────────────────────────────────────────────────
create table public.stores (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  slug text not null,
  description text null,
  logo_url text null,
  owner_id uuid not null,
  plan text not null default 'free'::text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint stores_pkey primary key (id),
  constraint stores_slug_key unique (slug),
  constraint stores_owner_id_fkey foreign KEY (owner_id) references auth.users (id) on delete CASCADE,
  constraint stores_plan_check check ((plan = any (array['free'::text, 'pro'::text])))
) TABLESPACE pg_default;

create index IF not exists idx_stores_slug on public.stores using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_stores_owner on public.stores using btree (owner_id) TABLESPACE pg_default;

create trigger trg_stores_updated_at BEFORE
update on stores for EACH row
execute FUNCTION update_updated_at_column ();

-- ──────────────────────────────────────────────────────────────────
-- STORE MEMBERS (roles)
-- ──────────────────────────────────────────────────────────────────
create table public.store_members (
  id uuid not null default extensions.uuid_generate_v4 (),
  store_id uuid not null,
  user_id uuid not null,
  role text not null default 'editor'::text,
  created_at timestamp with time zone not null default now(),
  constraint store_members_pkey primary key (id),
  constraint store_members_store_id_user_id_key unique (store_id, user_id),
  constraint store_members_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE,
  constraint store_members_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint store_members_role_check check (
    (
      role = any (
        array['owner'::text, 'admin'::text, 'editor'::text]
      )
    )
  )
) TABLESPACE pg_default;

-- ──────────────────────────────────────────────────────────────────
-- STORE SETTINGS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_settings (
create table public.store_settings (
  id uuid not null default extensions.uuid_generate_v4 (),
  store_id uuid not null,
  currency text not null default 'Gs'::text,
  whatsapp_number text null,
  contact_email text null,
  instagram_url text null,
  facebook_url text null,
  tiktok_url text null,
  twitter_url text null,
  template text not null default 'modern'::text,
  primary_color text not null default '#2563eb'::text,
  secondary_color text not null default '#7c3aed'::text,
  hero_title text null,
  hero_subtitle text null,
  benefits_bar_items text[] null default '{}'::text[],
  constraint store_settings_pkey primary key (id),
  constraint store_settings_store_id_key unique (store_id),
  constraint store_settings_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE,
  constraint store_settings_template_check check (
    (
      template = any (
        array['minimal'::text, 'modern'::text, 'brand'::text]
      )
    )
  )
) TABLESPACE pg_default;

-- ──────────────────────────────────────────────────────────────────
-- STORE BRANDING
-- ──────────────────────────────────────────────────────────────────
create table public.store_branding (
  id uuid not null default extensions.uuid_generate_v4 (),
  store_id uuid not null,
  logo_url text null,
  favicon_url text null,
  hero_banner_url text null,
  promo_banner_url text null,
  promo_banner_title text null,
  promo_banner_subtitle text null,
  promo_banner_cta text null,
  promo_banner_url_link text null,
  footer_categories_label text null default 'Productos'::text,
  footer_contact_label text null default 'Contacto'::text,
  constraint store_branding_pkey primary key (id),
  constraint store_branding_store_id_key unique (store_id),
  constraint store_branding_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE
) TABLESPACE pg_default;

-- ──────────────────────────────────────────────────────────────────
-- STORE SECTIONS VISIBILITY
-- ──────────────────────────────────────────────────────────────────
create table public.store_sections_visibility (
  id uuid not null default extensions.uuid_generate_v4 (),
  store_id uuid not null,
  section text not null,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  constraint store_sections_visibility_pkey primary key (id),
  constraint store_sections_visibility_store_id_section_key unique (store_id, section),
  constraint store_sections_visibility_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE
) TABLESPACE pg_default;

-- ──────────────────────────────────────────────────────────────────
-- CATEGORIES
-- ──────────────────────────────────────────────────────────────────
create table public.categories (
  id uuid not null default extensions.uuid_generate_v4 (),
  store_id uuid not null,
  parent_id uuid null,
  name text not null,
  slug text not null,
  image_url text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_store_id_slug_key unique (store_id, slug),
  constraint categories_parent_id_fkey foreign KEY (parent_id) references categories (id) on delete set null,
  constraint categories_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_categories_store on public.categories using btree (store_id) TABLESPACE pg_default;

create index IF not exists idx_categories_parent on public.categories using btree (parent_id) TABLESPACE pg_default;
-- ──────────────────────────────────────────────────────────────────
-- PRODUCTS
-- ──────────────────────────────────────────────────────────────────
create table public.products (
  id uuid not null default extensions.uuid_generate_v4 (),
  store_id uuid not null,
  category_id uuid null,
  name text not null,
  slug text not null,
  description text null,
  price numeric(12, 2) not null default 0,
  compare_at_price numeric(12, 2) null,
  show_price boolean not null default true,
  visibility text not null default 'visible'::text,
  stock_status text not null default 'available'::text,
  is_featured boolean not null default false,
  tags text[] not null default '{}'::text[],
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  has_variants boolean not null default false,
  stock_quantity integer not null default 0,
  track_inventory boolean not null default false,
  allow_backorder boolean not null default false,
  manage_stock_by_variant boolean not null default false,
  constraint products_pkey primary key (id),
  constraint products_store_id_slug_key unique (store_id, slug),
  constraint products_category_id_fkey foreign KEY (category_id) references categories (id) on delete set null,
  constraint products_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE,
  constraint products_stock_status_check check (
    (
      stock_status = any (array['available'::text, 'out_of_stock'::text])
    )
  ),
  constraint products_visibility_check check (
    (
      visibility = any (array['visible'::text, 'hidden'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_products_store on public.products using btree (store_id) TABLESPACE pg_default;

create index IF not exists idx_products_category on public.products using btree (category_id) TABLESPACE pg_default;

create index IF not exists idx_products_visibility on public.products using btree (visibility) TABLESPACE pg_default;

create index IF not exists idx_products_featured on public.products using btree (is_featured) TABLESPACE pg_default;

create trigger trg_products_stock_status BEFORE INSERT
or
update OF stock_quantity,
track_inventory,
allow_backorder,
has_variants on products for EACH row
execute FUNCTION update_product_stock_status ();

create trigger trg_products_updated_at BEFORE
update on products for EACH row
execute FUNCTION update_updated_at_column ();
-- ──────────────────────────────────────────────────────────────────
-- PRODUCT IMAGES
-- ──────────────────────────────────────────────────────────────────
create table public.product_images (
  id uuid not null default extensions.uuid_generate_v4 (),
  product_id uuid not null,
  url text not null,
  alt text null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  constraint product_images_pkey primary key (id),
  constraint product_images_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_product_images_product on public.product_images using btree (product_id) TABLESPACE pg_default;
-- ──────────────────────────────────────────────────────────────────
-- PRODUCT OPTION TYPES (Color, Size, ML, etc.)
-- ──────────────────────────────────────────────────────────────────
create table public.product_option_types (
  id uuid not null default extensions.uuid_generate_v4 (),
  product_id uuid not null,
  store_id uuid not null,
  name text not null,
  sort_order integer not null default 0,
  constraint product_option_types_pkey primary key (id),
  constraint product_option_types_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint product_option_types_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE
) TABLESPACE pg_default;
-- ──────────────────────────────────────────────────────────────────
-- PRODUCT OPTION VALUES (Red, XL, 100ml, etc.)
-- ──────────────────────────────────────────────────────────────────
create table public.product_option_values (
  id uuid not null default extensions.uuid_generate_v4 (),
  option_type_id uuid not null,
  value text not null,
  sort_order integer not null default 0,
  constraint product_option_values_pkey primary key (id),
  constraint product_option_values_option_type_id_fkey foreign KEY (option_type_id) references product_option_types (id) on delete CASCADE
) TABLESPACE pg_default;

-- ──────────────────────────────────────────────────────────────────
-- PRODUCT VARIANT COMBINATIONS
-- ──────────────────────────────────────────────────────────────────
create table public.product_variant_combinations (
  id uuid not null default extensions.uuid_generate_v4 (),
  product_id uuid not null,
  option_values uuid[] not null default '{}'::uuid[],
  price numeric(12, 2) null,
  stock integer not null default 0,
  sku text null,
  is_active boolean not null default true,
  constraint product_variant_combinations_pkey primary key (id),
  constraint product_variant_combinations_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;
-- ──────────────────────────────────────────────────────────────────
-- ORDERS
-- ──────────────────────────────────────────────────────────────────
create table public.orders (
  id uuid not null default extensions.uuid_generate_v4 (),
  store_id uuid not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text null,
  customer_address text null,
  customer_notes text null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  status text not null default 'new'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  customer_id uuid null,
  constraint orders_pkey primary key (id),
  constraint orders_customer_id_fkey foreign KEY (customer_id) references customers (id) on delete set null,
  constraint orders_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE,
  constraint orders_status_check check (
    (
      status = any (
        array[
          'new'::text,
          'confirmed'::text,
          'processing'::text,
          'delivered'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_orders_store on public.orders using btree (store_id) TABLESPACE pg_default;

create index IF not exists idx_orders_status on public.orders using btree (status) TABLESPACE pg_default;

create index IF not exists idx_orders_created on public.orders using btree (created_at desc) TABLESPACE pg_default;

create trigger trg_orders_updated_at BEFORE
update on orders for EACH row
execute FUNCTION update_updated_at_column ();


-- ──────────────────────────────────────────────────────────────────
-- UPDATED_AT FUNCTION & TRIGGERS
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stores_updated_at ON stores;
CREATE TRIGGER trg_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────────
-- STOCK STATUS FUNCTION & TRIGGERS
-- ──────────────────────────────────────────────────────────────────
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

DROP TRIGGER IF EXISTS trg_products_stock_status ON products;
CREATE TRIGGER trg_products_stock_status
  BEFORE INSERT OR UPDATE OF stock_quantity, track_inventory, allow_backorder, has_variants
  ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_status();

CREATE OR REPLACE FUNCTION trigger_variant_update_product()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET updated_at = NOW()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_variant_stock_change ON product_variant_combinations;
CREATE TRIGGER trg_variant_stock_change
  AFTER UPDATE OF stock, is_active ON product_variant_combinations
  FOR EACH ROW EXECUTE FUNCTION trigger_variant_update_product();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
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
-- ================================================================
CREATE OR REPLACE FUNCTION public.is_store_owner(_store_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.stores
    WHERE id = _store_id
      AND owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_store_member(_store_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.store_members
    WHERE store_id = _store_id
      AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_store_access(_store_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.stores
    WHERE id = _store_id
      AND owner_id = _user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.store_members
    WHERE store_id = _store_id
      AND user_id = _user_id
  );
$$;

-- ── STORES ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
CREATE POLICY "Public can view active stores"
ON public.stores
FOR SELECT
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Owners can insert stores" ON public.stores;
CREATE POLICY "Owners can insert stores"
ON public.stores
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update stores" ON public.stores;
CREATE POLICY "Owners can update stores"
ON public.stores
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete stores" ON public.stores;
CREATE POLICY "Owners can delete stores"
ON public.stores
FOR DELETE
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Members can view their stores" ON public.stores;
CREATE POLICY "Members can view their stores"
ON public.stores
FOR SELECT
USING (
  auth.uid() = owner_id
  OR public.is_store_member(id, auth.uid())
);

-- ── STORE MEMBERS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owners can manage team" ON public.store_members;
CREATE POLICY "Owners can manage team"
ON public.store_members
FOR ALL
USING (
  public.is_store_owner(store_id, auth.uid())
)
WITH CHECK (
  public.is_store_owner(store_id, auth.uid())
);

DROP POLICY IF EXISTS "Members can view team" ON public.store_members;
CREATE POLICY "Members can view team"
ON public.store_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_store_owner(store_id, auth.uid())
);

-- ── STORE SETTINGS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
CREATE POLICY "Public can view store settings"
ON public.store_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = store_settings.store_id
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Owner and admin manage settings" ON public.store_settings;
CREATE POLICY "Owner and admin manage settings"
ON public.store_settings
FOR ALL
USING (
  public.has_store_access(store_id, auth.uid())
)
WITH CHECK (
  public.has_store_access(store_id, auth.uid())
);

-- ── STORE BRANDING ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can view branding" ON public.store_branding;
CREATE POLICY "Public can view branding"
ON public.store_branding
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = store_branding.store_id
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Owner admin manage branding" ON public.store_branding;
CREATE POLICY "Owner admin manage branding"
ON public.store_branding
FOR ALL
USING (
  public.has_store_access(store_id, auth.uid())
)
WITH CHECK (
  public.has_store_access(store_id, auth.uid())
);

-- ── STORE SECTIONS VISIBILITY ─────────────────────────────────────
DROP POLICY IF EXISTS "Public can view sections" ON public.store_sections_visibility;
CREATE POLICY "Public can view sections"
ON public.store_sections_visibility
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = store_sections_visibility.store_id
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Owner admin manage sections" ON public.store_sections_visibility;
CREATE POLICY "Owner admin manage sections"
ON public.store_sections_visibility
FOR ALL
USING (
  public.has_store_access(store_id, auth.uid())
)
WITH CHECK (
  public.has_store_access(store_id, auth.uid())
);

-- ── CATEGORIES ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
ON public.categories
FOR SELECT
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Store members can manage categories" ON public.categories;
CREATE POLICY "Store members can manage categories"
ON public.categories
FOR ALL
USING (
  public.has_store_access(store_id, auth.uid())
)
WITH CHECK (
  public.has_store_access(store_id, auth.uid())
);

-- ── PRODUCTS ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can view visible products" ON public.products;
CREATE POLICY "Public can view visible products"
ON public.products
FOR SELECT
USING (visibility = 'visible');

DROP POLICY IF EXISTS "Store members can manage products" ON public.products;
CREATE POLICY "Store members can manage products"
ON public.products
FOR ALL
USING (
  public.has_store_access(store_id, auth.uid())
)
WITH CHECK (
  public.has_store_access(store_id, auth.uid())
);

-- ── PRODUCT IMAGES ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images"
ON public.product_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = product_images.product_id
      AND p.visibility = 'visible'
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Store members manage images" ON public.product_images;
CREATE POLICY "Store members manage images"
ON public.product_images
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = product_images.product_id
      AND public.has_store_access(p.store_id, auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = product_images.product_id
      AND public.has_store_access(p.store_id, auth.uid())
  )
);

-- ── PRODUCT OPTION TYPES ──────────────────────────────────────────
DROP POLICY IF EXISTS "Public can view option types" ON public.product_option_types;
CREATE POLICY "Public can view option types"
ON public.product_option_types
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = product_option_types.product_id
      AND p.visibility = 'visible'
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Store members manage option types" ON public.product_option_types;
CREATE POLICY "Store members manage option types"
ON public.product_option_types
FOR ALL
USING (
  public.has_store_access(store_id, auth.uid())
)
WITH CHECK (
  public.has_store_access(store_id, auth.uid())
);

-- ── PRODUCT OPTION VALUES ─────────────────────────────────────────
DROP POLICY IF EXISTS "Public can view option values" ON public.product_option_values;
CREATE POLICY "Public can view option values"
ON public.product_option_values
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.product_option_types pot
    JOIN public.products p ON p.id = pot.product_id
    JOIN public.stores s ON s.id = p.store_id
    WHERE pot.id = product_option_values.option_type_id
      AND p.visibility = 'visible'
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Members manage option values" ON public.product_option_values;
CREATE POLICY "Members manage option values"
ON public.product_option_values
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.product_option_types ot
    WHERE ot.id = product_option_values.option_type_id
      AND public.has_store_access(ot.store_id, auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.product_option_types ot
    WHERE ot.id = product_option_values.option_type_id
      AND public.has_store_access(ot.store_id, auth.uid())
  )
);

-- ── PRODUCT VARIANT COMBINATIONS ─────────────────────────────────
DROP POLICY IF EXISTS "Public can view variants" ON public.product_variant_combinations;
CREATE POLICY "Public can view variants"
ON public.product_variant_combinations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = product_variant_combinations.product_id
      AND p.visibility = 'visible'
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Members manage variants" ON public.product_variant_combinations;
CREATE POLICY "Members manage variants"
ON public.product_variant_combinations
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = product_variant_combinations.product_id
      AND public.has_store_access(p.store_id, auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = product_variant_combinations.product_id
      AND public.has_store_access(p.store_id, auth.uid())
  )
);

-- ── ORDERS ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role can create orders directly" ON public.orders;
CREATE POLICY "Service role can create orders directly"
ON public.orders
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Store members can view orders" ON public.orders;
CREATE POLICY "Store members can view orders"
ON public.orders
FOR SELECT
USING (
  public.has_store_access(store_id, auth.uid())
);

DROP POLICY IF EXISTS "Store members can update orders" ON public.orders;
CREATE POLICY "Store members can update orders"
ON public.orders
FOR UPDATE
USING (
  public.has_store_access(store_id, auth.uid())
)
WITH CHECK (
  public.has_store_access(store_id, auth.uid())
);

-- ──────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ──────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
CREATE POLICY "Users can delete own product images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
);

-- ──────────────────────────────────────────────────────────────────
-- CHECKOUT RPC (FINAL VERSION)
-- ──────────────────────────────────────────────────────────────────
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
  IF NOT EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = p_store_id
      AND s.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'La tienda no existe o no está activa';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido no tiene items válidos';
  END IF;

  INSERT INTO public.orders (
    store_id,
    customer_name,
    customer_phone,
    customer_email,
    customer_address,
    customer_notes,
    items,
    subtotal,
    total,
    status
  )
  VALUES (
    p_store_id,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_customer_address,
    p_customer_notes,
    p_items,
    p_subtotal,
    p_total,
    'processing'
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN
    SELECT * FROM jsonb_array_elements(p_items)
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

    SELECT
      p.store_id,
      p.has_variants,
      p.track_inventory,
      p.allow_backorder,
      p.stock_quantity
    INTO
      v_product_store_id,
      v_has_variants,
      v_track_inventory,
      v_allow_backorder,
      v_stock_quantity
    FROM public.products p
    WHERE p.id = v_product_id
      AND p.store_id = p_store_id
      AND p.visibility = 'visible'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado para esta tienda';
    END IF;

    IF v_has_variants THEN
      IF v_variant_id IS NULL THEN
        RAISE EXCEPTION 'Debe elegir una variante para este producto';
      END IF;

      SELECT
        pvc.product_id,
        pvc.stock
      INTO
        v_variant_product_id,
        v_variant_stock
      FROM public.product_variant_combinations pvc
      WHERE pvc.id = v_variant_id
        AND pvc.product_id = v_product_id
        AND pvc.is_active = TRUE
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Variante inválida para este producto';
      END IF;
    ELSE
      IF v_variant_id IS NOT NULL THEN
        RAISE EXCEPTION 'Este producto no usa variantes';
      END IF;
    END IF;

    IF v_track_inventory THEN
      IF v_has_variants THEN
        IF v_variant_stock < v_quantity AND v_allow_backorder = FALSE THEN
          RAISE EXCEPTION 'Stock insuficiente para la variante';
        END IF;

        UPDATE public.product_variant_combinations
        SET stock = stock - v_quantity
        WHERE id = v_variant_id;
      ELSE
        IF v_stock_quantity < v_quantity AND v_allow_backorder = FALSE THEN
          RAISE EXCEPTION 'Stock insuficiente para el producto';
        END IF;

        UPDATE public.products
        SET stock_quantity = stock_quantity - v_quantity
        WHERE id = v_product_id
          AND store_id = p_store_id;
      END IF;
    END IF;
  END LOOP;

  UPDATE public.orders
  SET status = 'new'
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;














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
-- ──────────────────────────────────────────────────────────────────
-- STORE SETTINGS UPDATES (Branding labels)
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS benefits_bar_items JSONB DEFAULT '[]';
ALTER TABLE store_branding ADD COLUMN IF NOT EXISTS footer_categories_label TEXT;
ALTER TABLE store_branding ADD COLUMN IF NOT EXISTS footer_contact_label TEXT;

-- ──────────────────────────────────────────────────────────────────
-- ATOMIC CHECKOUT & STOCK DEDUCTION
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_order_and_deduct_stock(
  p_store_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_address TEXT DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]',
  p_subtotal NUMERIC DEFAULT 0,
  p_total NUMERIC DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item RECORD;
  v_track_inventory BOOLEAN;
  v_manage_stock_by_variant BOOLEAN;
  v_allow_backorder BOOLEAN;
  v_current_stock INTEGER;
BEGIN
  -- 1. Crear el pedido
  INSERT INTO orders (
    store_id,
    customer_name,
    customer_phone,
    customer_email,
    customer_address,
    customer_notes,
    items,
    subtotal,
    total,
    status
  ) VALUES (
    p_store_id,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_customer_address,
    p_customer_notes,
    p_items,
    p_subtotal,
    p_total,
    'new'
  ) RETURNING id INTO v_order_id;

  -- 2. Procesar cada item y descontar stock
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, 
    quantity INTEGER, 
    variant_combination_id UUID
  ) LOOP
    
    -- Obtener configuración de inventario del producto
    SELECT track_inventory, manage_stock_by_variant, allow_backorder, stock_quantity
    INTO v_track_inventory, v_manage_stock_by_variant, v_allow_backorder, v_current_stock
    FROM products
    WHERE id = v_item.product_id;

    -- Solo descontar si se trackea inventario
    IF v_track_inventory THEN
      
      IF v_manage_stock_by_variant AND v_item.variant_combination_id IS NOT NULL THEN
        -- MODO: Stock por variante
        UPDATE product_variant_combinations
        SET stock = stock - v_item.quantity
        WHERE id = v_item.variant_combination_id
        AND product_id = v_item.product_id
        RETURNING stock INTO v_current_stock;

        -- Validar si quedó stock negativo y no se permite backorder
        IF v_current_stock < 0 AND NOT v_allow_backorder THEN
          RAISE EXCEPTION 'Stock insuficiente para la variante seleccionada.';
        END IF;

      ELSE
        -- MODO: Stock general del producto
        UPDATE products
        SET stock_quantity = stock_quantity - v_item.quantity
        WHERE id = v_item.product_id
        RETURNING stock_quantity INTO v_current_stock;

        -- Validar si quedó stock negativo y no se permite backorder
        IF v_current_stock < 0 AND NOT v_allow_backorder THEN
          RAISE EXCEPTION 'Stock insuficiente para el producto: %', (SELECT name FROM products WHERE id = v_item.product_id);
        END IF;

      END IF;

    END IF;
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────────────────────────
-- TRIGGER: AUTO-ACTUALIZAR STATUS DE STOCK
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_product_stock_status()
RETURNS TRIGGER AS $$
DECLARE
  v_has_stock BOOLEAN;
BEGIN
  -- Si no trackea inventario, siempre está disponible
  IF NOT NEW.track_inventory THEN
    NEW.stock_status := 'available';
    RETURN NEW;
  END IF;

  -- Si permite backorder, siempre está disponible para venta
  IF NEW.allow_backorder THEN
    NEW.stock_status := 'available';
    RETURN NEW;
  END IF;

  IF NEW.manage_stock_by_variant THEN
    -- Está disponible si al menos una variante activa tiene stock > 0
    SELECT EXISTS (
      SELECT 1 FROM product_variant_combinations
      WHERE product_id = NEW.id AND stock > 0 AND is_active = TRUE
    ) INTO v_has_stock;
    
    IF v_has_stock THEN
      NEW.stock_status := 'available';
    ELSE
      NEW.stock_status := 'out_of_stock';
    END IF;
  ELSE
    -- Depende solo de stock_quantity
    IF NEW.stock_quantity > 0 THEN
      NEW.stock_status := 'available';
    ELSE
      NEW.stock_status := 'out_of_stock';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para cuando cambia el producto directamente
DROP TRIGGER IF EXISTS trg_update_stock_status ON products;
CREATE TRIGGER trg_update_stock_status
  BEFORE INSERT OR UPDATE OF stock_quantity, track_inventory, allow_backorder, manage_stock_by_variant
  ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_status();

-- Trigger para cuando cambia el stock de una variante
CREATE OR REPLACE FUNCTION trigger_variant_update_product()
RETURNS TRIGGER AS $$
BEGIN
  -- Simplemente disparamos un UPDATE en el producto para que su propio trigger recalcule el status
  UPDATE products SET updated_at = NOW() WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_variant_stock_change ON product_variant_combinations;
CREATE TRIGGER trg_variant_stock_change
  AFTER UPDATE OF stock, is_active ON product_variant_combinations
  FOR EACH ROW EXECUTE FUNCTION trigger_variant_update_product();

-- =========================================================
-- PATCH 3: Restric Direct Orders Inserts
-- =========================================================

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- No permitir inserts directos públicos.
-- Las órdenes públicas deben entrar por la RPC create_order_and_deduct_stock.
CREATE POLICY "Service role can create orders directly"
ON public.orders
FOR INSERT
WITH CHECK (auth.role() = 'service_role');    -- =========================================================
-- PATCH 2: Restrict Public read access to store-related data
-- =========================================================

DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
CREATE POLICY "Public can view store settings"
ON public.store_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = store_settings.store_id
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Public can view branding" ON public.store_branding;
CREATE POLICY "Public can view branding"
ON public.store_branding
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = store_branding.store_id
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Public can view sections" ON public.store_sections_visibility;
CREATE POLICY "Public can view sections"
ON public.store_sections_visibility
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = store_sections_visibility.store_id
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images"
ON public.product_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = product_images.product_id
      AND p.visibility = 'visible'
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Public can view option types" ON public.product_option_types;
CREATE POLICY "Public can view option types"
ON public.product_option_types
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = product_option_types.product_id
      AND p.visibility = 'visible'
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Public can view option values" ON public.product_option_values;
CREATE POLICY "Public can view option values"
ON public.product_option_values
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.product_option_types pot
    JOIN public.products p ON p.id = pot.product_id
    JOIN public.stores s ON s.id = p.store_id
    WHERE pot.id = product_option_values.option_type_id
      AND p.visibility = 'visible'
      AND s.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Public can view variants" ON public.product_variant_combinations;
CREATE POLICY "Public can view variants"
ON public.product_variant_combinations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = product_variant_combinations.product_id
      AND p.visibility = 'visible'
      AND s.is_active = TRUE
  )
);  -- =========================================================
-- PATCH 1: endurecer función de checkout
-- =========================================================

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
  -- validar tienda activa
  IF NOT EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = p_store_id
      AND s.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'La tienda no existe o no está activa';
  END IF;

  -- validar items
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido no tiene items válidos';
  END IF;

  -- crear orden en processing
  INSERT INTO public.orders (
    store_id,
    customer_name,
    customer_phone,
    customer_email,
    customer_address,
    customer_notes,
    items,
    subtotal,
    total,
    status
  )
  VALUES (
    p_store_id,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_customer_address,
    p_customer_notes,
    p_items,
    p_subtotal,
    p_total,
    'processing'
  )
  RETURNING id INTO v_order_id;

  -- recorrer items
  FOR v_item IN
    SELECT * FROM jsonb_array_elements(p_items)
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

    -- producto debe pertenecer a la tienda del pedido
    SELECT
      p.store_id,
      p.has_variants,
      p.track_inventory,
      p.allow_backorder,
      p.stock_quantity
    INTO
      v_product_store_id,
      v_has_variants,
      v_track_inventory,
      v_allow_backorder,
      v_stock_quantity
    FROM public.products p
    WHERE p.id = v_product_id
      AND p.store_id = p_store_id
      AND p.visibility = 'visible'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado para esta tienda';
    END IF;

    -- si tiene variantes, la variante debe existir y pertenecer a ese producto
    IF v_has_variants THEN
      IF v_variant_id IS NULL THEN
        RAISE EXCEPTION 'Debe elegir una variante para este producto';
      END IF;

      SELECT
        pvc.product_id,
        pvc.stock
      INTO
        v_variant_product_id,
        v_variant_stock
      FROM public.product_variant_combinations pvc
      WHERE pvc.id = v_variant_id
        AND pvc.product_id = v_product_id
        AND pvc.is_active = TRUE
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Variante inválida para este producto';
      END IF;
    ELSE
      -- si no tiene variantes, no debe venir variant id
      IF v_variant_id IS NOT NULL THEN
        RAISE EXCEPTION 'Este producto no usa variantes';
      END IF;
    END IF;

    -- descontar stock solo si corresponde
    IF v_track_inventory THEN
      IF v_has_variants THEN
        IF v_variant_stock < v_quantity AND v_allow_backorder = FALSE THEN
          RAISE EXCEPTION 'Stock insuficiente para la variante';
        END IF;

        UPDATE public.product_variant_combinations
        SET stock = stock - v_quantity
        WHERE id = v_variant_id;
      ELSE
        IF v_stock_quantity < v_quantity AND v_allow_backorder = FALSE THEN
          RAISE EXCEPTION 'Stock insuficiente para el producto';
        END IF;

        UPDATE public.products
        SET stock_quantity = stock_quantity - v_quantity
        WHERE id = v_product_id
          AND store_id = p_store_id;
      END IF;
    END IF;
  END LOOP;

  UPDATE public.orders
  SET status = 'new'
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

