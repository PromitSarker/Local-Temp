-- Add new values to payment_status enum
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'held';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'disputed';

-- Add columns for review period tracking
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2);

