-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)

create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slot integer not null check (slot between 1 and 63),
  full_name text,
  birth_year integer,
  birthplace text,
  notes text,
  unique (user_id, slot)
);

alter table public.people enable row level security;

create policy "Users can view their own people"
  on public.people for select
  using (auth.uid() = user_id);

create policy "Users can insert their own people"
  on public.people for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own people"
  on public.people for update
  using (auth.uid() = user_id);

create policy "Users can delete their own people"
  on public.people for delete
  using (auth.uid() = user_id);

-- Migration: the tree now supports re-rooting onto any ancestor (viewing 5
-- generations from whichever person is currently the root), so absolute
-- slot numbers are no longer capped at 63.
alter table public.people drop constraint people_slot_check;
alter table public.people add constraint people_slot_check check (slot >= 1);
