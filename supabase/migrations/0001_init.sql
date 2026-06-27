-- The Unsealed Revelation — initial schema
-- Movements → Passages → Renderings (side by side) + one Gathered Rendering,
-- a collaborative Tenets library, additive Resonance, gentle Reflections,
-- full version history, and flagging. Everything is readable by all; only the
-- gathering acts (promotion, moderation) belong to stewards.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('member', 'steward', 'admin');
create type rendering_status as enum ('draft', 'submitted', 'gathered', 'archived');
create type resonance_target as enum ('rendering', 'tenet', 'reflection');
create type reflection_target as enum ('passage', 'rendering', 'tenet');
create type flag_target as enum ('passage', 'rendering', 'tenet', 'reflection');
create type flag_status as enum ('open', 'resolved');

-- ---------------------------------------------------------------------------
-- Profiles (members) — keyed to Supabase auth.users
-- ---------------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  handle        text unique not null,
  display_name  text not null,
  bio           text,
  traditions    text[] not null default '{}',
  languages     text[] not null default '{}',
  role          user_role not null default 'member',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Movements & Passages
-- ---------------------------------------------------------------------------
create table movements (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  summary      text,
  order_index  int not null default 0,
  created_at   timestamptz not null default now()
);

create table passages (
  id                uuid primary key default gen_random_uuid(),
  movement_id       uuid references movements (id) on delete set null,
  slug              text not null,
  canonical_ref     text not null,
  title             text not null,
  order_index       int not null default 0,
  traditional_text  text,
  -- set after renderings exist; the promoted Gathered Rendering
  current_rendering_id uuid,
  created_at        timestamptz not null default now(),
  unique (movement_id, slug)
);

-- ---------------------------------------------------------------------------
-- Tenets (collaborative library) + history
-- ---------------------------------------------------------------------------
create table tenets (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  description  text not null,
  support      text,
  "group"      text,
  author_id    uuid references profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table tenet_versions (
  id           uuid primary key default gen_random_uuid(),
  tenet_id     uuid not null references tenets (id) on delete cascade,
  description  text not null,
  support      text,
  edited_by    uuid references profiles (id) on delete set null,
  note         text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Renderings (side by side) + history + tenet links
-- ---------------------------------------------------------------------------
create table renderings (
  id           uuid primary key default gen_random_uuid(),
  passage_id   uuid not null references passages (id) on delete cascade,
  author_id    uuid references profiles (id) on delete set null,
  -- a human-readable source name (e.g. a seed source) when no author profile
  author_name  text,
  body         text not null,
  language     text not null default 'English',
  tradition    text,
  status       rendering_status not null default 'submitted',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table rendering_versions (
  id            uuid primary key default gen_random_uuid(),
  rendering_id  uuid not null references renderings (id) on delete cascade,
  body          text not null,
  edited_by     uuid references profiles (id) on delete set null,
  note          text,
  created_at    timestamptz not null default now()
);

create table rendering_tenets (
  rendering_id  uuid not null references renderings (id) on delete cascade,
  tenet_id      uuid not null references tenets (id) on delete cascade,
  primary key (rendering_id, tenet_id)
);

-- the promoted Gathered Rendering points here (added after renderings table)
alter table passages
  add constraint passages_current_rendering_fk
  foreign key (current_rendering_id) references renderings (id) on delete set null;

create table gathered_history (
  id           uuid primary key default gen_random_uuid(),
  passage_id   uuid not null references passages (id) on delete cascade,
  rendering_id uuid references renderings (id) on delete set null,
  -- a merged/inline body may be promoted without a single source rendering
  body         text,
  promoted_by  uuid references profiles (id) on delete set null,
  note         text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Resonance (additive only) & Reflections (gentle discussion)
-- ---------------------------------------------------------------------------
create table resonances (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles (id) on delete cascade,
  target_type  resonance_target not null,
  target_id    uuid not null,
  created_at   timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create table reflections (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid references profiles (id) on delete set null,
  target_type  reflection_target not null,
  target_id    uuid not null,
  parent_id    uuid references reflections (id) on delete cascade,
  body         text not null,
  hidden       boolean not null default false,
  created_at   timestamptz not null default now()
);

create table flags (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references profiles (id) on delete set null,
  target_type  flag_target not null,
  target_id    uuid not null,
  reason       text,
  status       flag_status not null default 'open',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index on passages (movement_id, order_index);
create index on renderings (passage_id);
create index on rendering_versions (rendering_id);
create index on reflections (target_type, target_id);
create index on resonances (target_type, target_id);
create index on gathered_history (passage_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_steward()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('steward', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Reading is fully open; contributing requires an account; gathering and
-- moderation belong to stewards.
-- ---------------------------------------------------------------------------
alter table profiles            enable row level security;
alter table movements           enable row level security;
alter table passages            enable row level security;
alter table tenets              enable row level security;
alter table tenet_versions      enable row level security;
alter table renderings          enable row level security;
alter table rendering_versions  enable row level security;
alter table rendering_tenets    enable row level security;
alter table gathered_history    enable row level security;
alter table resonances          enable row level security;
alter table reflections         enable row level security;
alter table flags               enable row level security;

-- Profiles: public to read; you manage your own.
create policy "profiles readable" on profiles for select using (true);
create policy "insert own profile" on profiles for insert with check (id = auth.uid());
create policy "update own profile" on profiles for update using (id = auth.uid());

-- Movements & Passages: open read; stewards curate.
create policy "movements readable" on movements for select using (true);
create policy "stewards write movements" on movements for all
  using (is_steward()) with check (is_steward());

create policy "passages readable" on passages for select using (true);
create policy "stewards write passages" on passages for all
  using (is_steward()) with check (is_steward());

-- Tenets: open read; any member may offer one; author or steward may edit.
create policy "tenets readable" on tenets for select using (true);
create policy "members add tenets" on tenets for insert
  with check (auth.uid() is not null);
create policy "author or steward edit tenets" on tenets for update
  using (author_id = auth.uid() or is_steward());
create policy "tenet versions readable" on tenet_versions for select using (true);
create policy "members add tenet versions" on tenet_versions for insert
  with check (auth.uid() is not null);

-- Renderings: drafts are private to their author; everything else is open.
create policy "renderings readable" on renderings for select
  using (status <> 'draft' or author_id = auth.uid());
create policy "members add renderings" on renderings for insert
  with check (author_id = auth.uid());
create policy "author or steward edit renderings" on renderings for update
  using (author_id = auth.uid() or is_steward());

create policy "rendering versions readable" on rendering_versions for select using (true);
create policy "members add rendering versions" on rendering_versions for insert
  with check (auth.uid() is not null);

create policy "rendering tenets readable" on rendering_tenets for select using (true);
create policy "author manages rendering tenets" on rendering_tenets for all
  using (
    exists (select 1 from renderings r
            where r.id = rendering_id and (r.author_id = auth.uid() or is_steward()))
  )
  with check (
    exists (select 1 from renderings r
            where r.id = rendering_id and (r.author_id = auth.uid() or is_steward()))
  );

-- Gathered history: open read; only stewards may promote.
create policy "gathered history readable" on gathered_history for select using (true);
create policy "stewards promote gathered" on gathered_history for insert
  with check (is_steward());

-- Resonance: open read; you add and remove only your own. Additive, no downvote.
create policy "resonances readable" on resonances for select using (true);
create policy "add own resonance" on resonances for insert
  with check (user_id = auth.uid());
create policy "remove own resonance" on resonances for delete
  using (user_id = auth.uid());

-- Reflections: open read (unless hidden); members add; author or steward edit.
create policy "reflections readable" on reflections for select
  using (not hidden or author_id = auth.uid() or is_steward());
create policy "members add reflections" on reflections for insert
  with check (author_id = auth.uid());
create policy "author or steward edit reflections" on reflections for update
  using (author_id = auth.uid() or is_steward());

-- Flags: members raise them; only stewards (and the reporter) may read them.
create policy "members raise flags" on flags for insert
  with check (auth.uid() is not null);
create policy "stewards read flags" on flags for select
  using (is_steward() or reporter_id = auth.uid());
create policy "stewards resolve flags" on flags for update
  using (is_steward());
