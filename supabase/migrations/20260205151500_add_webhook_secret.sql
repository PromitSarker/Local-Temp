insert into public.system_settings (key, value, description)
values ('STRIPE_WEBHOOK_SECRET', 'whsec_Aa8du1px6AQ8Guktxz4s1eq46adP8cL7', 'Stripe Webhook Signing Secret')
on conflict (key) do update set value = excluded.value;
