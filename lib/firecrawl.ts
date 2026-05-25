const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape";
const MAX_MARKDOWN_CHARS = 32_000;
const MIN_PAGE_CHARS = 80;

const SUB_PATHS = [
  "/pricing",
  "/docs",
  "/about",
  "/product",
  "/enterprise",
  "/community",
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

  for (const path of SUB_PATHS) {
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

/** Scrape homepage + key subpaths; merge 2–5 pages when available. */
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

  const primary = pages.find((p) => p.url === normalizeWebsiteUrl(profileUrl)) ?? pages[0];
  const merged = pages
    .map((page) => `## Source: ${page.url}\n\n${page.markdown}`)
    .join("\n\n---\n\n");

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
