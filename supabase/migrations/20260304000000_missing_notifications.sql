-- Notifications for Messages
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    recipient_email TEXT;
    recipient_name TEXT;
BEGIN
    -- Get sender name
    SELECT full_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
    
    -- Insert in-app notification
    INSERT INTO public.notifications (user_id, type, title, message)
    SELECT profiles.id, 'message', 'New Message', 'You have a new message from ' || COALESCE(sender_name, 'a user')
    FROM public.profiles 
    WHERE user_id = NEW.receiver_id;

    -- Queue email notification
    SELECT email, full_name INTO recipient_email, recipient_name 
    FROM public.profiles 
    WHERE user_id = NEW.receiver_id;

    IF recipient_email IS NOT NULL THEN
        PERFORM public.queue_booking_email(
            recipient_email,
            recipient_name,
            '💬 New Message Received',
            'You have received a new message from ' || COALESCE(sender_name, 'a user') || ': "' || 
            CASE WHEN length(NEW.content) > 100 THEN left(NEW.content, 97) || '...' ELSE NEW.content END || '"'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message();

-- Notifications for Booking Applications (Locum applies to a public shift)
CREATE OR REPLACE FUNCTION public.handle_new_application()
RETURNS TRIGGER AS $$
DECLARE
    locum_name TEXT;
    practice_id UUID;
    practice_email TEXT;
    practice_name TEXT;
    booking_date DATE;
BEGIN
    -- Get locum name
    SELECT full_name INTO locum_name FROM public.profiles WHERE id = NEW.locum_id;
    
    -- Get practice details and booking date
    SELECT b.practice_id, b.date INTO practice_id, booking_date
    FROM public.bookings b
    WHERE b.id = NEW.booking_id;

    -- Insert in-app notification for the practice
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
        practice_id,
        'shift',
        'New Application Received',
        COALESCE(locum_name, 'A locum') || ' has applied for your shift on ' || TO_CHAR(booking_date, 'Day, DD Mon YYYY')
    );

    -- Queue email for the practice
    SELECT email, full_name INTO practice_email, practice_name 
    FROM public.profiles 
    WHERE id = practice_id;

    IF practice_email IS NOT NULL THEN
        PERFORM public.queue_booking_email(
            practice_email,
            practice_name,
            '📝 New Shift Application',
            COALESCE(locum_name, 'A locum') || ' has submitted an application for your shift on ' || TO_CHAR(booking_date, 'Day, DD Mon YYYY') || '. Review the application in your dashboard.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_created ON public.applications;
CREATE TRIGGER on_application_created
    AFTER INSERT ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_application();

-- Notifications for Application Status Updates (Practice accepts/rejects a locum)
CREATE OR REPLACE FUNCTION public.handle_application_update()
RETURNS TRIGGER AS $$
DECLARE
    practice_name TEXT;
    locum_email TEXT;
    locum_name TEXT;
    booking_date DATE;
    notif_title TEXT;
    notif_message TEXT;
BEGIN
    -- Only notify if status changed to accepted or rejected
    IF OLD.status = NEW.status OR NEW.status = 'pending' THEN
        RETURN NEW;
    END IF;

    -- Get practice name and booking date
    SELECT p.full_name, b.date INTO practice_name, booking_date
    FROM public.bookings b
    JOIN public.profiles p ON b.practice_id = p.id
    WHERE b.id = NEW.booking_id;

    IF NEW.status = 'accepted' THEN
        notif_title := 'Application Accepted';
        notif_message := 'Your application for the shift on ' || TO_CHAR(booking_date, 'Day, DD Mon YYYY') || ' at ' || COALESCE(practice_name, 'the practice') || ' has been accepted!';
    ELSE
        notif_title := 'Application Update';
        notif_message := 'Your application for the shift on ' || TO_CHAR(booking_date, 'Day, DD Mon YYYY') || ' at ' || COALESCE(practice_name, 'the practice') || ' was not successful this time.';
    END IF;

    -- Insert in-app notification for the locum
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (NEW.locum_id, 'shift', notif_title, notif_message);

    -- Queue email for the locum
    SELECT email, full_name INTO locum_email, locum_name 
    FROM public.profiles 
    WHERE id = NEW.locum_id;

    IF locum_email IS NOT NULL THEN
        PERFORM public.queue_booking_email(
            locum_email,
            locum_name,
            '📋 Shift Application Update',
            notif_message
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_updated ON public.applications;
CREATE TRIGGER on_application_updated
    AFTER UPDATE ON public.applications
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.handle_application_update();
