ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reliability_score INTEGER DEFAULT 100;

-- Update RLS for public access
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);
