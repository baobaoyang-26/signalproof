/** Post-payment landing page — must match LemonSqueezy product redirect or API redirect_url. */

export function getCheckoutSuccessUrl(): string {
  const explicit =
    process.env.CHECKOUT_SUCCESS_URL?.trim() ||
    process.env.NEXT_PUBLIC_CHECKOUT_SUCCESS_URL?.trim();
  if (explicit) {
    return normalizeOriginPath(explicit);
  }

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (site) {
    return `${normalizeOrigin(site)}/success`;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000/success";
  }

  return "";
}

function normalizeOrigin(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function normalizeOriginPath(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return u.toString().replace(/\/$/, "");
  } catch {
    return trimmed.replace(/\/$/, "");
  }
}
