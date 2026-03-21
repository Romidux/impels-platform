export const phase4_extensions_sql = `
-- Phase 4: Extensions MVP
-- Add tracking pixel columns to store_settings

ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
ADD COLUMN IF NOT EXISTS google_analytics_id TEXT;

-- Notify: Afterwards, you can update your RLS policies if needed, 
-- but since store_settings is already readable by the public and writable by the owner, 
-- these new columns will inherit those rules automatically.
`;
