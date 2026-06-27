-- Margin Notes: a reader highlights a span of a rendering and leaves a gentle,
-- directed note for that rendering's author and the stewards. Anchors bind to a
-- rendering version + quoted text + context (re-anchored or orphaned on edit).
-- Also adds an email-notification preference.

alter type flag_target add value if not exists 'note';
alter type flag_target add value if not exists 'note_reply';

alter table profiles
  add column if not exists email_notifications boolean not null default true;

create table notes (
  id                  uuid primary key default gen_random_uuid(),
  rendering_id        uuid not null references renderings (id) on delete cascade,
  rendering_version_id uuid references rendering_versions (id) on delete set null,
  author_id           uuid not null references profiles (id) on delete cascade,
  audience            text not null default 'author_and_stewards',
  quoted_text         text not null,
  anchor_start        int not null,
  anchor_end          int not null,
  context_prefix      text,
  context_suffix      text,
  body                text not null,
  suggested_wording   text,
  status              text not null default 'open'
                        check (status in ('open', 'acknowledged', 'addressed', 'archived')),
  orphaned            boolean not null default false,
  hidden              boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table note_replies (
  id          uuid primary key default gen_random_uuid(),
  note_id     uuid not null references notes (id) on delete cascade,
  author_id   uuid references profiles (id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index on notes (rendering_id);
create index on notes (author_id);
create index on note_replies (note_id);

-- Who may see a note: its writer, the rendering's author, or a steward.
create or replace function public.can_see_note(n_rendering_id uuid, n_author_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    n_author_id = auth.uid()
    or exists (select 1 from renderings r where r.id = n_rendering_id and r.author_id = auth.uid())
    or is_steward();
$$;

alter table notes        enable row level security;
alter table note_replies enable row level security;

create policy "notes visible to writer/author/steward" on notes for select
  using (not hidden and can_see_note(rendering_id, author_id));
create policy "members create notes" on notes for insert
  with check (author_id = auth.uid());
create policy "writer/author/steward update note" on notes for update
  using (
    author_id = auth.uid()
    or exists (select 1 from renderings r where r.id = rendering_id and r.author_id = auth.uid())
    or is_steward()
  );

create policy "note replies visible with note" on note_replies for select
  using (
    exists (
      select 1 from notes n
      where n.id = note_id and not n.hidden and can_see_note(n.rendering_id, n.author_id)
    )
  );
create policy "participants add note replies" on note_replies for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1 from notes n
      where n.id = note_id and can_see_note(n.rendering_id, n.author_id)
    )
  );
