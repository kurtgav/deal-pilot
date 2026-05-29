-- =====================================================================
-- App Schema: leads, call_sessions, handoffs
-- ---------------------------------------------------------------------
-- Replaces the in-memory store. Columns mirror the shared TS interfaces.
-- Each lead is owned by a user (user_id). Seeded demo leads use a NULL
-- owner so every authenticated user can see them.
-- The API server talks to these tables with the service role (bypasses
-- RLS); RLS policies below are defense-in-depth for any direct client
-- access.
-- =====================================================================

-- ---------------------------------------------------------------------
-- LEADS
-- ---------------------------------------------------------------------
create table public.leads (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users(id) on delete cascade,
  contact_name         text not null,
  company              text not null default '',
  company_url          text,
  scraped_context      text,
  industry             text not null default '',
  initial_use_case     text not null default '',
  status               text not null default 'new',
  last_call_session_id uuid,
  created_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CALL SESSIONS
-- transcript / extracted_fields stored as JSONB (mirrors TS shapes).
-- ---------------------------------------------------------------------
create table public.call_sessions (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads(id) on delete cascade,
  user_id          uuid references auth.users(id) on delete cascade,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  transcript       jsonb not null default '[]'::jsonb,
  extracted_fields jsonb not null default '{"painPoints":[],"objections":[],"unansweredQuestions":[]}'::jsonb,
  lead_score       int,
  status           text not null default 'active'
);

-- ---------------------------------------------------------------------
-- HANDOFFS (1:1 with a session)
-- ---------------------------------------------------------------------
create table public.handoffs (
  session_id            uuid primary key references public.call_sessions(id) on delete cascade,
  lead_id               uuid not null references public.leads(id) on delete cascade,
  user_id               uuid references auth.users(id) on delete cascade,
  generated_at          timestamptz not null default now(),
  summary               text not null default '',
  qualification         jsonb not null default '{}'::jsonb,
  crm_json              jsonb not null default '{}'::jsonb,
  follow_up_email_draft text not null default '',
  flagged_questions     jsonb not null default '[]'::jsonb
);

create index idx_leads_user_id         on public.leads(user_id);
create index idx_call_sessions_lead_id on public.call_sessions(lead_id);
create index idx_call_sessions_user_id on public.call_sessions(user_id);
create index idx_handoffs_user_id      on public.handoffs(user_id);

-- =====================================================================
-- RLS: own rows only (leads also expose NULL-owner demo rows).
-- =====================================================================
alter table public.leads         enable row level security;
alter table public.call_sessions enable row level security;
alter table public.handoffs      enable row level security;

create policy leads_select on public.leads for select to authenticated
  using (user_id = auth.uid() or user_id is null);
create policy leads_modify on public.leads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy sessions_all on public.call_sessions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy handoffs_all on public.handoffs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
