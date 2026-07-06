-- Named branches: a contributor can gather their renderings across many passages
-- under one named branch (e.g. "Love Anchored"), reused wherever they choose. The
-- branch's name stands in for their alias in the picker and attribution, and the
-- branch can be read whole. A rendering may belong to one branch, or none (then it
-- is attributed to the contributor's name, as before). Seed renderings have none.

create table branches (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references profiles (id) on delete cascade,
  name        text not null,
  slug        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (author_id, slug)
);
create index on branches (author_id);

alter table renderings
  add column if not exists branch_id uuid references branches (id) on delete set null;
create index on renderings (branch_id);

alter table branches enable row level security;

-- Branches are public (they name a line every reader can follow).
create policy "branches are public" on branches for select using (true);
create policy "author creates branch" on branches for insert
  with check (author_id = auth.uid());
create policy "author updates branch" on branches for update
  using (author_id = auth.uid());
create policy "author deletes branch" on branches for delete
  using (author_id = auth.uid());
