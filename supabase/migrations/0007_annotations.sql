-- Author annotations (glosses): the one who offered a rendering marks a word or
-- phrase in their own text and explains why they chose it. Unlike notes (which
-- are private, reader to author), annotations are PUBLIC — the translator's hand,
-- shown to every reader as a gently coloured, hoverable span. Only the rendering's
-- author (or a steward) may write them. Anchored to quoted text + context.

create table rendering_annotations (
  id             uuid primary key default gen_random_uuid(),
  rendering_id   uuid not null references renderings (id) on delete cascade,
  author_id      uuid not null references profiles (id) on delete cascade,
  quoted_text    text not null,
  anchor_start   int not null,
  anchor_end     int not null,
  context_prefix text,
  context_suffix text,
  note           text not null,
  hidden         boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index on rendering_annotations (rendering_id);

alter table rendering_annotations enable row level security;

-- Public read: annotations are meant for every reader (unless hidden).
create policy "annotations are public" on rendering_annotations for select
  using (not hidden);

-- Only the rendering's author may add a gloss (and only to their own rendering).
create policy "author writes annotations" on rendering_annotations for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from renderings r
      where r.id = rendering_id and r.author_id = auth.uid()
    )
  );

-- Author or steward may edit / remove.
create policy "author or steward updates annotations" on rendering_annotations for update
  using (
    exists (select 1 from renderings r where r.id = rendering_id and r.author_id = auth.uid())
    or is_steward()
  );
create policy "author or steward deletes annotations" on rendering_annotations for delete
  using (
    exists (select 1 from renderings r where r.id = rendering_id and r.author_id = auth.uid())
    or is_steward()
  );
