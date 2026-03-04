-- Enhanced notification triggers with email queue
-- This migration adds email notifications for booking status changes
-- Uses a queue table that can be processed by a background worker

-- Create email queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email TEXT NOT NULL,
    to_name TEXT,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role only" ON public.email_queue
    FOR ALL
    USING (auth.role() = 'service_role');

-- Index for processing pending emails
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON public.email_queue(status, created_at) 
WHERE status = 'pending';

-- Function to queue an email
CREATE OR REPLACE FUNCTION public.queue_booking_email(
    recipient_email TEXT,
    recipient_name TEXT,
    subject TEXT,
    message TEXT
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.email_queue (to_email, to_name, subject, html_body)
    VALUES (
        recipient_email,
        recipient_name,
        subject,
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' ||
        '<h2 style="color: #116a4d;">' || subject || '</h2>' ||
        '<p style="font-size: 16px; line-height: 1.6;">' || message || '</p>' ||
        '<p style="margin-top: 30px;">' ||
        '<a href="' || current_setting('app.settings.app_url', true) || '" ' ||
        'style="background: #116a4d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">' ||
        'View Dashboard</a>' ||
        '</p>' ||
        '<p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">' ||
        'This is an automated notification from Local Smile Connect.' ||
        '</p>' ||
        '</div>'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Failed to queue email: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to handle booking status updates with email notifications
CREATE OR REPLACE FUNCTION public.handle_booking_update()
RETURNS TRIGGER AS $$
DECLARE
    actor_id UUID;
    recipient_id UUID;
    recipient_email TEXT;
    recipient_name TEXT;
    message_text TEXT;
    email_subject TEXT;
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
        IF actor_id = NEW.locum_id OR actor_id IS NULL THEN
            recipient_id := NEW.practice_id;
            message_text := COALESCE(booking_locum_name, 'A locum') || ' has accepted your booking request for ' || 
                           TO_CHAR(NEW.date, 'Day, DD Mon YYYY') || '. ' ||
                           'Complete payment now to confirm the booking.';
            email_subject := '✅ Booking Request Accepted - Payment Required';
            
            -- Insert in-app notification
            INSERT INTO public.notifications (user_id, type, title, message)
            VALUES (recipient_id, 'shift', 'Booking Accepted', message_text);
            
            -- Queue email notification
            SELECT email, full_name INTO recipient_email, recipient_name 
            FROM public.profiles 
            WHERE id = recipient_id;
            
            IF recipient_email IS NOT NULL THEN
                PERFORM public.queue_booking_email(
                    recipient_email,
                    recipient_name,
                    email_subject,
                    message_text
                );
            END IF;
        END IF;

    -- Case 2: Booking Declined (Pending -> Rejected)
    ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
        -- Usually action by Locum, notify Practice
        IF actor_id = NEW.locum_id OR actor_id IS NULL THEN
            recipient_id := NEW.practice_id;
            message_text := COALESCE(booking_locum_name, 'A locum') || ' has declined your booking request for ' ||
                           TO_CHAR(NEW.date, 'Day, DD Mon YYYY') || '. ' ||
                           'You may search for another locum or adjust your booking details.';
            email_subject := '❌ Booking Request Declined';
            
            -- Insert in-app notification
            INSERT INTO public.notifications (user_id, type, title, message)
            VALUES (recipient_id, 'shift', 'Booking Declined', message_text);
            
            -- Queue email notification
            SELECT email, full_name INTO recipient_email, recipient_name 
            FROM public.profiles 
            WHERE id = recipient_id;
            
            IF recipient_email IS NOT NULL THEN
                PERFORM public.queue_booking_email(
                    recipient_email,
                    recipient_name,
                    email_subject,
                    message_text
                );
            END IF;
        END IF;

    -- Case 3: Payment Received (payment_status -> paid)
    ELSIF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
        -- Notify Locum that payment is confirmed
        recipient_id := NEW.locum_id;
        message_text := 'Payment confirmed for your shift with ' || COALESCE(booking_practice_name, 'a practice') || 
                       ' on ' || TO_CHAR(NEW.date, 'Day, DD Mon YYYY') || ' at ' || NEW.start_time || '. ' ||
                       'The booking is now fully confirmed. Please arrive on time and bring all necessary documentation.';
        email_subject := '💳 Payment Confirmed - Your Shift is Booked!';
        
        -- Insert in-app notification
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (recipient_id, 'shift', 'Payment Confirmed', message_text);
        
        -- Queue email notification
        SELECT email, full_name INTO recipient_email, recipient_name 
        FROM public.profiles 
        WHERE id = recipient_id;
        
        IF recipient_email IS NOT NULL THEN
            PERFORM public.queue_booking_email(
                recipient_email,
                recipient_name,
                email_subject,
                message_text
            );
        END IF;

    -- Case 4: Shift Completed (Confirmed -> Completed)
    ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Usually action by Practice, notify Locum
        IF actor_id = NEW.practice_id OR actor_id IS NULL THEN
            recipient_id := NEW.locum_id;
            message_text := 'Your shift with ' || COALESCE(booking_practice_name, 'the practice') || ' has been marked as completed. ' ||
                           'Funds will be released to your account after a 24-hour review period.';
            email_subject := '✅ Shift Completed';
            
            -- Insert in-app notification
            INSERT INTO public.notifications (user_id, type, title, message)
            VALUES (recipient_id, 'shift', 'Shift Completed', message_text);
            
            -- Queue email notification
            SELECT email, full_name INTO recipient_email, recipient_name 
            FROM public.profiles 
            WHERE id = recipient_id;
            
            IF recipient_email IS NOT NULL THEN
                PERFORM public.queue_booking_email(
                    recipient_email,
                    recipient_name,
                    email_subject,
                    message_text
                );
            END IF;
        END IF;
        
    -- Case 5: Booking Cancelled
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Notify the OTHER party
        IF actor_id = NEW.practice_id THEN
            recipient_id := NEW.locum_id;
            message_text := COALESCE(booking_practice_name, 'The practice') || ' has cancelled the booking for ' ||
                           TO_CHAR(NEW.date, 'Day, DD Mon YYYY') || '.';
            email_subject := '⚠️ Booking Cancelled';
        ELSIF actor_id = NEW.locum_id THEN
            recipient_id := NEW.practice_id;
            message_text := COALESCE(booking_locum_name, 'The locum') || ' has cancelled the booking for ' ||
                           TO_CHAR(NEW.date, 'Day, DD Mon YYYY') || '.';
            email_subject := '⚠️ Booking Cancelled';
        END IF;

        IF recipient_id IS NOT NULL THEN
            -- Insert in-app notification
            INSERT INTO public.notifications (user_id, type, title, message)
            VALUES (recipient_id, 'shift', 'Booking Cancelled', message_text);
            
            -- Queue email notification
            SELECT email, full_name INTO recipient_email, recipient_name 
            FROM public.profiles 
            WHERE id = recipient_id;
            
            IF recipient_email IS NOT NULL THEN
                PERFORM public.queue_booking_email(
                    recipient_email,
                    recipient_name,
                    email_subject,
                    message_text
                );
            END IF;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger to also fire on payment_status changes
DROP TRIGGER IF EXISTS on_booking_updated ON public.bookings;
CREATE TRIGGER on_booking_updated
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    WHEN (
        OLD.status IS DISTINCT FROM NEW.status 
        OR OLD.payment_status IS DISTINCT FROM NEW.payment_status
    )
    EXECUTE FUNCTION public.handle_booking_update();

COMMENT ON TABLE public.email_queue IS 'Queue for sending email notifications asynchronously';
COMMENT ON FUNCTION public.handle_booking_update() IS 'Handles booking status and payment updates, sending both in-app notifications and queuing emails';
COMMENT ON FUNCTION public.queue_booking_email(TEXT, TEXT, TEXT, TEXT) IS 'Queues an email to be sent by the email processor';
