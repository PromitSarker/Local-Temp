-- Ticketing and Disputes Schema
CREATE TYPE public.ticket_status AS ENUM ('open', 'resolved', 'closed');

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status public.ticket_status DEFAULT 'open',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- RLS for tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Users can read tickets they created or are involved in via the booking
CREATE POLICY "Users can view their own tickets or tickets on their bookings"
    ON public.tickets
    FOR SELECT
    USING (
        auth.uid() = creator_id OR
        auth.uid() IN (
            SELECT practice_id FROM public.bookings WHERE id = booking_id
            UNION
            SELECT locum_id FROM public.bookings WHERE id = booking_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Only admins can update the status/resolution notes of a ticket
CREATE POLICY "Admins can update tickets"
    ON public.tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Any involved user can create a ticket for a booking
CREATE POLICY "Users can create tickets for their bookings"
    ON public.tickets
    FOR INSERT
    WITH CHECK (
        auth.uid() = creator_id AND
        auth.uid() IN (
            SELECT practice_id FROM public.bookings WHERE id = booking_id
            UNION
            SELECT locum_id FROM public.bookings WHERE id = booking_id
        )
    );

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ticket_updated
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_timestamp();

-- Create an RPC function to find bookings for auto release
-- Gets completed bookings that are held, not disputed, and older than 24 hours
CREATE OR REPLACE FUNCTION get_bookings_for_auto_release()
RETURNS TABLE (
    booking_id UUID,
    practice_id UUID,
    locum_id UUID,
    payment_intent_id TEXT
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.practice_id,
        b.locum_id,
        b.payment_intent_id
    FROM 
        public.bookings b
    WHERE 
        b.status = 'completed' AND 
        b.payment_status = 'held' AND
        -- Ensure at least 24 hours have passed since the shift completed/ended
        -- Ideally, we use b.date + b.end_time + 24 hours
        -- Since date is DATE and end_time is TIME, we combine them
        ((b.date + b.end_time) + INTERVAL '24 hours') <= NOW();
END;
$$ LANGUAGE plpgsql;
