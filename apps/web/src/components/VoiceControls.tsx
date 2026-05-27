import { useState } from 'react';

interface Props {
  muted: boolean;
  micMuted: boolean;
  joined: boolean;
  onMute: () => void;
  onUnmute: () => void;
  onToggleMic: () => void;
  onSend: (text: string) => void;
}

export default function VoiceControls({ muted, micMuted, joined, onMute, onUnmute, onToggleMic, onSend }: Props) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="border-t border-[var(--color-border)] p-4 space-y-3">
      {/* Controls row */}
      <div className="flex items-center gap-2">
        <button
          onClick={muted ? onUnmute : onMute}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            muted ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-[var(--color-surface-alt)] text-[var(--color-muted)] border border-[var(--color-border)]'
          }`}
        >
          {muted ? '🤖 AI Muted' : '🤖 AI Active'}
        </button>

        {joined && (
          <button
            onClick={onToggleMic}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              micMuted ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {micMuted ? '🎙️ Mic Off' : '🎙️ Mic On'}
          </button>
        )}

        {joined && (
          <span className="text-xs text-[var(--color-success)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse-dot"></span>
            Voice Connected
          </span>
        )}
      </div>

      {/* Text input (fallback / demo mode) */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={joined ? 'Type to simulate (mic is live)...' : 'Simulate prospect speech...'}
          className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-20"
        />
        <button onClick={handleSend} className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-light)] transition-colors">
          Send
        </button>
      </div>
    </div>
  );
}
