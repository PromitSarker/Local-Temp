-- Seed file to create admin user
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new)

-- This will create the admin user if it doesn't exist
-- Email: admin@localtemp.co.uk
-- Password: admin123

-- Note: You need to run this with your service role or in the Supabase SQL Editor

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Create the user using Supabase Auth
    -- Note: This uses the auth.users table which requires elevated privileges
    
    -- First check if user exists
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'admin@localtemp.co.uk';
    
    IF v_user_id IS NULL THEN
        -- User doesn't exist, we need to create it via the Supabase dashboard
        -- or using the Admin API
        RAISE NOTICE 'Please create user admin@localtemp.co.uk via Supabase Dashboard > Authentication > Add User';
        RAISE NOTICE 'Email: admin@localtemp.co.uk';
        RAISE NOTICE 'Password: admin123';
        RAISE NOTICE 'Then run this script again to set the admin role';
    ELSE
        -- User exists, just update the profile to admin
        INSERT INTO public.profiles (id, user_type, email, full_name)
        VALUES (v_user_id, 'admin', 'admin@localtemp.co.uk', 'System Administrator')
        ON CONFLICT (id) 
        DO UPDATE SET user_type = 'admin';
        
        RAISE NOTICE 'Admin role set for user %', v_user_id;
    END IF;
END $$;
