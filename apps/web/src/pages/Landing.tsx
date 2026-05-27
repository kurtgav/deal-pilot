import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[var(--color-primary)]">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-[var(--color-border)] z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">DealPilot AI</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">Pricing</a>
            <button onClick={() => navigate('/app')} className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-light)] transition-colors">
              Launch App →
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-dot"></span>
            AI-Powered Sales Engineering
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
            Your AI Sales Engineer<br />
            <span className="text-[var(--color-accent)]">on Every Call</span>
          </h1>
          <p className="mt-6 text-lg text-[var(--color-muted)] max-w-2xl mx-auto leading-relaxed">
            DealPilot AI joins your discovery calls, answers technical questions from your knowledge base, qualifies leads in real-time, and generates CRM-ready handoffs — so your team closes faster.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <button onClick={() => navigate('/app')} className="px-6 py-3 bg-[var(--color-accent)] text-white font-medium rounded-lg hover:bg-[var(--color-accent-light)] transition-colors shadow-lg shadow-indigo-200">
              Try Live Demo
            </button>
            <a href="#how-it-works" className="px-6 py-3 text-[var(--color-muted)] font-medium rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
              See How It Works
            </a>
          </div>
          <p className="mt-4 text-xs text-[var(--color-muted)]">No signup required · Full demo with AI voice agent</p>
        </div>

        {/* Hero visual */}
        <div className="max-w-5xl mx-auto mt-16 rounded-2xl border border-[var(--color-border)] shadow-2xl shadow-slate-200/50 overflow-hidden bg-[var(--color-surface-alt)]">
          <div className="bg-white border-b border-[var(--color-border)] px-6 py-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            <span className="ml-4 text-xs text-[var(--color-muted)]">DealPilot AI — Live Call</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[var(--color-border)] h-64">
            <div className="p-5">
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">Live Transcript</p>
              <div className="space-y-2.5">
                <div><span className="text-xs font-semibold text-[var(--color-accent)]">DealPilot AI</span><p className="text-xs mt-0.5">Hi Sarah, I'm here to understand your needs...</p></div>
                <div><span className="text-xs font-semibold text-emerald-600">Prospect</span><p className="text-xs mt-0.5">We need real-time voice AI for our tutoring platform...</p></div>
                <div><span className="text-xs font-semibold text-[var(--color-accent)]">DealPilot AI</span><p className="text-xs mt-0.5">That sounds like a great fit for our Professional plan...</p></div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">Sales Copilot</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="text-[var(--color-muted)]">Industry</span><span className="font-medium">EdTech</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--color-muted)]">Use Case</span><span className="font-medium">Voice Tutoring</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--color-muted)]">Urgency</span><span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">High</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--color-muted)]">Budget</span><span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">Medium</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--color-muted)]">Tech Fit</span><span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">Strong</span></div>
              </div>
            </div>
            <div className="p-5 flex flex-col items-center justify-center">
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Lead Score</p>
              <div className="relative">
                <svg width="100" height="100" className="-rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeDasharray="239" strokeDashoffset="48" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">82</span>
                  <span className="text-xs text-[var(--color-muted)]">SQL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-[var(--color-surface-alt)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">Everything you need to scale technical sales</h2>
            <p className="mt-3 text-[var(--color-muted)] max-w-xl mx-auto">DealPilot AI handles the 80% of discovery calls that don't need a senior SE — so your experts focus on complex enterprise deals.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🎙️', title: 'Voice AI Agent', desc: 'Joins calls as a named participant. Conducts discovery, answers questions, handles objections — all by voice.' },
              { icon: '🧠', title: 'Real-Time Copilot', desc: 'Extracts fields, scores leads, and surfaces signals live during the call. Your rep sees everything as it happens.' },
              { icon: '📋', title: 'Instant Handoff', desc: 'Generates transcript, CRM JSON, lead score, and follow-up email the moment the call ends.' },
              { icon: '📚', title: 'Knowledge Base RAG', desc: 'Answers only from your curated product knowledge. Never fabricates pricing, features, or SLAs.' },
              { icon: '🎯', title: 'Lead Scoring', desc: 'Weighted scoring across use case, urgency, budget, technical fit, and objections. Real-time 0-100 gauge.' },
              { icon: '🔒', title: 'Safe by Design', desc: 'Never denies being AI. Never makes binding commitments. Never stores PII beyond the session.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-[var(--color-border)] p-6 hover:shadow-md transition-shadow">
                <span className="text-2xl">{f.icon}</span>
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="mt-3 text-[var(--color-muted)]">Three steps from lead to qualified handoff</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Select a Lead', desc: 'Pick from your pipeline or create a new lead with company context and use case hypothesis.' },
              { step: '2', title: 'Start the Call', desc: 'AI introduces itself, conducts discovery, answers technical questions, and recommends a solution — all by voice.' },
              { step: '3', title: 'Review Handoff', desc: 'Get a complete package: transcript, lead score, CRM-ready JSON, and a personalized follow-up email draft.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] text-white text-lg font-bold flex items-center justify-center mx-auto">{s.step}</div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-[var(--color-surface-alt)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="mt-3 text-[var(--color-muted)]">Start small, scale as you grow</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: '$499', period: '/mo', features: ['50 AI-assisted calls/month', 'Basic lead scoring', 'CRM JSON export', 'Email templates', '1 knowledge base'], cta: 'Get Started', highlight: false },
              { name: 'Professional', price: '$1,499', period: '/mo', features: ['Unlimited AI calls', 'Advanced scoring', 'Real-time copilot panel', '5 knowledge bases', 'Slack + CRM integrations'], cta: 'Start Free Trial', highlight: true },
              { name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Pro', 'Custom AI persona', 'Dedicated infrastructure', 'SOC 2 + SSO', '99.9% SLA'], cta: 'Contact Sales', highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-xl border p-6 ${plan.highlight ? 'border-[var(--color-accent)] bg-white shadow-lg shadow-indigo-100 ring-1 ring-[var(--color-accent)]' : 'border-[var(--color-border)] bg-white'}`}>
                {plan.highlight && <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-2">Most Popular</p>}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-[var(--color-muted)] text-sm">{plan.period}</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-[var(--color-muted)] flex items-start gap-2">
                      <span className="text-[var(--color-success)] mt-0.5">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/app')} className={`mt-6 w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${plan.highlight ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]' : 'border border-[var(--color-border)] text-[var(--color-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold">Ready to scale your sales engineering?</h2>
          <p className="mt-4 text-[var(--color-muted)] text-lg">Try the live demo now — no signup required. See DealPilot AI conduct a full discovery call in under 5 minutes.</p>
          <button onClick={() => navigate('/app')} className="mt-8 px-8 py-3.5 bg-[var(--color-accent)] text-white font-medium rounded-lg hover:bg-[var(--color-accent-light)] transition-colors shadow-lg shadow-indigo-200 text-lg">
            Launch Demo →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[var(--color-accent)] flex items-center justify-center">
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <span className="text-sm font-medium">DealPilot AI</span>
          </div>
          <p className="text-xs text-[var(--color-muted)]">© 2026 DealPilot AI. Built for the future of B2B sales.</p>
        </div>
      </footer>
    </div>
  );
}
