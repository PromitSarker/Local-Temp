UPDATE public.system_settings
SET value = 'sk_test_PLACEHOLDER'
WHERE key = 'STRIPE_SECRET_KEY';

UPDATE public.system_settings
SET value = 'pk_test_PLACEHOLDER'
WHERE key = 'STRIPE_PUBLISHABLE_KEY';
