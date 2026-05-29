-- =====================================================================
-- Default role on signup
-- ---------------------------------------------------------------------
-- WHY: Every new auth.users row should automatically receive the base
-- 'user' role so RBAC is functional from the moment of sign-up. Without
-- this, new users would have an empty user_permissions claim in their
-- JWT and be effectively locked out of every authenticated endpoint
-- until a super_admin manually grants them a role.
--
-- The trigger fires AFTER INSERT on auth.users so that the new user
-- row is committed before we reference its id. security definer is
-- required because a regular user has no privilege on public.user_roles
-- (RLS denies it). We lock search_path to '' for safety.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  default_role_id uuid;
begin
  select id into default_role_id from public.roles where name = 'user';

  -- If the seed migration hasn't run yet (shouldn't happen in practice
  -- because migrations are ordered), skip silently rather than fail
  -- the user creation. Failing here would block all signups.
  if default_role_id is null then
    raise warning 'handle_new_user: default ''user'' role not found; skipping role assignment for %', new.id;
    return new;
  end if;

  insert into public.user_roles (user_id, role_id)
    values (new.id, default_role_id)
    on conflict do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'AFTER INSERT trigger function: assigns the default ''user'' role to every new auth.users row.';

-- Drop+recreate to make the migration idempotent (CREATE TRIGGER doesn't
-- support OR REPLACE in plain Postgres — the IF NOT EXISTS variant is
-- only available from PG 14+ for simple cases).
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
