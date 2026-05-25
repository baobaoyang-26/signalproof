import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/ui/site-header";
import { CHECKOUT_BUTTON_LABEL, LEMONSQUEEZY_CHECKOUT_URL } from "@/lib/checkout";

const metrics = [
  { value: "12k+", label: "Signals processed" },
  { value: "180+", label: "Partner memos" },
  { value: "24h", label: "Delivery SLA" },
];

const steps = [
  {
    step: "01",
    title: "Submit profile",
    body: "Share your website or social profile plus niche context.",
  },
  {
    step: "02",
    title: "We scrape & analyze",
    body: "Firecrawl extracts live evidence; GPT produces a VC-style memo.",
  },
  {
    step: "03",
    title: "Shareable report",
    body: "Score, moat, risks, and investment verdict in one link.",
  },
];

const plans = [
  {
    name: "Validation Report",
    price: "$29",
    description: "Full partner memo for one market wedge.",
    features: [
      "Website evidence scrape",
      "Validation score & confidence",
      "Moat & failure analysis",
      "Shareable report URL",
    ],
    featured: true,
  },
  {
    name: "Deep Dive",
    price: "$79",
    description: "Expanded diligence for compare-and-build decisions.",
    features: [
      "Everything in Validation",
      "Extended competition map",
      "Founder diligence questions",
      "Priority delivery",
    ],
    featured: false,
  },
];

const previewScores = [
  { label: "Validation", value: 74 },
  { label: "Demand", value: 68 },
  { label: "Competition", value: 52 },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="pointer-events-none fixed inset-0 bg-hero-glow" />
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-40" />
      <SiteHeader
        cta={{ href: "/order", label: "Get report" }}
        nav={[
          { href: "#product", label: "Product" },
          { href: "#process", label: "Process" },
          { href: "#pricing", label: "Pricing" },
        ]}
      />

      <main className="relative">
        <section className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-muted">
              <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_#3b82f6]" />
              VC-grade validation · Powered by live website evidence
            </p>
            <h1 className="mt-8 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-gradient">Evidence-first</span>
              <br />
              startup validation
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted">
              SignalProof turns your website and niche into a partner-level investment
              memo — score, moat, risks, and verdict — not another generic AI summary.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                className="w-full rounded-lg bg-white px-8 py-3.5 text-center text-sm font-semibold text-canvas transition hover:bg-white/90 sm:w-auto"
                href="/order"
              >
                Start validation
              </Link>
              <a
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-8 py-3.5 text-center text-sm font-medium text-white transition hover:border-white/20 sm:w-auto"
                href="#product"
              >
                See report preview
              </a>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">
            {metrics.map((m) => (
              <Card className="p-5 text-center" key={m.label}>
                <p className="text-2xl font-semibold tabular-nums text-white">{m.value}</p>
                <p className="mt-1 text-xs text-subtle">{m.label}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-white/[0.06] bg-surface/40 py-16 sm:py-20" id="product">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                Report preview
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Built to look like internal VC tooling
              </h2>
              <p className="mt-4 text-muted leading-7">
                Dark dashboard layout, score visualization, evidence blocks, and a
                shareable link you can forward to co-founders or advisors.
              </p>
            </div>
            <Card className="overflow-hidden p-6 glow" glow>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <span className="font-mono text-xs text-subtle">SP-VALIDATION</span>
                <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success">
                  Strong Opportunity
                </span>
              </div>
              <div className="mt-6 flex items-center gap-8">
                <div className="relative flex size-24 items-center justify-center rounded-full border-4 border-accent/50 text-2xl font-bold text-white">
                  74
                </div>
                <div className="flex-1 space-y-3">
                  {previewScores.map((s) => (
                    <div key={s.label}>
                      <div className="mb-1 flex justify-between text-xs text-muted">
                        <span>{s.label}</span>
                        <span className="tabular-nums">{s.value}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${s.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-6 text-sm leading-6 text-muted">
                Moat analysis, website evidence, and investment verdict — structured
                like a Monday partner memo.
              </p>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24" id="process">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Three steps to a decision</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((item) => (
              <Card className="p-6" key={item.title}>
                <span className="font-mono text-xs text-accent">{item.step}</span>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section
          className="border-t border-white/[0.06] bg-surface/30 py-16 sm:py-24"
          id="pricing"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
                Pricing
              </p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                One-time reports. Premium output.
              </h2>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {plans.map((plan) => (
                <Card
                  className={`p-8 ${plan.featured ? "border-accent/30 shadow-glow" : ""}`}
                  glow={plan.featured}
                  key={plan.name}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      <p className="mt-2 text-sm text-muted">{plan.description}</p>
                    </div>
                    <p className="text-3xl font-semibold tabular-nums">{plan.price}</p>
                  </div>
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((f) => (
                      <li className="flex gap-3 text-sm text-muted" key={f}>
                        <span className="text-accent">→</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-lg py-3 text-sm font-semibold transition ${
                      plan.featured
                        ? "bg-white text-canvas hover:bg-white/90"
                        : "border border-white/10 bg-white/[0.04] text-white hover:border-white/20"
                    }`}
                    href={LEMONSQUEEZY_CHECKOUT_URL}
                  >
                    {CHECKOUT_BUTTON_LABEL}
                  </a>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
          <Card className="relative overflow-hidden px-8 py-14 text-center sm:px-12" glow>
            <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60" />
            <div className="relative">
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Validate before you build
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted">
                Submit your profile. Get a shareable partner memo in 24 hours.
              </p>
              <Link
                className="mt-8 inline-flex rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-canvas hover:bg-white/90"
                href="/order"
              >
                {CHECKOUT_BUTTON_LABEL}
              </Link>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-subtle">
        SignalProof · Confidential validation memos
      </footer>
    </div>
  );
}
