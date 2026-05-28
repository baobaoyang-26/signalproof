import type { ValidationReport } from "@/lib/reports";
import { isBlockedCompanyName } from "@/lib/company-name";

export type OpportunityVerdict = "Strong Opportunity" | "Moderate Potential" | "High Risk";

export const EVIDENCE_LIMITED_MESSAGE =
  "Public website evidence is limited, so confidence is reduced.";

const INTERNAL_PATTERNS: RegExp[] = [
  /insufficient synthesis/i,
  /synthesis coverage/i,
  /not synthesized/i,
  /unmapped/i,
  /unverified/i,
  /pending\.?$/i,
  /behavior inference pending/i,
  /pattern evidence insufficient/i,
  /hidden risk unmapped/i,
  /defensibility not synthesized/i,
  /company behavior not yet synthesized/i,
  /expand signal scrape/i,
  /requires stronger synthesis/i,
  /synthesis unavailable/i,
  /synthesis sparse/i,
  /synthesis pending/i,
  /DNA read provisional/i,
  /tradeoff risk unmapped/i,
  /incumbent analysis requires/i,
  /opportunity mapping blocked/i,
  /danger path unknown/i,
  /blocked — run synthesis/i,
  /needs synthesis/i,
  /compare limited/i,
  /GTM unverified/i,
  /friction unverified/i,
  /attack vector unclear/i,
  /positioning synthesis to name/i,
  /0 edges/i,
  /\[SYN-/i,
  /signalIds/i,
  /supportingSignals/i,
  /synthesisIds/i,
  /memory id:/i,
  /cites SYN/i,
  /multi-signal inferences · memo cites/i,
  /market map · \d+ edges/i,
  /pricingModel:/i,
  /communitySignals:/i,
  /not found on page/i,
  /must not invent/i,
];

const GENERIC_PROSE: RegExp[] = [
  /competitive landscape is crowded/i,
  /market is large/i,
  /demand exists/i,
  /huge market opportunity/i,
  /defensibility appears thin/i,
  /point solution rather than a platform/i,
  /workflow embedding is unproven/i,
  /talk to users/i,
  /build an mvp/i,
  /category economics/i,
  /structural tension/i,
  /competitive landscape/i,
  /validate with paid pilots/i,
  /huge market/i,
  /game[- ]?changer/i,
  /leverage ai/i,
  /best[- ]in[- ]class/i,
  /cutting[- ]edge/i,
  /seamless/i,
  /unlock value/i,
];

export function isInternalDiagnostic(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (INTERNAL_PATTERNS.some((p) => p.test(t))) return true;
  if (/^About:/i.test(t)) return true;
  return false;
}

export function isGenericProse(text: string): boolean {
  return GENERIC_PROSE.some((p) => p.test(text));
}

/** User-facing copy; returns null when text should be hidden. */
export function formatMemoText(
  text: string | undefined,
  fallback: string,
): string | null {
  if (!text?.trim()) return fallback;
  if (isInternalDiagnostic(text) || isGenericProse(text)) return fallback;
  return text.trim();
}

export function isDisplayableMemoText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return !isInternalDiagnostic(text) && !isGenericProse(text);
}

export function getOpportunityVerdict(score: number): OpportunityVerdict {
  if (score >= 72) return "Strong Opportunity";
  if (score >= 48) return "Moderate Potential";
  return "High Risk";
}

export function levelToPercent(level: ValidationReport["demandLevel"]): number {
  if (level === "High") return 88;
  if (level === "Medium") return 58;
  return 28;
}

export function getCompetitionAnalysis(report: ValidationReport): string {
  const fromReport = formatMemoText(
    report.competitionAnalysis,
    "Competitive pressure depends on how buyers substitute this product versus bundled incumbents — underwrite with buyer interviews and paid cohort data.",
  );
  if (fromReport) return fromReport;

  if (report.competitionLevel === "High") {
    return "Substitutes include established incumbents and fast-follow AI tools in the same category. Differentiation must be proven with pricing and workflow evidence, not positioning claims alone.";
  }
  if (report.competitionLevel === "Medium") {
    return "A mix of legacy tools and newer entrants competes for the same budget. A narrow wedge and clear buyer still need validation.";
  }
  return "Direct competition may be lighter in this niche; the harder problem is proving buyers will pay for this wedge.";
}

export function formatReportNumber(id: string): string {
  return `SP-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function isWeakEvidence(report: ValidationReport): boolean {
  const tier = report.evidenceTier ?? "none";
  const count = report.extractedSignals?.signalCount ?? 0;
  return tier === "none" || tier === "weak" || count < 4;
}

export function hasMeaningfulSynthesis(report: ValidationReport): boolean {
  const syn = report.signalSynthesis;
  if (!syn || syn.synthesisCount < 1) return false;

  const items = [
    syn.companyDNA,
    ...syn.strategicPatterns,
    ...syn.optimizationDirection,
    ...syn.behaviorInference,
  ].filter(Boolean);

  return items.some((item) => item && !isInternalDiagnostic(item.insight));
}

export function shouldShowMarketPosition(report: ValidationReport): boolean {
  const mp = report.marketPosition;
  if (!mp) return false;
  return !isInternalDiagnostic(mp.attacking) && !isInternalDiagnostic(mp.replacing);
}

export function shouldShowMarketMap(report: ValidationReport): boolean {
  if (!report.marketNode) return false;
  const fields = [
    report.marketNode.userBehaviorModel,
    report.marketNode.distributionChannel,
    report.marketNode.infrastructureDependency,
  ];
  const usable = fields.filter((f) => f && !isInternalDiagnostic(f));
  return usable.length >= 2;
}

export function shouldShowStrategicSimulation(report: ValidationReport): boolean {
  const sim = report.strategicSimulation;
  if (!sim) return false;
  const scenario = sim.primaryScenarios[0];
  const response = sim.companyResponses[0];
  if (scenario?.winners[0] && !isInternalDiagnostic(scenario.winners[0].reason)) return true;
  if (response?.likelyResponse && !isInternalDiagnostic(response.likelyResponse)) return true;
  return false;
}

export function displayCompanyName(report: ValidationReport): string {
  const name = report.companyName?.trim();
  if (name && !isBlockedCompanyName(name)) return name;
  return report.industryNiche.split(/[,/]/)[0]?.trim() || "Company";
}

export function evidenceTierLabel(tier: string | undefined): string {
  if (tier === "strong") return "Strong";
  if (tier === "moderate") return "Moderate";
  if (tier === "weak") return "Limited";
  return "Limited";
}
