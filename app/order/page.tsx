import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/ui/site-header";
import {
  CHECKOUT_BUTTON_LABEL,
  LEMONSQUEEZY_CHECKOUT_URL,
} from "@/lib/checkout";
import { submitOrderForm } from "./actions";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-canvas/80 px-4 py-3 text-base text-white outline-none transition placeholder:text-subtle focus:border-accent/50 focus:ring-1 focus:ring-accent/30";

export default function OrderPage() {
  return (
    <div className="min-h-screen bg-canvas bg-grid">
      <div className="pointer-events-none fixed inset-0 bg-hero-glow opacity-40" />
      <SiteHeader cta={{ href: "/", label: "Back" }} variant="app" />

      <section className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div className="flex flex-col">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Validation report
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Submit your profile
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted">
            We scrape your website, run partner-level analysis, and deliver a
            shareable VC memo within 24 hours.
          </p>
          <a
            className="mt-8 inline-flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white transition hover:border-white/20 sm:w-auto"
            href={LEMONSQUEEZY_CHECKOUT_URL}
          >
            {CHECKOUT_BUTTON_LABEL} only
          </a>
          <p className="mt-4 text-sm text-subtle">
            Or complete the form below — checkout follows submission.
          </p>
        </div>

        <Card className="p-6 sm:p-8" glow>
          <form action={submitOrderForm}>
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-muted">Email</span>
                <input
                  className={inputClass}
                  name="email"
                  placeholder="founder@company.com"
                  required
                  type="email"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-muted">Social profile URL</span>
                <input
                  className={inputClass}
                  name="socialProfileUrl"
                  placeholder="https://yoursite.com or LinkedIn"
                  required
                  type="url"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-muted">Industry / niche</span>
                <input
                  className={inputClass}
                  name="industryNiche"
                  placeholder="B2B SaaS, creator economy, ecommerce"
                  required
                  type="text"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-muted">Main concern</span>
                <input
                  className={inputClass}
                  name="mainConcern"
                  placeholder="What should this report help you validate?"
                  required
                  type="text"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-muted">Additional notes</span>
                <textarea
                  className={`${inputClass} min-h-28 resize-y`}
                  name="additionalNotes"
                  placeholder="Optional context, competitors, or goals"
                />
              </label>
            </div>

            <button
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-canvas transition hover:bg-white/90"
              type="submit"
            >
              {CHECKOUT_BUTTON_LABEL}
            </button>
          </form>
        </Card>
      </section>
    </div>
  );
}
