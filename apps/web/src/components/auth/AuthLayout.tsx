import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

const TESTIMONIALS = [
  {
    quote: "DealPilot cut our qualification time by 60%. Every rep closes more now.",
    author: "Sarah Chen",
    role: "VP Sales, Meridian SaaS",
    avatar: "SC",
  },
  {
    quote: "The AI copilot surfaces objections before they happen. It's like having a coach on every call.",
    author: "Marcus Webb",
    role: "Head of Revenue, Stackline",
    avatar: "MW",
  },
  {
    quote: "We went from 12% to 31% win rate in one quarter. The ROI is undeniable.",
    author: "Priya Nair",
    role: "CRO, Vantage Cloud",
    avatar: "PN",
  },
];

const STATS = [
  { value: "3.2×", label: "avg. pipeline growth" },
  { value: "60%", label: "faster qualification" },
  { value: "500+", label: "sales teams" },
];

export default function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: brand + social proof ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col bg-[#0a0a0a] relative overflow-hidden">
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 group w-fit">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-[15px] tracking-[-0.01em]">DealPilot AI</span>
          </Link>

          {/* Hero copy */}
          <div className="mt-auto mb-auto pt-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[12px] text-white/60 font-medium tracking-wide uppercase">Trusted by 500+ teams</span>
            </div>

            <h2 className="text-[38px] xl:text-[44px] font-bold text-white leading-[1.1] tracking-[-0.03em]">
              Close more deals.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                Qualify faster.
              </span>
            </h2>
            <p className="mt-4 text-[15px] text-white/50 leading-relaxed max-w-sm">
              AI-powered sales copilot that listens, scores, and guides your reps in real time.
            </p>

            {/* Stats */}
            <div className="mt-10 flex gap-8">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-[26px] font-bold text-white tracking-[-0.03em]">{s.value}</div>
                  <div className="text-[12px] text-white/40 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-auto">
            <div className="border border-white/[0.08] rounded-2xl p-5 bg-white/[0.03] backdrop-blur-sm">
              <p className="text-[14px] text-white/70 leading-relaxed">
                &ldquo;{TESTIMONIALS[0].quote}&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white">
                  {TESTIMONIALS[0].avatar}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-white/80">{TESTIMONIALS[0].author}</div>
                  <div className="text-[12px] text-white/40">{TESTIMONIALS[0].role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile logo */}
        <header className="lg:hidden px-6 py-5 border-b border-[#f0f0f0]">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <span className="font-semibold text-[15px] text-zinc-900">DealPilot AI</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[380px]">
            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-[26px] font-bold tracking-[-0.03em] text-zinc-900">{title}</h1>
              {subtitle && (
                <p className="mt-2 text-[14px] text-zinc-500 leading-relaxed">{subtitle}</p>
              )}
            </div>

            {/* Form content */}
            {children}

            {/* Footer */}
            {footer && (
              <div className="mt-6 text-center text-[13px] text-zinc-500">{footer}</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
