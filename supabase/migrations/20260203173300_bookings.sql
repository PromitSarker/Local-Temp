-- Bookings / Jobs table
-- This table represents a shift that is either requested or confirmed
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'rejected');

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID REFERENCES public.profiles(id) NOT NULL, -- The practice posting the job
    locum_id UUID REFERENCES public.profiles(id), -- Nullable initially if it's an open job post
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hourly_rate NUMERIC NOT NULL,
    status booking_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Applications table (Locums applying to open bookings)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    locum_id UUID REFERENCES public.profiles(id) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(booking_id, locum_id)
);

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Bookings Policies
DO $$ BEGIN
    CREATE POLICY "Bookings are viewable by everyone" 
    ON public.bookings FOR SELECT 
    USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Practices can insert bookings" 
    ON public.bookings FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = practice_id 
            AND user_id = auth.uid()
            AND user_type = 'practice'
        )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Practices can update their own bookings" 
    ON public.bookings FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = practice_id 
            AND user_id = auth.uid()
        )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Applications Policies
DO $$ BEGIN
    CREATE POLICY "Practices can view applications for their bookings" 
    ON public.applications FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            JOIN public.profiles ON bookings.practice_id = profiles.id
            WHERE bookings.id = applications.booking_id
            AND profiles.user_id = auth.uid()
        )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Locums can view their own applications" 
    ON public.applications FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = locum_id
            AND user_id = auth.uid()
        )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Locums can insert applications" 
    ON public.applications FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = locum_id
            AND user_id = auth.uid()
            AND user_type = 'locum'
        )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;
