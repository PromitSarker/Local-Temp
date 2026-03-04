-- Add Stripe Account ID to profiles (for Locums to receive payouts)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Create payment status enum
DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'released', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add payment fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT, -- Stripe PaymentIntent ID (Charge)
ADD COLUMN IF NOT EXISTS transfer_id TEXT,       -- Stripe Transfer ID (Payout)
ADD COLUMN IF NOT EXISTS admin_fee NUMERIC(10, 2); -- The fee taken by platform

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON public.profiles(stripe_account_id);
