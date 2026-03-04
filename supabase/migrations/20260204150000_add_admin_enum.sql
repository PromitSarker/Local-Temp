-- Update user_type enum to include 'admin'
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'admin';
