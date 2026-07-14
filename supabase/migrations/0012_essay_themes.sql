-- Essay themes: a steward gathers essays under a named theme (e.g. "Wheat and
-- Tares", "Building Zion") and orders them within it. An essay belongs to one
-- theme (or none). Themes are public; only stewards tend them.

create table essay_themes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text unique not null,
  description text,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table essays
  add column if not exists theme_id uuid references essay_themes (id) on delete set null;
alter table essays
  add column if not exists theme_order int not null default 0;
create index on essays (theme_id);

alter table essay_themes enable row level security;
create policy "themes public read" on essay_themes for select using (true);
create policy "stewards tend themes" on essay_themes for all
  using (is_steward()) with check (is_steward());
