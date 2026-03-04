-- Create a function to update admin role
-- This can be called via RPC or run directly in SQL editor

CREATE OR REPLACE FUNCTION update_admin_role(admin_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET user_type = 'admin'
  WHERE id IN (
    SELECT id FROM auth.users WHERE email = admin_email
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_admin_role(TEXT) TO anon, authenticated;

-- Now update the admin user
SELECT update_admin_role('admin@localtemp.co.uk');
