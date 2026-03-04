-- Table for storing One-Time Passwords (OTPs) for registration
CREATE TABLE IF NOT EXISTS public.otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- email or phone
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'phone')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(identifier, type)
);

-- Enable RLS
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;

-- Only service role can access these (for edge functions)
CREATE POLICY "Service role only" ON public.otps
    FOR ALL
    USING (auth.role() = 'service_role');

-- Index for fast lookup by identifier and code
CREATE INDEX IF NOT EXISTS idx_otps_lookup ON public.otps(identifier, type, code) 
WHERE expires_at > now();

-- Helper function to clean up expired OTPs (can be called by cron or manually)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM public.otps WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
