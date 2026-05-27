import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { Handoff as HandoffType, CallSession, Lead } from '@dealpilot/shared';
import { api } from '../lib/api';
import HandoffExport from '../components/HandoffExport';

export default function Handoff() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [handoff, setHandoff] = useState<HandoffType | null>(null);
  const [session, setSession] = useState<CallSession | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'handoff' | 'transcript'>('handoff');

  useEffect(() => {
    if (!sessionId) return;
    api.getHandoff(sessionId).then(setHandoff).catch(() => setError('Handoff not ready yet. It may still be generating.'));
    api.getSession(sessionId).then((s) => {
      setSession(s);
      api.getLead(s.leadId).then(setLead);
    }).catch(() => {});
  }, [sessionId]);

  if (error && !handoff) {
    return (
      <div className="app-bg app-surface flex min-h-screen items-center justify-center p-4">
        <div className="app-card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          </div>
          <p className="text-[var(--color-muted)] mb-4">{error}</p>
          <button onClick={() => navigate('/app')} className="app-button-primary px-4 py-2 text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!handoff) {
    return (
      <div className="app-bg app-surface flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-primary)] font-medium">Generating handoff...</p>
          <p className="text-sm text-[var(--color-muted)] mt-1">Analyzing transcript and scoring lead</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg app-surface min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/72 px-4 py-5 backdrop-blur-xl sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" aria-label="Go to landing page" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200">
              <span className="text-white text-sm font-bold">D</span>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Post-Call Handoff</h1>
              {lead && <p className="text-xs text-[var(--color-muted)]">{lead.contactName} · {lead.company}</p>}
            </div>
          </div>
          <button onClick={() => navigate('/app')} className="app-button-secondary px-4 py-2 text-sm">
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/70 bg-white/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-8 flex gap-6">
          <button
            onClick={() => setTab('handoff')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'handoff' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-primary)]'}`}
          >
            Handoff Summary
          </button>
          <button
            onClick={() => setTab('transcript')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'transcript' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-primary)]'}`}
          >
            Full Transcript {session && `(${session.transcript.length})`}
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        {tab === 'handoff' && <HandoffExport handoff={handoff} lead={lead} />}
        {tab === 'transcript' && session && (
          <div className="app-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Call Transcript</h3>
              <span className="text-xs text-[var(--color-muted)]">{session.transcript.length} messages</span>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {session.transcript.map((line, i) => {
                const colors: Record<string, string> = { AI: 'text-[var(--color-accent)]', PROSPECT: 'text-emerald-600', REP: 'text-amber-600' };
                const labels: Record<string, string> = { AI: 'DealPilot AI', PROSPECT: 'Prospect', REP: 'Rep' };
                return (
                  <div key={i} className="py-2 border-b border-[var(--color-border)] last:border-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold ${colors[line.speaker] || ''}`}>{labels[line.speaker] || line.speaker}</span>
                      <span className="text-xs text-[var(--color-muted)]">{new Date(line.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{line.text}</p>
                  </div>
                );
              })}
              {session.transcript.length === 0 && (
                <p className="text-sm text-[var(--color-muted)] text-center py-8">No transcript recorded.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
