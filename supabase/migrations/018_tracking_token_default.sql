-- ================================================================
-- MIGRATION 018: tracking_token sin valor por defecto rompe el checkout
-- ================================================================
-- La migración 009 agregó la columna:
--
--   ALTER TABLE public.orders
--     ADD COLUMN IF NOT EXISTS tracking_token text,   -- sin DEFAULT
--   ...
--   ALTER TABLE public.orders
--     ALTER COLUMN tracking_token SET NOT NULL;
--
-- Rellenó los pedidos existentes y puso la columna NOT NULL, pero NO le
-- dio un valor por defecto y NO actualizó create_order_and_deduct_stock,
-- que es de la migración 008 y por lo tanto anterior.
--
-- Ese INSERT no menciona tracking_token. Sin default, el valor es NULL y
-- la restricción NOT NULL aborta la transacción:
--
--   23502: null value in column "tracking_token" of relation "orders"
--          violates not-null constraint
--
-- Es decir: desde que se aplicó la 009, NINGÚN pedido puede crearse.
-- Ni desde el checkout de la tienda ni desde el pedido manual del
-- dashboard, porque los dos pasan por el mismo RPC.
--
-- Comprobado contra la base llamando al RPC con un producto inexistente:
-- el INSERT del pedido falla antes de llegar a validar el producto.
--
-- El arreglo va en la columna y no en la función para que cubra también
-- cualquier INSERT directo con service_role.
-- ================================================================

ALTER TABLE public.orders
  ALTER COLUMN tracking_token
  SET DEFAULT lower(replace(gen_random_uuid()::text, '-', ''));

-- Red de seguridad: si quedó alguna fila en NULL de antes, se rellena.
UPDATE public.orders
SET tracking_token = lower(replace(gen_random_uuid()::text, '-', ''))
WHERE tracking_token IS NULL;

COMMENT ON COLUMN public.orders.tracking_token IS
  'Token público de seguimiento del pedido. Tiene DEFAULT porque '
  'create_order_and_deduct_stock no lo setea en su INSERT; sin el default '
  'la restricción NOT NULL hace fallar todo el checkout.';
