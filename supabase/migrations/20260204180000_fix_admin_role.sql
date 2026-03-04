-- Fix admin role for admin@localtemp.co.uk
-- This directly updates the profile to ensure admin access

UPDATE public.profiles
SET user_type = 'admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'admin@localtemp.co.uk'
);

-- Verify the update
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count
    FROM public.profiles
    WHERE user_type = 'admin' AND id IN (
        SELECT id FROM auth.users WHERE email = 'admin@localtemp.co.uk'
    );
    
    IF admin_count > 0 THEN
        RAISE NOTICE 'Admin role successfully set for admin@localtemp.co.uk';
    ELSE
        RAISE WARNING 'Failed to set admin role - user may not exist';
    END IF;
END $$;
