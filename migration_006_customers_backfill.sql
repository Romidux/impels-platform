-- ================================================================
-- MIGRATION 006: CUSTOMERS BACKFILL (ROBUST VERSION)
-- ================================================================

-- Este script enlaza órdenes antiguas hacia sus clientes usando normalización extrema.
DO $$
DECLARE
  rec RECORD;
  v_inserted_id UUID;
  v_normalized_phone TEXT;
BEGIN
  FOR rec IN 
    SELECT store_id, customer_name, customer_phone, customer_email
    FROM public.orders
    WHERE customer_id IS NULL 
      AND customer_phone IS NOT NULL 
      AND customer_name IS NOT NULL
      AND trim(customer_phone) <> ''
    GROUP BY store_id, customer_phone, customer_name, customer_email
  LOOP
    v_inserted_id := NULL;
    v_normalized_phone := regexp_replace(rec.customer_phone, '\D', '', 'g');

    -- IGNORAR SI EL TELÉFONO ES PURO TEXTO O VACÍO DESPUÉS DE NORMALIZAR
    IF length(v_normalized_phone) > 0 THEN
      
      -- Detectamos si existe por limpieza de numero
      SELECT id INTO v_inserted_id 
      FROM public.customers 
      WHERE store_id = rec.store_id 
        AND regexp_replace(phone_number, '\D', '', 'g') = v_normalized_phone
      LIMIT 1;

      -- Búsqueda por e-mail normalizado si no hay match de celular (Fallback)
      IF v_inserted_id IS NULL AND rec.customer_email IS NOT NULL AND trim(rec.customer_email) != '' THEN
        SELECT id INTO v_inserted_id 
        FROM public.customers 
        WHERE store_id = rec.store_id 
          AND lower(trim(email)) = lower(trim(rec.customer_email))
        LIMIT 1;
      END IF;

      -- Si no habia por ningún lado, lo creamos silenciamente
      IF v_inserted_id IS NULL THEN
        INSERT INTO public.customers (
          store_id, 
          full_name, 
          phone_country_code, 
          phone_number, 
          email
        )
        VALUES (
          rec.store_id, 
          trim(rec.customer_name), 
          '+595', 
          trim(rec.customer_phone), 
          lower(trim(rec.customer_email))
        )
        RETURNING id INTO v_inserted_id;
      ELSE
        -- Update Suave para los registros históricos que emparejan
        UPDATE public.customers
        SET 
          full_name = COALESCE(NULLIF(TRIM(full_name), ''), NULLIF(TRIM(rec.customer_name), '')),
          email = COALESCE(NULLIF(TRIM(email), ''), NULLIF(lower(trim(rec.customer_email)), ''))
        WHERE id = v_inserted_id;
      END IF;
      
      -- Actualizar órdenes históricas huérfanas NORMALIZADAS
      UPDATE public.orders
      SET customer_id = v_inserted_id
      WHERE store_id = rec.store_id 
        AND customer_id IS NULL
        AND regexp_replace(customer_phone, '\D', '', 'g') = v_normalized_phone;

    END IF;
  END LOOP;
END $$;
