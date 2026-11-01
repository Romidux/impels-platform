-- ================================================================
-- MIGRATION 017: Umbral de stock bajo configurable
-- ================================================================
-- El dashboard de Inventario consideraba "stock bajo" todo producto con 5
-- unidades o menos, un número escrito a mano en cinco lugares del código. Para
-- un producto que se vende de a 50, 5 no es "bajo": ya es tarde.
--
-- Pasa a ser por tienda. Default 5, que es el comportamiento que había, así que
-- aplicar esta migración no cambia nada hasta que la tienda elija otro número.
--
-- El código lee la columna con respaldo en 5 (`low_stock_threshold ?? 5`), así
-- que Inventario funciona igual antes y después de aplicar esto; lo único que
-- no anda hasta aplicarla es guardar un umbral distinto.
-- ================================================================

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;

-- Un umbral negativo no significa nada y 0 dejaría "stock bajo" vacío para
-- siempre; el tope alto es para que un dedo pesado no escriba 1000000.
ALTER TABLE public.store_settings
DROP CONSTRAINT IF EXISTS store_settings_low_stock_threshold_check;

ALTER TABLE public.store_settings
ADD CONSTRAINT store_settings_low_stock_threshold_check
CHECK (low_stock_threshold >= 1 AND low_stock_threshold <= 9999);
