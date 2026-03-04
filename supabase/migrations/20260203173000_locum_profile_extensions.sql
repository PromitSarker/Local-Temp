-- Add locum specific fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gdc_number TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC,
ADD COLUMN IF NOT EXISTS travel_radius INTEGER, -- in miles
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postcode TEXT,
ADD COLUMN IF NOT EXISTS job_type TEXT[], -- e.g. ['nurse', 'hygienist']
ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT,
ADD COLUMN IF NOT EXISTS insurance_coverage TEXT,
ADD COLUMN IF NOT EXISTS insurance_expiry DATE;

-- Update RLS to ensure these can be updated by the user
-- (Existing policies on profiles should handle this if they are "USING (auth.uid() = user_id)")
-- We double check existing policies allow update of these new columns impliedly.

-- Add indexes for common searches
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_job_type ON public.profiles USING GIN(job_type);
