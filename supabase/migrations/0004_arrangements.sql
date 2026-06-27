-- Arrangements: a contributor's proposed ordering of the whole book.
-- Movements become properties of an arrangement; passages stay global atoms.
-- Per-arrangement display names live on arrangement_entries (title/slug overrides),
-- so the Love-Ordered Arrangement shows the original love names while the
-- Canonical Order uses each passage's base (KJV) name.

-- Extend the polymorphic targets to include arrangements.
alter type resonance_target add value if not exists 'arrangement';
alter type reflection_target add value if not exists 'arrangement';

create table arrangements (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid references profiles (id) on delete set null,
  title        text not null,
  slug         text unique not null,
  description  text,
  status       text not null default 'published'
                 check (status in ('draft', 'published', 'archived')),
  is_default   boolean not null default false,
  is_system    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table arrangement_movements (
  id              uuid primary key default gen_random_uuid(),
  arrangement_id  uuid not null references arrangements (id) on delete cascade,
  title           text not null,
  subtitle        text,
  order_index     int not null default 0
);

create table arrangement_entries (
  id                       uuid primary key default gen_random_uuid(),
  arrangement_id           uuid not null references arrangements (id) on delete cascade,
  arrangement_movement_id  uuid references arrangement_movements (id) on delete set null,
  passage_id               uuid not null references passages (id) on delete cascade,
  order_index              int not null default 0,
  -- Per-arrangement display overrides; fall back to the passage's base name/slug.
  title                    text,
  slug                     text,
  featured_rendering_id    uuid references renderings (id) on delete set null,
  note                     text,
  unique (arrangement_id, passage_id)
);
-- A passage's slug must be unique within an arrangement (for routing).
create unique index arrangement_entries_slug_idx
  on arrangement_entries (arrangement_id, slug);

create table arrangement_versions (
  id              uuid primary key default gen_random_uuid(),
  arrangement_id  uuid not null references arrangements (id) on delete cascade,
  snapshot        jsonb not null,
  edited_by       uuid references profiles (id) on delete set null,
  note            text,
  created_at      timestamptz not null default now()
);

create table arrangement_tenets (
  arrangement_id  uuid not null references arrangements (id) on delete cascade,
  tenet_id        uuid not null references tenets (id) on delete cascade,
  primary key (arrangement_id, tenet_id)
);

create index on arrangement_movements (arrangement_id, order_index);
create index on arrangement_entries (arrangement_id, order_index);
create index on arrangement_versions (arrangement_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: published arrangements are open to all; drafts are private to the author;
-- a member edits their own; stewards may tend any.
-- ---------------------------------------------------------------------------
alter table arrangements           enable row level security;
alter table arrangement_movements  enable row level security;
alter table arrangement_entries    enable row level security;
alter table arrangement_versions   enable row level security;
alter table arrangement_tenets     enable row level security;

-- Helper predicate inlined per-table: an arrangement is visible when published,
-- owned, or the viewer is a steward.
create policy "arrangements readable" on arrangements for select
  using (status = 'published' or author_id = auth.uid() or is_steward());
create policy "members add arrangements" on arrangements for insert
  with check (author_id = auth.uid());
create policy "author or steward edit arrangements" on arrangements for update
  using (author_id = auth.uid() or is_steward());
create policy "author may delete own non-system" on arrangements for delete
  using ((author_id = auth.uid() and not is_system) or is_steward());

-- Child rows are visible/writable in step with their arrangement.
create policy "arr movements readable" on arrangement_movements for select
  using (exists (select 1 from arrangements a where a.id = arrangement_id
    and (a.status = 'published' or a.author_id = auth.uid() or is_steward())));
create policy "arr movements writable" on arrangement_movements for all
  using (exists (select 1 from arrangements a where a.id = arrangement_id
    and (a.author_id = auth.uid() or is_steward())))
  with check (exists (select 1 from arrangements a where a.id = arrangement_id
    and (a.author_id = auth.uid() or is_steward())));

create policy "arr entries readable" on arrangement_entries for select
  using (exists (select 1 from arrangements a where a.id = arrangement_id
    and (a.status = 'published' or a.author_id = auth.uid() or is_steward())));
create policy "arr entries writable" on arrangement_entries for all
  using (exists (select 1 from arrangements a where a.id = arrangement_id
    and (a.author_id = auth.uid() or is_steward())))
  with check (exists (select 1 from arrangements a where a.id = arrangement_id
    and (a.author_id = auth.uid() or is_steward())));

create policy "arr versions readable" on arrangement_versions for select
  using (exists (select 1 from arrangements a where a.id = arrangement_id
    and (a.status = 'published' or a.author_id = auth.uid() or is_steward())));
create policy "arr versions insert" on arrangement_versions for insert
  with check (exists (select 1 from arrangements a where a.id = arrangement_id
    and (a.author_id = auth.uid() or is_steward())));

create policy "arr tenets readable" on arrangement_tenets for select
  using (exists (select 1 from arrangements a where a.id = arrangement_id
    and (a.status = 'published' or a.author_id = auth.uid() or is_steward())));
create policy "arr tenets writable" on arrangement_tenets for all
  using (exists (select 1 from arrangements a where a.id = arrangement_id
    and (a.author_id = auth.uid() or is_steward())))
  with check (exists (select 1 from arrangements a where a.id = arrangement_id
    and (a.author_id = auth.uid() or is_steward())));
