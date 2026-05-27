import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { CallSession, Lead } from '@dealpilot/shared';
import { api } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { useVoice } from '../hooks/useVoice';
import { useSessionStore } from '../store/sessionStore';
import Transcript from '../components/Transcript';
import CopilotPanel from '../components/CopilotPanel';
import VoiceControls from '../components/VoiceControls';
import LeadScoreGauge from '../components/LeadScoreGauge';

export default function CallRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const { transcript, fields, score, muted } = useSessionStore();
  const { sendTranscript, muteAgent, unmuteAgent } = useSocket(sessionId!);

  // Agora voice - channel name is the sessionId
  const { join, leave, joined, micMuted, toggleMic } = useVoice({
    channel: sessionId!,
    uid: 0,
    onRemoteUserJoined: (uid) => console.log('[Agora] Remote user joined:', uid),
    onRemoteUserLeft: (uid) => console.log('[Agora] Remote user left:', uid),
  });

  useEffect(() => {
    if (!sessionId) return;
    api.getSession(sessionId).then((s: CallSession) => {
      api.getLead(s.leadId).then(setLead);
    });
    // Auto-join Agora voice channel
    join().catch((err) => console.warn('[Agora] Join failed (demo mode):', err.message));
    return () => { leave(); };
  }, [sessionId]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const endCall = async () => {
    await leave();
    await api.endSession(sessionId!);
    await api.generateHandoff(sessionId!);
    navigate(`/handoff/${sessionId}`);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[var(--color-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <div>
              <h1 className="text-base font-semibold">{lead?.contactName || 'Loading...'}</h1>
              <p className="text-xs text-[var(--color-muted)]">{lead?.company} · {lead?.industry}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot"></span>
              <span className="text-sm font-medium text-red-600">LIVE</span>
              <span className="text-sm text-[var(--color-muted)] ml-2 font-mono">{formatTime(elapsed)}</span>
            </div>
            <button onClick={endCall} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors">
              End Call
            </button>
          </div>
        </div>
      </header>

      {/* Main content - 3 column layout */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>
        {/* Transcript */}
        <div className="col-span-5 border-r border-[var(--color-border)] flex flex-col bg-white">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Live Transcript</h2>
          </div>
          <Transcript lines={transcript} />
          <VoiceControls
            muted={muted}
            micMuted={micMuted}
            joined={joined}
            onMute={() => muteAgent(sessionId!)}
            onUnmute={() => unmuteAgent(sessionId!)}
            onToggleMic={toggleMic}
            onSend={sendTranscript}
          />
        </div>

        {/* Copilot Panel */}
        <div className="col-span-4 border-r border-[var(--color-border)] flex flex-col bg-white">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Sales Copilot</h2>
          </div>
          <CopilotPanel fields={fields} />
        </div>

        {/* Score + Info */}
        <div className="col-span-3 flex flex-col bg-white">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Lead Score</h2>
          </div>
          <div className="flex-1 p-5 flex flex-col items-center justify-start gap-6 pt-10">
            <LeadScoreGauge score={score} />
            {lead && (
              <div className="w-full space-y-3 mt-4">
                <div className="p-3 rounded-lg bg-[var(--color-surface-alt)]">
                  <p className="text-xs text-[var(--color-muted)] mb-1">Initial Hypothesis</p>
                  <p className="text-sm">{lead.initialUseCase}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
