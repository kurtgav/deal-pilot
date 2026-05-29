-- =====================================================================
-- Assign specific users to RBAC roles
-- ---------------------------------------------------------------------
-- WHY: Grants the four known team members their intended roles. The
-- signup trigger (20260529000005) gives every user the base 'user'
-- role; this migration sets each listed user to EXACTLY one target
-- role by clearing any existing role rows first, then inserting the
-- target. That makes the migration idempotent AND authoritative —
-- re-running always converges to the mapping below regardless of prior
-- state.
--
-- Users are matched by email (case-insensitive) against auth.users.
-- If an email is not found, that row is skipped with a notice rather
-- than failing the whole migration (e.g. a user who hasn't signed up
-- yet). Re-run this migration after they sign up to grant the role.
--
-- After this runs, each affected user must obtain a NEW JWT (sign out +
-- in, or refreshSession) for the role/permission claims to update.
-- =====================================================================
do $$
declare
  -- email -> role mapping
  assignments constant text[][] := array[
    ['kurt@thirdcodesolutions.com', 'admin'],
    ['kurtgavin.design@gmail.com',  'super_admin'],
    ['kurtgavinlopez@gmail.com',    'manager'],
    ['hoontser@gmail.com',          'user']
  ];
  rec      text[];
  uid      uuid;
  role_id  uuid;
begin
  foreach rec slice 1 in array assignments loop
    select id into uid from auth.users where lower(email) = lower(rec[1]);
    if uid is null then
      raise notice 'User % not found in auth.users; skipping.', rec[1];
      continue;
    end if;

    select id into role_id from public.roles where name = rec[2];
    if role_id is null then
      raise warning 'Role % not found in public.roles; skipping % .', rec[2], rec[1];
      continue;
    end if;

    -- Authoritative: this user should hold ONLY the target role.
    delete from public.user_roles where user_id = uid;
    insert into public.user_roles (user_id, role_id)
      values (uid, role_id)
      on conflict do nothing;

    raise notice 'Granted role % to %', rec[2], rec[1];
  end loop;
end
$$;
