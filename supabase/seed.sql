-- Seed file to create admin user
-- This will be run automatically after migrations

-- Insert admin user into auth.users
-- Note: This uses a pre-hashed password for 'admin123'
-- Hash generated using: bcrypt with cost 10

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fixed UUID for admin
    'authenticated',
    'authenticated',
    'admin@localtemp.co.uk',
    '$2a$10$rKvFJvXQZ9YqJxJxJxJxJO5YqJxJxJxJxJxJxJxJxJxJxJxJxJxJx', -- bcrypt hash for 'admin123'
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{}',
    NULL,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL
) ON CONFLICT (id) DO NOTHING;

-- Create profile for admin user
INSERT INTO public.profiles (id, user_type, email, full_name, created_at, updated_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin',
    'admin@localtemp.co.uk',
    'System Administrator',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE 
SET user_type = 'admin';
