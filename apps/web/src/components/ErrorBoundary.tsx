import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

/** Top-level error boundary: catches render errors so a crash in one route
 *  shows a recoverable message instead of a blank white screen. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-6">
        <div className="max-w-md text-center">
          <div className="text-[13px] font-medium text-slate-400 uppercase tracking-wider">Error</div>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-[14px] text-slate-500">{this.state.error.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => { this.setState({ error: null }); location.reload(); }}
            className="mt-5 inline-flex items-center px-4 py-2 rounded-lg bg-zinc-900 text-white text-[13px] font-medium hover:bg-zinc-800 transition"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
