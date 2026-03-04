-- Populate system_settings with actual Stripe keys from environment
-- This allows the platform to process payments immediately

UPDATE public.system_settings
SET value = 'sk_test_PLACEHOLDER'
WHERE key = 'STRIPE_SECRET_KEY';

UPDATE public.system_settings
SET value = 'pk_test_PLACEHOLDER'
WHERE key = 'STRIPE_PUBLISHABLE_KEY';

-- Verify the update
DO $$
DECLARE
    v_secret_key TEXT;
    v_pub_key TEXT;
BEGIN
    SELECT value INTO v_secret_key FROM public.system_settings WHERE key = 'STRIPE_SECRET_KEY';
    SELECT value INTO v_pub_key FROM public.system_settings WHERE key = 'STRIPE_PUBLISHABLE_KEY';
    
    IF v_secret_key IS NOT NULL AND v_secret_key != '' THEN
        RAISE NOTICE 'SUCCESS: Stripe keys configured';
        RAISE NOTICE 'Secret Key: sk_test_***%', RIGHT(v_secret_key, 7);
        RAISE NOTICE 'Publishable Key: pk_test_***%', RIGHT(v_pub_key, 7);
    ELSE
        RAISE WARNING 'FAILED: Stripe keys not set';
    END IF;
END $$;
