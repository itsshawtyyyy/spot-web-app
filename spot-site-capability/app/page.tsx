const metrics = [
  { label: "Campaigns launched", value: "1.2k" },
  { label: "Avg. conversion lift", value: "+38%" },
  { label: "Teams active", value: "86" },
];

const features = [
  {
    title: "Plan the launch",
    text: "Coordinate tasks, timelines, and contributors in one shared event workflow.",
  },
  {
    title: "Track momentum",
    text: "See what is moving, what is delayed, and where your audience is engaging.",
  },
  {
    title: "Publish quickly",
    text: "Turn approved updates into release-ready copy, assets, and announcements.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f4ef] text-stone-900">
      <div className="mx-auto max-w-7xl px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-stone-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
              S
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-stone-500 uppercase">
                SPOT
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-stone-600 md:flex">
            <a href="#features" className="transition hover:text-stone-900">
              Features
            </a>
            <a href="#workflow" className="transition hover:text-stone-900">
              Workflow
            </a>
            <a href="#results" className="transition hover:text-stone-900">
              Results
            </a>
          </nav>

          <button className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700">
            Request demo
          </button>
        </header>

        <section className="grid items-center gap-10 pb-16 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center rounded-full border border-[#d9c8b1] bg-[#f2e7d9] px-3 py-1 text-xs font-medium tracking-[0.12em] text-stone-700 uppercase">
              Launch smarter
            </div>
            <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.06em] text-stone-900 sm:text-6xl">
              Turn event momentum into measurable outcomes.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
              SPOT helps teams coordinate launches, activate audiences, and keep every decision aligned from idea to execution.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700">
                Start planning
              </button>
              <button className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-50">
                View examples
              </button>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="text-2xl font-semibold tracking-tight text-stone-900">{metric.value}</div>
                  <div className="mt-2 text-xs leading-5 text-stone-500">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_24px_70px_rgba(28,25,23,0.08)]">
            <div className="rounded-[22px] bg-[#f3efe9] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
                  <span className="h-3 w-3 rounded-full bg-[#10b981]" />
                  <span className="h-3 w-3 rounded-full bg-[#f43f5e]" />
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] text-stone-600 uppercase">
                  Live board
                </span>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium tracking-[0.14em] text-stone-500 uppercase">Campaign</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight">Spring launch</h2>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    On track
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    ["Audience research", "Completed"],
                    ["Creative review", "In progress"],
                    ["Channel launch", "Due today"],
                  ].map(([label, status]) => (
                    <div key={label} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5">
                      <span className="text-sm text-stone-700">{label}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-stone-600 shadow-sm">
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16">
          <div className="mb-8 max-w-xl">
            <p className="text-sm font-medium tracking-[0.14em] text-stone-500 uppercase">Why SPOT</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">Everything your launch team needs, in sync.</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e9e0] text-lg">✦</div>
                <h3 className="text-xl font-semibold text-stone-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="py-8">
          <div className="rounded-[32px] border border-stone-200 bg-stone-900 px-6 py-8 text-white sm:px-8 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-3">
              {[
                ["01", "Map the moment", "Define the audience, timing, and message before launch day."],
                ["02", "Coordinate the team", "Align goals, owners, and approvals in a single source of truth."],
                ["03", "Measure the response", "Track engagement and iterate without losing momentum."],
              ].map(([step, title, description]) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-medium tracking-[0.18em] text-stone-300 uppercase">{step}</div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="results" className="py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium tracking-[0.14em] text-stone-500 uppercase">Results</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">Built for teams that move fast.</h2>
            </div>
            <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700">
              4.9/5 from launch teams
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
