import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { Lead } from '@dealpilot/shared';
import { api } from '../../lib/api';
import { ArrowLeft, Phone, Sparkles } from 'lucide-react';

const fallbackLeads: Lead[] = [
  { id: 'demo-1', contactName: 'Maya Chen', company: 'NovaStack Labs', industry: 'Developer Tools', initialUseCase: 'API development platform', status: 'sql', createdAt: '2026-05-26T14:30:00Z' },
  { id: 'demo-2', contactName: 'Rafael Santos', company: 'CloudCart PH', industry: 'E-commerce SaaS', initialUseCase: 'Multi-vendor marketplace integrations', status: 'in_call', createdAt: '2026-05-26T14:15:00Z' },
  { id: 'demo-3', contactName: 'Anika Reyes', company: 'FinOpsly', industry: 'Fintech', initialUseCase: 'Cloud cost optimization', status: 'sql', createdAt: '2026-05-25T10:15:00Z' },
  { id: 'demo-4', contactName: 'James Liu', company: 'DataStream AI', industry: 'Data Analytics', initialUseCase: 'Real-time data pipelines', status: 'new', createdAt: '2026-05-24T09:00:00Z' },
  { id: 'demo-5', contactName: 'Sarah Johnson', company: 'HealthTrack Pro', industry: 'Healthcare SaaS', initialUseCase: 'Patient engagement workflow', status: 'new', createdAt: '2026-05-23T16:00:00Z' },
];

const leadMeta: Record<string, { title: string; email: string; phone: string; score: number; hypothesis: string; objective: string }> = {
  'demo-1': { title: 'VP of Engineering', email: 'maya.chen@novastack.io', phone: '+1 (555) 123-4567', score: 82, hypothesis: 'API-first startup with growing sales engineering load and a strong need for repeatable technical discovery.', objective: 'Qualify integration requirements, budget fit, and next technical validation step.' },
  'demo-2': { title: 'CTO', email: 'rafael@cloudcart.ph', phone: '+63 912 345 6789', score: 76, hypothesis: 'Marketplace team is scaling merchant onboarding and needs a more reliable integration motion.', objective: 'Understand API complexity, implementation timeline, and urgency.' },
  'demo-3': { title: 'Head of Product', email: 'anika@finopsly.com', phone: '+1 (555) 987-6543', score: 68, hypothesis: 'Mid-market fintech evaluating tooling with compliance and data-control concerns.', objective: 'Assess compliance fit, budget signal, and objections.' },
  'demo-4': { title: 'Director of Engineering', email: 'james@datastream.ai', phone: '+1 (555) 234-5678', score: 0, hypothesis: 'Engineering-led account with a technical buyer and likely platform reliability requirements.', objective: 'Run initial discovery and identify the buying committee.' },
  'demo-5': { title: 'CEO', email: 'sarah@healthtrack.pro', phone: '+1 (555) 345-6789', score: 45, hypothesis: 'Healthcare operator likely to focus on security, workflows, and timeline risk.', objective: 'Confirm use case, data requirements, and decision timeline.' },
};

export default function LeadDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<any | null>(null);

  useEffect(() => {
    api.getLead(leadId!).then(setLead).catch(() => {
      setLead(fallbackLeads.find(l => l.id === leadId) || null);
    });
  }, [leadId]);

  // Load the most recent handoff for this lead's last call session, if any.
  useEffect(() => {
    if (!lead?.lastCallSessionId) return;
    api.getHandoff(lead.lastCallSessionId).then(setHandoff).catch(() => setHandoff(null));
  }, [lead?.lastCallSessionId]);

  if (!lead) return <div className="text-[14px] text-slate-400">Lead not found.</div>;

  const meta = leadMeta[lead.id] || { title: 'Prospect', email: '', phone: '', score: 0, hypothesis: '', objective: '' };

  const handleStartCall = async () => {
    setError(null);
    setStarting(true);
    try {
      const session = await api.startSession(lead.id);
      navigate(`/call/${session.id}`);
    } catch (e: any) {
      setError(e.message || 'Failed to start call. Please try again.');
      setStarting(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <Link to="/app/leads" className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-700 mb-5 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-5">
          {/* Profile header */}
          <div className="dash-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-base font-semibold text-indigo-600">
                {lead.contactName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900 tracking-[-0.025em]">{lead.contactName}</h2>
                <p className="text-[14px] text-slate-400">{meta.title} · {lead.company}</p>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Email', value: meta.email },
              { label: 'Phone', value: meta.phone },
              { label: 'Industry', value: lead.industry },
              { label: 'Use Case', value: lead.initialUseCase },
            ].map(item => (
              <div key={item.label} className="dash-card p-5">
                <div className="text-[12px] text-slate-400 font-medium uppercase tracking-wider mb-1">{item.label}</div>
                <div className="text-[14px] text-slate-800">{item.value || '—'}</div>
              </div>
            ))}
          </div>

          {/* Hypothesis */}
          <div className="dash-card p-6">
            <h3 className="text-[13px] font-semibold text-slate-900 mb-2">Pre-Call Hypothesis</h3>
            <p className="text-[14px] text-slate-600 leading-relaxed">{meta.hypothesis || 'No hypothesis generated yet.'}</p>
          </div>

          {/* Objective */}
          <div className="dash-card p-6">
            <h3 className="text-[13px] font-semibold text-slate-900 mb-2">Call Objective</h3>
            <p className="text-[14px] text-slate-600 leading-relaxed">{meta.objective || 'No objective set.'}</p>
          </div>

          {/* Last handoff (after a completed call) */}
          {handoff && (
            <div className="dash-card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-slate-900">Last Call Handoff</h3>
                <Link to={`/handoff/${handoff.sessionId}`} className="text-[12px] text-indigo-600 font-medium hover:text-indigo-700">View full →</Link>
              </div>
              <p className="text-[14px] text-slate-600 leading-relaxed">{handoff.summary}</p>
              <div className="mt-3 flex gap-4 text-[13px]">
                <span><span className="text-slate-400">Score:</span> <span className="font-semibold text-slate-800">{handoff.qualification?.score}/100</span></span>
                <span><span className="text-slate-400">Stage:</span> <span className="text-slate-700">{handoff.qualification?.dealStage}</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="dash-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h3 className="text-[13px] font-semibold text-slate-900">AI Setup</h3>
            </div>
            <p className="text-[13px] text-slate-500 leading-relaxed">Voice agent will use lead context, hypothesis, and knowledge base for this call.</p>
            {meta.score > 0 && (
              <div className="mt-3 text-[13px]">
                <span className="text-slate-400">Score:</span>
                <span className="ml-2 font-semibold text-slate-800">{meta.score}/100</span>
              </div>
            )}
          </div>

          <button
            onClick={handleStartCall}
            disabled={starting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-[14px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Phone className="h-4 w-4" />
            {starting ? 'Starting…' : 'Start Call'}
          </button>
          {error && <p className="text-[12px] text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
