alter table public.trip_days
  add column if not exists lodging_address text not null default '',
  add column if not exists lodging_map_url text not null default '';

alter table public.itinerary_items
  add column if not exists item_type text not null default 'place',
  add column if not exists address text not null default '',
  add column if not exists created_by_member_id text references public.members(id) on delete set null;

alter table public.day_map_links
  add column if not exists address text not null default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'itinerary_items_item_type_check'
  ) then
    alter table public.itinerary_items
      add constraint itinerary_items_item_type_check check (item_type in ('place', 'note'));
  end if;
end $$;

update public.itinerary_items
set address = place_name
where address = '';

update public.day_map_links
set address = place_name
where address = '';

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

alter table public.itinerary_item_photos enable row level security;

drop trigger if exists set_itinerary_item_photos_updated_at on public.itinerary_item_photos;
create trigger set_itinerary_item_photos_updated_at
before update on public.itinerary_item_photos
for each row execute function public.set_updated_at();

drop policy if exists "public read itinerary item photos" on public.itinerary_item_photos;
create policy "public read itinerary item photos" on public.itinerary_item_photos for select to anon using (true);

drop policy if exists "public insert itinerary item photos" on public.itinerary_item_photos;
create policy "public insert itinerary item photos" on public.itinerary_item_photos for insert to anon with check (true);

drop policy if exists "public update itinerary item photos" on public.itinerary_item_photos;
create policy "public update itinerary item photos" on public.itinerary_item_photos for update to anon using (true) with check (true);

drop policy if exists "public delete itinerary item photos" on public.itinerary_item_photos;
create policy "public delete itinerary item photos" on public.itinerary_item_photos for delete to anon using (true);

insert into storage.buckets (id, name, public)
values ('itinerary-photos', 'itinerary-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "public read itinerary photo objects" on storage.objects;
create policy "public read itinerary photo objects"
on storage.objects for select to anon
using (bucket_id = 'itinerary-photos');

drop policy if exists "public insert itinerary photo objects" on storage.objects;
create policy "public insert itinerary photo objects"
on storage.objects for insert to anon
with check (bucket_id = 'itinerary-photos');

drop policy if exists "public update itinerary photo objects" on storage.objects;
create policy "public update itinerary photo objects"
on storage.objects for update to anon
using (bucket_id = 'itinerary-photos')
with check (bucket_id = 'itinerary-photos');

drop policy if exists "public delete itinerary photo objects" on storage.objects;
create policy "public delete itinerary photo objects"
on storage.objects for delete to anon
using (bucket_id = 'itinerary-photos');
