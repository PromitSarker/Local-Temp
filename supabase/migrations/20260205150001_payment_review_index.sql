-- Create index for filtering held/disputed bookings
-- Separated from 20260205150000_payment_review_schema.sql to avoid "unsafe use of new value" enum error
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status_review ON public.bookings(payment_status) WHERE payment_status IN ('held', 'disputed');
