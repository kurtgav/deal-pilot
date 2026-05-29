-- =====================================================================
-- RLS Helper Functions
-- ---------------------------------------------------------------------
-- WHY: These functions read permissions/roles directly from the JWT
-- (auth.jwt()), avoiding any DB lookup. This is the payoff of the
-- JWT-injection design from the previous migration — RLS becomes a
-- pure JSON array membership check.
--
-- Function attributes:
--   `stable`           — auth.jwt() is stable within a transaction,
--                        so Postgres can cache results in the plan.
--   `security invoker` — these only read the caller's own JWT; no
--                        privileged data access needed (and using
--                        invoker prevents accidentally elevating).
--   `set search_path = ''` — defense in depth; fully qualify every ref.
-- =====================================================================

create or replace function public.has_permission(required_permission text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  -- jsonb ? operator: does the array contain the element?
  -- O(n) but n is typically <30 perms, so effectively constant time.
  select coalesce(
    (auth.jwt() -> 'user_permissions') ? required_permission,
    false
  );
$$;

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'user_roles') ? required_role,
    false
  );
$$;

comment on function public.has_permission(text) is
  'Returns true if the JWT user_permissions claim contains the given permission. Zero-query RLS check.';
comment on function public.has_role(text) is
  'Returns true if the JWT user_roles claim contains the given role. Zero-query RLS check.';

-- Exposed to authenticated users so RLS policies can call them.
-- anon doesn't get access — no anonymous endpoint should need RBAC.
grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.has_role(text)       to authenticated;

-- =====================================================================
-- Example: documents table with RBAC-driven RLS
-- ---------------------------------------------------------------------
-- Demonstrates the full pattern: ownership check + permission check.
-- Replace this with your real domain tables, copying the policy shape.
-- =====================================================================
create table public.documents (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  content    text,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_documents_owner_id on public.documents(owner_id);

create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.tg_set_updated_at();

alter table public.documents enable row level security;
alter table public.documents force row level security;

-- =====================================================================
-- RLS Policies — pattern: permission gate + ownership gate
-- ---------------------------------------------------------------------
-- The `(select auth.uid())` wrapping is a Supabase performance pattern:
-- it lets Postgres treat auth.uid() as an InitPlan, evaluating it once
-- per query instead of once per row.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- =====================================================================

-- SELECT: must have documents.read. Sees only own docs unless they
-- additionally have documents.read_any (admin-tier permission).
create policy "documents_select"
  on public.documents
  for select
  to authenticated
  using (
    public.has_permission('documents.read')
    and (
      owner_id = (select auth.uid())
      or public.has_permission('documents.read_any')
    )
  );

-- INSERT: must have documents.create AND owner_id must equal self.
-- Defense in depth: prevents an authorized user from creating docs
-- under another user's identity even if they bypass app-level checks.
create policy "documents_insert"
  on public.documents
  for insert
  to authenticated
  with check (
    public.has_permission('documents.create')
    and owner_id = (select auth.uid())
  );

-- UPDATE: own docs need documents.update; any docs need documents.update_any.
-- Both `using` (visibility) and `with check` (post-update validity) are
-- specified to prevent ownership-flipping attacks (changing owner_id
-- to escape future checks).
create policy "documents_update"
  on public.documents
  for update
  to authenticated
  using (
    (public.has_permission('documents.update') and owner_id = (select auth.uid()))
    or public.has_permission('documents.update_any')
  )
  with check (
    (public.has_permission('documents.update') and owner_id = (select auth.uid()))
    or public.has_permission('documents.update_any')
  );

-- DELETE: own docs need documents.delete; any docs need documents.delete_any.
create policy "documents_delete"
  on public.documents
  for delete
  to authenticated
  using (
    (public.has_permission('documents.delete') and owner_id = (select auth.uid()))
    or public.has_permission('documents.delete_any')
  );

-- Grant table privileges so the policies can take effect. Without this
-- grant, even authorized users would be blocked at the GRANT layer
-- (RLS only narrows access, never broadens it).
grant select, insert, update, delete on public.documents to authenticated;
