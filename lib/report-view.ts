import type { ValidationReport } from "@/lib/reports";
import {
  getCompanyMemoFallback,
  isWeakSignalDump,
  type MemoFieldKey,
  REPORT_SECTION_COPY,
} from "@/lib/memo-prose";
import {
  formatMemoText,
  isDisplayableMemoText,
  isInternalDiagnostic,
} from "@/lib/report-display";

export const REPORT_LABELS = {
  memoTitle: "Explainable Startup Intelligence",
  preparedFor: "Prepared for",
  created: "Generated at",
  website: "Reference link",
  executiveSummary: "Survivability snapshot",
  companyInsight: "Company insight",
  nonObviousInsight: "Non-obvious insight",
  strategicParadox: "Strategic paradox",
  hiddenMoatWeakness: "Hidden moat / weakness",
  investmentThesis: "Survivability thesis",
  bullCase: "Bull case",
  bearCase: "Bear case",
  moatDurability: "Moat durability",
  replacementRisk: "Replacement risk",
  gtmWeakness: "GTM weakness",
  whyNow: "Why now",
  coreContradiction: "Core contradiction",
  strategicTension: "Strategic tension",
  hiddenRisk: "Hidden risk",
  whyIncumbents: "Why incumbents haven't won",
  whatCompanyIs: "What this company actually is",
  moatAnalysis: "Moat analysis",
  marketAnalysis: "Market analysis",
  competitionAnalysis: "Competition analysis",
  opportunities: "Opportunities",
  whyFail: "Why this might fail",
  founderQuestions: "Founder questions",
  investmentVerdict: "Final verdict",
  confidence: "Confidence",
  score: "Score",
  verdict: "Verdict",
  demand: "Demand",
  competition: "Competition",
  evidenceStrength: "Evidence strength",
  evidenceSummary: "Evidence summary",
  confidential: "Confidential · Founder intelligence",
  footer: "SignalProof · Explainable startup intelligence",
} as const;

export const REPORT_INTRO =
  "Read this as a judgment system: each section explains why it matters, why investors care, and how startups in this shape typically survive or fail.";

export { REPORT_SECTION_COPY };

const PLACEHOLDER_EMAIL_PATTERNS = [
  /^test@signalproof\.co$/i,
  /^demo@signalproof/i,
  /^admin@signalproof/i,
];

export function isPlaceholderEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return true;
  return PLACEHOLDER_EMAIL_PATTERNS.some((p) => p.test(trimmed));
}

export function resolveReportEmail(
  reportEmail: string,
  orderEmail?: string | null,
): string {
  const order = orderEmail?.trim();
  if (order && !isPlaceholderEmail(order)) return order;
  const stored = reportEmail.trim();
  if (stored && !isPlaceholderEmail(stored)) return stored;
  return order || stored || "";
}

export function scrubUserFacingText(text: string): string {
  return text
    .replace(/\[SYN-[A-Z0-9-]+\]/gi, "")
    .replace(
      /\[(?:pricingModel|workflow|integrations|apiSignals|hiringSignals|docsSignals|communitySignals|positioning|targetUser|onboardingCta|aiClaims|enterpriseSignals|socialProof|distributionSurface|repeatedLanguage)-\d+\]/gi,
      "",
    )
    .replace(/\bSYN-[A-Z0-9-]+\b/gi, "")
    .replace(/\(\s*(?:pricingModel|workflow|integrations|apiSignals)[^)]*\)/gi, "")
    .replace(/^\[[^\]]+\]\s*\([^)]*\)\s*/gm, "")
    .replace(/\bfallback memo\b/gi, "")
    .replace(/\b\d+\s+edges?\b/gi, "")
    .replace(/\bsignal\s*ids?\b/gi, "")
    .replace(/\bsynthesis\s*(?:coverage|pending|unavailable|sparse)\b/gi, "")
    .replace(/\bunmapped\b/gi, "")
    .replace(/\binternal diagnostic\b/gi, "")
    .replace(/\bmemoryCompanyId\b/gi, "")
    .replace(/\bmarketNodeId\b/gi, "")
    .replace(/\brawContent\b/gi, "")
    .replace(/\bextractedSignals\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .trim();
}

function isPlaceholderContent(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t === "—" || t === "-" || t === "–" || t === "N/A" || t === "n/a") return true;
  return false;
}

function polishMemo(
  text: string | undefined | null,
  companyName: string,
  field?: MemoFieldKey,
): string | null {
  if (text == null || !String(text).trim()) {
    if (field) return getCompanyMemoFallback(companyName, field);
    return null;
  }

  const scrubbed = scrubUserFacingText(String(text).trim());
  if (isPlaceholderContent(scrubbed)) {
    return field ? getCompanyMemoFallback(companyName, field) : null;
  }
  if (isInternalDiagnostic(scrubbed) || isWeakSignalDump(scrubbed)) {
    const fallback = field ? getCompanyMemoFallback(companyName, field) : null;
    if (fallback) return fallback;
    return null;
  }

  const polished = formatMemoText(scrubbed, scrubbed);
  if (!polished || isPlaceholderContent(polished)) {
    return field ? getCompanyMemoFallback(companyName, field) : null;
  }
  if (isInternalDiagnostic(polished) || isWeakSignalDump(polished)) {
    return field ? getCompanyMemoFallback(companyName, field) : null;
  }
  if (polished.length < 40) {
    return field ? getCompanyMemoFallback(companyName, field) : null;
  }
  return polished;
}

export function getDisplayMemo(
  text: string | undefined | null,
  companyName?: string,
  field?: MemoFieldKey,
): string | null {
  return polishMemo(text, companyName ?? "Company", field);
}

export function getDisplayList(
  items: string[] | undefined | null,
  companyName?: string,
): string[] {
  if (!items?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const line = polishMemo(item, companyName ?? "Company");
    if (line && !seen.has(line)) {
      seen.add(line);
      out.push(line);
    }
  }
  return out;
}

export function hasDisplayContent(text: string | undefined | null): boolean {
  return polishMemo(text, "Company") != null;
}

export type PreparedReportView = {
  email: string;
  companyTitle: string;
  bullCase: string | null;
  bearCase: string | null;
  moatDurability: string | null;
  replacementRisk: string | null;
  gtmWeakness: string | null;
  whyNow: string | null;
  nonObviousInsight: string | null;
  strategicParadox: string | null;
  hiddenMoatOrWeakness: string | null;
  coreContradiction: string | null;
  strategicTension: string | null;
  hiddenRisk: string | null;
  whyIncumbentsHaventWon: string | null;
  whatThisCompanyActuallyIs: string | null;
  moatAnalysis: string | null;
  marketAnalysis: string | null;
  competitionAnalysis: string | null;
  investmentVerdict: string | null;
  opportunities: string[];
  whyFail: string[];
  founderQuestions: string[];
  websiteEvidence: string[];
  showCompanyInsightRow: boolean;
  showThesisGrid: boolean;
  showCoreGrid: boolean;
};

export function prepareReportView(
  report: ValidationReport,
  orderEmail?: string | null,
): PreparedReportView {
  const companyTitle =
    report.companyName?.trim() || report.industryNiche.split(/[,/]/)[0]?.trim() || "Company";

  const bullCase = getDisplayMemo(report.bullCase, companyTitle, "bullCase");
  const bearCase = getDisplayMemo(report.bearCase, companyTitle, "bearCase");
  const moatDurability = getDisplayMemo(report.moatDurability, companyTitle, "moatDurability");
  const replacementRisk = getDisplayMemo(report.replacementRisk, companyTitle, "replacementRisk");
  const gtmWeakness = getDisplayMemo(report.gtmWeakness, companyTitle, "gtmWeakness");
  const whyNow = getDisplayMemo(report.whyNow, companyTitle, "whyNow");
  const nonObviousInsight = getDisplayMemo(
    report.nonObviousInsight,
    companyTitle,
    "nonObviousInsight",
  );
  const strategicParadox = getDisplayMemo(report.strategicParadox, companyTitle);
  const hiddenMoatOrWeakness = getDisplayMemo(
    report.hiddenMoatOrWeakness,
    companyTitle,
    "moatAnalysis",
  );

  const showCompanyInsightRow = Boolean(
    nonObviousInsight || strategicParadox || hiddenMoatOrWeakness,
  );
  const showThesisGrid = Boolean(
    bullCase || bearCase || moatDurability || replacementRisk || gtmWeakness || whyNow,
  );

  const coreContradiction = getDisplayMemo(
    report.coreContradiction,
    companyTitle,
    "coreContradiction",
  );
  const strategicTension = getDisplayMemo(report.strategicTension, companyTitle);
  const hiddenRisk = getDisplayMemo(report.hiddenRisk, companyTitle, "hiddenRisk");
  const whyIncumbentsHaventWon = getDisplayMemo(
    report.whyIncumbentsHaventWon,
    companyTitle,
    "whyIncumbentsHaventWon",
  );
  const showCoreGrid = Boolean(
    coreContradiction || strategicTension || hiddenRisk || whyIncumbentsHaventWon,
  );

  return {
    email: resolveReportEmail(report.email, orderEmail),
    companyTitle,
    bullCase,
    bearCase,
    moatDurability,
    replacementRisk,
    gtmWeakness,
    whyNow,
    nonObviousInsight,
    strategicParadox,
    hiddenMoatOrWeakness,
    coreContradiction,
    strategicTension,
    hiddenRisk,
    whyIncumbentsHaventWon,
    whatThisCompanyActuallyIs: getDisplayMemo(
      report.whatThisCompanyActuallyIs ?? report.suggestedMvp,
      companyTitle,
      "whatThisCompanyActuallyIs",
    ),
    moatAnalysis: getDisplayMemo(report.moatAnalysis, companyTitle, "moatAnalysis"),
    marketAnalysis: getDisplayMemo(report.marketAnalysis, companyTitle),
    competitionAnalysis: getDisplayMemo(report.competitionAnalysis, companyTitle),
    investmentVerdict: getDisplayMemo(
      report.investmentVerdict,
      companyTitle,
      "investmentVerdict",
    ),
    opportunities: getDisplayList(report.opportunities, companyTitle),
    whyFail: getDisplayList(report.whyThisMightFail ?? report.risks, companyTitle),
    founderQuestions: getDisplayList(
      report.founderQuestions ?? report.recommendations,
      companyTitle,
    ),
    websiteEvidence: getDisplayList(report.websiteEvidence, companyTitle),
    showCompanyInsightRow,
    showThesisGrid,
    showCoreGrid,
  };
}

export function isPartnerVisibleInsight(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return isDisplayableMemoText(text) && polishMemo(text, "Company") != null;
}

export function verdictHeadline(verdict: ValidationReport["verdict"]): string {
  if (verdict === "Go") return "Conditional pass";
  if (verdict === "Caution") return "Hold — further diligence";
  return "Pass for now";
}
