import { useEffect, useState } from 'react';
import type { ReactNode, SVGProps } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type IconName =
  | 'arrowRight'
  | 'audioLines'
  | 'badgeCheck'
  | 'barChart'
  | 'brain'
  | 'building'
  | 'check'
  | 'chevronRight'
  | 'database'
  | 'fileText'
  | 'filter'
  | 'handshake'
  | 'lock'
  | 'mail'
  | 'message'
  | 'phone'
  | 'radar'
  | 'shield'
  | 'sparkles'
  | 'target'
  | 'trendingUp'
  | 'user'
  | 'zap';

const iconPaths: Record<IconName, ReactNode> = {
  arrowRight: <path d="M5 12h14M13 5l7 7-7 7" />,
  audioLines: (
    <>
      <path d="M2 10v4" />
      <path d="M6 7v10" />
      <path d="M10 4v16" />
      <path d="M14 8v8" />
      <path d="M18 6v12" />
      <path d="M22 10v4" />
    </>
  ),
  badgeCheck: (
    <>
      <path d="M8.8 21.1 7 18.1l-3.4-.8.3-3.5L2 10.9l2.4-2.5.3-3.5 3.4-.8L10 1.1l3.2 1.4 3.2-1.4 1.9 3 3.4.8-.3 3.5 2.4 2.5-1.9 2.9.3 3.5-3.4.8-1.8 3-3.2-1.4-3.2 1.4Z" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  barChart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M8 17V9" />
      <path d="M13 17V5" />
      <path d="M18 17v-6" />
    </>
  ),
  brain: (
    <>
      <path d="M12 5a3 3 0 0 0-5.8-1 3.2 3.2 0 0 0-3.1 4A3.5 3.5 0 0 0 4 14.7 3.4 3.4 0 0 0 8.5 19 3.5 3.5 0 0 0 12 22Z" />
      <path d="M12 5a3 3 0 0 1 5.8-1 3.2 3.2 0 0 1 3.1 4 3.5 3.5 0 0 1-.9 6.7A3.4 3.4 0 0 1 15.5 19 3.5 3.5 0 0 1 12 22Z" />
      <path d="M12 5v17" />
      <path d="M7 9h2" />
      <path d="M15 9h2" />
      <path d="M8 15h2" />
      <path d="M14 15h2" />
    </>
  ),
  building: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <path d="M9 9h.01" />
      <path d="M9 13h.01" />
      <path d="M9 17h.01" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  database: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  ),
  fileText: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </>
  ),
  filter: (
    <>
      <path d="M3 5h18" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </>
  ),
  handshake: (
    <>
      <path d="m11 17 2 2a2.8 2.8 0 0 0 4 0l3-3a2.8 2.8 0 0 0 0-4l-4.5-4.5a2.8 2.8 0 0 0-4 0L10 9" />
      <path d="m13 11 2 2a2.8 2.8 0 0 0 4 0" />
      <path d="m7 7-3 3a2.8 2.8 0 0 0 0 4l4.5 4.5a2.8 2.8 0 0 0 4 0L14 17" />
      <path d="m8 13 3-3" />
    </>
  ),
  lock: (
    <>
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  mail: (
    <>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </>
  ),
  message: (
    <>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </>
  ),
  phone: (
    <>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" />
    </>
  ),
  radar: (
    <>
      <path d="M19.1 4.9A10 10 0 1 1 4.9 19.1" />
      <path d="M12 12 21 3" />
      <path d="M10.2 13.8a2.5 2.5 0 1 1 3.6-3.6" />
      <path d="M7.8 16.2a6 6 0 1 1 8.5-8.5" />
    </>
  ),
  shield: (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.7 8.8a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V5l8-3 8 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3 14.3 8.7 20 11l-5.7 2.3L12 19l-2.3-5.7L4 11l5.7-2.3Z" />
      <path d="M19 3v4" />
      <path d="M21 5h-4" />
      <path d="M5 17v3" />
      <path d="M6.5 18.5h-3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  trendingUp: (
    <>
      <path d="m3 17 6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </>
  ),
  user: (
    <>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  zap: <path d="M13 2 3 14h8l-1 8 10-12h-8Z" />,
};

function Icon({ name, className = 'h-5 w-5', ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

const valueCards = [
  {
    icon: 'filter',
    title: 'Qualify technical fit before an SE joins',
    desc: 'DealPilot filters discovery signals, product fit, budget, urgency, and blockers while the call is still live.',
  },
  {
    icon: 'barChart',
    title: 'Scale coverage without burning the team',
    desc: 'Give every rep access to a consistent technical copilot for first-pass calls, follow-up notes, and CRM-ready handoffs.',
  },
  {
    icon: 'handshake',
    title: 'Keep senior sellers focused on relationships',
    desc: 'Automate repetitive technical answers and handoff prep so people spend more time on complex enterprise deals.',
  },
] as const;

const marqueeItems = [
  ['audioLines', 'Live voice discovery'],
  ['database', 'Knowledge-grounded answers'],
  ['target', 'Lead scoring'],
  ['message', 'Objection handling'],
  ['fileText', 'CRM handoff'],
  ['shield', 'Guardrailed responses'],
  ['brain', 'Copilot signals'],
  ['trendingUp', 'Pipeline acceleration'],
] as const;

const useCases = [
  {
    label: 'Discovery calls',
    icon: 'phone',
    title: 'Run structured discovery from the first minute',
    desc: 'DealPilot introduces itself, asks qualification questions, captures buying triggers, and keeps the conversation moving.',
    metric: '82',
    metricLabel: 'Average SQL score',
  },
  {
    label: 'Technical Q&A',
    icon: 'database',
    title: 'Answer product questions from trusted knowledge',
    desc: 'The AI only uses curated product, pricing, security, and deployment content, reducing unsupported claims and bad handoffs.',
    metric: '5x',
    metricLabel: 'More answer coverage',
  },
  {
    label: 'Rep handoff',
    icon: 'fileText',
    title: 'Turn every call into a clean sales package',
    desc: 'Generate transcript summaries, CRM JSON, lead score, objections, and a follow-up email while the context is fresh.',
    metric: '<1m',
    metricLabel: 'Handoff creation',
  },
] as const;

const pricing = [
  {
    name: 'Starter',
    price: '$499',
    period: '/mo',
    features: ['50 AI-assisted calls/month', 'Basic lead scoring', 'CRM JSON export', 'Email templates', '1 knowledge base'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$1,499',
    period: '/mo',
    features: ['Unlimited AI calls', 'Advanced scoring', 'Real-time copilot panel', '5 knowledge bases', 'Slack + CRM integrations'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Everything in Pro', 'Custom AI persona', 'Dedicated infrastructure', 'SOC 2 + SSO', '99.9% SLA'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [activeUseCase, setActiveUseCase] = useState(0);
  const selectedUseCase = useCases[activeUseCase];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal-on-scroll').forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );

    document.querySelectorAll('.reveal-on-scroll').forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-hidden bg-[#fbfcff] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Go to DealPilot AI landing page" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-200/70 transition-transform group-hover:scale-105">
              <span className="text-sm font-bold">D</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">DealPilot AI</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex" aria-label="Primary navigation">
            <a href="#platform" className="transition-colors hover:text-slate-950">Platform</a>
            <a href="#use-cases" className="transition-colors hover:text-slate-950">Use Cases</a>
            <a href="#pricing" className="transition-colors hover:text-slate-950">Pricing</a>
            <button onClick={() => navigate('/app')} className="btn-primary group px-4 py-2 text-sm">
              <span>Launch App</span>
              <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </nav>

          <button onClick={() => navigate('/app')} className="btn-primary px-3.5 py-2 text-sm md:!hidden">
            Launch
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[560px] w-[960px] -translate-x-1/2 rounded-full bg-indigo-100/80 blur-3xl" />
            <div className="absolute right-[-160px] top-28 h-96 w-96 rounded-full bg-violet-100 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.07)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_0%,transparent_70%)]" />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="reveal-on-scroll">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm shadow-indigo-100/50 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                AI sales engineer for live discovery
              </div>

              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[68px]">
                Your technical seller
                <span className="block bg-gradient-to-r from-slate-950 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
                  in every call.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                DealPilot AI joins discovery calls, answers product questions from your knowledge base, scores leads in real time, and produces clean CRM-ready handoffs.
              </p>

              <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center">
                <button onClick={() => navigate('/app')} className="btn-primary group px-6 py-3.5 text-base">
                  <span>Try Live Demo</span>
                  <Icon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <div className="flex items-center gap-3">
                  {['RAG', 'SQL', 'CRM'].map((label) => (
                    <div key={label} className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-indigo-50 to-white text-xs font-bold text-indigo-700 shadow-sm first:ml-0">
                      {label}
                    </div>
                  ))}
                  <p className="text-sm leading-5 text-slate-500">
                    Live call-ready.
                    <br />
                    No signup required.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[440px] reveal-on-scroll reveal-delay-2">
              <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-indigo-100 via-violet-100 to-sky-50 opacity-80 blur-2xl" />
              <div className="relative mx-auto overflow-hidden rounded-[2.5rem] border border-white bg-white/80 p-3 shadow-2xl shadow-indigo-200/60 backdrop-blur-xl">
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50">
                  <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 text-xs font-semibold text-slate-500">
                    <span>14:32</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-4 rounded-sm border border-slate-300" />
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    </div>
                  </div>

                  <div className="relative p-4">
                    <div className="absolute left-1/2 top-3 z-10 flex w-[86%] -translate-x-1/2 items-center gap-3 rounded-full border border-indigo-100 bg-white/90 px-3 py-2 shadow-xl shadow-indigo-100 backdrop-blur-md">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                        <Icon name="phone" className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-950">DealPilot AI is listening</p>
                        <p className="text-[11px] text-emerald-600">Knowledge-grounded response ready</p>
                      </div>
                    </div>

                    <div className="mt-12 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-600">Live Call</p>
                          <h2 className="mt-1 text-lg font-semibold tracking-tight">Sarah Chen</h2>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">04:38</span>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-2xl bg-indigo-50 p-3">
                          <p className="text-xs font-semibold text-indigo-700">DealPilot AI</p>
                          <p className="mt-1 text-sm leading-5 text-slate-600">Your latency requirement maps to the Professional deployment path.</p>
                        </div>
                        <div className="ml-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                          <p className="text-xs font-semibold text-emerald-700">Prospect</p>
                          <p className="mt-1 text-sm leading-5 text-slate-600">Compliance and rollout speed are our biggest concerns.</p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Lead Score</p>
                          <span className="text-2xl font-semibold text-slate-950">82</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500" />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <span className="rounded-lg bg-white px-2 py-1 ring-1 ring-slate-200">High urgency</span>
                          <span className="rounded-lg bg-white px-2 py-1 ring-1 ring-slate-200">Strong fit</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <span className="flex-1 text-xs text-slate-400">Ask DealPilot...</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <Icon name="arrowRight" className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="relative overflow-hidden border-y border-indigo-100 bg-gradient-to-b from-white via-indigo-50/50 to-white px-5 py-24 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-100 blur-3xl" />
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-3xl text-center reveal-on-scroll">
              <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Sales engineering support</span>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Give every rep technical depth without adding calendar drag.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">A light-mode translation of the reference value section: soft glass cards, generous spacing, and premium accents built around DealPilot AI.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {valueCards.map((card, index) => (
                <article key={card.title} className="premium-card group reveal-on-scroll" style={{ animationDelay: `${index * 120}ms` }}>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-white text-indigo-700 shadow-sm transition-transform group-hover:scale-110">
                    <Icon name={card.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden border-b border-slate-100 bg-white py-20">
          <div className="mx-auto mb-10 max-w-3xl px-5 text-center sm:px-6 lg:px-8 reveal-on-scroll">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">What DealPilot handles</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">One AI layer across the sales-engineering workflow.</h2>
          </div>

          <div className="relative flex overflow-hidden reveal-on-scroll">
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
            <div className="animate-marquee flex gap-4 pr-4">
              {[...marqueeItems, ...marqueeItems].map(([icon, label], index) => (
                <div key={`${label}-${index}`} className="flex w-[280px] shrink-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition-colors hover:border-indigo-100 hover:bg-white hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-indigo-600 shadow-sm">
                    <Icon name={icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold tracking-tight text-slate-950">{label}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Structured, observable, and ready for rep review.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="use-cases" className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="reveal-on-scroll">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Use cases</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">A production call room layout for technical sales.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">The reference page uses an interactive left-list and right preview. Here that same layout is wired to DealPilot AI workflows.</p>

              <div className="mt-8 space-y-3">
                {useCases.map((item, index) => (
                  <button
                    key={item.label}
                    onClick={() => setActiveUseCase(index)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                      activeUseCase === index
                        ? 'border-indigo-200 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-100'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex gap-4">
                      <span className="mt-1 text-indigo-600">
                        <Icon name={item.icon} className="h-6 w-6" />
                      </span>
                      <span>
                        <span className="block font-semibold text-slate-950">{item.label}</span>
                        <span className="mt-1 block text-sm leading-6 text-slate-600">{item.desc}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative reveal-on-scroll">
              <div className="absolute -inset-4 -z-10 rounded-[40px] bg-gradient-to-r from-indigo-100 to-sky-50 opacity-80 blur-xl" />
              <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl shadow-indigo-100">
                <div className="absolute right-0 top-0 p-8 text-indigo-100">
                  <Icon name="sparkles" className="h-24 w-24" />
                </div>

                <div className="relative">
                  <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                    <Icon name={selectedUseCase.icon} className="h-7 w-7" />
                  </div>
                  <h3 className="max-w-lg text-3xl font-semibold tracking-tight text-slate-950">{selectedUseCase.title}</h3>
                  <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">{selectedUseCase.desc}</p>

                  <div className="mt-10 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50 p-5">
                    <div className="flex items-center justify-between gap-5">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{selectedUseCase.metricLabel}</p>
                        <p className="mt-2 text-5xl font-semibold tracking-tight text-slate-950">{selectedUseCase.metric}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                        <Icon name="check" className="h-6 w-6" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {['Call transcript', 'Objection summary', 'CRM fields', 'Follow-up email'].map((label) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm">
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="relative overflow-hidden border-y border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-5 py-24 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-200/60 blur-[120px]" />
          <div className="relative mx-auto max-w-6xl reveal-on-scroll">
            <div className="mb-10 text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Live demo</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Put DealPilot into a call room.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">Use the existing app route to test the live sales-engineering workflow.</p>
            </div>

            <div className="rounded-[2rem] border border-white bg-white/80 p-4 shadow-2xl shadow-indigo-200/50 backdrop-blur md:p-6">
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <div className="group relative">
                  <Icon name="user" className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                  <input readOnly value="New technical buyer" className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" aria-label="Demo lead" />
                </div>
                <div className="group relative">
                  <Icon name="mail" className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                  <input readOnly value="Voice AI evaluation" className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" aria-label="Demo use case" />
                </div>
                <button onClick={() => navigate('/app')} className="btn-primary justify-center px-8 py-3.5 text-base">
                  <Icon name="phone" className="h-4 w-4" />
                  <span>Launch Demo</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white px-5 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-14 max-w-2xl text-center reveal-on-scroll">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Pricing</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Simple, transparent pricing</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">Start small, scale as you grow.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {pricing.map((plan, index) => (
                <article
                  key={plan.name}
                  className={`relative rounded-[1.75rem] border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                    plan.highlight
                      ? 'border-indigo-200 shadow-2xl shadow-indigo-200/60 ring-1 ring-indigo-100'
                      : 'border-slate-200 shadow-xl shadow-slate-200/35 hover:border-indigo-100'
                  } reveal-on-scroll`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-7 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg shadow-indigo-200">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950">{plan.name}</h3>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-4xl font-semibold tracking-tight text-slate-950">{plan.price}</span>
                    <span className="pb-1 text-sm font-medium text-slate-500">{plan.period}</span>
                  </div>
                  <ul className="mt-7 space-y-3.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                          <Icon name="check" className="h-3.5 w-3.5" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate('/app')} className={`mt-8 w-full justify-center ${plan.highlight ? 'btn-primary py-3' : 'btn-secondary py-3'}`}>
                    {plan.cta}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="bg-white px-5 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-start gap-16 lg:grid-cols-2">
            <div className="reveal-on-scroll">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Ready for AI-assisted technical discovery?</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">This final conversion block mirrors the reference layout, but every element points back to DealPilot's live app experience.</p>
              <div className="mt-10 space-y-6">
                {[
                  ['Launch the call room', 'Start with a sample lead and see the voice workflow.'],
                  ['Review generated handoff', 'Inspect transcript, lead score, CRM JSON, and follow-up draft.'],
                  ['Adapt the knowledge base', 'Use curated product data to keep answers grounded.'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                      <Icon name="check" className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-950">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-8 shadow-xl shadow-slate-200/50 reveal-on-scroll lg:p-10">
              <div className="mb-8">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">DealPilot app</span>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Run the production demo flow</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">No new backend or route changes. This CTA uses the existing `/app` experience.</p>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Included</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {['Voice controls', 'Live transcript', 'Copilot panel', 'Handoff export'].map((item) => (
                      <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">{item}</div>
                    ))}
                  </div>
                </div>
                <button onClick={() => navigate('/app')} className="btn-primary w-full justify-center px-8 py-3.5 text-base">
                  Open DealPilot AI
                  <Icon name="arrowRight" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 md:flex-row">
          <div>
            <Link to="/" aria-label="Go to DealPilot AI landing page" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-100">
                <span className="text-sm font-bold">D</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-950">DealPilot AI</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">AI sales engineering for live discovery, technical answers, lead scoring, and CRM-ready handoffs.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <h3 className="font-semibold text-slate-950">Product</h3>
              <div className="mt-4 space-y-3 text-slate-500">
                <a href="#platform" className="block hover:text-indigo-700">Platform</a>
                <a href="#use-cases" className="block hover:text-indigo-700">Use Cases</a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-950">Workflow</h3>
              <div className="mt-4 space-y-3 text-slate-500">
                <a href="#demo" className="block hover:text-indigo-700">Demo</a>
                <a href="#pricing" className="block hover:text-indigo-700">Pricing</a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-950">Status</h3>
              <p className="mt-4 text-slate-500">(c) 2026 DealPilot AI.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
