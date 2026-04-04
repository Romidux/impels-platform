  -- ================================================================
  -- MIGRATION 008b: COUPONS STRICT RLS & PUBLIC VALIDATION RPC
  -- ================================================================

  ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

  -- 1. Índice funcional y optimizado
  CREATE INDEX IF NOT EXISTS idx_coupons_code_upper
  ON public.coupons (store_id, UPPER(TRIM(code)));

  -- 2. Políticas de Dashboard (Dashboard)
  -- Cualquier propietario de tienda puede crear, ver y editar SUS propios cupones
  -- Se agrega WITH CHECK explícito para asegurar de que no modifique o inserte ajenos.
  DROP POLICY IF EXISTS "Public Read Active Coupons" ON public.coupons;
  DROP POLICY IF EXISTS "Store Owners Full Access Coupons" ON public.coupons;

  CREATE POLICY "Store Owners Full Access Coupons"
  ON public.coupons
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = coupons.store_id AND stores.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = coupons.store_id AND stores.owner_id = auth.uid())
  );

  -- Nota de Seguridad Frontal: 
  -- NO SE CREAN POLÍTICAS PÚBLICAS PARA LA TABLA COUPONS. 
  -- Cero acceso directo desde el frontend para evitar enumeración. 
  -- Toda consulta de "Usuario final" debe pasar por el RPC de abajo.


  -- 2. RPC Público para Validar Cupón de forma controlada (Zero-Knowledge real)
  -- Firma controlada para proteger lógica de cupones desde un cliente anon.
  DROP FUNCTION IF EXISTS public.validate_coupon_public(UUID, TEXT, NUMERIC);

  CREATE OR REPLACE FUNCTION public.validate_coupon_public(
    p_store_id UUID,
    p_code TEXT,
    p_subtotal NUMERIC
  )
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  DECLARE
    v_coupon RECORD;
    v_discount NUMERIC := 0;
  BEGIN
    -- Intentamos buscar el cupón exacto limitando por store y codigo sin exponer la lista completa
    SELECT * INTO v_coupon 
    FROM public.coupons 
    WHERE store_id = p_store_id AND code = UPPER(TRIM(p_code))
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Cupón inválido o inexistente');
    END IF;

    IF NOT v_coupon.is_active THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Este cupón no está activo');
    END IF;

    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Este cupón ha expirado');
    END IF;

    IF v_coupon.min_purchase IS NOT NULL AND v_coupon.min_purchase > 0 AND p_subtotal < v_coupon.min_purchase THEN
      RETURN jsonb_build_object('valid', false, 'min_purchase', v_coupon.min_purchase, 'message', 'minimum_not_met');
    END IF;

    IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Este cupón ha superado su límite de usos');
    END IF;

    -- Calcular el descuento estimativo solo como cortesía de UI
    IF v_coupon.type = 'percentage' THEN
      v_discount := ROUND((p_subtotal * (v_coupon.value / 100))::NUMERIC, 2);
    ELSIF v_coupon.type = 'fixed' THEN
      v_discount := v_coupon.value;
    END IF;

    IF v_discount > p_subtotal THEN
      v_discount := p_subtotal;
    END IF;

    RETURN jsonb_build_object(
      'valid', true,
      'code', v_coupon.code,
      'type', v_coupon.type,
      'calculated_discount', v_discount,
      'message', '¡Cupón aplicado correctamente!'
    );
  END;
  $$;
