import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/ui/site-header";
import { PRIMARY_CTA_LABEL } from "@/lib/checkout";
import {
  ANALYZED_COMPANIES,
  FOOTER_TAGLINE,
  HERO,
  LANDING,
  PREVIEW_SCORES,
  PRICING,
  SAMPLE_INSIGHTS,
} from "@/lib/site-copy";

export default function Home() {
  return (
    <div className="notranslate min-h-screen bg-canvas" lang="en" translate="no">
      <div className="pointer-events-none fixed inset-0 bg-hero-glow" />
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-40" />
      <SiteHeader
        cta={{ href: "/order", label: PRIMARY_CTA_LABEL }}
        nav={[...LANDING.nav]}
      />

      <main className="relative">
        <section className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium tracking-wide text-muted">
              <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_#3b82f6]" />
              {HERO.eyebrow}
            </p>
            <h1 className="mt-8 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-[4.25rem] lg:leading-[1.05]">
              <span className="text-gradient">{HERO.title}</span>
              <br />
              <span className="text-white/95">{HERO.titleAccent}</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              {HERO.subtitle}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                className="w-full rounded-lg bg-white px-8 py-3.5 text-center text-sm font-semibold text-canvas transition hover:bg-white/90 sm:w-auto"
                href="/order"
              >
                {PRIMARY_CTA_LABEL}
              </Link>
              <a
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-8 py-3.5 text-center text-sm font-medium text-white transition hover:border-white/20 sm:w-auto"
                href="#insights"
              >
                {HERO.secondaryCta}
              </a>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">
            {LANDING.metrics.map((m) => (
              <Card className="p-5 text-center" key={m.label}>
                <p className="text-2xl font-semibold tabular-nums text-white">{m.value}</p>
                <p className="mt-1 text-xs text-subtle">{m.label}</p>
              </Card>
            ))}
          </div>
        </section>

        <section
          className="border-y border-white/[0.06] bg-surface/40 py-16 sm:py-20"
          id="insights"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                {LANDING.insights.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {LANDING.insights.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">{LANDING.insights.subtitle}</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {SAMPLE_INSIGHTS.map((item) => (
                <Card
                  className={`relative overflow-hidden border-white/[0.08] p-6 bg-gradient-to-br ${item.accent}`}
                  key={item.company}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                    {item.company}
                  </p>
                  <blockquote className="mt-5 space-y-3">
                    {item.lines.map((line) => (
                      <p
                        className="text-base font-medium leading-snug text-white sm:text-lg"
                        key={line}
                      >
                        {line}
                      </p>
                    ))}
                  </blockquote>
                  <p className="mt-6 text-[10px] uppercase tracking-wider text-subtle">
                    {LANDING.insights.sampleTag}
                  </p>
                </Card>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
                {LANDING.insights.companiesEyebrow}
              </p>
              <p className="mt-3 text-sm text-muted">{LANDING.insights.companiesSubtitle}</p>
              <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {ANALYZED_COMPANIES.map((name) => (
                  <li
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white"
                    key={name}
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24" id="product">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                {LANDING.product.eyebrow}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {LANDING.product.title}
              </h2>
              <p className="mt-4 leading-7 text-muted">{LANDING.product.subtitle}</p>
            </div>
            <Card className="overflow-hidden p-6 glow" glow>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <span className="font-mono text-xs text-subtle">{LANDING.product.previewTag}</span>
                <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success">
                  {LANDING.product.verdictBadge}
                </span>
              </div>
              <div className="mt-6 flex items-center gap-8">
                <div className="relative flex size-24 items-center justify-center rounded-full border-4 border-accent/50 text-2xl font-bold text-white">
                  74
                </div>
                <div className="flex-1 space-y-3">
                  {PREVIEW_SCORES.map((s) => (
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
              <p className="mt-6 text-sm leading-6 text-muted">{LANDING.product.previewFooter}</p>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24" id="process">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
            {LANDING.process.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{LANDING.process.title}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {LANDING.process.steps.map((item) => (
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
                {LANDING.pricing.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{LANDING.pricing.title}</h2>
              <p className="mt-4 text-sm leading-7 text-muted">{LANDING.pricing.subtitle}</p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <Card className="border-accent/30 p-8 shadow-glow" glow>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                  {LANDING.pricing.availableNow}
                </p>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{LANDING.pricing.singleMemo.name}</h3>
                    <p className="mt-2 text-sm font-medium text-white/90">
                      {LANDING.pricing.singleMemo.tagline}
                    </p>
                    <p className="mt-3 text-sm text-muted">
                      {LANDING.pricing.singleMemo.description}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                      {PRICING.singleMemo.displayPrice}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-subtle">
                      {PRICING.singleMemo.billingNote}
                    </p>
                  </div>
                </div>
                <p className="mt-8 text-xs font-medium uppercase tracking-wider text-subtle">
                  {LANDING.pricing.includesLabel}
                </p>
                <ul className="mt-4 space-y-3">
                  {LANDING.pricing.singleMemo.outcomes.map((outcome) => (
                    <li className="flex gap-3 text-sm text-white" key={outcome}>
                      <span className="text-success">✓</span>
                      {outcome}
                    </li>
                  ))}
                </ul>
                <Link
                  className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-white py-3 text-sm font-semibold text-canvas transition hover:bg-white/90"
                  href="/order"
                >
                  {PRIMARY_CTA_LABEL}
                </Link>
              </Card>

              <Card
                aria-disabled
                className="pointer-events-none border-white/[0.06] bg-surface/40 p-8 opacity-55"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-subtle">
                  {LANDING.pricing.advanced.badge}
                </p>
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-white/80">
                    {LANDING.pricing.advanced.name}
                  </h3>
                  <p className="mt-3 text-sm text-muted">{LANDING.pricing.advanced.description}</p>
                </div>
                <p className="mt-8 text-xs font-medium uppercase tracking-wider text-subtle">
                  {LANDING.pricing.includesLabel}
                </p>
                <ul className="mt-4 space-y-3">
                  {LANDING.pricing.advanced.outcomes.map((outcome) => (
                    <li className="flex gap-3 text-sm text-muted" key={outcome}>
                      <span className="text-subtle">✓</span>
                      {outcome}
                    </li>
                  ))}
                </ul>
                <button
                  className="mt-8 inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] py-3 text-sm font-semibold text-subtle"
                  disabled
                  type="button"
                >
                  {LANDING.pricing.advanced.cta}
                </button>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
          <Card className="relative overflow-hidden px-8 py-14 text-center sm:px-12" glow>
            <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60" />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {HERO.closingLine}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-muted">{HERO.subtitle}</p>
              <Link
                className="mt-8 inline-flex rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-canvas hover:bg-white/90"
                href="/order"
              >
                {PRIMARY_CTA_LABEL}
              </Link>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-10 text-center text-xs leading-6 text-subtle">
        SignalProof · {FOOTER_TAGLINE}
      </footer>
    </div>
  );
}
