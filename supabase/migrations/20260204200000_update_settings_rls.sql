-- Update RLS policies for system_settings
-- Goal: Allow all authenticated users to read PUBLIC settings
-- Keep WRITE access restricted to admins
-- Keep SECRET settings restricted to admins

DROP POLICY IF EXISTS "Admins can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;

-- 1. Everyone (Authenticated) can view NON-SECRET settings
CREATE POLICY "Authenticated users can view public settings"
ON public.system_settings FOR SELECT
USING (
    auth.role() = 'authenticated' AND 
    is_secret = false
);

-- 2. Admins can view ALL settings (including secrets)
CREATE POLICY "Admins can view all settings"
ON public.system_settings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type = 'admin'
    )
);

-- 3. Admins can perform INSERT/UPDATE/DELETE
CREATE POLICY "Admins can manage system settings"
ON public.system_settings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type = 'admin'
    )
);
