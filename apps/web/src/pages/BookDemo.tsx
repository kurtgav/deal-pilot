import { useState } from 'react';
import { Calendar, Clock, Mic, ArrowRight } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import PageMeta from '../components/PageMeta';

export default function BookDemo() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <PageMeta
        title="Book a Demo — Hear DealPilot AI on a Live Call"
        description="Schedule a 30-minute live demo of DealPilot AI. See the voice agent run a discovery call, handle technical Q&A, and generate a CRM handoff in real time."
        path="/book-demo"
      />
      <Navbar />

      <section className="pt-32 pb-24 px-6">
        <div className="mx-auto max-w-5xl grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Book a demo</h1>
              <p className="text-lg text-zinc-500 leading-relaxed">
                See DealPilot AI run a live discovery call. Hear the voice agent qualify a prospect, answer technical questions, and generate a complete handoff.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Calendar, text: 'Pick a time that works for your team' },
                { icon: Clock, text: '30-minute live demo session' },
                { icon: Mic, text: 'Hear the AI voice agent on a real call' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-zinc-600">
                  <div className="rounded-lg bg-zinc-50 p-2"><Icon className="h-4 w-4 text-zinc-700" /></div>
                  {text}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-6 space-y-3">
              <p className="text-sm font-medium text-zinc-900">What you'll see:</p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>• AI joining a live voice call as a sales engineer</li>
                <li>• Real-time field extraction and lead scoring</li>
                <li>• Technical Q&A from a knowledge base (zero hallucination)</li>
                <li>• Post-call CRM JSON and follow-up email generation</li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <div className="rounded-full bg-emerald-50 p-4">
                  <Calendar className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900">Demo requested!</h3>
                <p className="text-sm text-zinc-500">We'll reach out within 24 hours to confirm your session.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">First name</label>
                    <input required className="w-full rounded-md border border-zinc-300 px-3 py-2.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Last name</label>
                    <input required className="w-full rounded-md border border-zinc-300 px-3 py-2.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Work email</label>
                  <input type="email" required className="w-full rounded-md border border-zinc-300 px-3 py-2.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Company</label>
                  <input required className="w-full rounded-md border border-zinc-300 px-3 py-2.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Sales team size</label>
                  <select required className="w-full rounded-md border border-zinc-300 px-3 py-2.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900">
                    <option value="">Select...</option>
                    <option>1-5 reps</option>
                    <option>6-20 reps</option>
                    <option>21-50 reps</option>
                    <option>50+ reps</option>
                  </select>
                </div>
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors">
                  Request Demo <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
