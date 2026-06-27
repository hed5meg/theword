-- Stewardship: let an admin grant or revoke a member's role.
-- (Profiles' own RLS only allows editing your own row, so role changes for
-- others go through this SECURITY DEFINER function, gated to admins.)

create or replace function public.set_member_role(target_handle text, new_role user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only an admin may set roles';
  end if;
  update profiles set role = new_role where handle = target_handle;
end;
$$;

-- Bootstrap the first steward/admin once, by hand, in the SQL editor:
--   update profiles set role = 'admin' where handle = 'your-handle';
