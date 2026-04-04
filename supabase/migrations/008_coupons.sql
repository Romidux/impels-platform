-- ================================================================
-- MIGRATION 008: BUSINESS / COUPONS AND CHECKOUT TRANSACTION
-- ================================================================

-- 1. Create Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL CHECK (value > 0),
  min_purchase NUMERIC DEFAULT 0,
  max_uses INT DEFAULT NULL,
  current_uses INT DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (store_id, code)
);

-- Index for fast lookup by code during checkout
CREATE INDEX IF NOT EXISTS idx_coupons_store_code ON public.coupons (store_id, code);

-- 2. Enhance Orders Table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- 3. Replace the Checkout RPC function to handle coupon atomic validations
DROP FUNCTION IF EXISTS public.create_order_and_deduct_stock(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, TEXT, TEXT);

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
  p_shipping_method TEXT DEFAULT NULL,
  p_coupon_code TEXT DEFAULT NULL
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

  -- Coupon variables
  v_coupon_record RECORD;
  v_discount_amount NUMERIC := 0;
  v_final_total NUMERIC := p_total;
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

  -- COUPON VALIDATION & CALCULATION
  IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon_record 
    FROM public.coupons 
    WHERE store_id = p_store_id AND code = UPPER(TRIM(p_coupon_code)) 
    FOR UPDATE; -- Row-level lock to prevent concurrent abuse
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'El cupón "%" no existe.', p_coupon_code;
    END IF;
    
    IF NOT v_coupon_record.is_active THEN
      RAISE EXCEPTION 'El cupón "%" no está activo.', p_coupon_code;
    END IF;

    IF v_coupon_record.expires_at IS NOT NULL AND v_coupon_record.expires_at < NOW() THEN
      RAISE EXCEPTION 'El cupón "%" ha expirado.', p_coupon_code;
    END IF;

    IF v_coupon_record.min_purchase IS NOT NULL AND v_coupon_record.min_purchase > 0 AND p_subtotal < v_coupon_record.min_purchase THEN
      RAISE EXCEPTION 'El cupón "%" requiere una compra mínima de %.', p_coupon_code, v_coupon_record.min_purchase;
    END IF;

    IF v_coupon_record.max_uses IS NOT NULL AND v_coupon_record.current_uses >= v_coupon_record.max_uses THEN
      RAISE EXCEPTION 'El cupón "%" ha superado su límite de usos.', p_coupon_code;
    END IF;

    -- Calculate discount strictly over the subtotal (product prices)
    IF v_coupon_record.type = 'percentage' THEN
      v_discount_amount := ROUND((p_subtotal * (v_coupon_record.value / 100))::NUMERIC, 2);
    ELSIF v_coupon_record.type = 'fixed' THEN
      v_discount_amount := v_coupon_record.value;
    END IF;

    -- Avoid negative totals
    IF v_discount_amount > p_subtotal THEN
      v_discount_amount := p_subtotal;
    END IF;

    -- The new final total reflects the product discount
    v_final_total := p_total - v_discount_amount;
    IF v_final_total < 0 THEN
      v_final_total := 0;
    END IF;

    -- Atomically increment the usage counter
    UPDATE public.coupons 
    SET current_uses = current_uses + 1 
    WHERE id = v_coupon_record.id;
  END IF;

  -- Validate items
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido no tiene items válidos';
  END IF;

  -- Create order with initial status 'new', checkout methods, and coupon data
  INSERT INTO public.orders (
    store_id, customer_id, customer_name, customer_phone, customer_email,
    customer_address, customer_notes, items, subtotal, total, status,
    payment_method, shipping_method, coupon_code, discount_amount
  )
  VALUES (
    p_store_id, v_customer_id, p_customer_name, p_customer_phone, p_customer_email,
    p_customer_address, p_customer_notes, p_items, p_subtotal, v_final_total, 'new',
    p_payment_method, p_shipping_method, NULLIF(UPPER(TRIM(p_coupon_code)), ''), v_discount_amount
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
