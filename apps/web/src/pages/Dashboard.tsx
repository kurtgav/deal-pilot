import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Lead } from '@dealpilot/shared';
import { api } from '../lib/api';

type Screen = 'dashboard' | 'lead-detail' | 'leads' | 'handoffs' | 'new-lead';

const fallbackLeads: Lead[] = [
  { id: 'demo-1', contactName: 'Maya Chen', company: 'NovaStack Labs', industry: 'Developer Tools', initialUseCase: 'API development platform', status: 'sql', createdAt: '2026-05-26T14:30:00Z' },
  { id: 'demo-2', contactName: 'Rafael Santos', company: 'CloudCart PH', industry: 'E-commerce SaaS', initialUseCase: 'Multi-vendor marketplace integrations', status: 'in_call', createdAt: '2026-05-26T14:15:00Z' },
  { id: 'demo-3', contactName: 'Anika Reyes', company: 'FinOpsly', industry: 'Fintech', initialUseCase: 'Cloud cost optimization', status: 'sql', createdAt: '2026-05-25T10:15:00Z' },
  { id: 'demo-4', contactName: 'James Liu', company: 'DataStream AI', industry: 'Data Analytics', initialUseCase: 'Real-time data pipelines', status: 'new', createdAt: '2026-05-24T09:00:00Z' },
  { id: 'demo-5', contactName: 'Sarah Johnson', company: 'HealthTrack Pro', industry: 'Healthcare SaaS', initialUseCase: 'Patient engagement workflow', status: 'new', createdAt: '2026-05-23T16:00:00Z' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getLeads()
      .then((data) => setLeads(data.length ? data : fallbackLeads))
      .catch(() => { setLeads(fallbackLeads); setError('Using demo data — API not reachable.'); })
      .finally(() => setLoading(false));
  }, []);

  const selectedLead = useMemo(() => leads.find((l) => l.id === selectedLeadId) ?? leads[0], [leads, selectedLeadId]);

  const nav = (next: Screen, leadId?: string) => { if (leadId) setSelectedLeadId(leadId); setScreen(next); };

  const startCall = async (leadId: string) => {
    if (leadId.startsWith('demo-')) return;
    const session = await api.startSession(leadId);
    navigate(`/call/${session.id}`);
  };

  const title = { dashboard: 'Dashboard', 'lead-detail': 'Lead Detail', leads: 'Leads', handoffs: 'Handoffs', 'new-lead': 'New Lead' }[screen];

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-alt)]">
      <Sidebar active={screen} onNavigate={nav} />
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-white px-6">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={() => nav('new-lead')} className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white">New Lead</button>
        </header>
        {error && <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-800">{error}<button className="ml-3 underline" onClick={() => setError(null)}>Dismiss</button></div>}
        <main className="p-6">
          {loading ? <LoadingState /> : (
            <>
              {screen === 'dashboard' && <DashboardHome leads={leads} onNavigate={nav} onStartCall={startCall} search={search} setSearch={setSearch} />}
              {screen === 'leads' && <DashboardHome leads={leads} onNavigate={nav} onStartCall={startCall} search={search} setSearch={setSearch} />}
              {screen === 'lead-detail' && selectedLead && <LeadDetail lead={selectedLead} onBack={() => nav('dashboard')} onStartCall={startCall} />}
              {screen === 'new-lead' && <NewLeadForm onCancel={() => nav('dashboard')} onCreated={(lead) => { setLeads((c) => [lead, ...c]); nav('lead-detail', lead.id); }} onError={setError} />}
              {screen === 'handoffs' && <HandoffsList leads={leads} onNavigate={nav} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  const items: { id: Screen; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'leads', label: 'Leads' },
    { id: 'handoffs', label: 'Handoffs' },
  ];
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-white lg:flex">
      <div className="border-b border-[var(--color-border)] p-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-bold text-white">DP</div>
          <span className="text-lg font-semibold">DealPilot</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex w-full rounded-lg px-3 py-2.5 text-sm ${active === item.id ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-muted)] hover:bg-slate-100'}`}>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

// ─── Dashboard / Leads (single unified view) ────────────────────────────────

function DashboardHome({ leads, onNavigate, onStartCall, search, setSearch }: { leads: Lead[]; onNavigate: (s: Screen, id?: string) => void; onStartCall: (id: string) => void; search: string; setSearch: (v: string) => void }) {
  const sql = leads.filter((l) => l.status === 'sql').length;
  const inCall = leads.filter((l) => l.status === 'in_call').length;
  const newCount = leads.filter((l) => l.status === 'new').length;
  const filtered = leads.filter((l) => `${l.contactName} ${l.company}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="New Leads" value={newCount} />
        <Metric label="In Call" value={inCall} />
        <Metric label="SQL" value={sql} />
      </div>
      <div className="rounded-xl border border-[var(--color-border)] bg-white">
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..." className="h-9 min-w-48 flex-1 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left">
                {['Contact', 'Company', 'Use Case', 'Status', ''].map((h) => <th key={h} className="px-5 py-3 text-sm font-medium text-[var(--color-muted)]">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} onClick={() => onNavigate('lead-detail', lead.id)} className="cursor-pointer border-b border-[var(--color-border)] last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-medium">{lead.contactName}</td>
                  <td className="px-5 py-4 text-sm">{lead.company || lead.companyUrl || '-'}</td>
                  <td className="max-w-[240px] truncate px-5 py-4 text-sm text-[var(--color-muted)]">{lead.initialUseCase || '-'}</td>
                  <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={(e) => { e.stopPropagation(); onStartCall(lead.id); }} className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-accent)] hover:bg-indigo-50">Call</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Lead Detail ─────────────────────────────────────────────────────────────

function LeadDetail({ lead, onBack, onStartCall }: { lead: Lead; onBack: () => void; onStartCall: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{lead.company || lead.companyUrl || 'New Lead'}</h2>
          <p className="text-sm text-[var(--color-muted)]">{lead.contactName} · {lead.industry || 'Unknown industry'}</p>
        </div>
        <button onClick={onBack} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">Back</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card title="Use Case">
            <p className="text-sm">{lead.initialUseCase || 'No use case provided.'}</p>
          </Card>
          {lead.companyUrl && (
            <Card title="Company URL">
              <a href={lead.companyUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-accent)] underline">{lead.companyUrl}</a>
              {lead.scrapedContext && <p className="mt-3 whitespace-pre-wrap text-xs text-[var(--color-muted)]">{lead.scrapedContext.slice(0, 500)}</p>}
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
            <h3 className="font-semibold">Start Call</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">AI will use scraped company data to personalize the conversation.</p>
            <button onClick={() => onStartCall(lead.id)} className="mt-4 w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white">Start Voice Sales Call</button>
          </div>
          <Card title="Status">
            <StatusBadge status={lead.status} />
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── New Lead Form ───────────────────────────────────────────────────────────

function NewLeadForm({ onCancel, onCreated, onError }: { onCancel: () => void; onCreated: (lead: Lead) => void; onError: (msg: string) => void }) {
  const [form, setForm] = useState({ contactName: '', companyUrl: '', industry: '', initialUseCase: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.contactName || !form.companyUrl) return;
    setSaving(true);
    try {
      const lead = await api.createLead({ ...form, company: form.companyUrl });
      onCreated(lead);
    } catch { onError('Could not create lead — API not reachable.'); }
    finally { setSaving(false); }
  };

  return (
    <Card title="Create New Lead">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Contact Name" value={form.contactName} onChange={(v) => setForm({ ...form, contactName: v })} required />
          <Field label="Company Website URL" value={form.companyUrl} onChange={(v) => setForm({ ...form, companyUrl: v })} required placeholder="https://example.com" />
          <Field label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
          <Field label="Initial Use Case" value={form.initialUseCase} onChange={(v) => setForm({ ...form, initialUseCase: v })} />
        </div>
        <p className="text-xs text-[var(--color-muted)]">DealPilot will scrape the website to personalize AI calls.</p>
        <div className="flex gap-3">
          <button disabled={saving} className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{saving ? 'Scraping & Creating...' : 'Create Lead'}</button>
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-[var(--color-muted)]">Cancel</button>
        </div>
      </form>
    </Card>
  );
}

// ─── Handoffs ────────────────────────────────────────────────────────────────

function HandoffsList({ leads, onNavigate }: { leads: Lead[]; onNavigate: (s: Screen, id?: string) => void }) {
  const completed = leads.filter((l) => l.status === 'sql' || l.status === 'disqualified');
  const list = completed.length ? completed : leads.slice(0, 3);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Handoffs</h2>
      <div className="grid gap-4">
        {list.map((lead) => (
          <div key={lead.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white p-5">
            <div>
              <h3 className="font-semibold">{lead.company || lead.companyUrl}</h3>
              <p className="text-sm text-[var(--color-muted)]">{lead.contactName}</p>
            </div>
            <button onClick={() => onNavigate('lead-detail', lead.id)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">View</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <h3 className="mt-1 text-2xl font-semibold">{value}</h3>
    </div>
  );
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-white">
      {title && <div className="border-b border-[var(--color-border)] px-5 py-4"><h3 className="font-semibold">{title}</h3></div>}
      <div className="p-5">{children}</div>
    </section>
  );
}

function StatusBadge({ status }: { status: Lead['status'] }) {
  const map = { new: ['New', 'bg-slate-100 text-slate-600'], in_call: ['In Call', 'bg-sky-100 text-sky-700'], sql: ['SQL', 'bg-emerald-100 text-emerald-700'], disqualified: ['Disqualified', 'bg-red-100 text-red-700'] } as const;
  const [label, cls] = map[status] ?? ['New', 'bg-slate-100 text-slate-600'];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function Field({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}{required && ' *'}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className="mt-1 h-10 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
    </label>
  );
}

function LoadingState() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
    </div>
  );
}
