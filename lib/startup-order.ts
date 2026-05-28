import { resolveCompanyName } from "@/lib/company-name";
import { extractSignals, formatSignalsCatalog } from "@/lib/extract-signals";
import type { CreateOrderInput } from "@/lib/orders";
import type { ReportContext } from "@/lib/openai";
import { synthesizeSignals } from "@/lib/signal-synthesis";

export const STARTUP_INTELLIGENCE_NICHE = "Explainable Startup Intelligence";

const URL_PATTERN =
  /\bhttps?:\/\/[^\s<>"'`,)\]]+|\b(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-z]{2,}(?:\/[^\s<>"'`,)\]]*)?/gi;

const SKIP_SCRAPE_HOST =
  /^(?:www\.)?(?:twitter\.com|x\.com|t\.co|youtube\.com|youtu\.be|linkedin\.com)$/i;

const PREFER_SCRAPE_HOST =
  /github\.com|gitlab\.com|producthunt\.com|notion\.|vercel\.app|\.io\b/i;

/** Legacy shape for OpenAI + report storage compatibility. */
export type PipelineInput = CreateOrderInput & {
  socialProfileUrl: string;
  industryNiche: string;
  mainConcern: string;
  additionalNotes: string;
};

export function extractUrlsFromText(...parts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    if (!part?.trim()) continue;
    const matches = part.match(URL_PATTERN) ?? [];
    for (const raw of matches) {
      let normalized = raw.trim().replace(/[.,;]+$/, "");
      if (!/^https?:\/\//i.test(normalized)) {
        normalized = `https://${normalized.replace(/^www\./i, "www.")}`;
      }
      try {
        const u = new URL(normalized);
        if (u.protocol !== "http:" && u.protocol !== "https:") continue;
        const key = u.href.replace(/\/$/, "");
        if (!seen.has(key)) {
          seen.add(key);
          out.push(u.href);
        }
      } catch {
        /* skip invalid */
      }
    }
  }
  return out;
}

function scrapeScore(url: string): number {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (SKIP_SCRAPE_HOST.test(host)) return -1;
    if (PREFER_SCRAPE_HOST.test(host)) return 10;
    return 5;
  } catch {
    return -1;
  }
}

export function selectUrlsToScrape(urls: string[], max = 2): string[] {
  return [...urls]
    .sort((a, b) => scrapeScore(b) - scrapeScore(a))
    .filter((u) => scrapeScore(u) >= 0)
    .slice(0, max);
}

export function toPipelineInput(input: CreateOrderInput): PipelineInput {
  const idea = input.startupIdea.trim();
  const context = input.additionalContext.trim();
  const urls = extractUrlsFromText(idea, context);

  return {
    ...input,
    startupIdea: idea,
    additionalContext: context,
    socialProfileUrl: urls[0] ?? "",
    industryNiche: STARTUP_INTELLIGENCE_NICHE,
    mainConcern: idea,
    additionalNotes: context,
  };
}

export function formatFounderSubmission(input: CreateOrderInput): string {
  const blocks = [
    "# Founder submission (Explainable Startup Intelligence)",
    "",
    "## Startup idea / project description",
    input.startupIdea.trim(),
  ];
  if (input.additionalContext.trim()) {
    blocks.push("", "## Additional context / links", input.additionalContext.trim());
  }
  return blocks.join("\n");
}

export async function prepareStartupReportContext(
  input: CreateOrderInput,
): Promise<{ pipeline: PipelineInput; context: ReportContext }> {
  const pipeline = toPipelineInput(input);
  let submissionMarkdown = formatFounderSubmission(input);
  let scrapedUrl: string | undefined;
  let scrapedTitle: string | undefined;
  let pagesScraped = 0;

  const urls = extractUrlsFromText(input.startupIdea, input.additionalContext);
  const targets = selectUrlsToScrape(urls, 2);

  if (targets.length === 0) {
    console.info("[SignalProof] idea-analysis pipeline (no URLs to scrape)");
  } else {
    const { scrapeProfileUrl } = await import("@/lib/firecrawl");
    for (const url of targets) {
      try {
        console.info("[SignalProof] selective scrape", url);
        const scrape = await scrapeProfileUrl(url);
        if (scrape?.markdown && scrape.markdown.length >= 80) {
          submissionMarkdown += `\n\n## Supporting scrape: ${scrape.url}\n${scrape.markdown.slice(0, 24_000)}`;
          scrapedUrl = scrapedUrl ?? scrape.url;
          scrapedTitle = scrapedTitle ?? scrape.title;
          pagesScraped += scrape.pagesScraped;
        }
      } catch (error) {
        console.warn("[SignalProof] scrape skipped", url, error);
      }
    }
  }

  const companyName = resolveCompanyName(scrapedUrl ?? "", {
    markdown: submissionMarkdown,
    pageTitle: scrapedTitle,
    niche: STARTUP_INTELLIGENCE_NICHE,
  });

  const extractedSignals = extractSignals(submissionMarkdown, scrapedUrl);
  extractedSignals.companyName = companyName;
  const signalSynthesis = synthesizeSignals(extractedSignals, companyName);

  const context: ReportContext = {
    rawContent: submissionMarkdown,
    scrapedUrl,
    scrapedTitle,
    extractedSignals,
    signalSynthesis,
    ideaMode: !scrapedUrl,
    founderSubmission: formatFounderSubmission(input),
    supportingUrls: urls,
    signalCatalog: formatSignalsCatalog(extractedSignals),
  };

  if (pagesScraped > 0) {
    console.info("[SignalProof] merged scrape pages", pagesScraped);
  }

  return { pipeline, context };
}
