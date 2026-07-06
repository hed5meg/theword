-- Idempotency for insert-only writes. Each submission carries a client-generated
-- key; a partial unique index makes a repeated insert (double-click, retry,
-- duplicate delivery) collide instead of creating a second row. Null keys are
-- allowed and never collide, so older/keyless clients simply fall back to the
-- prior behaviour. Update/delete actions are already idempotent, and resonances
-- are guarded by their own unique(user_id, target_type, target_id).

alter table renderings           add column if not exists idempotency_key uuid;
alter table notes                add column if not exists idempotency_key uuid;
alter table note_replies         add column if not exists idempotency_key uuid;
alter table refinements          add column if not exists idempotency_key uuid;
alter table refinement_replies   add column if not exists idempotency_key uuid;
alter table rendering_annotations add column if not exists idempotency_key uuid;
alter table reflections          add column if not exists idempotency_key uuid;
alter table flags                add column if not exists idempotency_key uuid;

create unique index if not exists renderings_idem_key
  on renderings (idempotency_key) where idempotency_key is not null;
create unique index if not exists notes_idem_key
  on notes (idempotency_key) where idempotency_key is not null;
create unique index if not exists note_replies_idem_key
  on note_replies (idempotency_key) where idempotency_key is not null;
create unique index if not exists refinements_idem_key
  on refinements (idempotency_key) where idempotency_key is not null;
create unique index if not exists refinement_replies_idem_key
  on refinement_replies (idempotency_key) where idempotency_key is not null;
create unique index if not exists rendering_annotations_idem_key
  on rendering_annotations (idempotency_key) where idempotency_key is not null;
create unique index if not exists reflections_idem_key
  on reflections (idempotency_key) where idempotency_key is not null;
create unique index if not exists flags_idem_key
  on flags (idempotency_key) where idempotency_key is not null;
