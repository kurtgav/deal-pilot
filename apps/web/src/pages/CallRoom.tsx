import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { CallSession, Lead } from '@dealpilot/shared';
import { api } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { useSpeech } from '../hooks/useSpeech';
import { useSessionStore, SPEECH_RATES } from '../store/sessionStore';
import Transcript from '../components/Transcript';
import CopilotPanel from '../components/CopilotPanel';
import LeadScoreGauge from '../components/LeadScoreGauge';

// When AI is muted, no TTS plays so there's no `speaking → false` transition to
// trigger the next listen. After we send a turn we instead schedule a resume.
const MUTED_RESUME_DELAY_MS = 600;
// Tiny delay after AI's TTS ends before re-opening the mic, so the speaker tail
// doesn't get re-captured by the microphone.
const POST_SPEECH_RESUME_DELAY_MS = 250;

export default function CallRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [convoActive, setConvoActive] = useState(false);

  const { transcript, fields, score, muted, speechRate, setSpeechRate, reset } = useSessionStore();

  // Refs that mirror state so timers/closures always read the latest values.
  const convoActiveRef = useRef(false);
  const mutedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { convoActiveRef.current = convoActive; }, [convoActive]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Reset store when entering a new session
  useEffect(() => { reset(); }, [sessionId]);

  // ------- Closed-loop transcript dispatcher -------
  // When useSpeech flushes a buffered turn, send it. If AI is muted, no TTS will
  // fire to bring the mic back, so schedule a resume ourselves.
  const handleProspectTurn = (text: string) => {
    sendTranscript(text);
    if (convoActiveRef.current && mutedRef.current) {
      scheduleResume(MUTED_RESUME_DELAY_MS);
    }
  };

  // TTS + STT
  const {
    listening,
    speaking,
    interim,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useSpeech({
    onTranscript: handleProspectTurn,
    rate: speechRate,
    mode: 'continuous', // closed-loop: one mic-stop = one turn
  });

  // Socket: agent:response → speak (loop closes via the speaking-end useEffect)
  const { sendTranscript, muteAgent, unmuteAgent } = useSocket(sessionId!, (aiText) => {
    speak(aiText);
  });

  // ------- Resume scheduling helper -------
  const clearResumeTimer = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  const scheduleResume = (delayMs: number) => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
      // Only resume if the loop is still active and nothing else is going on.
      if (convoActiveRef.current && !speaking && !listening) {
        startListening();
      }
    }, delayMs);
  };

  // ------- Loop closure: when AI finishes speaking, resume mic -------
  const wasSpeakingRef = useRef(false);
  useEffect(() => {
    const wasSpeaking = wasSpeakingRef.current;
    wasSpeakingRef.current = speaking;
    if (wasSpeaking && !speaking && convoActiveRef.current) {
      scheduleResume(POST_SPEECH_RESUME_DELAY_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speaking]);

  // ------- Lead lookup -------
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

  // ------- Cleanup any pending timers on unmount -------
  useEffect(() => {
    return () => clearResumeTimer();
  }, []);

  // ------- Conversation controls -------
  const startConversation = () => {
    setConvoActive(true);
    convoActiveRef.current = true;
    // If AI happens to be speaking (e.g., greeting on session join), the
    // speaking-end effect will start the mic when it finishes.
    if (!speaking && !listening) {
      startListening();
    }
  };

  const stopConversation = () => {
    setConvoActive(false);
    convoActiveRef.current = false;
    clearResumeTimer();
    stopSpeaking();
    if (listening) stopListening({ flush: false });
  };

  const endCall = async () => {
    convoActiveRef.current = false;
    setConvoActive(false);
    clearResumeTimer();
    stopListening({ flush: false });
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

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ------- Loop status pill -------
  const loopStatus = !convoActive
    ? { label: 'Idle', dot: 'bg-gray-400', text: 'text-gray-600' }
    : speaking
      ? { label: 'AI speaking', dot: 'bg-[var(--color-accent)]', text: 'text-[var(--color-accent)]' }
      : listening
        ? { label: 'Listening', dot: 'bg-[var(--color-success)]', text: 'text-[var(--color-success)]' }
        : { label: 'Processing…', dot: 'bg-amber-500', text: 'text-amber-600' };

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
            <button
              onClick={endCall}
              className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              End Call
            </button>
          </div>
        </div>
      </header>

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
            <span className={`text-xs flex items-center gap-1.5 ${loopStatus.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${loopStatus.dot} ${convoActive ? 'animate-pulse-dot' : ''}`}></span>
              {loopStatus.label}
            </span>
          </div>
          <Transcript lines={transcript} />

          {/* Controls */}
          <div className="border-t border-[var(--color-border)] p-4 space-y-3">
            {interim && (
              <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 italic">
                🎤 {interim}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={convoActive ? stopConversation : startConversation}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  convoActive
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600'
                    : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
                }`}
                title={
                  convoActive
                    ? 'Stop the conversation loop'
                    : 'Start the closed conversation loop — mic auto-cycles between turns'
                }
              >
                {convoActive ? '⏹ Stop Conversation' : '🎙️ Start Conversation'}
              </button>

              <button
                onClick={muted ? () => unmuteAgent(sessionId!) : () => muteAgent(sessionId!)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  muted
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-[var(--color-surface-alt)] text-[var(--color-muted)] border border-[var(--color-border)]'
                }`}
              >
                {muted ? '🤖 AI Muted' : '🤖 AI Active'}
              </button>

              {/* AI speech rate selector */}
              <div
                className="inline-flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden"
                role="group"
                aria-label="AI speech rate"
              >
                <span className="px-2 py-2 text-[10px] uppercase tracking-wider text-[var(--color-muted)] bg-[var(--color-surface-alt)] border-r border-[var(--color-border)]">
                  Speed
                </span>
                {SPEECH_RATES.map((r) => {
                  const active = speechRate === r;
                  const label = r === 1 ? '1x' : r === 1.5 ? '1.5x' : '2x';
                  return (
                    <button
                      key={r}
                      onClick={() => setSpeechRate(r)}
                      aria-pressed={active}
                      title={`AI speaks at ${label}${speaking ? ' (restarts current line)' : ''}`}
                      className={`px-2.5 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'bg-white text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
                placeholder="Or type here..."
                className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-20"
              />
              <button
                onClick={handleTextSend}
                className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-light)] transition-colors"
              >
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
