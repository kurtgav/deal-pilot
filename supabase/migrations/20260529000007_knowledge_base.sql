-- =====================================================================
-- Knowledge Base: products, objections, discovery questions
-- ---------------------------------------------------------------------
-- Moves the static JSON knowledge into Postgres so it can be edited via
-- the admin UI. Global (shared) knowledge uses NULL user_id; the API
-- reads with the service role. RLS allows authenticated users to read
-- global + own rows and to manage their own rows.
-- =====================================================================

create table public.knowledge_products (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  name         text not null,
  price        text not null default '',
  features     jsonb not null default '[]'::jsonb,
  best_for     text not null default '',
  integrations jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now()
);

create table public.knowledge_objections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  objection  text not null,
  rebuttal   text not null default '',
  created_at timestamptz not null default now()
);

create table public.knowledge_discovery (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  stage      text not null,
  questions  jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.knowledge_products   enable row level security;
alter table public.knowledge_objections enable row level security;
alter table public.knowledge_discovery  enable row level security;

create policy kp_select on public.knowledge_products for select to authenticated
  using (user_id = auth.uid() or user_id is null);
create policy kp_modify on public.knowledge_products for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy ko_select on public.knowledge_objections for select to authenticated
  using (user_id = auth.uid() or user_id is null);
create policy ko_modify on public.knowledge_objections for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy kd_select on public.knowledge_discovery for select to authenticated
  using (user_id = auth.uid() or user_id is null);
create policy kd_modify on public.knowledge_discovery for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Seed global knowledge from the original JSON catalogue (NULL user_id).
insert into public.knowledge_products (name, price, features, best_for, integrations) values
  ('DealPilot Starter', '$499/mo',
   '["Up to 50 AI-assisted calls/month","Basic lead scoring","CRM CSV export","Email templates","1 knowledge base"]'::jsonb,
   'Early-stage startups with < 10 reps',
   '["REST API","Webhook notifications"]'::jsonb),
  ('DealPilot Professional', '$1,499/mo',
   '["Unlimited AI-assisted calls","Advanced lead scoring with custom weights","Real-time copilot panel","Custom knowledge bases (up to 5)","Priority STT/TTS","Slack integration"]'::jsonb,
   'Growth-stage B2B SaaS with 10-50 reps',
   '["REST API","Webhooks","Slack","Salesforce (basic)","HubSpot (basic)"]'::jsonb),
  ('DealPilot Enterprise', 'Custom pricing',
   '["Everything in Professional","Unlimited knowledge bases","Custom AI persona training","Dedicated voice infrastructure","SOC 2 compliance","SSO/SAML","Dedicated CSM","99.9% SLA"]'::jsonb,
   'Enterprise sales orgs with 50+ reps and complex deal cycles',
   '["All Professional integrations","Salesforce (deep)","HubSpot (deep)","Pipedrive","Custom CRM via API"]'::jsonb);

insert into public.knowledge_objections (objection, rebuttal) values
  ('It''s too expensive', 'I understand budget is a consideration. Many of our customers find that DealPilot pays for itself within the first month by increasing SQL conversion rates by 40% and eliminating the need to hire additional sales engineers. Would it help if I walked through the ROI calculation based on your team size?'),
  ('We already have a solution', 'That''s great that you''ve invested in your sales process. What we hear from teams switching to DealPilot is that their existing tools don''t handle the real-time technical Q&A during live calls. How does your current solution handle it when prospects ask deep technical questions mid-call?'),
  ('We need to think about it', 'Absolutely, this is an important decision. To help you evaluate, I can generate a detailed summary of what we discussed today along with a recommended implementation plan. Would it be helpful to schedule a follow-up with our solutions team to address any remaining technical questions?'),
  ('Integration seems complex', 'Integration is actually one of our strengths. Most teams are up and running within a day using our REST API and webhook system. We also provide pre-built connectors for major CRMs. What''s your current tech stack? I can speak to the specific integration path.'),
  ('AI can''t replace human sales engineers', 'You''re absolutely right — and that''s not our goal. DealPilot augments your team by handling the 80% of discovery calls that don''t require a senior SE. Your human experts focus on complex enterprise deals while AI handles initial qualification and technical Q&A from your knowledge base.'),
  ('Concerned about data privacy', 'Data privacy is a top priority for us. We don''t store prospect PII beyond the active session, all data is encrypted in transit and at rest, and we''re SOC 2 compliant on our Enterprise plan. Session data is isolated and can be purged on demand. Would you like me to flag a security review with our team?');

insert into public.knowledge_discovery (stage, questions) values
  ('intro', '["Hi, I''m DealPilot AI — your AI sales engineer for today''s call. I''m here to understand your needs and see if we can help. To start, could you tell me a bit about your role and what your team is working on?"]'::jsonb),
  ('use_case', '["What''s the primary challenge you''re looking to solve with a tool like ours?","Can you walk me through a typical sales call at your company today?","How many discovery or demo calls does your team run per week?"]'::jsonb),
  ('pain_points', '["What''s the biggest bottleneck in your current sales process?","When prospects ask technical questions on calls, how does your team handle that today?","How much time do your sales engineers spend on initial discovery versus complex deals?"]'::jsonb),
  ('technical_fit', '["What does your current tech stack look like for sales tooling?","Do you use a CRM today? If so, which one?","How important is real-time data extraction during calls versus post-call summaries?"]'::jsonb),
  ('budget_and_urgency', '["Is there a timeline you''re working toward for implementing a solution?","Do you have budget allocated for sales tooling this quarter?","Who else would be involved in evaluating and deciding on a tool like this?"]'::jsonb),
  ('recommendation', '["Based on what you''ve shared, I''d like to recommend a solution that fits your needs. Let me walk you through what I think would work best for your team."]'::jsonb),
  ('close', '["Would it make sense to schedule a deeper technical session with our solutions team?","What would be the best next step from your perspective?"]'::jsonb);
