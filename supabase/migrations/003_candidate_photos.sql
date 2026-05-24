create table if not exists public.place_candidate_photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.place_candidates(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, member_id)
);

alter table public.place_candidate_photos enable row level security;

drop trigger if exists set_place_candidate_photos_updated_at on public.place_candidate_photos;
create trigger set_place_candidate_photos_updated_at
before update on public.place_candidate_photos
for each row execute function public.set_updated_at();

drop policy if exists "public read candidate photos" on public.place_candidate_photos;
create policy "public read candidate photos" on public.place_candidate_photos for select to anon using (true);

drop policy if exists "public insert candidate photos" on public.place_candidate_photos;
create policy "public insert candidate photos" on public.place_candidate_photos for insert to anon with check (true);

drop policy if exists "public update candidate photos" on public.place_candidate_photos;
create policy "public update candidate photos" on public.place_candidate_photos for update to anon using (true) with check (true);

drop policy if exists "public delete candidate photos" on public.place_candidate_photos;
create policy "public delete candidate photos" on public.place_candidate_photos for delete to anon using (true);

insert into storage.buckets (id, name, public)
values ('place-candidate-photos', 'place-candidate-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "public read candidate photo objects" on storage.objects;
create policy "public read candidate photo objects"
on storage.objects for select to anon
using (bucket_id = 'place-candidate-photos');

drop policy if exists "public insert candidate photo objects" on storage.objects;
create policy "public insert candidate photo objects"
on storage.objects for insert to anon
with check (bucket_id = 'place-candidate-photos');

drop policy if exists "public update candidate photo objects" on storage.objects;
create policy "public update candidate photo objects"
on storage.objects for update to anon
using (bucket_id = 'place-candidate-photos')
with check (bucket_id = 'place-candidate-photos');

drop policy if exists "public delete candidate photo objects" on storage.objects;
create policy "public delete candidate photo objects"
on storage.objects for delete to anon
using (bucket_id = 'place-candidate-photos');
