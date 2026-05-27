import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lead } from '@dealpilot/shared';
import { api } from '../lib/api';
import LeadCard from '../components/LeadCard';

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const navigate = useNavigate();

  useEffect(() => { api.getLeads().then(setLeads); }, []);

  const startCall = async (leadId: string) => {
    const session = await api.startSession(leadId);
    navigate(`/call/${session.id}`);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">
      {/* Header */}
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

      {/* Content */}
      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold">Lead Pipeline</h2>
            <p className="text-[var(--color-muted)] mt-1">Select a lead to start an AI-assisted discovery call</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse-dot"></span>
            AI Agent Online
          </div>
        </div>

        <div className="grid gap-4">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onStartCall={startCall} />
          ))}
        </div>
      </main>
    </div>
  );
}
