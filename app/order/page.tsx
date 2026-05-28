import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/ui/site-header";
import { OrderForm } from "@/components/order/order-form";
import {
  CHECKOUT_COMING_SOON_MESSAGE,
  CHECKOUT_NOT_CONFIGURED_MESSAGE,
  CHECKOUT_PLAN_META,
  isSellablePlan,
  parseCheckoutPlan,
} from "@/lib/checkout";
import { ORDER_PAGE, PRICING } from "@/lib/site-copy";

type PageProps = {
  searchParams: Promise<{ plan?: string; status?: string }>;
};

export default async function OrderPage({ searchParams }: PageProps) {
  const { plan: planParam, status } = await searchParams;
  const requestedPlan = parseCheckoutPlan(planParam);
  const sellable = isSellablePlan(requestedPlan);
  const plan = "single_memo" as const;
  const planMeta = CHECKOUT_PLAN_META[plan];

  const statusMessage =
    status === "checkout_unavailable"
      ? CHECKOUT_NOT_CONFIGURED_MESSAGE
      : status === "coming_soon"
        ? CHECKOUT_COMING_SOON_MESSAGE
        : null;

  return (
    <div className="notranslate min-h-screen bg-canvas bg-grid" lang="en" translate="no">
      <div className="pointer-events-none fixed inset-0 bg-hero-glow opacity-40" />
      <SiteHeader cta={{ href: "/", label: "Home" }} variant="app" />

      <section className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
        <div className="flex flex-col lg:pt-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            {ORDER_PAGE.eyebrow}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              {ORDER_PAGE.title}
            </h1>
            {sellable ? (
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                {planMeta.name} · {planMeta.displayPrice}
              </span>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-subtle">
                Coming Soon
              </span>
            )}
          </div>
          <p className="mt-6 max-w-md text-base leading-8 text-muted">{ORDER_PAGE.subtitle}</p>
          {sellable ? (
            <div className="mt-8 space-y-3 text-sm leading-7 text-subtle">
              <p>{ORDER_PAGE.formHint}</p>
              <p className="text-xs text-subtle">{planMeta.billingNote}</p>
              <p>{PRICING.checkoutPaymentNotice}</p>
            </div>
          ) : null}
          {statusMessage ? (
            <p
              className="mt-6 rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm leading-7 text-warn"
              role="alert"
            >
              {statusMessage}
            </p>
          ) : null}
        </div>

        <Card className="p-7 sm:p-9" glow>
          {!sellable ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-subtle">Coming Soon</p>
              <p className="mt-4 text-base leading-7 text-muted">{CHECKOUT_COMING_SOON_MESSAGE}</p>
              <a
                className="mt-8 inline-flex rounded-lg bg-white px-6 py-3 text-sm font-semibold text-canvas hover:bg-white/90"
                href="/order"
              >
                {ORDER_PAGE.orderSingleMemoCta}
              </a>
            </div>
          ) : (
            <OrderForm />
          )}
        </Card>
      </section>
    </div>
  );
}
