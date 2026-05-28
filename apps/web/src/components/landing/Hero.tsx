export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 text-center">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm text-zinc-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          AI Voice Sales Engineer
        </div>

        <h1 className="text-5xl font-bold leading-tight tracking-tight text-zinc-900 md:text-6xl">
          Your AI sales engineer<br />on every discovery call
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-zinc-500 leading-relaxed">
          DealPilot AI joins live B2B sales calls, qualifies prospects through voice conversation, answers technical questions, and generates{' '}
          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-sm font-medium text-blue-700">CRM-ready handoffs</span> — so your reps never lose a deal to a missed technical question.
        </p>

        <div className="flex items-center justify-center gap-4">
          <a href="/app" className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors">
            Start Free Trial
          </a>
          <a href="/book-demo" className="rounded-md border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
            Book a Demo
          </a>
        </div>
      </div>
    </section>
  );
}
