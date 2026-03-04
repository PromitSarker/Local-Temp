-- Create invoices tracking table
create table if not exists public.invoices (
  id uuid not null default gen_random_uuid(),
  primary key (id)
);

-- Add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'booking_id') THEN
        ALTER TABLE public.invoices ADD COLUMN booking_id uuid not null references public.bookings(id) on delete cascade;
        ALTER TABLE public.invoices ADD CONSTRAINT invoices_booking_id_key UNIQUE (booking_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_number') THEN
        ALTER TABLE public.invoices ADD COLUMN invoice_number text not null DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'file_path') THEN
        ALTER TABLE public.invoices ADD COLUMN file_path text not null DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'signed_url') THEN
        ALTER TABLE public.invoices ADD COLUMN signed_url text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'amount_total') THEN
        ALTER TABLE public.invoices ADD COLUMN amount_total numeric(10,2) not null DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'amount_locum') THEN
        ALTER TABLE public.invoices ADD COLUMN amount_locum numeric(10,2) not null DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'amount_admin_fee') THEN
        ALTER TABLE public.invoices ADD COLUMN amount_admin_fee numeric(10,2) not null DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'generated_at') THEN
        ALTER TABLE public.invoices ADD COLUMN generated_at timestamptz not null default now();
    END IF;
END $$;

-- Enable RLS
alter table public.invoices enable row level security;

-- Policies
-- Policies
DO $$ BEGIN
    CREATE POLICY "Users can view their own invoices"
    ON public.invoices FOR SELECT
    USING (
        booking_id IN (
        SELECT id FROM public.bookings 
        WHERE practice_id = auth.uid() OR locum_id = auth.uid()
        )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "System can insert invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (true); -- Edge functions use service role
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create storage bucket for invoices (this needs to be done in dashboard or via SQL)
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- Storage policies
create policy "Authenticated users can read their own invoices"
on storage.objects for select
using (
  bucket_id = 'invoices' and
  auth.role() = 'authenticated'
);

create policy "Service role can upload invoices"
on storage.objects for insert
with check (
  bucket_id = 'invoices' and
  auth.role() = 'service_role'
);
