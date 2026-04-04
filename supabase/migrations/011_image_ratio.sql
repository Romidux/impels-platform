-- ================================================================
-- MIGRATION 011: Product Image Aspect Ratio Setting
-- ================================================================
-- Adds a configurable aspect ratio for product images in storefront.
-- Options: '1:1' (square) or '4:5' (Instagram-style).
-- Default: '4:5' (established by Minimal template).
-- ================================================================

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS product_image_ratio text NOT NULL DEFAULT '4:5';
