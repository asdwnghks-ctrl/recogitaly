create extension if not exists pgcrypto;

create table if not exists public.trips (
  id text primary key,
  title text not null,
  start_date date not null,
  end_date date not null,
  cities text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id text primary key,
  name text not null,
  username text not null unique,
  color_name text not null,
  color text not null,
  background_color text not null,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

create table if not exists public.trip_days (
  id text primary key,
  trip_id text not null references public.trips(id) on delete cascade,
  day_number integer not null,
  date date not null,
  weekday text not null,
  title text not null,
  city text not null,
  summary text not null,
  lodging text not null default '',
  lodging_address text not null default '',
  lodging_map_url text not null default '',
  goal text not null default '',
  caution text not null default '',
  created_at timestamptz not null default now(),
  unique (trip_id, day_number)
);

create table if not exists public.itinerary_items (
  id text primary key,
  trip_id text not null references public.trips(id) on delete cascade,
  day_id text not null references public.trip_days(id) on delete cascade,
  sort_order integer not null,
  time_label text not null,
  title text not null,
  item_type text not null check (item_type in ('place', 'note')) default 'place',
  city text not null default '',
  place_name text not null default '',
  address text not null default '',
  map_url text not null default '',
  description text not null default '',
  importance text not null check (importance in ('high', 'normal', 'low')) default 'normal',
  created_by_member_id text references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (day_id, sort_order)
);

create table if not exists public.day_map_links (
  id text primary key,
  day_id text not null references public.trip_days(id) on delete cascade,
  sort_order integer not null,
  place_name text not null,
  address text not null default '',
  purpose text not null default '',
  map_url text not null,
  created_at timestamptz not null default now(),
  unique (day_id, sort_order)
);

create table if not exists public.itinerary_item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id text not null references public.itinerary_items(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, member_id)
);

create table if not exists public.place_candidates (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references public.trips(id) on delete cascade,
  name text not null,
  city text not null,
  category text not null check (category in ('food', 'cafe', 'dessert', 'bar', 'grocery', 'sight', 'shopping', 'etc')),
  map_url text not null,
  suggested_by_member_id text not null references public.members(id),
  related_day_id text not null references public.trip_days(id) on delete cascade,
  related_itinerary_item_id text references public.itinerary_items(id) on delete set null,
  after_itinerary_item_id text references public.itinerary_items(id) on delete set null,
  before_itinerary_item_id text references public.itinerary_items(id) on delete set null,
  reason text not null default '',
  status text not null check (status in ('suggested', 'approved', 'pending', 'rejected', 'visited')) default 'suggested',
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.place_recommendations (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.place_candidates(id) on delete cascade,
  member_id text not null references public.members(id),
  created_at timestamptz not null default now(),
  unique (place_id, member_id)
);

create table if not exists public.place_comments (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.place_candidates(id) on delete cascade,
  member_id text not null references public.members(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.place_approvals (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.place_candidates(id) on delete cascade,
  decided_by_member_id text not null references public.members(id),
  decision text not null check (decision in ('approved', 'pending', 'rejected')),
  related_day_id text references public.trip_days(id) on delete set null,
  related_itinerary_item_id text references public.itinerary_items(id) on delete set null,
  approved_after_itinerary_item_id text references public.itinerary_items(id) on delete set null,
  approved_before_itinerary_item_id text references public.itinerary_items(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.visit_checks (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.place_candidates(id) on delete cascade,
  member_ids text[] not null default '{}',
  checked_by_member_id text not null references public.members(id),
  note text not null default '',
  visited_at timestamptz not null default now()
);

create table if not exists public.settlement_rounds (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references public.trips(id) on delete cascade,
  status text not null check (status in ('open', 'closed')) default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references public.trips(id) on delete cascade,
  settlement_round_id uuid references public.settlement_rounds(id) on delete set null,
  type text not null check (type in ('personal', 'shared')),
  title text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null check (currency in ('EUR', 'KRW')),
  exchange_rate_to_krw numeric(14, 4) not null default 1,
  amount_krw numeric(14, 2) not null,
  amount_eur numeric(14, 2) not null,
  paid_by_member_id text not null references public.members(id),
  spent_for_member_id text references public.members(id),
  participant_member_ids text[] not null default '{}',
  date date not null,
  category text not null check (category in ('food', 'cafe', 'grocery', 'transport', 'lodging', 'ticket', 'shopping', 'etc')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.settlement_confirmations (
  id uuid primary key default gen_random_uuid(),
  settlement_round_id uuid not null references public.settlement_rounds(id) on delete cascade,
  member_id text not null references public.members(id),
  confirmed_at timestamptz not null default now(),
  unique (settlement_round_id, member_id)
);

create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null,
  quote_currency text not null,
  rate numeric(14, 4) not null,
  fetched_at timestamptz not null default now(),
  source text not null default 'manual'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_place_candidates_updated_at on public.place_candidates;
create trigger set_place_candidates_updated_at
before update on public.place_candidates
for each row execute function public.set_updated_at();

drop trigger if exists set_itinerary_item_photos_updated_at on public.itinerary_item_photos;
create trigger set_itinerary_item_photos_updated_at
before update on public.itinerary_item_photos
for each row execute function public.set_updated_at();

alter table public.trips enable row level security;
alter table public.members enable row level security;
alter table public.trip_days enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.itinerary_item_photos enable row level security;
alter table public.day_map_links enable row level security;
alter table public.place_candidates enable row level security;
alter table public.place_recommendations enable row level security;
alter table public.place_comments enable row level security;
alter table public.place_approvals enable row level security;
alter table public.visit_checks enable row level security;
alter table public.settlement_rounds enable row level security;
alter table public.expenses enable row level security;
alter table public.settlement_confirmations enable row level security;
alter table public.exchange_rates enable row level security;

create policy "public read trips" on public.trips for select to anon using (true);
create policy "public read members" on public.members for select to anon using (true);
create policy "public read trip days" on public.trip_days for select to anon using (true);
create policy "public read itinerary items" on public.itinerary_items for select to anon using (true);
create policy "public read itinerary item photos" on public.itinerary_item_photos for select to anon using (true);
create policy "public insert itinerary item photos" on public.itinerary_item_photos for insert to anon with check (true);
create policy "public update itinerary item photos" on public.itinerary_item_photos for update to anon using (true) with check (true);
create policy "public delete itinerary item photos" on public.itinerary_item_photos for delete to anon using (true);
create policy "public read day map links" on public.day_map_links for select to anon using (true);
create policy "public read candidates" on public.place_candidates for select to anon using (true);
create policy "public insert candidates" on public.place_candidates for insert to anon with check (true);
create policy "public read recommendations" on public.place_recommendations for select to anon using (true);
create policy "public insert recommendations" on public.place_recommendations for insert to anon with check (true);
create policy "public delete own-like recommendations" on public.place_recommendations for delete to anon using (true);
create policy "public read comments" on public.place_comments for select to anon using (true);
create policy "public insert comments" on public.place_comments for insert to anon with check (true);
create policy "public read approvals" on public.place_approvals for select to anon using (true);
create policy "public read visits" on public.visit_checks for select to anon using (true);
create policy "public read settlement rounds" on public.settlement_rounds for select to anon using (true);
create policy "public insert settlement rounds" on public.settlement_rounds for insert to anon with check (true);
create policy "public read expenses" on public.expenses for select to anon using (true);
create policy "public insert expenses" on public.expenses for insert to anon with check (true);
create policy "public read confirmations" on public.settlement_confirmations for select to anon using (true);
create policy "public insert confirmations" on public.settlement_confirmations for insert to anon with check (true);
create policy "public read exchange rates" on public.exchange_rates for select to anon using (true);

insert into storage.buckets (id, name, public)
values ('itinerary-photos', 'itinerary-photos', true)
on conflict (id) do update set public = true;

create policy "public read itinerary photo objects"
on storage.objects for select to anon
using (bucket_id = 'itinerary-photos');

create policy "public insert itinerary photo objects"
on storage.objects for insert to anon
with check (bucket_id = 'itinerary-photos');

create policy "public update itinerary photo objects"
on storage.objects for update to anon
using (bucket_id = 'itinerary-photos')
with check (bucket_id = 'itinerary-photos');

create policy "public delete itinerary photo objects"
on storage.objects for delete to anon
using (bucket_id = 'itinerary-photos');
