import { useEffect, useState } from 'react';

/** Minimal dependency-free toast. Call toast('message') anywhere; render
 *  <Toaster/> once near the app root. */
interface Toast { id: number; message: string; type: 'error' | 'info'; }

let listeners: ((t: Toast) => void)[] = [];
let nextId = 1;

export function toast(message: string, type: 'error' | 'info' = 'info') {
  const t: Toast = { id: nextId++, message, type };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg px-4 py-2.5 text-[13px] shadow-lg max-w-sm ${
            t.type === 'error' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
