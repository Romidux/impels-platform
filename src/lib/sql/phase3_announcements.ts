export const platform_announcements_sql = `
-- Table: platform_announcements
CREATE TABLE IF NOT EXISTS public.platform_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can read published announcements
CREATE POLICY "Public can view published announcements" 
ON public.platform_announcements FOR SELECT 
USING (is_published = true);

-- Only Super Admins can manage all announcements
CREATE POLICY "Super Admins can manage announcements" 
ON public.platform_announcements FOR ALL 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true
);
`;
