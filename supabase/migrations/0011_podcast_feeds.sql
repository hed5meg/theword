-- Podcast shows by RSS: a steward subscribes the site to a show's feed URL and
-- every episode appears automatically (fetched + cached at read time). Episodes
-- are not stored — the feed is the source of truth. The manual podcast_episodes
-- table stays for one-off / guest episodes.

create table podcast_feeds (
  id          uuid primary key default gen_random_uuid(),
  added_by    uuid references profiles (id) on delete set null,
  feed_url    text not null unique,
  title       text,
  slug        text unique not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table podcast_feeds enable row level security;

create policy "feeds public read" on podcast_feeds for select using (true);
create policy "stewards tend feeds" on podcast_feeds for all
  using (is_steward()) with check (is_steward());
