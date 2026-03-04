-- Skills tables
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT, -- e.g. 'clinical', 'software', 'language'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, skill_id)
);

-- RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- Skills are readable by everyone, but only admins (service role) should ideally manage the master list. 
-- For now, we allow authenticated users to view.
DO $$ BEGIN
    CREATE POLICY "Skills are viewable by everyone" 
    ON public.skills FOR SELECT 
    USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- User Skills
DO $$ BEGIN
    CREATE POLICY "User skills are viewable by everyone" 
    ON public.user_skills FOR SELECT 
    USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage their own skills" 
    ON public.user_skills FOR ALL 
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Seed some default skills
INSERT INTO public.skills (name, category) VALUES
('Sedation', 'Clinical'),
('Implants', 'Clinical'),
('Invisalign', 'Clinical'),
('Software of Excellence (SOE)', 'Software'),
('R4', 'Software'),
('Dentally', 'Software')
ON CONFLICT (name) DO NOTHING;
