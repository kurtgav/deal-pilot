import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import PageMeta from '../components/PageMeta';

const plans = [
  {
    name: 'Starter',
    price: '$99',
    desc: 'For small sales teams running AI-assisted discovery calls.',
    features: ['50 AI-assisted calls/month', 'Real-time transcription', 'Lead scoring (0–100)', 'CRM JSON export', '1 knowledge base'],
    cta: 'Start Free Trial',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$299',
    desc: 'For scaling teams that need full voice AI coverage.',
    features: ['500 AI-assisted calls/month', 'Custom knowledge base', 'Objection handling', 'Follow-up email drafts', '5 knowledge bases', 'Priority support'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'For organizations with high call volume and custom needs.',
    features: ['Unlimited calls', 'Custom AI voice persona', 'SSO & audit logs', 'Dedicated CSM', 'SLA guarantee', 'Custom integrations', 'On-prem deployment option'],
    cta: 'Talk to Sales',
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white">
      <PageMeta
        title="Pricing — AI Voice Sales Engineer Plans"
        description="DealPilot AI pricing: $99/mo Starter for 50 calls, $299/mo Growth for 500 calls with full features, and custom Enterprise plans. Start free."
        path="/pricing"
      />
      <Navbar />

      <section className="pt-32 pb-16 px-6 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-zinc-500">
            Start free. Scale as your call volume grows. No hidden fees.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-xl border p-8 space-y-6 ${plan.highlight ? 'border-zinc-900 shadow-xl relative' : 'border-zinc-200'}`}>
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">Most popular</span>
              )}
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">{plan.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{plan.desc}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900">{plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-sm text-zinc-500">/mo</span>}
              </div>
              <Link
                to={plan.name === 'Enterprise' ? '/book-demo' : '/app'}
                className={`block w-full rounded-md py-3 text-center text-sm font-medium transition-colors ${plan.highlight ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}
              >
                {plan.cta}
              </Link>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
