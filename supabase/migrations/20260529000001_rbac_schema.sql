-- =====================================================================
-- RBAC Core Schema
-- ---------------------------------------------------------------------
-- WHY: Normalized RBAC model. Roles and permissions are decoupled so
-- permissions can be reassigned to roles without touching user data.
-- All FKs use ON DELETE CASCADE to prevent orphaned mappings when a
-- role/permission/user is removed.
--
-- All tables live in `public` because Supabase exposes only public
-- schema by default, and the JWT hook (running as supabase_auth_admin)
-- needs to read these tables. RLS is force-enabled and locked down so
-- only the auth admin and service_role can read them.
-- =====================================================================

-- ROLES: high-level categories (admin, manager, user, super_admin).
create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.roles is 'Application roles (e.g., admin, manager, user).';

-- PERMISSIONS: granular capabilities, named "resource.action".
-- The dotted convention is enforced by convention only (not a CHECK)
-- because changing it later would require a destructive migration.
create table public.permissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);
comment on table public.permissions is 'Granular permissions following resource.action convention.';

-- ROLE_PERMISSIONS: many-to-many mapping between roles and permissions.
-- Composite PK prevents duplicate (role, permission) pairs naturally.
create table public.role_permissions (
  role_id       uuid not null references public.roles(id)       on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (role_id, permission_id)
);
comment on table public.role_permissions is 'Maps roles to their granted permissions.';

-- USER_ROLES: maps auth.users to roles. A user can hold multiple roles.
-- created_by tracks who assigned the role for auditing; nulled on delete
-- to preserve audit trail even if the assigner is removed.
create table public.user_roles (
  user_id    uuid not null references auth.users(id) on delete cascade,
  role_id    uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  primary key (user_id, role_id)
);
comment on table public.user_roles is 'Maps users to one or more roles.';

-- =====================================================================
-- Indexes
-- WHY: The JWT hook runs on EVERY token issuance — these indexes ensure
-- the hook completes in sub-millisecond time even at scale.
-- (The composite PKs already provide a btree on the leading column,
-- but we add explicit single-column indexes for lookup symmetry.)
-- =====================================================================
create index idx_user_roles_user_id        on public.user_roles(user_id);
create index idx_role_permissions_role_id  on public.role_permissions(role_id);

-- =====================================================================
-- updated_at trigger (reusable; documents table will reuse this).
-- WHY: Centralize the trigger function so future tables can attach it.
-- search_path locked to '' so a malicious schema can't shadow now().
-- =====================================================================
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger roles_updated_at
  before update on public.roles
  for each row execute function public.tg_set_updated_at();

-- =====================================================================
-- LOCKDOWN: deny by default.
-- ---------------------------------------------------------------------
-- RLS is enabled AND forced (force makes the policy apply even to the
-- table owner). No policies are created here for anon/authenticated —
-- Task 3 grants supabase_auth_admin access for the hook to read.
-- This means anon/authenticated users CANNOT read RBAC tables directly,
-- preventing them from enumerating roles/permissions.
-- =====================================================================
alter table public.roles            enable row level security;
alter table public.permissions      enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles       enable row level security;

alter table public.roles            force row level security;
alter table public.permissions      force row level security;
alter table public.role_permissions force row level security;
alter table public.user_roles       force row level security;

-- Revoke any default privileges from public roles. service_role retains
-- full access (Supabase default), and supabase_auth_admin is granted
-- explicit SELECT in the next migration.
revoke all on public.roles            from anon, authenticated, public;
revoke all on public.permissions      from anon, authenticated, public;
revoke all on public.role_permissions from anon, authenticated, public;
revoke all on public.user_roles       from anon, authenticated, public;
