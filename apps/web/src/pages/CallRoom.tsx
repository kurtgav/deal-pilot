import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { CallSession, Lead } from '@dealpilot/shared';
import { api } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { useSpeech } from '../hooks/useSpeech';
import { useSessionStore } from '../store/sessionStore';
import Transcript from '../components/Transcript';
import CopilotPanel from '../components/CopilotPanel';
import LeadScoreGauge from '../components/LeadScoreGauge';

export default function CallRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { transcript, fields, score, muted, reset } = useSessionStore();

  // Reset store when entering a new session
  useEffect(() => { reset(); }, [sessionId]);

  // TTS: speak AI responses aloud
  // Use 'fil-PH' to support Filipino speech recognition (also recognizes English/Taglish)
  const { listening, speaking, interim, startListening, stopListening, speak, stopSpeaking } = useSpeech({
    onTranscript: (text) => sendTranscript(text),
    lang: 'fil-PH',
  });

  // Socket: wire agent:response → speak
  const { sendTranscript, muteAgent, unmuteAgent } = useSocket(sessionId!, (aiText) => {
    speak(aiText);
  });

  useEffect(() => {
    if (!sessionId) return;
    api.getSession(sessionId).then((s: CallSession) => {
      api.getLead(s.leadId).then(setLead);
    });
  }, [sessionId]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const endCall = async () => {
    stopListening();
    stopSpeaking();
    try {
      await api.endSession(sessionId!);
      await api.generateHandoff(sessionId!);
      navigate(`/handoff/${sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to end call');
    }
  };

  const handleTextSend = () => {
    if (!input.trim()) return;
    sendTranscript(input.trim());
    setInput('');
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

      {/* Main content */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-sm text-red-700">
          ⚠ {error} <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>
        {/* Transcript + Voice */}
        <div className="col-span-5 border-r border-[var(--color-border)] flex flex-col bg-white">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Live Transcript</h2>
            {speaking && (
              <span className="text-xs text-[var(--color-accent)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse-dot"></span>
                AI Speaking...
              </span>
            )}
          </div>
          <Transcript lines={transcript} />

          {/* Controls */}
          <div className="border-t border-[var(--color-border)] p-4 space-y-3">
            {interim && (
              <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 italic">
                🎤 {interim}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={listening ? stopListening : startListening}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  listening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                    : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
                }`}
              >
                {listening ? '⏹ Stop Mic' : '🎙️ Start Talking'}
              </button>
              <button
                onClick={muted ? () => unmuteAgent(sessionId!) : () => muteAgent(sessionId!)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  muted ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-[var(--color-surface-alt)] text-[var(--color-muted)] border border-[var(--color-border)]'
                }`}
              >
                {muted ? '🤖 AI Muted' : '🤖 AI Active'}
              </button>
              {listening && (
                <span className="text-xs text-[var(--color-success)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse-dot"></span>
                  Listening...
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
                placeholder="Or type here..."
                className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-20"
              />
              <button onClick={handleTextSend} className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-light)] transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Copilot Panel */}
        <div className="col-span-4 border-r border-[var(--color-border)] flex flex-col bg-white">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Sales Copilot</h2>
          </div>
          <CopilotPanel fields={fields} />
        </div>

        {/* Score */}
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
