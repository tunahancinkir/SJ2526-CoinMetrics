-- Run this script once in the Supabase SQL Editor.

create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  coin_id text not null,
  coin_symbol text,
  coin_name text,
  created_at timestamptz not null default now(),
  constraint user_favorites_pkey primary key (user_id, coin_id)
);

alter table public.user_favorites add column if not exists coin_symbol text;
alter table public.user_favorites add column if not exists coin_name text;

alter table public.user_favorites enable row level security;

drop policy if exists "Users can view own favorites" on public.user_favorites;
create policy "Users can view own favorites"
  on public.user_favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own favorites" on public.user_favorites;
create policy "Users can insert own favorites"
  on public.user_favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.user_favorites;
create policy "Users can delete own favorites"
  on public.user_favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace view public.user_favorites_readable as
select
  uf.user_id,
  au.email as user_email,
  coalesce(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'name', au.email) as user_name,
  uf.coin_id,
  uf.coin_name,
  uf.coin_symbol,
  uf.created_at
from public.user_favorites uf
left join auth.users au on au.id = uf.user_id;
