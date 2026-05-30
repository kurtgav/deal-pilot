import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { CallSession, Lead } from '@dealpilot/shared';
import { api } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { useSpeech } from '../hooks/useSpeech';
import { useSessionStore, SPEECH_RATES } from '../store/sessionStore';
import Transcript from '../components/Transcript';
import CopilotPanel from '../components/CopilotPanel';
import LeadScoreGauge from '../components/LeadScoreGauge';

// When AI is muted, no TTS plays so there is no speaking-to-idle transition to
// trigger the next listen. After we send a turn we instead schedule a resume.
const MUTED_RESUME_DELAY_MS = 600;
// Tiny delay after AI's TTS ends before re-opening the mic, so the speaker tail
// doesn't get re-captured by the microphone.
const POST_SPEECH_RESUME_DELAY_MS = 150;

export default function CallRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [convoActive, setConvoActive] = useState(false);
  const [consented, setConsented] = useState(false);

  const { transcript, fields, score, muted, speechRate, setSpeechRate, reset, lastLatencyMs } = useSessionStore();

  // Refs that mirror state so timers/closures always read the latest values.
  const convoActiveRef = useRef(false);
  const mutedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { convoActiveRef.current = convoActive; }, [convoActive]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Reset store when entering a new session
  useEffect(() => { reset(); }, [sessionId]);

  // ------- Closed-loop transcript dispatcher -------
  const handleProspectTurn = (text: string) => {
    // Mic already stopped by useSpeech (silence timeout flushes and stops).
    // Send transcript and wait for AI to respond.
    sendTranscript(text);
    if (convoActiveRef.current && mutedRef.current) {
      scheduleResume(MUTED_RESUME_DELAY_MS);
    }
  };

  // STT transport: 'deepgram' streams mic audio to the server (cross-browser);
  // default 'browser' uses Web Speech API. Set VITE_STT_TRANSPORT=deepgram to enable.
  const sttTransport = import.meta.env.VITE_STT_TRANSPORT === 'deepgram' ? 'deepgram' : 'browser';

  // TTS + STT — English-only.
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
    lang: 'en-US',
    silenceTimeoutMs: 800,
    rate: speechRate,
    mode: 'continuous',
    transport: sttTransport,
    onAudioChunk: (chunk) => sendAudio(chunk),
    allowBargeIn: true,
  });

  // Socket agent responses are spoken. With barge-in the mic stays live during
  // AI speech so the prospect can interrupt; useSpeech cancels TTS on real speech.
  const { sendTranscript, sendAudio, muteAgent, unmuteAgent } = useSocket(
    sessionId!,
    (aiText) => {
      speak(aiText);
      // Ensure the mic is open while the AI talks so interruptions are caught.
      if (convoActiveRef.current && !listening) startListening();
    },
    () => {
      // AI started generating — keep listening; do not cut the prospect off.
    },
  );

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
  const giveConsent = async () => {
    try {
      await api.recordConsent(sessionId!);
      setConsented(true);
    } catch (err: any) {
      setError(err.message || 'Failed to record consent');
    }
  };

  const startConversation = () => {
    // Golden Rule: no mic capture without explicit prospect consent.
    if (!consented) return;
    setConvoActive(true);
    convoActiveRef.current = true;
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
    <div className="app-bg app-surface flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/72 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              aria-label="Go to landing page"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200"
            >
              <span className="text-white text-sm font-bold">D</span>
            </Link>
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
              className="app-button-danger px-4 py-2 text-sm"
            >
              End Call
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-sm text-red-700">
          Alert: {error} <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="grid flex-1 min-h-0 gap-4 overflow-y-auto p-4 lg:overflow-hidden lg:grid-cols-12">
        {/* Transcript + Voice */}
        <div className="app-card col-span-5 flex h-[65vh] min-h-0 flex-col overflow-hidden lg:h-auto">
          <div className="app-panel-header flex items-center justify-between px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Live Transcript</h2>
            <span className={`text-xs flex items-center gap-1.5 ${loopStatus.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${loopStatus.dot} ${convoActive ? 'animate-pulse-dot' : ''}`}></span>
              {loopStatus.label}
              {lastLatencyMs != null && (
                <span className="ml-2 text-[var(--color-muted)] font-mono" title="Last AI response latency">
                  {(lastLatencyMs / 1000).toFixed(1)}s
                </span>
              )}
            </span>
          </div>
          <Transcript lines={transcript} />

          {/* Controls */}
          <div className="space-y-3 border-t border-[var(--color-border)] bg-white/70 p-4">
            {!consented && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-3 py-3 text-sm text-amber-900">
                <p className="font-medium">You're about to speak with an AI assistant.</p>
                <p className="mt-0.5 text-amber-800">This conversation is AI-driven and will be transcribed for this session. Your microphone stays off until you agree.</p>
                <button
                  onClick={giveConsent}
                  className="mt-2 rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  I understand — talk to the AI
                </button>
              </div>
            )}
            {interim && (
              <div className="rounded-2xl border border-green-200 bg-green-50/80 px-3 py-2 text-sm italic text-green-800">
                Live input: {interim}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={convoActive ? stopConversation : startConversation}
                disabled={!consented}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  !consented
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : convoActive
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600'
                    : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
                }`}
                title={
                  !consented
                    ? 'Prospect must consent before the microphone can be enabled'
                    : convoActive
                    ? 'Stop the conversation loop'
                    : 'Start the closed conversation loop - mic auto-cycles between turns'
                }
              >
                {convoActive ? 'Stop Conversation' : 'Start Conversation'}
              </button>

              <button
                onClick={muted ? () => unmuteAgent(sessionId!) : () => muteAgent(sessionId!)}
                className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                  muted
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-[var(--color-surface-alt)] text-[var(--color-muted)] border border-[var(--color-border)]'
                }`}
              >
                {muted ? 'AI Muted' : 'AI Active'}
              </button>

              {/* AI speech rate selector */}
              <div
                className="inline-flex items-center overflow-hidden rounded-full border border-[var(--color-border)] bg-white"
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
                      title={`AI speaks at ${label}`}
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
                className="app-input flex-1 px-3 py-2 text-sm"
              />
              <button
                onClick={handleTextSend}
                className="app-button-primary px-4 py-2 text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Copilot Panel */}
        <div className="app-card col-span-4 flex min-h-0 flex-col overflow-hidden max-lg:h-[60vh]">
          <div className="app-panel-header px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Sales Copilot</h2>
          </div>
          <CopilotPanel fields={fields} />
        </div>

        {/* Score */}
        <div className="app-card col-span-3 flex min-h-0 flex-col overflow-hidden max-lg:h-[50vh]">
          <div className="app-panel-header px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Lead Score</h2>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col items-center justify-start gap-6 pt-10">
            <LeadScoreGauge score={score} />
            {lead && (
              <div className="w-full space-y-3 mt-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 shadow-sm">
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

