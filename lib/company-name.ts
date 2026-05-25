/** Resolve display company name — URL domain always beats page titles like "About". */

const BLOCKED_NAMES = new Set([
  "about",
  "home",
  "pricing",
  "price",
  "product",
  "products",
  "documentation",
  "docs",
  "explore",
  "sign up",
  "log in",
  "login",
  "signup",
  "enterprise",
  "community",
  "support",
  "help",
  "contact",
  "blog",
  "careers",
  "features",
  "platform",
  "solutions",
  "welcome",
  "index",
  "overview",
]);

const SUBDOMAIN_SKIP = new Set(["www", "docs", "app", "blog", "help", "support", "api", "status"]);

const KNOWN_BRANDS: Record<string, string> = {
  midjourney: "Midjourney",
  linear: "Linear",
  notion: "Notion",
  cursor: "Cursor",
  perplexity: "Perplexity",
  runway: "Runway",
  stability: "Stability",
  figma: "Figma",
  stripe: "Stripe",
  vercel: "Vercel",
  openai: "OpenAI",
  anthropic: "Anthropic",
};

export function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("URL is empty");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isBlockedCompanyName(name: string): boolean {
  const normalized = name.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "");
  if (!normalized || normalized.length < 2) return true;
  if (BLOCKED_NAMES.has(normalized)) return true;
  if (/^(sign|log|get|try|start)\s/.test(normalized)) return true;
  return false;
}

function capitalize(slug: string): string {
  if (KNOWN_BRANDS[slug.toLowerCase()]) return KNOWN_BRANDS[slug.toLowerCase()];
  if (slug.length <= 3) return slug.toUpperCase();
  return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
}

/** Primary source: registrable domain slug (midjourney.com → Midjourney). */
export function companyNameFromUrl(url: string): string | undefined {
  try {
    const host = new URL(normalizeWebsiteUrl(url)).hostname.toLowerCase();
    const parts = host.split(".").filter(Boolean);
    if (parts.length < 2) return undefined;

    let slug = parts[0];
    if (SUBDOMAIN_SKIP.has(slug) && parts.length >= 3) {
      slug = parts[1];
    }

    if (slug.length < 2 || SUBDOMAIN_SKIP.has(slug)) return undefined;
    return capitalize(slug);
  } catch {
    return undefined;
  }
}

function companyNameFromMarkdownHead(markdown: string): string | undefined {
  for (const raw of markdown.split("\n").slice(0, 20)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("[") || line.startsWith("![")) continue;
    if (/sign up|log in|explore|documentation/i.test(line)) continue;
    const cleaned = line.replace(/\*\*/g, "").trim();
    if (cleaned.length >= 2 && cleaned.length <= 48 && !isBlockedCompanyName(cleaned)) {
      return cleaned;
    }
  }
  return undefined;
}

/**
 * Resolve company name for reports and memory graph.
 * Priority: URL domain → explicit candidate → markdown lead line → niche.
 */
export function resolveCompanyName(
  profileUrl: string,
  options?: {
    pageTitle?: string;
    aiName?: string;
    niche?: string;
    markdown?: string;
  },
): string {
  const fromUrl = companyNameFromUrl(profileUrl);
  if (fromUrl) return fromUrl;

  const candidates = [
    options?.aiName,
    options?.pageTitle,
    options?.markdown ? companyNameFromMarkdownHead(options.markdown) : undefined,
    options?.niche?.split(/[,/]/)[0]?.trim(),
  ];

  for (const c of candidates) {
    if (c?.trim() && !isBlockedCompanyName(c)) return c.trim();
  }

  return "Target company";
}

export function deriveCompanyIdFromUrl(url: string): string {
  try {
    const host = new URL(normalizeWebsiteUrl(url)).hostname.toLowerCase();
    let slug = host.replace(/^www\./, "").split(".")[0];
    if (SUBDOMAIN_SKIP.has(slug)) {
      slug = host.replace(/^www\./, "").split(".")[1] ?? slug;
    }
    return slug || "unknown";
  } catch {
    return "unknown";
  }
}
