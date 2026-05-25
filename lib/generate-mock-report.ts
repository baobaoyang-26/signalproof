import { randomUUID } from "node:crypto";
import {
  allSignals,
  capConfidenceByEvidence,
  extractSignals,
  signalsToWebsiteEvidence,
} from "@/lib/extract-signals";
import type { ReportContext } from "@/lib/openai";
import type { CreateOrderInput } from "@/lib/orders";
import type { ValidationReport } from "@/lib/reports";
import {
  allSynthesisItems,
  capConfidenceBySynthesis,
  synthesizeSignals,
  type SynthesisItem,
} from "@/lib/signal-synthesis";

type Level = ValidationReport["demandLevel"];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickLevel(score: number): Level {
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function pickVerdict(score: number): ValidationReport["verdict"] {
  if (score >= 72) return "Go";
  if (score >= 48) return "Caution";
  return "No-Go";
}

function synRef(item: SynthesisItem | undefined, fallback: string): string {
  if (!item) return fallback;
  return `[${item.id}] ${item.insight}`;
}

export function generateMockReport(
  orderId: string,
  input: CreateOrderInput,
  reportId: string = randomUUID(),
  context?: ReportContext,
): ValidationReport {
  const seed = hashString(
    `${input.email}|${input.industryNiche}|${input.mainConcern}|${input.socialProfileUrl}`,
  );
  const signals =
    context?.extractedSignals ??
    extractSignals(context?.rawContent, context?.scrapedUrl ?? input.socialProfileUrl);
  const synthesis =
    context?.signalSynthesis ?? synthesizeSignals(signals, signals.companyName);
  const catalog = allSignals(signals);
  const company = signals.companyName ?? input.industryNiche.split(/[,/]/)[0]?.trim() ?? "Target company";

  const pattern = synthesis.strategicPatterns[0];
  const tradeoff = synthesis.hiddenTradeoffs[0];
  const optimization = synthesis.optimizationDirection[0];
  const behavior = synthesis.behaviorInference[0];
  const dna = synthesis.companyDNA;

  const validationScore = 38 + (seed % 54);
  const demandScore = 30 + ((seed >> 3) % 60);
  const competitionScore = 25 + ((seed >> 6) % 65);

  const demandLevel = pickLevel(demandScore);
  const competitionLevel = pickLevel(competitionScore);
  const verdict = pickVerdict(validationScore);

  const coreContradiction = tradeoff
    ? synRef(tradeoff, `${company}: structural tradeoff under-evidenced.`)
    : synRef(pattern, `${company}: pattern synthesis unavailable — insufficient multi-signal evidence.`);
  const strategicTension = synRef(
    optimization ?? tradeoff,
    `${company}: optimization direction unclear from signals.`,
  );
  const hiddenRisk = behavior
    ? `${synRef(behavior, "")} Risk: ${behavior.contradictionRisk}`
    : pattern
      ? `Risk from [${pattern.id}]: ${pattern.contradictionRisk}`
      : `${company}: hidden risk unmapped — low synthesis coverage.`;
  const whyIncumbentsHaventWon = pattern
    ? `[${pattern.id}] Incumbent inertia vs. ${company}'s synthesized wedge — ${pattern.contradictionRisk}`
    : `${company}: incumbent analysis requires stronger synthesis.`;
  const nonObviousInsight = dna
    ? `[${dna.id}] ${dna.insight.split("DNA:")[1]?.trim() ?? dna.insight}`
    : synRef(behavior ?? optimization, `${company}: behavior inference pending.`);
  const strategicParadox = tradeoff
    ? `[${tradeoff.id}] ${tradeoff.contradictionRisk}`
    : pattern
      ? `[${pattern.id}] ${pattern.contradictionRisk}`
      : `${company}: paradox not synthesized from signals.`;
  const hiddenMoatOrWeakness = optimization
    ? synRef(optimization, `${company}: moat/weakness unclear.`)
    : synRef(pattern, `${company}: defensibility not synthesized.`);

  const whatThisCompanyActuallyIs = dna
    ? synRef(dna, synRef(pattern, `${company}: identity unclear from signals.`))
    : synRef(pattern, `${company}: company behavior not yet synthesized.`);
  const moatAnalysis = optimization
    ? `[${optimization.id}] Moat mechanism inferred from multi-signal optimization: ${optimization.insight}`
    : synRef(pattern, `${company}: moat requires multi-signal synthesis.`);

  const opportunities = [
    optimization
      ? `[${optimization.id}] Wedge if optimization loop converts for "${input.mainConcern}".`
      : `${company}: opportunity mapping blocked — run synthesis with more signals.`,
    pattern
      ? `[${pattern.id}] Pattern supports narrow ICP before horizontal expansion.`
      : `${company}: pattern evidence insufficient.`,
  ];

  const whyThisMightFail = [
    tradeoff
      ? `[${tradeoff.id}] ${tradeoff.contradictionRisk}`
      : `${company}: tradeoff risk unmapped.`,
    behavior
      ? `[${behavior.id}] ${behavior.contradictionRisk}`
      : `${company}: buyer behavior inference weak.`,
    dna ? `[${dna.id}] ${dna.contradictionRisk}` : `${company}: DNA read provisional.`,
  ];

  const founderQuestions = [
    dna
      ? `Does [${dna.id}] company DNA hold in paid cohorts — not just homepage synthesis?`
      : `What multi-signal evidence contradicts ${company}'s positioning?`,
    optimization
      ? `Where does [${optimization.id}] optimization loop break in enterprise deals?`
      : `Which two signals on the site most predict retention for ${company}?`,
    tradeoff
      ? `How do you resolve [${tradeoff.id}] without slowing shipping?`
      : `What tradeoff is ${company} hiding between GTM surfaces?`,
    pattern
      ? `Why hasn't an incumbent copied [${pattern.id}] as a bundle feature?`
      : `Why has the category leader not closed ${company}'s wedge?`,
  ];

  const websiteEvidence = signals.hasScrape
    ? signalsToWebsiteEvidence(signals)
    : ["[positioning] No scrape — memo uses URL and submission only."];

  const evidenceBindings = allSynthesisItems(synthesis)
    .slice(0, 3)
    .map((item) => ({
      field: item.id.startsWith("SYN-DNA") ? "companyDNA" : "strategicPatterns",
      claim: item.insight,
      signalIds: item.supportingSignals,
    }));

  const rawConfidence =
    validationScore >= 72 ? "High" : validationScore >= 48 ? "Medium" : "Low";
  let confidence = capConfidenceByEvidence(rawConfidence, signals.evidenceTier);
  confidence = capConfidenceBySynthesis(confidence, synthesis);

  const investmentVerdict =
    verdict === "Go"
      ? `[${dna?.id ?? optimization?.id ?? "SYN"}] Explore ${company} if synthesized behavior loop converts — tier ${signals.evidenceTier}.`
      : verdict === "Caution"
        ? `Hold ${company}: ${hiddenRisk}`
        : `Pass ${company} until synthesis confidence rises above ${synthesis.synthesisCount} patterns.`;

  const marketAnalysis = pattern
    ? `[${pattern.id}] Demand read through synthesized ICP — ${demandLevel.toLowerCase()} for "${input.mainConcern}".`
    : `${company}: demand analysis needs synthesis (signals: ${catalog.length}).`;
  const competitionAnalysis = tradeoff
    ? `[${tradeoff.id}] Competition via tradeoff lens — ${competitionLevel.toLowerCase()} substitution.`
    : `${company}: competition ${competitionLevel.toLowerCase()} — synthesis sparse.`;

  return {
    id: reportId,
    orderId,
    email: input.email,
    socialProfileUrl: input.socialProfileUrl,
    industryNiche: input.industryNiche,
    mainConcern: input.mainConcern,
    additionalNotes: input.additionalNotes,
    validationScore,
    demandLevel,
    competitionLevel,
    opportunities,
    risks: whyThisMightFail,
    suggestedMvp: whatThisCompanyActuallyIs,
    verdict,
    marketAnalysis,
    competitionAnalysis,
    recommendations: founderQuestions,
    investmentVerdict,
    whatThisCompanyActuallyIs,
    moatAnalysis,
    whyThisMightFail,
    founderQuestions,
    confidence,
    websiteEvidence,
    companyName: company,
    coreContradiction,
    strategicTension,
    hiddenRisk,
    whyIncumbentsHaventWon,
    nonObviousInsight,
    strategicParadox,
    hiddenMoatOrWeakness,
    extractedSignals: signals,
    evidenceBindings,
    evidenceTier: signals.evidenceTier,
    evidenceScore: signals.evidenceScore,
    signalSynthesis: synthesis,
    createdAt: new Date().toISOString(),
    source: "mock",
    rawContent: context?.rawContent,
    scrapedUrl: context?.scrapedUrl,
  };
}
