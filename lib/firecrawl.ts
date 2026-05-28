const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape";
const MAX_MARKDOWN_CHARS = 48_000;
const MIN_PAGE_CHARS = 80;

/** Lower number = merged first when truncating. */
const SCRAPE_PATHS: { path: string; priority: number }[] = [
  { path: "/", priority: 0 },
  { path: "/pricing", priority: 1 },
  { path: "/integrations", priority: 2 },
  { path: "/api", priority: 3 },
  { path: "/developers", priority: 4 },
  { path: "/developer", priority: 5 },
  { path: "/docs", priority: 6 },
  { path: "/changelog", priority: 7 },
  { path: "/careers", priority: 8 },
  { path: "/jobs", priority: 9 },
  { path: "/roadmap", priority: 10 },
  { path: "/blog", priority: 11 },
  { path: "/about", priority: 12 },
  { path: "/product", priority: 13 },
  { path: "/enterprise", priority: 14 },
  { path: "/community", priority: 15 },
];

export type FirecrawlScrapeResult = {
  url: string;
  markdown: string;
  title?: string;
  pagesScraped: number;
};

type FirecrawlScrapeResponse = {
  success?: boolean;
  error?: string;
  data?: {
    markdown?: string;
    metadata?: {
      title?: string;
      sourceURL?: string;
      url?: string;
    };
  };
};

function getApiKey(): string {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("FIRECRAWL_API_KEY is not set");
  }
  return apiKey.trim();
}

export function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("URL is empty");
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function pathPriority(pageUrl: string, origin: string, homepageUrl: string): number {
  try {
    const parsed = new URL(pageUrl);
    const home = new URL(homepageUrl);
    if (parsed.origin === home.origin && parsed.pathname.replace(/\/$/, "") === home.pathname.replace(/\/$/, "")) {
      return 0;
    }
    const pathname = parsed.pathname.replace(/\/$/, "") || "/";
    let best = 99;
    for (const entry of SCRAPE_PATHS) {
      if (entry.path === "/") continue;
      if (pathname === entry.path || pathname.startsWith(`${entry.path}/`)) {
        best = Math.min(best, entry.priority);
      }
    }
    return best;
  } catch {
    return 99;
  }
}

function mergePages(
  pages: Omit<FirecrawlScrapeResult, "pagesScraped">[],
  origin: string,
  homepageUrl: string,
): string {
  const sorted = [...pages].sort(
    (a, b) => pathPriority(a.url, origin, homepageUrl) - pathPriority(b.url, origin, homepageUrl),
  );

  const chunks: string[] = [];
  let total = 0;
  for (const page of sorted) {
    const block = `## Source: ${page.url}\n\n${page.markdown}`;
    if (total + block.length > MAX_MARKDOWN_CHARS) {
      const remaining = MAX_MARKDOWN_CHARS - total;
      if (remaining > 500) {
        chunks.push(`${block.slice(0, remaining)}\n\n[Section truncated…]`);
      }
      break;
    }
    chunks.push(block);
    total += block.length + 4;
  }
  return chunks.join("\n\n---\n\n");
}

function truncateMarkdown(markdown: string): string {
  if (markdown.length <= MAX_MARKDOWN_CHARS) {
    return markdown;
  }
  return `${markdown.slice(0, MAX_MARKDOWN_CHARS)}\n\n[Content truncated for analysis…]`;
}

function buildScrapeUrls(profileUrl: string): string[] {
  const normalized = normalizeWebsiteUrl(profileUrl);
  const origin = new URL(normalized).origin;
  const urls = new Set<string>([normalized]);

  for (const { path } of SCRAPE_PATHS) {
    if (path === "/") continue;
    urls.add(`${origin}${path}`);
  }

  return [...urls];
}

export async function scrapeWebsite(url: string): Promise<FirecrawlScrapeResult> {
  const result = await scrapeWebsiteRaw(url);
  return { ...result, pagesScraped: 1 };
}

async function scrapeWebsiteRaw(
  url: string,
): Promise<Omit<FirecrawlScrapeResult, "pagesScraped">> {
  const apiKey = getApiKey();
  const normalizedUrl = normalizeWebsiteUrl(url);

  const response = await fetch(FIRECRAWL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: normalizedUrl,
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 25000,
    }),
  });

  const payload = (await response.json()) as FirecrawlScrapeResponse;

  if (!response.ok || !payload.success) {
    const message =
      payload.error ??
      `Firecrawl scrape failed (${response.status} ${response.statusText})`;
    throw new Error(message);
  }

  const markdown = payload.data?.markdown?.trim();
  if (!markdown || markdown.length < MIN_PAGE_CHARS) {
    throw new Error("Firecrawl returned empty markdown");
  }

  return {
    url: payload.data?.metadata?.sourceURL ?? payload.data?.metadata?.url ?? normalizedUrl,
    markdown,
    title: payload.data?.metadata?.title,
  };
}

/** Scrape homepage + high-value subpaths; merge by priority (pricing, API, careers, etc.). */
export async function scrapeProfileUrl(
  profileUrl: string,
): Promise<FirecrawlScrapeResult | null> {
  if (!profileUrl.trim()) {
    return null;
  }

  if (!process.env.FIRECRAWL_API_KEY?.trim()) {
    console.warn("[SignalProof] FIRECRAWL_API_KEY not set — skipping scrape");
    return null;
  }

  const homepageUrl = normalizeWebsiteUrl(profileUrl);
  const origin = new URL(homepageUrl).origin;
  const urls = buildScrapeUrls(profileUrl);
  const settled = await Promise.allSettled(urls.map((url) => scrapeWebsiteRaw(url)));

  const pages: Omit<FirecrawlScrapeResult, "pagesScraped">[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      pages.push(result.value);
    }
  }

  if (pages.length === 0) {
    console.error("[SignalProof] Firecrawl: no pages scraped for", profileUrl);
    return null;
  }

  const primary = pages.find((p) => p.url === homepageUrl) ?? pages[0];
  const merged = mergePages(pages, origin, homepageUrl);

  console.info(
    `[SignalProof] Firecrawl merged ${pages.length} page(s) for ${profileUrl}`,
  );

  return {
    url: primary.url,
    markdown: truncateMarkdown(merged),
    title: primary.title,
    pagesScraped: pages.length,
  };
}
