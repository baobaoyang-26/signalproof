import { randomUUID } from "node:crypto";
import { resolveCompanyName } from "@/lib/company-name";
import {
  getCompanyMemoFallback,
  getFounderQuestionsFallback,
  type MemoFieldKey,
} from "@/lib/memo-prose";
import { scrubUserFacingText } from "@/lib/report-view";
import {
  capConfidenceByEvidence,
  extractSignals,
  signalsToWebsiteEvidence,
} from "@/lib/extract-signals";
import type { ReportContext } from "@/lib/openai";
import { toPipelineInput, type PipelineInput } from "@/lib/startup-order";
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
  const cleaned = scrubUserFacingText(item.insight);
  return cleaned.length >= 40 ? cleaned : fallback;
}

function memoOrSyn(
  company: string,
  field: MemoFieldKey,
  item: SynthesisItem | undefined,
  fallback: string,
): string {
  const branded = getCompanyMemoFallback(company, field);
  if (branded) return branded;
  return synRef(item, fallback);
}

export function generateMockReport(
  orderId: string,
  input: CreateOrderInput | PipelineInput,
  reportId: string = randomUUID(),
  context?: ReportContext,
): ValidationReport {
  const pipeline: PipelineInput =
    "industryNiche" in input && input.mainConcern
      ? (input as PipelineInput)
      : toPipelineInput(input as CreateOrderInput);

  const seed = hashString(
    `${pipeline.email}|${pipeline.startupIdea}|${pipeline.additionalContext}`,
  );
  const signals =
    context?.extractedSignals ??
    extractSignals(context?.rawContent, context?.scrapedUrl ?? pipeline.socialProfileUrl);
  const synthesis =
    context?.signalSynthesis ?? synthesizeSignals(signals, signals.companyName);
  const company = resolveCompanyName(pipeline.socialProfileUrl, {
    markdown: context?.rawContent,
    niche: pipeline.industryNiche,
    aiName: signals.companyName,
  });
  const niche = pipeline.industryNiche;
  const concern = pipeline.mainConcern;

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

  const fallbackCore = `${company} must prove a durable wedge in ${niche} while buyers weigh "${concern}" — public site evidence alone cannot settle whether distribution or model quality wins.`;
  const fallbackTension = `${company} is choosing between deepening one workflow and expanding into adjacent surfaces incumbents can bundle.`;
  const fallbackRisk = `${company}'s downside is substitution by bundled incumbents or cheaper models if workflow lock-in does not show up in buyer behavior.`;
  const fallbackIncumbents = `Category leaders have not fully copied ${company}'s wedge because bundling would dilute core SKU economics and slow enterprise roadmaps.`;
  const fallbackInsight = signals.communitySignals[0]
    ? `${company}'s community and distribution surface (${signals.communitySignals[0].text.slice(0, 120)}) may matter as much as model benchmarks for retention.`
    : `${company}'s real buyer is whoever repeats the core workflow weekly — paid cohort retention matters more than homepage positioning.`;
  const fallbackParadox = `${company} markets creative speed while revenue durability depends on habit and distribution, not one-off generation quality.`;
  const fallbackMoat = signals.aiClaims[0]
    ? `Defensibility hinges on whether "${signals.aiClaims[0].text.slice(0, 80)}" translates into repeat use, not feature parity.`
    : `Without clear pricing and workflow evidence, ${company}'s moat is narrative until retention data proves otherwise.`;

  const coreContradiction = memoOrSyn(
    company,
    "coreContradiction",
    tradeoff ?? pattern,
    fallbackCore,
  );
  const strategicTension = synRef(optimization ?? tradeoff, fallbackTension);
  const hiddenRisk = memoOrSyn(company, "hiddenRisk", behavior ?? pattern, fallbackRisk);
  const whyIncumbentsHaventWon = memoOrSyn(
    company,
    "whyIncumbentsHaventWon",
    pattern,
    fallbackIncumbents,
  );
  const nonObviousInsight = memoOrSyn(
    company,
    "nonObviousInsight",
    dna ?? behavior ?? optimization,
    fallbackInsight,
  );
  const strategicParadox = tradeoff
    ? synRef(tradeoff, fallbackParadox)
    : pattern
      ? synRef(pattern, fallbackParadox)
      : fallbackParadox;
  const hiddenMoatOrWeakness = optimization
    ? synRef(optimization, fallbackMoat)
    : synRef(pattern, fallbackMoat);

  const whatThisCompanyActuallyIs = memoOrSyn(
    company,
    "whatThisCompanyActuallyIs",
    dna ?? pattern,
    `${company} is a ${niche} product whose economics depend on repeat workflow use, not one-time trials.`,
  );
  const moatAnalysis = memoOrSyn(company, "moatAnalysis", optimization ?? pattern, fallbackMoat);

  const opportunities = [
    optimization
      ? synRef(optimization, `A narrow wedge on "${concern}" can work if ${company} converts trial users into weekly workflow habit.`)
      : `Prove a repeatable wedge for "${concern}" with pricing and onboarding evidence before horizontal expansion.`,
    pattern
      ? synRef(pattern, `Focus on one ICP in ${niche} until retention data beats positioning claims.`)
      : `Validate one ICP and one paid motion before expanding SKUs.`,
  ];

  const whyThisMightFail = [
    tradeoff
      ? synRef(tradeoff, `${company} may lose if tradeoffs between speed and control push power users to incumbents.`)
      : `Substitutes bundle similar capability; ${company} must show switching costs in workflow, not demos.`,
    behavior
      ? synRef(behavior, `Buyer behavior may not match ${company}'s implied ICP — test with paid pilots.`)
      : `Demand may be real but willingness to pay unproven without pricing evidence on the site.`,
    dna
      ? synRef(dna, `Identity drift between creative brand and enterprise motion can confuse GTM.`)
      : `Model or feature parity can erode differentiation faster than brand can rebuild habit.`,
  ];

  const founderQuestions =
    getFounderQuestionsFallback(company) ?? [
      `What evidence from paid cohorts contradicts ${company}'s public positioning?`,
      `Which on-site signals best predict 90-day retention for ${company}?`,
      `What tradeoff between GTM surfaces is management accepting, and where does it break in enterprise deals?`,
      `Why has the category leader not bundled ${company}'s wedge into an existing SKU?`,
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

  const pricingHint = signals.pricingModel[0]?.text.slice(0, 100);
  const integrationHint = signals.integrations[0]?.text.slice(0, 100);
  const apiHint = signals.apiSignals[0]?.text.slice(0, 100);
  const hiringHint = signals.hiringSignals[0]?.text.slice(0, 100);
  const distHint =
    signals.distributionSurface[0]?.text.slice(0, 100) ??
    signals.communitySignals[0]?.text.slice(0, 100);

  const bullCase = memoOrSyn(
    company,
    "bullCase",
    optimization ?? pattern,
    pricingHint
      ? `${company} monetizes via on-site packaging (${pricingHint}) if ${distHint ? `distribution (${distHint})` : "acquisition"} drives weekly habit in ${niche}.`
      : `${company} can win a narrow wedge on "${concern}" if retention proves stronger than incumbent bundles.`,
  );
  const bearCase = memoOrSyn(
    company,
    "bearCase",
    tradeoff ?? behavior,
    `Substitutes can bundle the workflow; ${company} loses if ${integrationHint ?? apiHint ?? "integrations or API depth"} do not create embed lock-in.`,
  );
  const moatDurability = memoOrSyn(
    company,
    "moatDurability",
    optimization,
    apiHint
      ? `Durability hinges on API and embed depth (${apiHint}), not brand copy alone.`
      : `Durability is unproven without API, integration, or pricing evidence on the public site.`,
  );
  const replacementRisk = memoOrSyn(
    company,
    "replacementRisk",
    pattern,
    `Buyers stitch tools for "${concern}" today; ${company} must own a daily step incumbents will bundle.`,
  );
  const gtmWeakness = memoOrSyn(
    company,
    "gtmWeakness",
    behavior,
    distHint
      ? `GTM is over-reliant on ${distHint} without a visible enterprise or pricing ladder.`
      : `GTM lacks a clear primary channel and paid conversion path on the public site.`,
  );
  const whyNow = memoOrSyn(
    company,
    "whyNow",
    optimization,
    hiringHint
      ? `Hiring (${hiringHint}) and category velocity suggest a window before incumbents ship parity SKUs.`
      : `Model and distribution shifts in ${niche} reward fast movers that form weekly habit before bundling.`,
  );

  const investmentVerdict =
    getCompanyMemoFallback(company, "investmentVerdict") ??
    (verdict === "Go"
      ? `Explore ${company} if paid retention on "${concern}" matches on-site monetization evidence.`
      : verdict === "Caution"
        ? `Hold ${company} — resolve GTM and replacement risk before a term sheet.`
        : `Pass for now. Public evidence does not yet support a durable wedge on pricing, API, or enterprise workflow for ${company}.`);

  const marketAnalysis = /midjourney/i.test(company)
    ? "Creator demand for differentiated visuals remains strong, but economics are shifting from model novelty to distribution and bundled creative suites. Midjourney's public positioning emphasizes breadth (image, video, tools) while buyers increasingly expect generation inside tools they already pay for."
    : pattern
      ? `${company} shows ${demandLevel.toLowerCase()} demand based on the submitted idea and any supporting links — not TAM slides.`
      : `${company}: demand read is provisional until more on-site pricing and workflow evidence is available.`;
  const competitionAnalysis = /midjourney/i.test(company)
    ? "OpenAI, Adobe, Canva, and Google can bundle generation into seats, templates, and collaboration. Midjourney competes on taste and community velocity, not on being the only model in market."
    : tradeoff
      ? `${competitionLevel} substitution pressure: ${company} competes with bundled incumbents on "${concern}", not feature lists alone.`
      : `${company} faces ${competitionLevel.toLowerCase()} substitution risk until workflow lock-in is visible in buyer behavior.`;

  return {
    id: reportId,
    orderId,
    email: pipeline.email,
    socialProfileUrl: pipeline.socialProfileUrl,
    industryNiche: pipeline.industryNiche,
    mainConcern: pipeline.startupIdea,
    additionalNotes: pipeline.additionalContext,
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
    bullCase,
    bearCase,
    moatDurability,
    replacementRisk,
    gtmWeakness,
    whyNow,
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
