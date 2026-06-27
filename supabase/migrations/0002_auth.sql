-- Auth support: auto-create a gentle profile when someone signs in for the
-- first time, and keep rendering timestamps fresh.

-- Create a profile for each new auth user, with a friendly handle derived from
-- their email. (The app also ensures a profile on first sign-in, so this is the
-- preferred path but not the only one.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
begin
  base := regexp_replace(lower(split_part(coalesce(new.email, ''), '@', 1)), '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  if base = '' then
    base := 'friend';
  end if;

  candidate := base;
  if exists (select 1 from profiles where handle = candidate) then
    candidate := base || '-' || substr(new.id::text, 1, 6);
  end if;

  insert into profiles (id, handle, display_name)
  values (new.id, candidate, initcap(replace(base, '-', ' ')))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Touch renderings.updated_at on edit.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists renderings_touch_updated_at on renderings;
create trigger renderings_touch_updated_at
  before update on renderings
  for each row execute function public.touch_updated_at();
