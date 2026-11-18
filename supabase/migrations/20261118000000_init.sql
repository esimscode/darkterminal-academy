-- DarkTerminal Academy: initial schema
-- Every table has row-level security; users can only touch their own rows.

-- Profiles ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  github_login text,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Create a profile row on sign-up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, github_login, display_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'user_name',
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'user_name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Checklist progress -----------------------------------------------------
create table public.checklist_progress (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  lab_slug text not null check (lab_slug ~ '^[0-9]{2}-[a-z0-9-]+$'),
  item_id text not null check (char_length(item_id) <= 100),
  completed_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.checklist_progress enable row level security;

create policy "progress: read own" on public.checklist_progress
  for select using ((select auth.uid()) = user_id);
create policy "progress: insert own" on public.checklist_progress
  for insert with check ((select auth.uid()) = user_id);
create policy "progress: delete own" on public.checklist_progress
  for delete using ((select auth.uid()) = user_id);

-- Lab notes (one markdown doc per user per lab) ---------------------------
create table public.lab_notes (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  lab_slug text not null check (lab_slug ~ '^[0-9]{2}-[a-z0-9-]+$'),
  body text not null default '' check (char_length(body) <= 50000),
  updated_at timestamptz not null default now(),
  primary key (user_id, lab_slug)
);
alter table public.lab_notes enable row level security;

create policy "notes: read own" on public.lab_notes
  for select using ((select auth.uid()) = user_id);
create policy "notes: insert own" on public.lab_notes
  for insert with check ((select auth.uid()) = user_id);
create policy "notes: update own" on public.lab_notes
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Evidence (screenshots in Storage) --------------------------------------
create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  lab_slug text not null check (lab_slug ~ '^[0-9]{2}-[a-z0-9-]+$'),
  storage_path text not null unique,
  caption text not null default '' check (char_length(caption) <= 300),
  created_at timestamptz not null default now(),
  -- the object must live under the user's own folder
  check (storage_path like (user_id::text || '/%'))
);
alter table public.evidence enable row level security;

create policy "evidence: read own" on public.evidence
  for select using ((select auth.uid()) = user_id);
create policy "evidence: insert own" on public.evidence
  for insert with check ((select auth.uid()) = user_id);
create policy "evidence: delete own" on public.evidence
  for delete using ((select auth.uid()) = user_id);

-- GitHub publishing target ------------------------------------------------
-- Users may write their own row, but the server re-verifies with the GitHub
-- App API on every publish that the installation belongs to this user's
-- GitHub account and that the repo is in that installation.
create table public.github_connections (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  installation_id bigint not null,
  repo_full_name text check (repo_full_name ~ '^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$'),
  last_published_at timestamptz,
  last_commit_url text,
  updated_at timestamptz not null default now()
);
alter table public.github_connections enable row level security;

create policy "github: read own" on public.github_connections
  for select using ((select auth.uid()) = user_id);
create policy "github: insert own" on public.github_connections
  for insert with check ((select auth.uid()) = user_id);
create policy "github: update own" on public.github_connections
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Storage bucket for screenshots -----------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 5242880, array['image/png', 'image/jpeg', 'image/webp']);

-- Objects are stored as <user_id>/<lab_slug>/<uuid>.<ext>
create policy "evidence objects: read own" on storage.objects
  for select using (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "evidence objects: upload own" on storage.objects
  for insert with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "evidence objects: delete own" on storage.objects
  for delete using (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
