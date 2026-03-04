-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    is_secret BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins can perform operations
DO $$ BEGIN
    CREATE POLICY "Admins can view system settings" 
    ON public.system_settings FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can update system settings" 
    ON public.system_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can insert system settings" 
    ON public.system_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Insert default structure (values empty initially)
INSERT INTO public.system_settings (key, value, description, is_secret)
VALUES 
    ('STRIPE_SECRET_KEY', '', 'Stripe Secret Key (sk_...)', true),
    ('STRIPE_PUBLISHABLE_KEY', '', 'Stripe Publishable Key (pk_...)', false),
    ('ADMIN_FEE_PERCENTAGE', '0.10', 'Platform Fee Percentage (0.10 = 10%)', false)
ON CONFLICT (key) DO NOTHING;
