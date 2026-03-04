-- Properly create admin profile for admin@localtemp.co.uk
-- The profiles table uses 'user_id' column, not 'id'

INSERT INTO public.profiles (id, user_id, user_type, full_name, email, created_at, updated_at)
SELECT 
    auth.users.id,
    auth.users.id,
    'admin'::user_type,
    'System Administrator',
    auth.users.email,
    NOW(),
    NOW()
FROM auth.users
WHERE auth.users.email = 'admin@localtemp.co.uk'
ON CONFLICT (user_id) 
DO UPDATE SET 
    user_type = 'admin'::user_type,
    full_name = 'System Administrator';

-- Verify
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.profiles
    WHERE user_type = 'admin'::user_type 
    AND user_id IN (SELECT id FROM auth.users WHERE email = 'admin@localtemp.co.uk');
    
    IF v_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Admin profile created/updated for admin@localtemp.co.uk';
    ELSE
        RAISE WARNING 'FAILED: Could not create admin profile. User may not exist in auth.users';
    END IF;
END $$;
