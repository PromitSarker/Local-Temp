-- Function to handle new booking requests
CREATE OR REPLACE FUNCTION public.handle_new_booking()
RETURNS TRIGGER AS $$
DECLARE
    practice_name TEXT;
BEGIN
    -- If a locum is assigned (Direct Booking), notify them
    IF NEW.locum_id IS NOT NULL THEN
        SELECT full_name INTO practice_name FROM public.profiles WHERE id = NEW.practice_id;
        
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (
            NEW.locum_id,
            'shift',
            'New Booking Request',
            'You have received a new booking request from ' || COALESCE(practice_name, 'a practice')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new bookings
DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_booking();

-- Function to handle booking status updates
CREATE OR REPLACE FUNCTION public.handle_booking_update()
RETURNS TRIGGER AS $$
DECLARE
    actor_id UUID;
    recipient_id UUID;
    message_text TEXT;
    booking_practice_name TEXT;
    booking_locum_name TEXT;
BEGIN
    -- Get current user ID to determine who performed the action
    actor_id := auth.uid();
    
    -- Fetch names for clearer messages
    SELECT full_name INTO booking_practice_name FROM public.profiles WHERE id = NEW.practice_id;
    SELECT full_name INTO booking_locum_name FROM public.profiles WHERE id = NEW.locum_id;

    -- Case 1: Booking Accepted (Pending -> Confirmed)
    IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
        -- Usually action by Locum, notify Practice
        -- If actor_id is null (system/admin), default to notifying practice as they are the requester
        IF actor_id = NEW.locum_id OR actor_id IS NULL THEN
            recipient_id := NEW.practice_id;
            message_text := COALESCE(booking_locum_name, 'A locum') || ' has accepted your booking request.';
            
            INSERT INTO public.notifications (user_id, type, title, message)
            VALUES (recipient_id, 'shift', 'Booking Accepted', message_text);
        END IF;

    -- Case 2: Booking Declined (Pending -> Rejected)
    ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
        -- Usually action by Locum, notify Practice
        IF actor_id = NEW.locum_id OR actor_id IS NULL THEN
            recipient_id := NEW.practice_id;
            message_text := COALESCE(booking_locum_name, 'A locum') || ' has declined your booking request.';
            
            INSERT INTO public.notifications (user_id, type, title, message)
            VALUES (recipient_id, 'shift', 'Booking Declined', message_text);
        END IF;

    -- Case 3: Shift Completed (Confirmed -> Completed)
    ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Usually action by Locum, notify Practice to review
        IF actor_id = NEW.locum_id OR actor_id IS NULL THEN
            recipient_id := NEW.practice_id;
            message_text := 'Shift completed by ' || COALESCE(booking_locum_name, 'locum') || '. Please leave a review.';
            
            INSERT INTO public.notifications (user_id, type, title, message)
            VALUES (recipient_id, 'shift', 'Shift Completed', message_text);
        END IF;
        
    -- Case 4: Booking Cancelled
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Notify the OTHER party
        IF actor_id = NEW.practice_id THEN
            recipient_id := NEW.locum_id;
            message_text := COALESCE(booking_practice_name, 'The practice') || ' has cancelled the booking.';
        ELSIF actor_id = NEW.locum_id THEN
            recipient_id := NEW.practice_id;
            message_text := COALESCE(booking_locum_name, 'The locum') || ' has cancelled the booking.';
        END IF;

        IF recipient_id IS NOT NULL THEN
             INSERT INTO public.notifications (user_id, type, title, message)
             VALUES (recipient_id, 'shift', 'Booking Cancelled', message_text);
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for booking updates
DROP TRIGGER IF EXISTS on_booking_updated ON public.bookings;
CREATE TRIGGER on_booking_updated
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.handle_booking_update();
