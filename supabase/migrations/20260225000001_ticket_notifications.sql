-- Function to send notifications when a ticket is created
CREATE OR REPLACE FUNCTION public.handle_ticket_creation()
RETURNS TRIGGER AS $$
DECLARE
    booking_record RECORD;
    recipient_id UUID;
    recipient_email TEXT;
    recipient_name TEXT;
    creator_name TEXT;
    message_text TEXT;
    email_subject TEXT;
BEGIN
    -- Get booking details
    SELECT locum_id, practice_id INTO booking_record
    FROM public.bookings
    WHERE id = NEW.booking_id;

    -- Get creator name
    SELECT full_name INTO creator_name
    FROM public.profiles
    WHERE id = NEW.creator_id;

    -- Determine the recipient (the other party)
    IF NEW.creator_id = booking_record.locum_id THEN
        recipient_id := booking_record.practice_id;
    ELSE
        recipient_id := booking_record.locum_id;
    END IF;

    IF recipient_id IS NOT NULL THEN
        -- Setup message
        message_text := COALESCE(creator_name, 'The other party') || ' has opened a dispute ticket regarding your recent booking. Reason: ' || NEW.subject || '. Funds will be held until an admin resolves this.';
        email_subject := '⚠️ Payment Dispute Opened';

        -- Insert in-app notification
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (recipient_id, 'payment', 'Dispute Opened', message_text);

        -- Also notify admins
        INSERT INTO public.notifications (user_id, type, title, message)
        SELECT id, 'system', 'New Dispute Ticket', 'A new dispute ticket has been opened by ' || COALESCE(creator_name, 'a user') || '. Ticket ID: ' || NEW.id
        FROM public.profiles WHERE user_type = 'admin';

        -- Queue email to the recipient
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

    -- Also automatically update the booking payment_status to 'disputed'
    UPDATE public.bookings 
    SET payment_status = 'disputed'
    WHERE id = NEW.booking_id AND payment_status = 'held';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ticket_created
    AFTER INSERT ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_ticket_creation();
