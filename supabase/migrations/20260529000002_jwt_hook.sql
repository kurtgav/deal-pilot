-- =====================================================================
-- Custom Access Token Hook
-- ---------------------------------------------------------------------
-- WHY: This function runs ONCE per token issuance (sign-in / refresh).
-- It flattens the user's roles AND all their granted permissions into
-- the JWT claims. RLS policies can then check permissions with zero
-- DB queries — they read directly from auth.jwt(). This is the core
-- performance optimization vs. the standard authorize() pattern that
-- queries role_permissions on every RLS check.
--
-- Trade-offs of injecting permissions into the JWT:
--   + Zero-query RLS, much lower latency
--   + Permission checks work everywhere auth.jwt() works
--   - JWT size grows with permission count (~20 bytes per perm)
--   - Permission changes require a token refresh to take effect
-- For typical apps with <100 perms per user, the upside dominates.
--
-- Function attributes:
--   `stable`           — same input → same output within a transaction;
--                        lets Postgres cache the result inside RLS plans.
--   `security definer` — runs with the function owner's privileges, so
--                        it can read RBAC tables regardless of caller.
--   `set search_path = ''` — prevents schema-shadowing attacks; we
--                        fully qualify every reference (public.*, auth.*).
-- =====================================================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims          jsonb;
  user_roles_arr  jsonb;
  user_perms_arr  jsonb;
  uid             uuid;
begin
  uid    := (event->>'user_id')::uuid;
  claims := event->'claims';

  -- Aggregate role NAMES for this user.
  -- coalesce ensures an empty array (not null) when the user has no
  -- roles, so the JWT shape stays consistent for client decoders.
  select coalesce(jsonb_agg(distinct r.name), '[]'::jsonb)
    into user_roles_arr
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = uid;

  -- Aggregate DEDUPLICATED permission names across all of the user's
  -- roles. distinct is critical — overlapping permissions across roles
  -- would otherwise bloat the JWT (e.g. an admin+manager user).
  select coalesce(jsonb_agg(distinct p.name), '[]'::jsonb)
    into user_perms_arr
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = uid;

  claims := jsonb_set(claims, '{user_roles}',       user_roles_arr);
  claims := jsonb_set(claims, '{user_permissions}', user_perms_arr);

  return jsonb_set(event, '{claims}', claims);
end;
$$;

comment on function public.custom_access_token_hook(jsonb) is
  'Supabase Auth Custom Access Token Hook. Injects user_roles and user_permissions arrays into JWT claims at token issuance.';

-- =====================================================================
-- Hook permissions
-- ---------------------------------------------------------------------
-- Only Supabase Auth itself may execute this function. Revoking from
-- authenticated/anon/public prevents privilege escalation: a user
-- could otherwise call the hook with a forged event payload and
-- compute claims for any UUID — though they couldn't issue a real JWT,
-- exposing the function surface is unnecessary.
-- =====================================================================
grant usage on schema public to supabase_auth_admin;

grant execute on function public.custom_access_token_hook(jsonb)
  to supabase_auth_admin;

revoke execute on function public.custom_access_token_hook(jsonb)
  from authenticated, anon, public;

-- The hook (running as supabase_auth_admin via security definer) needs
-- to SELECT the RBAC tables. Grant only SELECT — no other access.
grant select on public.user_roles, public.roles,
                public.role_permissions, public.permissions
  to supabase_auth_admin;

-- =====================================================================
-- RLS policies for supabase_auth_admin
-- ---------------------------------------------------------------------
-- The previous migration enabled+forced RLS with no policies, blocking
-- ALL access. These permissive SELECT policies allow only the auth
-- admin to read RBAC tables, which is what the hook needs.
-- =====================================================================
create policy "auth_admin_read_user_roles"
  on public.user_roles
  as permissive
  for select
  to supabase_auth_admin
  using (true);

create policy "auth_admin_read_roles"
  on public.roles
  as permissive
  for select
  to supabase_auth_admin
  using (true);

create policy "auth_admin_read_role_permissions"
  on public.role_permissions
  as permissive
  for select
  to supabase_auth_admin
  using (true);

create policy "auth_admin_read_permissions"
  on public.permissions
  as permissive
  for select
  to supabase_auth_admin
  using (true);
