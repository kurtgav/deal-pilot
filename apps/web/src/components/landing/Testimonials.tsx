const testimonials = [
  { quote: 'DealPilot handles the technical questions our AEs used to fumble. Prospects get real answers instantly and we book more follow-ups.', name: 'Marcus Chen', title: 'VP Sales', company: 'CloudScale', metric: '+52% SQL rate' },
  { quote: 'We eliminated the SE scheduling bottleneck overnight. Our reps run discovery calls independently now and the handoff quality is better than before.', name: 'Sarah Kim', title: 'Head of Revenue Ops', company: 'TechScale Inc', metric: '3x more calls/week' },
  { quote: 'The real-time field extraction is magic. By the time the call ends, the CRM entry is already done — no more post-call admin.', name: 'James Park', title: 'CRO', company: 'Nexus Platform', metric: '80% less admin time' },
  { quote: 'Our prospects actually prefer talking to the AI for technical questions. It gives precise, grounded answers without the sales fluff.', name: 'Elena Rodriguez', title: 'Director of Sales', company: 'DevFirst', metric: '94% answer accuracy' },
  { quote: 'The objection handling caught a pricing concern we would have missed. Saved a $200K deal that was about to go dark.', name: 'David Okafor', title: 'Account Executive', company: 'Meridian SaaS', metric: '$200K deal saved' },
  { quote: 'Finally — an AI tool that makes reps more effective instead of replacing them. The mute button gives us full control.', name: 'Priya Sharma', title: 'VP Sales Engineering', company: 'Orbit Analytics', metric: '+38% quota attainment' },
];

export default function Testimonials() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-zinc-900 mb-12">Trusted by B2B sales teams closing faster</h2>

        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {testimonials.map((t) => (
            <div key={t.name} className="mb-4 break-inside-avoid rounded-xl border border-zinc-100 bg-white p-6 space-y-4">
              <p className="text-sm text-zinc-600 leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.title}, {t.company}</p>
                </div>
              </div>
              <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{t.metric}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
