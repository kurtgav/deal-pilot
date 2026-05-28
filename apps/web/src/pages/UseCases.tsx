import { Mic, Brain, Shield, FileText, Zap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import PageMeta from '../components/PageMeta';

const useCases = [
  { icon: Mic, title: 'AI-Assisted Discovery Calls', desc: 'DealPilot joins live calls and runs structured discovery — qualifying prospects through natural voice conversation without needing a human SE.', metric: '3x more calls/week' },
  { icon: Brain, title: 'Technical Q&A on Calls', desc: 'Prospects ask SDK, API, and integration questions mid-call. DealPilot answers instantly from your knowledge base — no hallucination, no "let me get back to you."', metric: '94% answer accuracy' },
  { icon: Shield, title: 'Real-Time Objection Handling', desc: 'AI detects pricing, timeline, and competitive objections as they happen and delivers trained rebuttals to keep deals moving forward.', metric: '40% fewer stalled deals' },
  { icon: FileText, title: 'Automated CRM Handoffs', desc: 'Every call generates a complete package: transcript, lead score, CRM JSON, and follow-up email draft — ready in seconds, not hours.', metric: '80% less admin time' },
  { icon: Zap, title: 'Lead Scoring & Qualification', desc: 'Real-time scoring based on urgency, budget signal, technical fit, and decision-maker involvement. Know which leads to prioritize instantly.', metric: '+52% SQL conversion' },
  { icon: Users, title: 'SE Bottleneck Elimination', desc: 'Stop waiting for sales engineers to be available. DealPilot handles routine technical discovery so your SEs focus on complex, high-value engagements.', metric: '5x SE leverage' },
];

export default function UseCases() {
  return (
    <div className="min-h-screen bg-white">
      <PageMeta
        title="Use Cases — AI Voice Sales Engineer Workflows"
        description="From AI-assisted discovery calls to automated CRM handoffs, DealPilot AI handles technical Q&A, objection handling, and lead qualification on every B2B sales call."
        path="/use-cases"
      />
      <Navbar />

      <section className="pt-32 pb-16 px-6 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm text-zinc-700">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Use Cases
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
            An AI sales engineer for every call
          </h1>
          <p className="text-lg text-zinc-500 leading-relaxed">
            DealPilot AI handles the technical heavy lifting so your reps can focus on building relationships and closing deals.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map(({ icon: Icon, title, desc, metric }) => (
            <div key={title} className="rounded-xl border border-zinc-100 bg-white p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all">
              <div className="inline-flex rounded-lg bg-zinc-50 p-2.5">
                <Icon className="h-5 w-5 text-zinc-700" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{metric}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl rounded-2xl bg-zinc-900 p-12 text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">Ready to put an AI sales engineer on every call?</h2>
          <p className="text-zinc-400">Start a free trial or book a live demo with our team.</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/app" className="rounded-md bg-white px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors">
              Start Free Trial
            </Link>
            <Link to="/book-demo" className="rounded-md border border-zinc-600 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
