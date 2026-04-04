-- ================================================================
-- MIGRATION 005: CUSTOMERS (SAFE VERSION - FINAL)
-- ================================================================

-- 1. Renombramientos Seguros (Evita error si la columna no existe)
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='customers' AND column_name='name') THEN
    ALTER TABLE public.customers RENAME COLUMN name TO full_name;
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='customers' AND column_name='phone') THEN
    ALTER TABLE public.customers RENAME COLUMN phone TO phone_number;
  END IF;
END $$;

-- 2. Añadir Columnas (Idempotente)
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS doc_type text,
  ADD COLUMN IF NOT EXISTS doc_number text,
  ADD COLUMN IF NOT EXISTS doc_verifier text,
  ADD COLUMN IF NOT EXISTS phone_country_code text DEFAULT '+595',
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Constraint de Órdenes a Clientes
DO $$
BEGIN
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_customer_id_fkey'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.customers (id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Creación Segura del Helper function para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Índices para Performance y Búsqueda
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON public.customers(store_id);
-- Indice Funcional para escaneo normalizado:
CREATE INDEX IF NOT EXISTS idx_customers_store_phone_normalized ON public.customers (store_id, regexp_replace(phone_number, '\D', '', 'g'));
CREATE INDEX IF NOT EXISTS idx_customers_store_email_normalized ON public.customers(store_id, lower(trim(email)));
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- 6. Trigger Updated At
DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store members can view customers" ON public.customers;
CREATE POLICY "Store members can view customers"
  ON public.customers FOR SELECT
  USING (public.has_store_access(store_id, auth.uid()));

DROP POLICY IF EXISTS "Store owners/admins can insert customers" ON public.customers;
CREATE POLICY "Store owners/admins can insert customers"
  ON public.customers FOR INSERT
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

DROP POLICY IF EXISTS "Store owners/admins can update customers" ON public.customers;
CREATE POLICY "Store owners/admins can update customers"
  ON public.customers FOR UPDATE
  USING (public.has_store_access(store_id, auth.uid()))
  WITH CHECK (public.has_store_access(store_id, auth.uid()));

DROP POLICY IF EXISTS "Store owners/admins can delete customers" ON public.customers;
CREATE POLICY "Store owners/admins can delete customers"
  ON public.customers FOR DELETE
  USING (public.has_store_access(store_id, auth.uid()));

-- ================================================================
-- CHECKOUT RPC (REFORZADA Y BLINDADA)
-- ================================================================
CREATE OR REPLACE FUNCTION public.create_order_and_deduct_stock(
  p_store_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_phone_country_code TEXT DEFAULT '+595',
  p_customer_email TEXT DEFAULT NULL,
  p_customer_city TEXT DEFAULT NULL,
  p_customer_neighborhood TEXT DEFAULT NULL,
  p_customer_address TEXT DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]',
  p_subtotal NUMERIC DEFAULT 0,
  p_total NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER   -- IMPORTANTE: Bypassa internamente RLS pero lo reforzamos aquí
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_customer_id UUID;
  v_item RECORD;

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
  
  v_clean_phone TEXT;
BEGIN
  -- VALIDACIÓN 0: Obligatoriedad de datos vitales
  IF p_customer_phone IS NULL OR trim(p_customer_phone) = '' THEN
    RAISE EXCEPTION 'El teléfono del cliente es obligatorio';
  END IF;

  IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
    RAISE EXCEPTION 'El nombre del cliente es obligatorio';
  END IF;

  -- VALIDACIÓN 1: Verificar que la tienda existe y está activa
  IF NOT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = p_store_id AND s.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'La tienda no existe o no está activa';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido no tiene items válidos';
  END IF;
  
  -- Normalizamos teléfono entrante
  v_clean_phone := regexp_replace(p_customer_phone, '\D', '', 'g');

  -- BUSCAR CLIENTE EXISTENTE (Normalizado)
  SELECT id INTO v_customer_id 
  FROM public.customers 
  WHERE store_id = p_store_id 
    AND regexp_replace(phone_number, '\D', '', 'g') = v_clean_phone
  LIMIT 1;

  -- Búsqueda por e-mail normalizado si no hay match de celular
  IF v_customer_id IS NULL AND p_customer_email IS NOT NULL AND trim(p_customer_email) != '' THEN
    SELECT id INTO v_customer_id 
    FROM public.customers 
    WHERE store_id = p_store_id AND lower(trim(email)) = lower(trim(p_customer_email))
    LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    -- Crear cliente nuevo
    INSERT INTO public.customers (
      store_id, 
      full_name, 
      phone_country_code, 
      phone_number, 
      email, 
      city, 
      neighborhood, 
      address, 
      notes
    ) VALUES (
      p_store_id, 
      TRIM(p_customer_name), 
      TRIM(p_phone_country_code), 
      TRIM(p_customer_phone), 
      lower(trim(p_customer_email)), 
      TRIM(p_customer_city), 
      TRIM(p_customer_neighborhood), 
      TRIM(p_customer_address), 
      p_customer_notes
    ) RETURNING id INTO v_customer_id;
  ELSE
    -- UPDATE SUAVE DE CLIENTE EXISTENTE (Robustecido nulos)
    UPDATE public.customers
    SET 
      full_name = COALESCE(NULLIF(TRIM(full_name), ''), NULLIF(TRIM(p_customer_name), '')),
      email = COALESCE(NULLIF(TRIM(email), ''), NULLIF(lower(trim(p_customer_email)), '')),
      phone_country_code = COALESCE(NULLIF(TRIM(phone_country_code), ''), NULLIF(TRIM(p_phone_country_code), '')),
      city = COALESCE(NULLIF(TRIM(city), ''), NULLIF(TRIM(p_customer_city), '')),
      neighborhood = COALESCE(NULLIF(TRIM(neighborhood), ''), NULLIF(TRIM(p_customer_neighborhood), '')),
      address = COALESCE(NULLIF(TRIM(address), ''), NULLIF(TRIM(p_customer_address), ''))
    WHERE id = v_customer_id;
  END IF;

  -- Crear Orden con el customer_id enlazado y datos legacy para compat
  INSERT INTO public.orders (
    store_id,
    customer_id,
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
    v_customer_id,
    TRIM(p_customer_name),
    TRIM(p_customer_phone),
    lower(trim(p_customer_email)),
    TRIM(p_customer_address),
    p_customer_notes,
    p_items,
    p_subtotal,
    p_total,
    'processing'
  )
  RETURNING id INTO v_order_id;

  -- Procesamiento de Items y Descuento de Stock
  FOR v_item IN
    SELECT * FROM jsonb_to_recordset(p_items) AS x(
      product_id UUID, 
      quantity INTEGER, 
      variant_combination_id UUID
    )
  LOOP
    v_product_id := v_item.product_id;
    v_quantity := v_item.quantity;
    v_variant_id := v_item.variant_combination_id;

    IF v_product_id IS NULL OR v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Item inválido en el pedido';
    END IF;

    -- VALIDACIÓN 2: Que el producto pertenezca a ESTA tienda
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
      AND p.store_id = p_store_id   -- ESCLUSA DE SEGURIDAD
      AND p.visibility = 'visible'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado para esta tienda';
    END IF;

    IF v_has_variants THEN
      IF v_variant_id IS NULL THEN
        RAISE EXCEPTION 'Debe elegir una variante para este producto';
      END IF;

      -- VALIDACIÓN 3: Que la variante le pertenezca a ESTE producto en ESTA tienda
      SELECT
        pvc.product_id,
        pvc.stock
      INTO
        v_variant_product_id,
        v_variant_stock
      FROM public.product_variant_combinations pvc
      WHERE pvc.id = v_variant_id
        AND pvc.product_id = v_product_id  -- ESCLUSA DE SEGURIDAD 2
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

    -- Lógica de descuento real
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

  -- Mover a nueva orden tras validar stocks
  UPDATE public.orders
  SET status = 'new'
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;
