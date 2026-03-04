-- Promote the demo user to admin
UPDATE public.profiles 
SET user_type = 'admin' 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'admin@localtemp.co.uk'
);
