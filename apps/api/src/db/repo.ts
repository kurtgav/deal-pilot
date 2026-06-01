import type { Lead, CallSession, Handoff, LeadStatus } from '@dealpilot/shared';
import { supabaseAdmin } from '../lib/supabase.js';
import { redactTranscript } from '../lib/pii.js';

/**
 * Data access layer backed by Supabase Postgres. The API server uses the
 * service-role client (bypasses RLS); ownership is enforced in the route/
 * socket layer via the passed userId. DB columns are snake_case; these
 * mappers convert to/from the camelCase shared TS interfaces.
 */

// ---------- mappers ----------
function toLead(r: any): Lead {
  return {
    id: r.id,
    contactName: r.contact_name,
    company: r.company,
    companyUrl: r.company_url ?? undefined,
    scrapedContext: r.scraped_context ?? undefined,
    industry: r.industry,
    initialUseCase: r.initial_use_case,
    status: r.status,
    createdAt: r.created_at,
    lastCallSessionId: r.last_call_session_id ?? undefined,
  };
}

function toSession(r: any): CallSession {
  return {
    id: r.id,
    leadId: r.lead_id,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
    transcript: r.transcript ?? [],
    extractedFields: r.extracted_fields ?? { painPoints: [], objections: [], unansweredQuestions: [] },
    leadScore: r.lead_score ?? undefined,
    status: r.status,
  };
}

function toHandoff(r: any): Handoff {
  return {
    sessionId: r.session_id,
    leadId: r.lead_id,
    generatedAt: r.generated_at,
    summary: r.summary,
    qualification: r.qualification,
    crmJson: r.crm_json,
    followUpEmailDraft: r.follow_up_email_draft,
    flaggedQuestions: r.flagged_questions ?? [],
  };
}

// ---------- leads ----------
export async function listLeads(userId: string): Promise<Lead[]> {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toLead);
}

export async function getLead(id: string): Promise<Lead | null> {
  const { data } = await supabaseAdmin.from('leads').select('*').eq('id', id).maybeSingle();
  return data ? toLead(data) : null;
}

/** Owner of a lead. `null` = seeded demo lead (shared); `undefined` = no such lead. */
export async function getLeadOwner(id: string): Promise<string | null | undefined> {
  const { data } = await supabaseAdmin.from('leads').select('user_id').eq('id', id).maybeSingle();
  return data ? (data.user_id ?? null) : undefined;
}

export async function createLead(input: Partial<Lead> & { userId: string }): Promise<Lead> {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({
      user_id: input.userId,
      contact_name: input.contactName,
      company: input.company ?? '',
      company_url: input.companyUrl,
      scraped_context: input.scrapedContext,
      industry: input.industry ?? '',
      initial_use_case: input.initialUseCase ?? '',
      status: 'new',
    })
    .select('*')
    .single();
  if (error) throw error;
  return toLead(data);
}

export async function updateLead(id: string, patch: Partial<{ status: LeadStatus; lastCallSessionId: string; scrapedContext: string }>): Promise<Lead | null> {
  const row: any = {};
  if (patch.status) row.status = patch.status;
  if (patch.lastCallSessionId) row.last_call_session_id = patch.lastCallSessionId;
  if (patch.scrapedContext !== undefined) row.scraped_context = patch.scrapedContext;
  const { data } = await supabaseAdmin.from('leads').update(row).eq('id', id).select('*').maybeSingle();
  return data ? toLead(data) : null;
}

// ---------- sessions ----------
export async function createSession(leadId: string, userId: string): Promise<CallSession> {
  const { data, error } = await supabaseAdmin
    .from('call_sessions')
    .insert({ lead_id: leadId, user_id: userId, status: 'active' })
    .select('*')
    .single();
  if (error) throw error;
  return toSession(data);
}

export async function getSession(id: string): Promise<CallSession | null> {
  const { data } = await supabaseAdmin.from('call_sessions').select('*').eq('id', id).maybeSingle();
  return data ? toSession(data) : null;
}

/** Returns the owning user_id for a session, or null if it doesn't exist. */
export async function getSessionOwner(id: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('call_sessions').select('user_id').eq('id', id).maybeSingle();
  return data?.user_id ?? null;
}

export async function saveSession(s: CallSession): Promise<void> {
  // Optional redaction-at-rest (Golden Rule #4): when PII_REDACTION=true, the
  // verbatim transcript is never written; emails/phones are masked first.
  const transcript = process.env.PII_REDACTION === 'true' ? redactTranscript(s.transcript) : s.transcript;
  await supabaseAdmin
    .from('call_sessions')
    .update({
      transcript,
      extracted_fields: s.extractedFields,
      lead_score: s.leadScore ?? null,
      status: s.status,
      ended_at: s.endedAt ?? null,
    })
    .eq('id', s.id);
}

export async function endSession(id: string): Promise<CallSession | null> {
  const { data } = await supabaseAdmin
    .from('call_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  return data ? toSession(data) : null;
}

/**
 * Retention sweep (Golden Rule #4): empty the verbatim transcript of any ended
 * session whose review window has elapsed (ended_at < cutoff). The handoff's
 * exported business artifacts (summary, crm_json) are retained; only the raw
 * PII-bearing transcript is purged. Returns the number of sessions purged.
 */
export async function purgeExpiredTranscripts(cutoffIso: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('call_sessions')
    .update({ transcript: [] })
    .eq('status', 'ended')
    .lt('ended_at', cutoffIso)
    .neq('transcript', '[]')
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

// ---------- handoffs ----------
export async function createHandoff(h: Handoff, userId: string): Promise<Handoff> {
  const { data, error } = await supabaseAdmin
    .from('handoffs')
    .upsert({
      session_id: h.sessionId,
      lead_id: h.leadId,
      user_id: userId,
      generated_at: h.generatedAt,
      summary: h.summary,
      qualification: h.qualification,
      crm_json: h.crmJson,
      follow_up_email_draft: h.followUpEmailDraft,
      flagged_questions: h.flaggedQuestions,
    })
    .select('*')
    .single();
  if (error) throw error;
  return toHandoff(data);
}

export async function getHandoff(sessionId: string): Promise<Handoff | null> {
  const { data } = await supabaseAdmin.from('handoffs').select('*').eq('session_id', sessionId).maybeSingle();
  return data ? toHandoff(data) : null;
}

/** Owner of a handoff, or null if it doesn't exist. Handoffs always have an owner. */
export async function getHandoffOwner(sessionId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('handoffs').select('user_id').eq('session_id', sessionId).maybeSingle();
  return data?.user_id ?? null;
}

export async function listHandoffs(userId: string): Promise<Handoff[]> {
  const { data, error } = await supabaseAdmin
    .from('handoffs')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toHandoff);
}
