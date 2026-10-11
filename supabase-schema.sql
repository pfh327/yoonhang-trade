-- 윤항무역 마케팅 파트너 기본 데이터 구조
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  username text,
  phone text,
  role text not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  contact_name text,
  phone text,
  email text,
  source text,
  category text,
  status text not null default 'new',
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outreach (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  channel text not null,
  subject text,
  body text,
  status text not null default 'draft',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  channel text not null,
  sender_name text,
  sender_url text,
  message text not null,
  status text not null default 'unread',
  received_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.outreach enable row level security;
alter table public.inbox_messages enable row level security;

create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "leads own rows" on public.leads for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "outreach own rows" on public.outreach for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "inbox own rows" on public.inbox_messages for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, username, phone)
  values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'phone')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
