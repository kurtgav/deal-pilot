import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lead } from '@dealpilot/shared';
import { api } from '../lib/api';
import LeadCard from '../components/LeadCard';

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ contactName: '', company: '', industry: '', initialUseCase: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { api.getLeads().then(setLeads).finally(() => setLoading(false)); }, []);

  const startCall = async (leadId: string) => {
    const session = await api.startSession(leadId);
    navigate(`/call/${session.id}`);
  };

  const createLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactName || !form.company) return;
    const lead = await api.createLead(form);
    setLeads((prev) => [...prev, lead]);
    setForm({ contactName: '', company: '', industry: '', initialUseCase: '' });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">
      <header className="bg-white border-b border-[var(--color-border)] px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">DealPilot AI</h1>
          </div>
          <span className="text-sm text-[var(--color-muted)]">Sales Engineering Copilot</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold">Lead Pipeline</h2>
            <p className="text-[var(--color-muted)] mt-1">Select a lead to start an AI-assisted discovery call</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse-dot"></span>
              AI Agent Online
            </div>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-light)] transition-colors">
              + New Lead
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={createLead} className="bg-white rounded-xl border border-[var(--color-border)] p-6 mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-4">Create New Lead</h3>
            <div className="grid grid-cols-2 gap-4">
              <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Contact Name *" required className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-20" />
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company *" required className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-20" />
              <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Industry" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-20" />
              <input value={form.initialUseCase} onChange={(e) => setForm({ ...form, initialUseCase: e.target.value })} placeholder="Initial Use Case" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-20" />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-light)]">Create Lead</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)]">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--color-muted)]">Loading leads...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onStartCall={startCall} />
            ))}
            {leads.length === 0 && (
              <p className="text-center text-[var(--color-muted)] py-10">No leads yet. Create one to get started.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
