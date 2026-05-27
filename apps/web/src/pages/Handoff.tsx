import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Handoff as HandoffType } from '@dealpilot/shared';
import { api } from '../lib/api';
import HandoffExport from '../components/HandoffExport';

export default function Handoff() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [handoff, setHandoff] = useState<HandoffType | null>(null);

  useEffect(() => {
    if (sessionId) api.getHandoff(sessionId).then(setHandoff).catch(() => {});
  }, [sessionId]);

  if (!handoff) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-alt)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-muted)]">Generating handoff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">
      <header className="bg-white border-b border-[var(--color-border)] px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <h1 className="text-xl font-semibold">Post-Call Handoff</h1>
          </div>
          <button onClick={() => navigate('/app')} className="text-sm text-[var(--color-accent)] hover:underline">
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">
        <HandoffExport handoff={handoff} />
      </main>
    </div>
  );
}
