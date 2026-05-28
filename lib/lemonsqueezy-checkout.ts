import { getCheckoutSuccessUrl } from "@/lib/checkout-success-url";
import type { CheckoutPlan } from "@/lib/checkout";

type LemonCheckoutResponse = {
  data?: {
    attributes?: {
      url?: string;
    };
  };
};

type LemonVariantResponse = {
  data?: {
    attributes?: {
      store_id?: number;
    };
  };
};

/** Extract variant UUID from a share link like …/checkout/buy/{variant_id} */
export function parseVariantIdFromCheckoutUrl(checkoutUrl: string): string | null {
  try {
    const pathname = new URL(checkoutUrl).pathname;
    const buy = pathname.match(/\/checkout\/buy\/([^/]+)/i);
    if (buy?.[1]) return buy[1];
    const custom = pathname.match(/\/checkout\/custom\/([^/]+)/i);
    return custom?.[1] ?? null;
  } catch {
    return null;
  }
}

async function fetchStoreIdForVariant(apiKey: string, variantId: string): Promise<string | null> {
  const res = await fetch(`https://api.lemonsqueezy.com/v1/variants/${variantId}`, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn("[SignalProof] LemonSqueezy variant lookup failed", res.status);
    return null;
  }
  const json = (await res.json()) as LemonVariantResponse;
  const storeId = json.data?.attributes?.store_id;
  return storeId != null ? String(storeId) : null;
}

export type CreateCheckoutParams = {
  email: string;
  orderId: string;
  plan: CheckoutPlan;
  variantId?: string;
};

/**
 * Create a LemonSqueezy checkout session with redirect_url → /success.
 * Requires LEMONSQUEEZY_API_KEY and variant id (env or parsed from checkout URL).
 */
export async function createLemonSqueezyCheckout(
  params: CreateCheckoutParams,
): Promise<string | null> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();
  const successUrl = getCheckoutSuccessUrl();
  if (!apiKey || !successUrl) return null;

  const variantId =
    params.variantId?.trim() ||
    process.env.LEMONSQUEEZY_VARIANT_ID?.trim() ||
    parseVariantIdFromCheckoutUrl(process.env.LEMONSQUEEZY_CHECKOUT_SINGLE_MEMO_URL ?? "");
  if (!variantId) {
    console.warn("[SignalProof] LemonSqueezy variant id missing for API checkout");
    return null;
  }

  const storeId =
    process.env.LEMONSQUEEZY_STORE_ID?.trim() ||
    (await fetchStoreIdForVariant(apiKey, variantId));
  if (!storeId) {
    console.warn("[SignalProof] LemonSqueezy store id missing for API checkout");
    return null;
  }

  console.info("[SignalProof] LemonSqueezy checkout success URL", successUrl);

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            redirect_url: successUrl,
          },
          checkout_data: {
            email: params.email,
            custom: {
              plan: params.plan,
              order_id: params.orderId,
            },
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn("[SignalProof] LemonSqueezy create checkout failed", res.status, body.slice(0, 200));
    return null;
  }

  const json = (await res.json()) as LemonCheckoutResponse;
  const url = json.data?.attributes?.url?.trim();
  if (!url) {
    console.warn("[SignalProof] LemonSqueezy checkout response missing url");
    return null;
  }

  console.info("[SignalProof] LemonSqueezy API checkout created with redirect to /success");
  return url;
}
