-- ================================================================
-- MIGRATION 006: CHECKOUT METHODS & ORDER EXTENSIONS
-- ================================================================

-- 1. Añadir campos JSONB a la tabla store_settings para guardar los métodos habilitados por la tienda
ALTER TABLE public.store_settings 
  ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '["Transferencia bancaria", "Efectivo", "Tarjeta"]'::jsonb,
  ADD COLUMN IF NOT EXISTS shipping_methods JSONB DEFAULT '["Delivery", "Retiro en tienda"]'::jsonb;

-- 2. Añadir campos TEXT a la tabla orders para guardar qué método eligió el cliente
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS shipping_method TEXT;

-- 3. Actualizar el RPC create_order_and_deduct_stock para aceptar los nuevos campos
DROP FUNCTION IF EXISTS public.create_order_and_deduct_stock(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC);

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
  p_total NUMERIC DEFAULT 0,
  p_payment_method TEXT DEFAULT NULL,
  p_shipping_method TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_customer_id UUID;

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

  -- Upsert Customer based on phone + store_id
  SELECT id INTO v_customer_id 
  FROM public.customers 
  WHERE store_id = p_store_id AND phone_number = p_customer_phone 
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (
      store_id, full_name, phone_country_code, phone_number,
      email, address, neighborhood, city, notes
    ) VALUES (
      p_store_id, p_customer_name, p_phone_country_code, p_customer_phone,
      p_customer_email, p_customer_address, p_customer_neighborhood, p_customer_city, p_customer_notes
    ) RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers SET
      full_name = COALESCE(p_customer_name, full_name),
      email = COALESCE(p_customer_email, email),
      address = COALESCE(p_customer_address, address),
      neighborhood = COALESCE(p_customer_neighborhood, neighborhood),
      city = COALESCE(p_customer_city, city),
      updated_at = NOW()
    WHERE id = v_customer_id;
  END IF;

  -- Validate items
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido no tiene items válidos';
  END IF;

  -- Create order with initial status 'new' and new checkout methods
  INSERT INTO public.orders (
    store_id, customer_id, customer_name, customer_phone, customer_email,
    customer_address, customer_notes, items, subtotal, total, status,
    payment_method, shipping_method
  )
  VALUES (
    p_store_id, v_customer_id, p_customer_name, p_customer_phone, p_customer_email,
    p_customer_address, p_customer_notes, p_items, p_subtotal, p_total, 'new',
    p_payment_method, p_shipping_method
  )
  RETURNING id INTO v_order_id;

  -- Loop through items and deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id_str := v_item->>'variant_combination_id';
    v_quantity := (v_item->>'quantity')::INT;

    -- Validate quantity
    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'La cantidad del producto % debe ser mayor a 0', v_product_id;
    END IF;

    -- Get product info
    SELECT store_id, has_variants, track_inventory, allow_backorder, stock_quantity
    INTO v_product_store_id, v_has_variants, v_track_inventory, v_allow_backorder, v_stock_quantity
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE; -- Lock for update

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto % no encontrado', v_product_id;
    END IF;

    IF v_product_store_id <> p_store_id THEN
      RAISE EXCEPTION 'Producto % de otra tienda', v_product_id;
    END IF;

    -- Processing stock reduction
    IF v_track_inventory THEN
      IF v_has_variants THEN
        IF v_variant_id_str IS NULL OR v_variant_id_str = '' THEN
          RAISE EXCEPTION 'El producto % requiere variante', v_product_id;
        END IF;

        v_variant_id := v_variant_id_str::UUID;

        SELECT product_id, stock
        INTO v_variant_product_id, v_variant_stock
        FROM public.product_variant_combinations
        WHERE id = v_variant_id AND is_active = TRUE
        FOR UPDATE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Variante % no encontrada o inactiva', v_variant_id;
        END IF;

        IF v_variant_product_id <> v_product_id THEN
          RAISE EXCEPTION 'Inconsistencia: variante % no de prod %', v_variant_id, v_product_id;
        END IF;

        IF NOT v_allow_backorder AND v_variant_stock < v_quantity THEN
          RAISE EXCEPTION 'Stock insuficiente var % (req %, disp %)', v_variant_id, v_quantity, v_variant_stock;
        END IF;

        -- Deduct variant stock
        UPDATE public.product_variant_combinations
        SET stock = stock - v_quantity
        WHERE id = v_variant_id;

      ELSE
        -- No variants
        IF NOT v_allow_backorder AND v_stock_quantity < v_quantity THEN
          RAISE EXCEPTION 'Stock insuficiente prod % (req %, disp %)', v_product_id, v_quantity, v_stock_quantity;
        END IF;

        -- Deduct main stock
        UPDATE public.products
        SET stock_quantity = stock_quantity - v_quantity
        WHERE id = v_product_id;
      END IF;
    END IF;
  END LOOP;

  RETURN v_order_id;
END;
$$;
