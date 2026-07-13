-- Essays and podcast episodes: curated, steward-published long-form writing and
-- audio. Each may optionally anchor to a passage, an arrangement, or a principle
-- (and then surface there). Both receive the community's light (resonance) and
-- reflections, so we extend those target enums. Audio is carried by an external
-- URL (Spotify/Apple/YouTube/RSS or a direct file) — no media is hosted here.

alter type resonance_target  add value if not exists 'essay';
alter type resonance_target  add value if not exists 'episode';
alter type reflection_target add value if not exists 'essay';
alter type reflection_target add value if not exists 'episode';
alter type flag_target       add value if not exists 'essay';
alter type flag_target       add value if not exists 'episode';

create table essays (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid references profiles (id) on delete set null,
  byline          text,
  title           text not null,
  slug            text unique not null,
  dek             text,
  body            text not null,
  status          text not null default 'draft'
                    check (status in ('draft', 'published')),
  published_at    timestamptz,
  passage_id      uuid references passages (id) on delete set null,
  arrangement_id  uuid references arrangements (id) on delete set null,
  tenet_id        uuid references tenets (id) on delete set null,
  idempotency_key uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on essays (status, published_at desc);
create index on essays (passage_id);
create index on essays (arrangement_id);
create index on essays (tenet_id);
create unique index if not exists essays_idem_key
  on essays (idempotency_key) where idempotency_key is not null;

create table podcast_episodes (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid references profiles (id) on delete set null,
  byline          text,
  title           text not null,
  slug            text unique not null,
  series          text,
  notes           text,
  audio_url       text not null,
  status          text not null default 'draft'
                    check (status in ('draft', 'published')),
  published_at    timestamptz,
  passage_id      uuid references passages (id) on delete set null,
  arrangement_id  uuid references arrangements (id) on delete set null,
  tenet_id        uuid references tenets (id) on delete set null,
  idempotency_key uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on podcast_episodes (status, published_at desc);
create index on podcast_episodes (passage_id);
create index on podcast_episodes (arrangement_id);
create index on podcast_episodes (tenet_id);
create unique index if not exists podcast_episodes_idem_key
  on podcast_episodes (idempotency_key) where idempotency_key is not null;

alter table essays           enable row level security;
alter table podcast_episodes enable row level security;

-- Public reads what's published; stewards see drafts and do everything.
create policy "essays public read" on essays for select
  using (status = 'published' or is_steward());
create policy "stewards tend essays" on essays for all
  using (is_steward()) with check (is_steward());

create policy "episodes public read" on podcast_episodes for select
  using (status = 'published' or is_steward());
create policy "stewards tend episodes" on podcast_episodes for all
  using (is_steward()) with check (is_steward());
