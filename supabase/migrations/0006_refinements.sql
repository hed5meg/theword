-- Refinements: a proposed, span-anchored edit to an existing rendering, which the
-- author/stewards can "gather in" (→ new version, cross-pollinated by the refiner)
-- or "set aside with thanks". Reuses the Margin Notes anchor design + rendering
-- versions. A scoped before/after diff is correct here (same text changing).

alter type flag_target add value if not exists 'refinement';
alter type flag_target add value if not exists 'refinement_reply';

create table refinements (
  id                       uuid primary key default gen_random_uuid(),
  rendering_id             uuid not null references renderings (id) on delete cascade,
  base_rendering_version_id uuid references rendering_versions (id) on delete set null,
  proposer_id              uuid not null references profiles (id) on delete cascade,
  reason                   text,
  status                   text not null default 'open'
                             check (status in ('open', 'gathered_in', 'set_aside', 'withdrawn')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table refinement_changes (
  id              uuid primary key default gen_random_uuid(),
  refinement_id   uuid not null references refinements (id) on delete cascade,
  anchor_start    int not null,
  anchor_end      int not null,
  quoted_text     text not null,
  context_prefix  text,
  context_suffix  text,
  replacement_text text not null,
  change_status   text not null default 'open'
                    check (change_status in ('open', 'gathered_in', 'set_aside', 'stale'))
);

create table refinement_tenets (
  refinement_id  uuid not null references refinements (id) on delete cascade,
  tenet_id       uuid not null references tenets (id) on delete cascade,
  primary key (refinement_id, tenet_id)
);

create table refinement_replies (
  id            uuid primary key default gen_random_uuid(),
  refinement_id uuid not null references refinements (id) on delete cascade,
  author_id     uuid references profiles (id) on delete set null,
  body          text not null,
  created_at    timestamptz not null default now()
);

create index on refinements (rendering_id);
create index on refinement_changes (refinement_id);
create index on refinement_replies (refinement_id);

-- Visibility: proposer, the rendering's author, or a steward.
create or replace function public.can_see_refinement(r_rendering_id uuid, r_proposer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    r_proposer_id = auth.uid()
    or exists (select 1 from renderings r where r.id = r_rendering_id and r.author_id = auth.uid())
    or is_steward();
$$;

alter table refinements        enable row level security;
alter table refinement_changes enable row level security;
alter table refinement_tenets  enable row level security;
alter table refinement_replies enable row level security;

create policy "refinements visible" on refinements for select
  using (can_see_refinement(rendering_id, proposer_id));
create policy "members propose refinements" on refinements for insert
  with check (proposer_id = auth.uid());
create policy "proposer/author/steward update refinement" on refinements for update
  using (
    proposer_id = auth.uid()
    or exists (select 1 from renderings r where r.id = rendering_id and r.author_id = auth.uid())
    or is_steward()
  );

create policy "refinement changes visible" on refinement_changes for select
  using (exists (select 1 from refinements rf
    where rf.id = refinement_id and can_see_refinement(rf.rendering_id, rf.proposer_id)));
create policy "refinement changes writable" on refinement_changes for all
  using (exists (select 1 from refinements rf
    where rf.id = refinement_id and (
      rf.proposer_id = auth.uid()
      or exists (select 1 from renderings r where r.id = rf.rendering_id and r.author_id = auth.uid())
      or is_steward())))
  with check (exists (select 1 from refinements rf
    where rf.id = refinement_id and (
      rf.proposer_id = auth.uid()
      or exists (select 1 from renderings r where r.id = rf.rendering_id and r.author_id = auth.uid())
      or is_steward())));

create policy "refinement tenets visible" on refinement_tenets for select
  using (exists (select 1 from refinements rf
    where rf.id = refinement_id and can_see_refinement(rf.rendering_id, rf.proposer_id)));
create policy "proposer manages refinement tenets" on refinement_tenets for all
  using (exists (select 1 from refinements rf
    where rf.id = refinement_id and rf.proposer_id = auth.uid()))
  with check (exists (select 1 from refinements rf
    where rf.id = refinement_id and rf.proposer_id = auth.uid()));

create policy "refinement replies visible" on refinement_replies for select
  using (exists (select 1 from refinements rf
    where rf.id = refinement_id and can_see_refinement(rf.rendering_id, rf.proposer_id)));
create policy "participants add refinement replies" on refinement_replies for insert
  with check (auth.uid() is not null and exists (select 1 from refinements rf
    where rf.id = refinement_id and can_see_refinement(rf.rendering_id, rf.proposer_id)));
