import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Lead } from '@dealpilot/shared';
import { api } from '../lib/api';

type Screen = 'dashboard' | 'lead-detail' | 'active-call' | 'leads' | 'handoffs' | 'knowledge-base' | 'settings' | 'new-lead';
type IconName = 'dashboard' | 'users' | 'handoff' | 'database' | 'settings' | 'plus' | 'check' | 'phone' | 'spark' | 'shield' | 'alert' | 'arrowLeft';

const fallbackLeads: Lead[] = [
  {
    id: 'demo-1',
    contactName: 'Maya Chen',
    company: 'NovaStack Labs',
    industry: 'Developer Tools',
    initialUseCase: 'API development platform',
    status: 'sql',
    createdAt: '2026-05-26T14:30:00Z',
  },
  {
    id: 'demo-2',
    contactName: 'Rafael Santos',
    company: 'CloudCart PH',
    industry: 'E-commerce SaaS',
    initialUseCase: 'Multi-vendor marketplace integrations',
    status: 'in_call',
    createdAt: '2026-05-26T14:15:00Z',
  },
  {
    id: 'demo-3',
    contactName: 'Anika Reyes',
    company: 'FinOpsly',
    industry: 'Fintech',
    initialUseCase: 'Cloud cost optimization',
    status: 'sql',
    createdAt: '2026-05-25T10:15:00Z',
  },
  {
    id: 'demo-4',
    contactName: 'James Liu',
    company: 'DataStream AI',
    industry: 'Data Analytics',
    initialUseCase: 'Real-time data pipelines',
    status: 'new',
    createdAt: '2026-05-24T09:00:00Z',
  },
  {
    id: 'demo-5',
    contactName: 'Sarah Johnson',
    company: 'HealthTrack Pro',
    industry: 'Healthcare SaaS',
    initialUseCase: 'Patient engagement workflow',
    status: 'new',
    createdAt: '2026-05-23T16:00:00Z',
  },
];

const leadMeta: Record<string, { title: string; email: string; phone: string; score: number; lastCall: string; hypothesis: string; objective: string }> = {
  'demo-1': {
    title: 'VP of Engineering',
    email: 'maya.chen@novastack.io',
    phone: '+1 (555) 123-4567',
    score: 82,
    lastCall: 'Yesterday',
    hypothesis: 'API-first startup with growing sales engineering load and a strong need for repeatable technical discovery.',
    objective: 'Qualify integration requirements, budget fit, and next technical validation step.',
  },
  'demo-2': {
    title: 'CTO',
    email: 'rafael@cloudcart.ph',
    phone: '+63 912 345 6789',
    score: 76,
    lastCall: 'Live now',
    hypothesis: 'Marketplace team is scaling merchant onboarding and needs a more reliable integration motion.',
    objective: 'Understand API complexity, implementation timeline, and urgency.',
  },
  'demo-3': {
    title: 'Head of Product',
    email: 'anika@finopsly.com',
    phone: '+1 (555) 987-6543',
    score: 68,
    lastCall: '2 days ago',
    hypothesis: 'Mid-market fintech evaluating tooling with compliance and data-control concerns.',
    objective: 'Assess compliance fit, budget signal, and objections.',
  },
  'demo-4': {
    title: 'Director of Engineering',
    email: 'james@datastream.ai',
    phone: '+1 (555) 234-5678',
    score: 0,
    lastCall: 'None',
    hypothesis: 'Engineering-led account with a technical buyer and likely platform reliability requirements.',
    objective: 'Run initial discovery and identify the buying committee.',
  },
  'demo-5': {
    title: 'CEO',
    email: 'sarah@healthtrack.pro',
    phone: '+1 (555) 345-6789',
    score: 45,
    lastCall: '3 days ago',
    hypothesis: 'Healthcare operator likely to focus on security, workflows, and timeline risk.',
    objective: 'Confirm use case, data requirements, and decision timeline.',
  },
};

function metaFor(lead: Lead) {
  return leadMeta[lead.id] ?? {
    title: 'Prospect',
    email: `${lead.contactName.toLowerCase().replace(/\s+/g, '.')}@${lead.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    phone: '+1 (555) 010-2026',
    score: lead.status === 'sql' ? 82 : lead.status === 'in_call' ? 76 : lead.status === 'disqualified' ? 22 : 0,
    lastCall: lead.lastCallSessionId ? 'Recent call' : 'None',
    hypothesis: `${lead.company} may need technical qualification around ${lead.initialUseCase || 'their current growth project'}.`,
    objective: 'Qualify pain, urgency, technical fit, and recommended next step.',
  };
}

function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    handoff: <><path d="M7 11l5-5 5 5" /><path d="M12 6v12" /><path d="M19 15l-7 7-7-7" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" /><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></>,
    settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.52a2 2 0 0 1-1 1.72l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.52a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" /><circle cx="12" cy="12" r="3" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    check: <path d="M20 6 9 17l-5-5" />,
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.78.6 2.63a2 2 0 0 1-.45 2.11L8 9.72a16 16 0 0 0 6.28 6.28l1.26-1.26a2 2 0 0 1 2.11-.45c.85.28 1.73.48 2.63.6A2 2 0 0 1 22 16.92Z" />,
    spark: <><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" /></>,
    shield: <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z" />,
    alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    arrowLeft: <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>,
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .getLeads()
      .then((data) => setLeads(data.length ? data : fallbackLeads))
      .catch(() => {
        setLeads(fallbackLeads);
        setError('Using demo data because the API is not reachable.');
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? leads[0],
    [leads, selectedLeadId],
  );

  const navigateScreen = (next: Screen, leadId?: string) => {
    if (leadId) setSelectedLeadId(leadId);
    setScreen(next);
  };

  const startCall = async (leadId: string) => {
    if (leadId.startsWith('demo-')) {
      navigateScreen('active-call', leadId);
      return;
    }
    const session = await api.startSession(leadId);
    navigate(`/call/${session.id}`);
  };

  const title = {
    dashboard: 'Dashboard',
    'lead-detail': 'Lead Detail',
    'active-call': 'Active Voice Sales Call',
    leads: 'Leads',
    handoffs: 'Handoffs',
    'knowledge-base': 'Knowledge Base',
    settings: 'Settings',
    'new-lead': 'Create New Lead',
  }[screen];

  return (
    <div className="app-bg app-surface min-h-screen text-[var(--color-primary)]">
      <div className="flex min-h-screen">
        <Sidebar active={screen} onNavigate={(next) => navigateScreen(next)} />
        <div className="min-w-0 flex-1">
          <Topbar title={title} onNewLead={() => navigateScreen('new-lead')} />
          <MobileNav active={screen} onNavigate={navigateScreen} />
          {error && (
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-800">
              {error}
              <button className="ml-3 font-medium underline" onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}
          <main className="px-4 py-5 sm:px-6 lg:px-8">
            {loading ? (
              <LoadingState />
            ) : (
              <>
                {screen === 'dashboard' && <DashboardScreen leads={leads} onNavigate={navigateScreen} />}
                {screen === 'leads' && (
                  <LeadsScreen
                    leads={leads}
                    search={search}
                    setSearch={setSearch}
                    onNavigate={navigateScreen}
                    onStartCall={startCall}
                  />
                )}
                {screen === 'lead-detail' && selectedLead && (
                  <LeadDetailScreen lead={selectedLead} onBack={() => navigateScreen('dashboard')} onStartCall={startCall} />
                )}
                {screen === 'active-call' && selectedLead && (
                  <ActiveCallScreen lead={selectedLead} onEnd={() => navigateScreen('handoffs', selectedLead.id)} />
                )}
                {screen === 'new-lead' && (
                  <NewLeadScreen
                    onCancel={() => navigateScreen('leads')}
                    onCreated={(lead) => {
                      setLeads((current) => [lead, ...current]);
                      navigateScreen('lead-detail', lead.id);
                    }}
                    onError={setError}
                  />
                )}
                {screen === 'handoffs' && <HandoffsScreen leads={leads} onNavigate={navigateScreen} />}
                {screen === 'knowledge-base' && <KnowledgeBaseScreen />}
                {screen === 'settings' && <SettingsScreen />}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  const items: Array<{ id: Screen; label: string; icon: IconName }> = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'leads', label: 'Leads', icon: 'users' },
    { id: 'handoffs', label: 'Handoffs', icon: 'handoff' },
    { id: 'knowledge-base', label: 'Knowledge Base', icon: 'database' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside className="app-glass sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-y-0 border-l-0 lg:flex">
      <div className="border-b border-white/70 p-6">
        <Link to="/" aria-label="Go to landing page" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-200">DP</div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">DealPilot AI</h1>
            <p className="text-xs text-[var(--color-muted)]">Voice Sales Engineer</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1.5 p-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
              active === item.id ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200' : 'text-[var(--color-muted)] hover:bg-white/80 hover:text-[var(--color-primary)]'
            }`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${active === item.id ? 'bg-white/15' : 'app-icon-box'}`}>
              <Icon name={item.icon} className="h-4 w-4" />
            </span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-white/70 p-4">
        <div className="app-card flex items-center gap-3 rounded-2xl p-3 shadow-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-semibold text-white">JD</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">John Doe</p>
            <p className="truncate text-xs text-[var(--color-muted)]">Sales Rep</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, onNewLead }: { title: string; onNewLead: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-white/70 bg-white/72 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <h2 className="truncate text-xl font-semibold tracking-tight">{title}</h2>
        <Badge tone="neutral">DEMO MODE</Badge>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Voice engine ready
        </div>
        <button onClick={onNewLead} className="app-button-primary px-3.5 py-2 text-sm">
          <Icon name="plus" className="h-4 w-4" />
          New Lead
        </button>
      </div>
    </header>
  );
}

function MobileNav({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  const items: Array<{ id: Screen; label: string; icon: IconName }> = [
    { id: 'dashboard', label: 'Home', icon: 'dashboard' },
    { id: 'leads', label: 'Leads', icon: 'users' },
    { id: 'handoffs', label: 'Handoffs', icon: 'handoff' },
    { id: 'knowledge-base', label: 'Knowledge', icon: 'database' },
  ];

  return (
    <nav className="sticky top-16 z-10 flex gap-2 overflow-x-auto border-b border-white/70 bg-white/70 px-4 py-2 backdrop-blur-xl lg:hidden">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(item.id)}
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-all ${
            active === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'border border-slate-200 bg-white/80 text-slate-600'
          }`}
        >
          <Icon name={item.icon} className="h-3.5 w-3.5" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function DashboardScreen({ leads, onNavigate }: { leads: Lead[]; onNavigate: (screen: Screen, leadId?: string) => void }) {
  const sql = leads.filter((lead) => lead.status === 'sql').length;
  const inCall = leads.filter((lead) => lead.status === 'in_call').length;
  const newLeads = leads.filter((lead) => lead.status === 'new').length;
  const review = Math.max(1, leads.filter((lead) => lead.status === 'disqualified').length);

  return (
    <div className="space-y-6">
      <section className="app-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              AI sales engineering workspace
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Prioritize technical buyers and move clean handoffs faster.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)] sm:text-base">
              DealPilot keeps every discovery call grounded in approved knowledge, qualification signals, and next-step handoff context.
            </p>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-3">
            <MiniStat label="Grounded answers" value="100%" />
            <MiniStat label="Human follow-up" value="Flagged" />
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="New Leads" value={newLeads} detail="+3 today" accent="indigo" />
        <Metric label="In Call" value={inCall} detail={inCall ? 'Live now' : 'No active calls'} accent="sky" />
        <Metric label="SQL Candidates" value={sql} detail="This week" accent="emerald" />
        <Metric label="Needs Review" value={review} detail="Pending" accent="amber" />
      </div>
      <Card title="Recent Leads">
        <LeadTable leads={leads} onNavigate={onNavigate} />
      </Card>
    </div>
  );
}

function LeadsScreen({
  leads,
  search,
  setSearch,
  onNavigate,
  onStartCall,
}: {
  leads: Lead[];
  search: string;
  setSearch: (value: string) => void;
  onNavigate: (screen: Screen, leadId?: string) => void;
  onStartCall: (leadId: string) => void;
}) {
  const [previewId, setPreviewId] = useState(leads[0]?.id ?? '');
  const filtered = leads.filter((lead) => `${lead.contactName} ${lead.company}`.toLowerCase().includes(search.toLowerCase()));
  const preview = leads.find((lead) => lead.id === previewId) ?? filtered[0];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Leads</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Manage prospects before and after AI-assisted discovery calls.</p>
        </div>
        <button onClick={() => onNavigate('new-lead')} className="app-button-primary px-4 py-2 text-sm">
          <Icon name="plus" className="h-4 w-4" />
          New Lead
        </button>
      </div>
      <div className="app-card p-4">
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search leads..." className="app-input h-10 min-w-64 flex-1 px-3 text-sm" />
          {['All Statuses', 'All Industries', 'Any score', 'Last call'].map((label) => (
            <select key={label} className="app-input h-10 px-3 text-sm text-[var(--color-muted)]">
              <option>{label}</option>
            </select>
          ))}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <LeadTable leads={filtered} onNavigate={onNavigate} onPreview={setPreviewId} onStartCall={onStartCall} />
        </Card>
        {preview && <LeadPreview lead={preview} onNavigate={onNavigate} />}
      </div>
    </div>
  );
}

function LeadDetailScreen({ lead, onBack, onStartCall }: { lead: Lead; onBack: () => void; onStartCall: (leadId: string) => void }) {
  const meta = metaFor(lead);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{lead.company}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Pre-Call Setup</p>
        </div>
        <button onClick={onBack} className="app-button-secondary px-3 py-2 text-sm">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card title="Lead Profile">
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileItem label={lead.contactName} value={meta.title} initials={lead.contactName.charAt(0)} />
              <ProfileItem label={lead.company} value={lead.industry || 'Industry unknown'} />
              <ProfileItem label="Email" value={meta.email} />
              <ProfileItem label="Phone" value={meta.phone} />
            </div>
            <div className="mt-4 border-t border-[var(--color-border)] pt-4">
              <p className="text-sm font-medium">Use Case</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{lead.initialUseCase || 'No use case provided yet.'}</p>
            </div>
          </Card>
          <Card title="Pre-Call Hypothesis">
            <p className="text-sm leading-relaxed">{meta.hypothesis}</p>
          </Card>
          <Card title="Call Objective">
            <p className="text-sm leading-relaxed">{meta.objective}</p>
          </Card>
          <Card title="Readiness Checklist">
            <div className="grid gap-3 sm:grid-cols-2">
              {['Lead profile complete', 'Pre-call hypothesis documented', 'Knowledge base synced', 'Voice engine ready'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="check" className="h-3.5 w-3.5" /></span>
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <div className="app-card p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold"><span className="app-icon-box h-9 w-9 rounded-xl"><Icon name="spark" /></span> AI Setup</h3>
            <div className="mt-4 space-y-4 text-sm">
              <SetupRow label="AI Persona" value="DealPilot AI" />
              <SetupRow label="Voice Status" value="Ready" tone="success" />
              <SetupRow label="Knowledge Base" value="Grounded knowledge base loaded" tone="success" />
              <div className="border-t border-indigo-200 pt-4 text-xs text-[var(--color-muted)]">
                AI will only answer from curated knowledge base content.
              </div>
              <button onClick={() => onStartCall(lead.id)} className="app-button-primary w-full px-4 py-2.5 text-sm"><Icon name="phone" className="h-4 w-4" />Start Voice Sales Call</button>
              <button className="app-button-secondary w-full px-4 py-2.5 text-sm">Test AI Voice</button>
              <button className="app-button-ghost w-full px-4 py-2.5 text-sm">View Demo Scenario</button>
            </div>
          </div>
          <Card title="AI Guardrails">
            <div className="space-y-3 text-xs text-[var(--color-muted)]">
              {['No fabrication: only knowledge base answers', 'Escalates unknown questions to human', 'No pricing or SLA commitments', 'Rep can mute, pause, or end anytime'].map((item) => (
                <div key={item} className="flex gap-2"><Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{item}</div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActiveCallScreen({ lead, onEnd }: { lead: Lead; onEnd: () => void }) {
  const meta = metaFor(lead);
  const transcript = [
    ['AI', "Hi, I'm DealPilot AI. I'll help with technical discovery and flag anything that needs a human sales engineer."],
    ['Prospect', `We're evaluating this for ${lead.initialUseCase || 'a new technical workflow'}, and we need to understand implementation risk.`],
    ['AI', 'That makes sense. What is driving the urgency, and what systems would this need to connect with?'],
    ['Prospect', 'Timeline is next quarter. Budget is available if the integration path is clear.'],
    ['AI', 'I can confirm the relevant product fit and will flag implementation timing for follow-up.'],
  ];

  return (
    <div className="space-y-4">
      <div className="app-card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse-dot" />
            <span className="text-sm font-semibold text-red-600">LIVE</span>
            <span className="font-mono text-sm text-[var(--color-muted)]">14:36</span>
          </div>
          <h2 className="mt-1 text-lg font-semibold">{lead.contactName} · {lead.company}</h2>
          <p className="text-sm text-[var(--color-muted)]">{lead.industry || 'Industry unknown'} · {meta.title}</p>
        </div>
        <button onClick={onEnd} className="app-button-danger px-4 py-2 text-sm">End Call</button>
      </div>

      <div className="grid min-h-[calc(100vh-190px)] gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)_320px]">
        <section className="app-card flex min-h-[560px] flex-col overflow-hidden">
          <div className="app-panel-header px-5 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">Live Transcript</h3>
          </div>
          <div className="flex-1 space-y-4 overflow-auto p-5">
            {transcript.map(([speaker, message], index) => (
              <div key={`${speaker}-${index}`} className="flex gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${speaker === 'AI' ? 'bg-indigo-50 text-[var(--color-accent)]' : 'bg-emerald-50 text-emerald-700'}`}>
                  {speaker === 'AI' ? 'AI' : 'P'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{speaker}</span>
                    <span className="text-xs text-[var(--color-muted)]">14:{32 + index}:0{index}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{message}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--color-border)] bg-white/70 p-4">
            <div className="flex gap-2">
              <button className="app-button-primary px-4 py-2 text-sm">AI Active</button>
              <button className="app-button-secondary px-4 py-2 text-sm">Mute Agent</button>
              <input placeholder="Type a message or note..." className="app-input min-w-0 flex-1 px-3 text-sm" />
            </div>
          </div>
        </section>

        <section className="app-card overflow-hidden">
          <div className="app-panel-header px-5 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">Sales Copilot</h3>
          </div>
          <div className="space-y-5 p-5">
            <Signal label="Industry" value={lead.industry || 'Unknown'} />
            <Signal label="Use Case" value={lead.initialUseCase || 'Discovery pending'} />
            <Signal label="Budget Signal" value="Medium" tone="warning" />
            <Signal label="Urgency" value="High: next quarter" tone="success" />
            <Signal label="Technical Fit" value="Strong" tone="success" />
            <div>
              <p className="mb-2 text-sm font-medium">Pain Points</p>
              <div className="space-y-2">
                {['Manual qualification workload', 'Implementation timeline uncertainty', 'Need for grounded product answers'].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 text-sm shadow-sm">{item}</div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3">
              <p className="text-xs font-medium text-amber-700">Flagged question</p>
              <p className="mt-1 text-sm">Implementation timeline needs a human sales engineer follow-up.</p>
            </div>
          </div>
        </section>

        <section className="app-card overflow-hidden">
          <div className="app-panel-header px-5 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">Lead Score</h3>
          </div>
          <div className="flex flex-col items-center gap-6 p-6">
            <ScoreGauge score={meta.score || 76} />
            <div className="w-full space-y-3">
              <MiniStat label="Recommended Package" value="Growth API Package" />
              <MiniStat label="Next Step" value="Technical validation call" />
              <MiniStat label="Owner" value="Human Sales Engineer" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function NewLeadScreen({ onCancel, onCreated, onError }: { onCancel: () => void; onCreated: (lead: Lead) => void; onError: (message: string) => void }) {
  const [form, setForm] = useState({ contactName: '', company: '', industry: '', initialUseCase: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.contactName || !form.company) return;
    setSaving(true);
    try {
      const lead = await api.createLead(form);
      onCreated(lead);
    } catch {
      onError('Could not create the lead because the API is not reachable.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Create New Lead">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Contact Name" value={form.contactName} onChange={(value) => setForm({ ...form, contactName: value })} required />
          <Field label="Company" value={form.company} onChange={(value) => setForm({ ...form, company: value })} required />
          <Field label="Industry" value={form.industry} onChange={(value) => setForm({ ...form, industry: value })} />
          <Field label="Initial Use Case" value={form.initialUseCase} onChange={(value) => setForm({ ...form, initialUseCase: value })} />
        </div>
        <div className="flex gap-3">
          <button disabled={saving} className="app-button-primary px-4 py-2 text-sm disabled:opacity-60">{saving ? 'Creating...' : 'Create Lead'}</button>
          <button type="button" onClick={onCancel} className="app-button-ghost px-4 py-2 text-sm">Cancel</button>
        </div>
      </form>
    </Card>
  );
}

function HandoffsScreen({ leads, onNavigate }: { leads: Lead[]; onNavigate: (screen: Screen, leadId?: string) => void }) {
  const completed = leads.filter((lead) => lead.status === 'sql' || lead.status === 'disqualified');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Handoffs</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Review generated summaries, CRM payloads, follow-up emails, and flagged questions.</p>
      </div>
      <div className="grid gap-4">
        {(completed.length ? completed : leads.slice(0, 3)).map((lead) => {
          const meta = metaFor(lead);
          return (
            <div key={lead.id} className="app-card app-card-hover p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{lead.company}</h3>
                    <Badge tone={meta.score >= 80 ? 'success' : 'warning'}>{meta.score >= 80 ? 'SQL' : 'Needs Review'}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{lead.contactName} · {lead.initialUseCase}</p>
                </div>
                <button onClick={() => onNavigate('lead-detail', lead.id)} className="app-button-secondary px-3 py-2 text-sm">Open Lead</button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <MiniStat label="Score" value={`${meta.score}/100`} />
                <MiniStat label="Stage" value={meta.score >= 80 ? 'Sales Qualified Lead' : 'Needs Review'} />
                <MiniStat label="Product Fit" value={meta.score >= 70 ? 'Strong' : 'Moderate'} />
                <MiniStat label="Next Step" value="Technical validation call" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KnowledgeBaseScreen() {
  const sources = [
    ['Product Catalog', '42 grounded answer cards', 'Synced'],
    ['Objection Handling', '18 response patterns', 'Synced'],
    ['Discovery Playbooks', '24 qualification prompts', 'Synced'],
    ['Security & Compliance', '12 approved claims', 'Review due'],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Knowledge Base</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Control the approved source material used by the AI sales engineer.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {sources.map(([name, detail, status]) => (
          <div key={name} className="app-card app-card-hover p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{name}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{detail}</p>
              </div>
              <Badge tone={status === 'Synced' ? 'success' : 'warning'}>{status}</Badge>
            </div>
            <div className="mt-5 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-500" style={{ width: status === 'Synced' ? '92%' : '64%' }} />
            </div>
          </div>
        ))}
      </div>
      <Card title="Grounding Rules">
        <div className="grid gap-3 md:grid-cols-3">
          {['Answer only from approved content', 'Flag unknowns for human follow-up', 'Avoid binding pricing, SLA, or legal commitments'].map((rule) => (
            <div key={rule} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-sm shadow-sm">{rule}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SettingsScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Configure the voice sales workflow and handoff defaults.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Voice Agent">
          <div className="space-y-4">
            <SetupRow label="Persona" value="DealPilot AI" />
            <SetupRow label="Default language" value="English" />
            <SetupRow label="Auto-mute on human takeover" value="Enabled" tone="success" />
          </div>
        </Card>
        <Card title="Handoff Defaults">
          <div className="space-y-4">
            <SetupRow label="CRM payload" value="JSON export" />
            <SetupRow label="Follow-up email" value="Draft after every completed call" />
            <SetupRow label="Flagged questions owner" value="Human Sales Engineer" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function LeadTable({
  leads,
  onNavigate,
  onPreview,
  onStartCall,
}: {
  leads: Lead[];
  onNavigate: (screen: Screen, leadId?: string) => void;
  onPreview?: (id: string) => void;
  onStartCall?: (leadId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px]">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left">
            {['Contact', 'Company', 'Industry', 'Use Case', 'Status', 'Score', 'Last Call', ''].map((head) => (
              <th key={head} className="pb-3 text-sm font-medium text-[var(--color-muted)]">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const meta = metaFor(lead);
            return (
              <tr key={lead.id} onClick={() => (onPreview ? onPreview(lead.id) : onNavigate('lead-detail', lead.id))} className="app-table-row cursor-pointer border-b border-[var(--color-border)] last:border-0">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-[var(--color-accent)]">{lead.contactName.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium">{lead.contactName}</p>
                      <p className="text-xs text-[var(--color-muted)]">{meta.title}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-sm">{lead.company}</td>
                <td className="py-4 text-sm text-[var(--color-muted)]">{lead.industry || 'Unknown'}</td>
                <td className="max-w-[220px] truncate py-4 text-sm text-[var(--color-muted)]">{lead.initialUseCase || 'Discovery pending'}</td>
                <td className="py-4"><StatusBadge status={lead.status} /></td>
                <td className="py-4 text-sm font-semibold"><span className={meta.score >= 80 ? 'text-emerald-600' : meta.score >= 60 ? 'text-amber-600' : 'text-[var(--color-muted)]'}>{meta.score || '-'}</span></td>
                <td className="py-4 text-sm text-[var(--color-muted)]">{meta.lastCall}</td>
                <td className="py-4 text-right">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onStartCall ? onStartCall(lead.id) : onNavigate('lead-detail', lead.id);
                    }}
                    className="app-button-ghost px-3 py-1.5 text-sm"
                  >
                    {onStartCall ? 'Start' : 'Open'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LeadPreview({ lead, onNavigate }: { lead: Lead; onNavigate: (screen: Screen, leadId?: string) => void }) {
  const meta = metaFor(lead);
  return (
    <Card title="Lead Preview">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 font-semibold text-[var(--color-accent)]">{lead.contactName.charAt(0)}</div>
          <div>
            <p className="text-sm font-semibold">{lead.contactName}</p>
            <p className="text-xs text-[var(--color-muted)]">{meta.title} · {lead.company}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-y border-[var(--color-border)] py-3">
          <MiniStat label="Industry" value={lead.industry || 'Unknown'} />
          <MiniStat label="Score" value={meta.score ? String(meta.score) : '-'} />
        </div>
        <div>
          <p className="text-xs font-medium text-[var(--color-accent)]">AI Pre-call Hypothesis</p>
          <p className="mt-1 text-sm">{meta.hypothesis}</p>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-3">
          <p className="text-xs font-medium text-[var(--color-accent)]">Recommended next action</p>
          <p className="mt-1 text-sm">{lead.status === 'sql' ? 'Review post-call handoff' : 'Start AI-assisted discovery call'}</p>
        </div>
        <button onClick={() => onNavigate('lead-detail', lead.id)} className="app-button-primary w-full px-4 py-2 text-sm">View Details</button>
      </div>
    </Card>
  );
}

function Metric({ label, value, detail, accent }: { label: string; value: number; detail: string; accent: 'indigo' | 'sky' | 'emerald' | 'amber' }) {
  const color = {
    indigo: 'bg-indigo-50 text-indigo-600',
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }[accent];

  return (
    <div className="app-card app-card-hover p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--color-muted)]">{label}</p>
          <h3 className="mt-2 text-3xl font-semibold">{value}</h3>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{detail}</p>
        </div>
        <div className={`app-icon-box h-10 w-10 rounded-2xl ${color}`} />
      </div>
    </div>
  );
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="app-card overflow-hidden">
      {title && <div className="app-panel-header px-6 py-4"><h3 className="font-semibold tracking-tight">{title}</h3></div>}
      <div className="p-6">{children}</div>
    </section>
  );
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'live' }) {
  const cls = {
    neutral: 'border-slate-200 bg-slate-50 text-slate-600',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-red-200 bg-red-50 text-red-700',
    live: 'border-red-200 bg-red-50 text-red-700',
  }[tone];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm ${cls}`}>{children}</span>;
}

function StatusBadge({ status }: { status: Lead['status'] }) {
  const map = {
    new: ['New Lead', 'neutral'],
    in_call: ['In Call', 'live'],
    sql: ['SQL', 'success'],
    disqualified: ['Disqualified', 'danger'],
  } as const;
  const [label, tone] = map[status] ?? ['New Lead', 'neutral'];
  return <Badge tone={tone}>{status === 'in_call' && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />}{label}</Badge>;
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}{required && ' *'}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} required={required} className="app-input mt-1 h-10 w-full px-3 text-sm" />
    </label>
  );
}

function ProfileItem({ label, value, initials }: { label: string; value: string; initials?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="app-icon-box flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">{initials ?? label.charAt(0)}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-[var(--color-muted)]">{value}</p>
      </div>
    </div>
  );
}

function SetupRow({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className={`mt-1 text-xs ${tone === 'success' ? 'text-emerald-700' : 'text-[var(--color-muted)]'}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 shadow-sm">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function Signal({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'warning' }) {
  const color = tone === 'success' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : tone === 'warning' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-slate-700 bg-slate-50 border-slate-200';
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[var(--color-muted)]">{label}</span>
      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${color}`}>{value}</span>
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#64748b';

  return (
    <div className="relative h-40 w-40">
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="9" />
        <circle cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold">{score}</span>
        <span className="text-xs text-[var(--color-muted)]">{score >= 80 ? 'SQL' : score >= 60 ? 'MQL' : 'Review'}</span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-96 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        <p className="text-sm text-[var(--color-muted)]">Loading workspace...</p>
      </div>
    </div>
  );
}
