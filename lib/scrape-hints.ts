/** @deprecated Use extract-signals.ts — thin compatibility wrapper. */
import { extractSignals, type ExtractedSignals } from "@/lib/extract-signals";

export type ScrapeHints = {
  companyName?: string;
  pricingSnippets: string[];
  productSnippets: string[];
  workflowSnippets: string[];
  communitySnippets: string[];
  positioningSnippets: string[];
};

function toHints(signals: ExtractedSignals): ScrapeHints {
  return {
    companyName: signals.companyName,
    pricingSnippets: signals.pricingModel.map((s) => s.text),
    productSnippets: signals.targetUser.map((s) => s.text),
    workflowSnippets: signals.workflow.map((s) => s.text),
    communitySnippets: signals.communitySignals.map((s) => s.text),
    positioningSnippets: signals.positioning.map((s) => s.text),
  };
}

export function extractScrapeHints(
  markdown: string | undefined,
  url?: string,
): ScrapeHints {
  return toHints(extractSignals(markdown, url));
}

export function formatScrapeHintsForPrompt(hints: ScrapeHints): string {
  const blocks: string[] = [];
  if (hints.companyName) blocks.push(`Likely company / product name: ${hints.companyName}`);
  if (hints.pricingSnippets.length)
    blocks.push(`Pricing signals:\n- ${hints.pricingSnippets.join("\n- ")}`);
  if (hints.productSnippets.length)
    blocks.push(`Product copy:\n- ${hints.productSnippets.join("\n- ")}`);
  if (hints.workflowSnippets.length)
    blocks.push(`Workflow / integrations:\n- ${hints.workflowSnippets.join("\n- ")}`);
  if (hints.communitySnippets.length)
    blocks.push(`Community / distribution:\n- ${hints.communitySnippets.join("\n- ")}`);
  if (hints.positioningSnippets.length)
    blocks.push(`Positioning:\n- ${hints.positioningSnippets.join("\n- ")}`);
  return blocks.length ? blocks.join("\n\n") : "(no structured hints extracted)";
}
