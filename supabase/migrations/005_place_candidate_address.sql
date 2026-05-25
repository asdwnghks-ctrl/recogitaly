alter table public.place_candidates
  add column if not exists address text not null default '';
