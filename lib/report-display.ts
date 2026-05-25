import type { ValidationReport } from "@/lib/reports";

export type OpportunityVerdict = "Strong Opportunity" | "Moderate Potential" | "High Risk";

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
  if (report.competitionAnalysis?.trim()) {
    return report.competitionAnalysis.trim();
  }

  const intensity =
    report.competitionLevel === "High"
      ? "Crowded positioning with multiple established alternatives and fast-follow AI wrappers."
      : report.competitionLevel === "Medium"
        ? "A mix of legacy tools and new entrants — differentiation is possible with a narrow wedge."
        : "Limited direct competition in this niche; the primary challenge is proving demand, not beating incumbents.";

  return `${intensity} For ${report.industryNiche}, buyers compare solutions on speed, credibility of research, and depth of evidence — not feature count alone. Your stated concern ("${report.mainConcern}") should be validated against how existing players message outcomes and pricing.`;
}

export function formatReportNumber(id: string): string {
  return `SP-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
