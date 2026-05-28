import type { Order } from "@/lib/orders";
import { getCheckoutSuccessUrl } from "@/lib/checkout-success-url";
import { createLemonSqueezyCheckout } from "@/lib/lemonsqueezy-checkout";
import { PRICING, PRIMARY_CTA } from "@/lib/site-copy";

/** LemonSqueezy checkout plans. Single Memo bills ¥199 CNY at checkout ($29 equivalent positioning). */
export type CheckoutPlan = "single_memo" | "portfolio_pack";

export const CHECKOUT_BUTTON_LABEL = PRIMARY_CTA;
export const PRIMARY_CTA_LABEL = PRIMARY_CTA;

export const CHECKOUT_NOT_CONFIGURED_MESSAGE =
  "Checkout is not configured yet. Please contact support.";

export const CHECKOUT_COMING_SOON_MESSAGE =
  "Advanced Competitive Intelligence is coming soon.";

export const CHECKOUT_PLAN_META: Record<
  CheckoutPlan,
  { name: string; displayPrice: string; billingNote: string; cta: string }
> = {
  single_memo: {
    name: "Startup Intelligence",
    displayPrice: PRICING.singleMemo.displayPrice,
    billingNote: PRICING.singleMemo.billingNote,
    cta: PRIMARY_CTA,
  },
  portfolio_pack: {
    name: "Advanced Competitive Intelligence",
    displayPrice: "",
    billingNote: "",
    cta: PRIMARY_CTA,
  },
};

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function resolveUrlFromEnv(serverKey: string, publicKey: string): string {
  return readEnv(serverKey) || readEnv(publicKey);
}

/** Single Memo checkout (¥199 CNY on LemonSqueezy). Set LEMONSQUEEZY_CHECKOUT_SINGLE_MEMO_URL in .env.local */
export const CHECKOUT_SINGLE_MEMO_URL = resolveUrlFromEnv(
  "LEMONSQUEEZY_CHECKOUT_SINGLE_MEMO_URL",
  "NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_SINGLE_MEMO_URL",
);

/** Reserved — not sold yet */
export const CHECKOUT_PORTFOLIO_PACK_URL = resolveUrlFromEnv(
  "LEMONSQUEEZY_CHECKOUT_PORTFOLIO_PACK_URL",
  "NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_PORTFOLIO_PACK_URL",
);

/** @deprecated Use CHECKOUT_SINGLE_MEMO_URL */
export const LEMONSQUEEZY_CHECKOUT_URL = CHECKOUT_SINGLE_MEMO_URL;

export function parseCheckoutPlan(value: string | undefined | null): CheckoutPlan {
  if (value === "portfolio_pack" || value === "portfolio") return "portfolio_pack";
  return "single_memo";
}

export function isSellablePlan(plan: CheckoutPlan): boolean {
  return plan === "single_memo";
}

function isValidSingleCheckoutUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export type CheckoutResolveResult =
  | { ok: true; url: string; successUrl: string }
  | { ok: false; message: string };

export type CheckoutOrderRef = Pick<Order, "id" | "email">;

function buildStaticCheckoutUrl(plan: CheckoutPlan, order?: CheckoutOrderRef): string {
  const url = new URL(CHECKOUT_SINGLE_MEMO_URL);
  url.searchParams.set("checkout[custom][plan]", plan);
  if (order) {
    url.searchParams.set("checkout[custom][order_id]", order.id);
    url.searchParams.set("checkout[email]", order.email);
  }
  return url.toString();
}

/** Static share-link checkout (redirect URL must be set in LemonSqueezy dashboard). */
export function resolveCheckoutUrl(
  plan: CheckoutPlan,
  order?: CheckoutOrderRef,
): CheckoutResolveResult {
  if (!isSellablePlan(plan)) {
    return { ok: false, message: CHECKOUT_COMING_SOON_MESSAGE };
  }

  const base = CHECKOUT_SINGLE_MEMO_URL;
  if (!isValidSingleCheckoutUrl(base)) {
    return { ok: false, message: CHECKOUT_NOT_CONFIGURED_MESSAGE };
  }

  const successUrl = getCheckoutSuccessUrl();
  if (!successUrl) {
    return { ok: false, message: CHECKOUT_NOT_CONFIGURED_MESSAGE };
  }

  try {
    return { ok: true, url: buildStaticCheckoutUrl(plan, order), successUrl };
  } catch {
    return { ok: false, message: CHECKOUT_NOT_CONFIGURED_MESSAGE };
  }
}

/**
 * Prefer LemonSqueezy API checkout with redirect_url → /success.
 * Falls back to static checkout URL when API key is not configured.
 */
export async function resolveCheckoutUrlAsync(
  plan: CheckoutPlan,
  order: CheckoutOrderRef,
): Promise<CheckoutResolveResult> {
  if (!isSellablePlan(plan)) {
    return { ok: false, message: CHECKOUT_COMING_SOON_MESSAGE };
  }

  const successUrl = getCheckoutSuccessUrl();
  if (!successUrl) {
    return { ok: false, message: CHECKOUT_NOT_CONFIGURED_MESSAGE };
  }

  const apiCheckout = await createLemonSqueezyCheckout({
    email: order.email,
    orderId: order.id,
    plan,
  });
  if (apiCheckout) {
    return { ok: true, url: apiCheckout, successUrl };
  }

  const staticResult = resolveCheckoutUrl(plan, order);
  if (staticResult.ok) {
    console.warn(
      "[SignalProof] Using static LemonSqueezy link — set product redirect to",
      successUrl,
      "or add LEMONSQUEEZY_API_KEY for automatic redirect_url",
    );
  }
  return staticResult;
}

export function isCheckoutConfigured(): boolean {
  return resolveCheckoutUrl("single_memo").ok;
}

/** @deprecated Prefer resolveCheckoutUrlAsync */
export function buildCheckoutUrl(plan: CheckoutPlan, order?: CheckoutOrderRef): string | null {
  const result = resolveCheckoutUrl(plan, order);
  return result.ok ? result.url : null;
}

/** @deprecated Prefer resolveCheckoutUrlAsync */
export function getCheckoutUrlForPlan(plan: CheckoutPlan): string | null {
  return buildCheckoutUrl(plan);
}
