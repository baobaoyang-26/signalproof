import Link from "next/link";

const metrics = [
  { value: "12k+", label: "Public Reddit signals reviewed" },
  { value: "180+", label: "Opportunity reports drafted" },
  { value: "34", label: "Founder validation use cases" },
];

const samplePainPoints = [
  {
    niche: "Freelance tools",
    pain: "Proposal work is repetitive, slow, and often ends in ghosted leads.",
    signal: "Repeated threads mention proposal fatigue, unclear scope, and weak follow-up.",
    opportunity: "A focused proposal and follow-up assistant for Webflow, design, and no-code freelancers.",
  },
  {
    niche: "Shopify operators",
    pain: "Store owners answer the same shipping, returns, sizing, and discount questions manually.",
    signal: "Operators want support automation without a full enterprise helpdesk.",
    opportunity: "A done-for-you AI FAQ and support setup for lean Shopify stores.",
  },
  {
    niche: "AI agencies",
    pain: "Agencies need specific workflows painful enough to pitch and monetize.",
    signal: "Founders ask for niches, workflows, and proof of willingness to pay.",
    opportunity: "Weekly workflow-pain intelligence for AI automation agencies.",
  },
];

const steps = [
  {
    title: "Pick a market",
    body: "Send a niche, customer segment, competitor, or workflow you are considering before you build.",
  },
  {
    title: "We extract the signal",
    body: "We review public Reddit discussions for complaints, workarounds, buying intent, competitor frustration, and repeated language.",
  },
  {
    title: "Get a validation brief",
    body: "Receive pain points, source links, opportunity scores, MVP angles, and go-to-market notes within 24 hours.",
  },
];

const reportItems = [
  "10 high-signal pain points with plain-English summaries",
  "Source links to public Reddit threads for verification",
  "Pain intensity, frequency, and buyer-intent scoring",
  "Competitor gaps and weak existing alternatives",
  "MVP concepts a solo founder could ship quickly",
  "Landing page angles, SEO topics, and cold outreach hooks",
];

const plans = [
  {
    name: "Opportunity Report",
    price: "$29",
    description: "A focused validation brief for one niche, audience, or product direction.",
    features: [
      "10 validated pain points",
      "Public Reddit source links",
      "Opportunity scoring",
      "MVP and positioning ideas",
      "Delivered in 24 hours",
    ],
    primary: true,
  },
  {
    name: "Deep Dive Report",
    price: "$79",
    description: "A deeper brief for founders comparing opportunities or preparing a build sprint.",
    features: [
      "20 validated pain points",
      "Competitor frustration analysis",
      "Top 3 product opportunities",
      "Landing page and outreach copy",
      "SEO content angles",
    ],
    primary: false,
  },
];

const faqs = [
  {
    question: "Is this a SaaS dashboard?",
    answer:
      "Not yet. The MVP is intentionally report-first so founders can buy a useful validation artifact without learning another tool.",
  },
  {
    question: "Is the research human-reviewed?",
    answer:
      "Yes. AI helps cluster and summarize public discussions, but every report is reviewed before delivery so the output stays specific and usable.",
  },
  {
    question: "What data do you use?",
    answer:
      "We use public Reddit discussions and provide source links where possible. We do not use private messages, private communities, or personal outreach lists.",
  },
  {
    question: "Which markets work best?",
    answer:
      "B2B SaaS, indie tools, AI tools, ecommerce operations, creator workflows, agencies, freelancers, and small business software usually work best.",
  },
  {
    question: "What exactly will I receive?",
    answer:
      "You receive a concise PDF or document-style report with pain points, evidence links, opportunity scoring, MVP ideas, positioning notes, and go-to-market angles.",
  },
  {
    question: "Will this guarantee a winning startup idea?",
    answer:
      "No. It is a validation input, not a guarantee. It helps you replace founder guesses with real user language before you spend weeks building.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link className="flex items-center gap-3" href="/" aria-label="SignalProof home">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d4d4d4] bg-white text-sm font-semibold">
            S
          </span>
          <span className="text-sm font-semibold tracking-tight">SignalProof</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-[#666] md:flex">
          <a className="transition hover:text-[#0a0a0a]" href="#sample">
            Examples
          </a>
          <a className="transition hover:text-[#0a0a0a]" href="#process">
            Process
          </a>
          <a className="transition hover:text-[#0a0a0a]" href="#pricing">
            Pricing
          </a>
        </nav>
        <Link
          className="rounded-md bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2a2a2a]"
          href="/order"
        >
          Order report
        </Link>
      </header>

      <section className="mx-auto w-full max-w-7xl px-5 pb-24 pt-20 sm:px-8 sm:pb-28 sm:pt-28 lg:px-10 lg:pb-32 lg:pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 text-sm font-medium text-[#666]">
            Market validation reports for SaaS founders, indie hackers, and AI builders
          </p>
          <h1 className="text-4xl font-semibold leading-[1.04] tracking-tight text-[#0a0a0a] sm:text-6xl sm:leading-[1.02] lg:text-7xl">
            Build from market signal, not founder intuition.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#525252] sm:text-xl">
            A founder-ready report built from public Reddit complaints,
            repeated workarounds, competitor frustration, and buying intent.
            Delivered in 24 hours.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              className="w-full rounded-md bg-[#0a0a0a] px-6 py-3.5 text-center text-base font-medium text-white transition hover:bg-[#2a2a2a] sm:w-auto"
              href="/order"
            >
              Validate my idea
            </Link>
            <a
              className="w-full rounded-md border border-[#d4d4d4] bg-white px-6 py-3.5 text-center text-base font-medium text-[#0a0a0a] transition hover:border-[#a3a3a3] sm:w-auto"
              href="#sample"
            >
              See real pain examples
            </a>
          </div>
          <p className="mt-5 text-sm text-[#737373]">
            No generic AI idea lists. No dashboard to learn. Just source-backed
            opportunities you can evaluate before writing code.
          </p>
        </div>
      </section>

      <section className="border-y border-[#eeeeee] bg-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#eeeeee] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
          {metrics.map((metric) => (
            <div className="py-8 md:px-8" key={metric.label}>
              <p className="text-3xl font-semibold tracking-tight">{metric.value}</p>
              <p className="mt-2 text-sm text-[#666]">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="sample" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-sm font-medium text-[#737373]">Sample pain points</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Real user frustration, converted into startup direction.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#525252]">
              Each report turns noisy public discussions into clear problems,
              repeated language, and concrete product angles.
            </p>
          </div>
          <div className="grid gap-4">
            {samplePainPoints.map((item) => (
              <article
                className="rounded-xl border border-[#eeeeee] bg-[#fafafa] p-5 sm:p-6"
                key={item.niche}
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold">{item.niche}</h3>
                  <span className="w-fit rounded-full border border-[#d4d4d4] px-3 py-1 text-xs font-medium text-[#525252]">
                    Reddit signal
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#737373]">
                      Pain
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#171717]">{item.pain}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#737373]">
                      Signal
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#171717]">{item.signal}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#737373]">
                      Opportunity
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#171717]">
                      {item.opportunity}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="border-y border-[#eeeeee] bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#737373]">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A fast validation workflow before you commit to a build.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div className="rounded-xl border border-[#eeeeee] bg-[#fafafa] p-6" key={step.title}>
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0a0a0a] text-sm font-medium text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#525252]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-medium text-[#737373]">What you get</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A concise brief built for founder decisions.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#525252]">
              Use it to decide what to build, who it is for, and how to test
              demand without overbuilding.
            </p>
          </div>
          <div className="rounded-xl border border-[#eeeeee] bg-[#fafafa] p-4 sm:p-5">
            <div className="divide-y divide-[#eeeeee]">
              {reportItems.map((item) => (
                <div className="flex gap-4 py-4" key={item}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a0a0a]" />
                  <p className="text-base leading-7 text-[#171717]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-[#eeeeee] bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-[#737373]">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              One-time reports. No subscription required.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => (
              <div
                className={`rounded-xl border p-6 sm:p-8 ${
                  plan.primary
                    ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                    : "border-[#eeeeee] bg-[#fafafa] text-[#0a0a0a]"
                }`}
                key={plan.name}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p
                      className={`mt-2 text-sm leading-6 ${
                        plan.primary ? "text-white/70" : "text-[#525252]"
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>
                  <p className="text-4xl font-semibold tracking-tight">{plan.price}</p>
                </div>
                <div
                  className={`my-7 h-px ${plan.primary ? "bg-white/15" : "bg-[#eeeeee]"}`}
                />
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li className="flex gap-3 text-sm leading-6" key={feature}>
                      <span
                        className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                          plan.primary ? "bg-white" : "bg-[#0a0a0a]"
                        }`}
                      />
                      <span className={plan.primary ? "text-white/85" : "text-[#171717]"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-md px-5 py-3 text-sm font-medium transition ${
                    plan.primary
                      ? "bg-white text-[#0a0a0a] hover:bg-[#e5e5e5]"
                      : "border border-[#d4d4d4] bg-white text-[#0a0a0a] hover:border-[#a3a3a3]"
                  }`}
                  href="/order"
                >
                  {plan.primary ? "Order the $29 report" : "Order the $79 deep dive"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-medium text-[#737373]">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              What founders usually ask before ordering.
            </h2>
          </div>
          <div className="divide-y divide-[#eeeeee] rounded-xl border border-[#eeeeee] bg-[#fafafa]">
            {faqs.map((faq) => (
              <details className="group p-5 sm:p-6" key={faq.question}>
                <summary className="cursor-pointer list-none">
                  <span className="flex items-center justify-between gap-5 text-base font-semibold">
                    {faq.question}
                    <span className="text-xl font-light text-[#737373] transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#525252]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-2xl border border-[#0a0a0a] bg-[#0a0a0a] px-6 py-16 text-center text-white sm:px-10">
          <p className="text-sm font-medium text-white/60">Ready to validate?</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Before you build, find the pain people already admit.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70">
            Send us a niche. We will return the clearest Reddit-backed pain
            points, opportunity angles, evidence links, and next steps within
            24 hours.
          </p>
          <Link
            className="mt-8 inline-flex w-full items-center justify-center rounded-md bg-white px-6 py-3.5 text-base font-medium text-[#0a0a0a] transition hover:bg-[#e5e5e5] sm:w-auto"
            href="/order"
          >
            Order my validation report
          </Link>
        </div>
      </section>
    </main>
  );
}
