-- Add additional practice settings fields to the practices table
ALTER TABLE public.practices
ADD COLUMN IF NOT EXISTS practice_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS operating_hours JSONB;
