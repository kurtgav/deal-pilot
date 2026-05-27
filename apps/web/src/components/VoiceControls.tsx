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
    <div className="space-y-3 border-t border-[var(--color-border)] bg-white/70 p-4">
      {/* Controls row */}
      <div className="flex items-center gap-2">
        <button
          onClick={muted ? onUnmute : onMute}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            muted ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-[var(--color-surface-alt)] text-[var(--color-muted)] border border-[var(--color-border)]'
          }`}
        >
          {muted ? 'AI Muted' : 'AI Active'}
        </button>

        {joined && (
          <button
            onClick={onToggleMic}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              micMuted ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {micMuted ? 'Mic Off' : 'Mic On'}
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
          className="app-input flex-1 px-3 py-2 text-sm"
        />
        <button onClick={handleSend} className="app-button-primary px-4 py-2 text-sm">
          Send
        </button>
      </div>
    </div>
  );
}

