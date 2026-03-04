-- Create reviews table
create table public.reviews (
  id uuid not null default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating numeric not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  primary key (id)
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Policies
create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using (true);

create policy "Users can create reviews for their own bookings"
  on public.reviews for insert
  with check (auth.uid() = (select user_id from public.profiles where id = reviewer_id));
