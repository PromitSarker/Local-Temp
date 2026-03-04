-- Add notes field to bookings table for practice instructions to locum
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes TEXT;
