-- ================================================================
-- MIGRATION 013: Add admin suspension fields to stores
-- ================================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS disabled_reason  text,
  ADD COLUMN IF NOT EXISTS disabled_at      timestamptz;

-- When a store is reactivated, clear the reason and date
-- This is handled at the application level in the server action.
