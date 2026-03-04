-- Add Resend API Key to system settings
insert into public.system_settings (key, value, description)
values ('RESEND_API_KEY', 're_A1DH6WgW_WMHTMiJDNS6kq1yvAVF571LC', 'Resend API Key for sending emails')
on conflict (key) do update set value = excluded.value;
