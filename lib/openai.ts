import OpenAI from "openai";
import {
  allSignals,
  capConfidenceByEvidence,
  extractSignals,
  formatSignalsCatalog,
  memoReferencesSignals,
  parseEvidenceBindings,
  signalsToWebsiteEvidence,
  type ExtractedSignals,
} from "@/lib/extract-signals";
import { containsBannedGenericPhrase, isLikelyGenericMemo } from "@/lib/memo-quality";
import type { CreateOrderInput } from "@/lib/orders";
import type { ValidationReport } from "@/lib/reports";
import {
  capConfidenceBySynthesis,
  formatSynthesisForPrompt,
  memoReferencesSynthesis,
  synthesizeSignals,
  type SignalSynthesis,
} from "@/lib/signal-synthesis";

export type VCMemoJson = {
  score: number;
  confidence: "Low" | "Medium" | "High";
  companyName: string;
  coreContradiction: string;
  strategicTension: string;
  hiddenRisk: string;
  whyIncumbentsHaventWon: string;
  nonObviousInsight: string;
  strategicParadox: string;
  hiddenMoatOrWeakness: string;
  investmentVerdict: string;
  whatThisCompanyActuallyIs: string;
  moatAnalysis: string;
  whyThisMightFail: string[];
  founderQuestions: string[];
  websiteEvidence: string[];
  demand: string | { level?: string; analysis?: string };
  competition: string | { level?: string; analysis?: string };
  opportunities: string[];
  verdict: string;
  evidenceBindings: Array<{
    field: string;
    claim: string;
    signalIds: string[];
    synthesisIds?: string[];
  }>;
};

const SYSTEM_PROMPT = `You are a Sequoia / YC partner writing a confidential investment validation memo about ONE specific company.

You receive a **signal synthesis catalog** — multi-signal behavioral inferences (company DNA, patterns, tradeoffs) — plus a raw signal catalog for verification only.

## Primary source (mandatory)
1. **Reason from SYNTHESIS entries [SYN-*] first** — each bundles ≥2 signals into company behavior understanding.
2. Every prose field MUST cite synthesis ids, e.g. [SYN-PATTERN-1], [SYN-DNA-1], [SYN-OPT-1]. You may add supporting signal ids in parentheses only when clarifying a fact.
3. **Do not draw conclusions from a single signal alone** — if no synthesis covers a claim, say evidence is insufficient.
4. **evidenceBindings**: { field, claim, synthesisIds[] (preferred), signalIds[] (supporting only) }.
5. If synthesis catalog is empty: confidence "Low"; no behavioral DNA claims.

## Secondary source
Raw signal catalog — use only to verify synthesis or fill websiteEvidence bullets. Do not replace synthesis reasoning with isolated signal listing.

## Analysis priority
coreContradiction, strategicTension, hiddenRisk, whyIncumbentsHaventWon, nonObviousInsight, strategicParadox, hiddenMoatOrWeakness — each must reflect synthesized company behavior, not feature lists.

## Banned
Generic industry language, single-signal conclusions, consultant platitudes.

Voice: terse partner memo. Output strict JSON only.`;

type Level = ValidationReport["demandLevel"];
type Verdict = ValidationReport["verdict"];
type Confidence = NonNullable<ValidationReport["confidence"]>;

export type ReportContext = {
  rawContent?: string;
  scrapedUrl?: string;
  scrapedTitle?: string;
  extractedSignals?: ExtractedSignals;
  signalSynthesis?: SignalSynthesis;
};

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
}

function normalizeLevel(value: unknown, fallbackScore: number): Level {
  if (typeof value === "object" && value !== null && "level" in value) {
    const level = String((value as { level?: string }).level ?? "");
    if (/high/i.test(level)) return "High";
    if (/medium/i.test(level)) return "Medium";
    if (/low/i.test(level)) return "Low";
  }
  if (typeof value === "string") {
    if (/high/i.test(value)) return "High";
    if (/medium/i.test(value)) return "Medium";
    if (/low/i.test(value)) return "Low";
  }
  if (fallbackScore >= 70) return "High";
  if (fallbackScore >= 45) return "Medium";
  return "Low";
}

function normalizeConfidence(value: unknown, score: number): Confidence {
  if (typeof value === "string") {
    if (/high/i.test(value)) return "High";
    if (/medium/i.test(value)) return "Medium";
    if (/low/i.test(value)) return "Low";
  }
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function extractAnalysis(
  value: VCMemoJson["demand"],
  fallback: string,
): string {
  if (typeof value === "object" && value !== null && "analysis" in value) {
    const analysis = (value as { analysis?: string }).analysis;
    if (typeof analysis === "string" && analysis.trim()) return analysis.trim();
  }
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

function normalizeVerdict(value: unknown, score: number): Verdict {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("go") && !text.includes("no")) return "Go";
  if (text.includes("caution") || text.includes("hold") || text.includes("moderate")) {
    return "Caution";
  }
  if (text.includes("no")) return "No-Go";
  if (score >= 72) return "Go";
  if (score >= 48) return "Caution";
  return "No-Go";
}

function clampScore(score: unknown): number {
  const n = typeof score === "number" ? score : Number(score);
  if (Number.isNaN(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function ensureString(value: unknown, fallback: string): string {
  const raw = typeof value === "string" && value.trim() ? value.trim() : fallback;
  if (containsBannedGenericPhrase(raw)) {
    return fallback;
  }
  return raw;
}

function ensureStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .filter((item) => !containsBannedGenericPhrase(item));
  return items.length > 0 ? items : fallback;
}

function buildUserPrompt(input: CreateOrderInput, context?: ReportContext): string {
  const signals =
    context?.extractedSignals ??
    extractSignals(context?.rawContent, context?.scrapedUrl ?? input.socialProfileUrl);
  const synthesis =
    context?.signalSynthesis ?? synthesizeSignals(signals, signals.companyName);
  const synthesisBlock = formatSynthesisForPrompt(synthesis);
  const signalCatalog = formatSignalsCatalog(signals);

  const evidenceBlock = signals.hasScrape
    ? `## Signal synthesis (PRIMARY — company behavior understanding)
${synthesisBlock}

## Raw signal catalog (SECONDARY — verification only)
URL: ${context?.scrapedUrl ?? input.socialProfileUrl}
${context?.scrapedTitle ? `Page title: ${context.scrapedTitle}\n` : ""}
${signalCatalog}`
    : `## Signal synthesis
${synthesisBlock}

## Raw signals
No scrape. Do not invent on-page facts.`;

  return `Write a partner memo from synthesized company behavior — not isolated feature bullets.

Return JSON:

{
  "companyName": "<from synthesis or signals>",
  "score": <integer 0-100>,
  "confidence": "Low" | "Medium" | "High",
  "coreContradiction": "<cite [SYN-*] ids>",
  "strategicTension": "<cite [SYN-*] ids>",
  "hiddenRisk": "<cite [SYN-*] ids>",
  "whyIncumbentsHaventWon": "<cite [SYN-*] ids>",
  "nonObviousInsight": "<cite [SYN-*] ids>",
  "strategicParadox": "<cite [SYN-*] ids>",
  "hiddenMoatOrWeakness": "<cite [SYN-*] ids>",
  "investmentVerdict": "<cite [SYN-*] ids>",
  "whatThisCompanyActuallyIs": "<cite [SYN-*] ids>",
  "moatAnalysis": "<cite [SYN-*] ids>",
  "whyThisMightFail": ["<cite [SYN-*]>", "..."],
  "founderQuestions": ["<question tied to synthesized behavior>", "..."],
  "websiteEvidence": ["[tag] (signal-id) fact from catalog", "..."],
  "evidenceBindings": [
    { "field": "coreContradiction", "claim": "<one sentence>", "synthesisIds": ["SYN-PATTERN-1"], "signalIds": ["pricingModel-1", "workflow-1"] }
  ],
  "demand": { "level": "Low"|"Medium"|"High", "analysis": "<[SYN-*] citations>" },
  "competition": { "level": "Low"|"Medium"|"High", "analysis": "<[SYN-*] citations>" },
  "opportunities": ["<[SYN-*] grounded wedge>", "..."],
  "verdict": "Go" | "Caution" | "No-Go"
}

${evidenceBlock}

## Submission (stress-test)
- Stated niche: ${input.industryNiche}
- Founder concern: ${input.mainConcern}
- Profile URL: ${input.socialProfileUrl}
- Notes: ${input.additionalNotes || "(none)"}

Return JSON only.`;
}

function parseVCMemoJson(content: string): VCMemoJson {
  const parsed = JSON.parse(content) as VCMemoJson;
  if (parsed === null || typeof parsed !== "object") {
    throw new Error("OpenAI returned invalid JSON");
  }
  return parsed;
}

function companyLabel(ai: VCMemoJson, input: CreateOrderInput, context?: ReportContext): string {
  const fromAi = ai.companyName?.trim();
  if (fromAi && fromAi.length > 1 && !/niche|industry|offer/i.test(fromAi)) {
    return fromAi;
  }
  const signals =
    context?.extractedSignals ??
    extractSignals(context?.rawContent, context?.scrapedUrl ?? input.socialProfileUrl);
  if (signals.companyName) return signals.companyName;
  try {
    const host = new URL(
      (context?.scrapedUrl ?? input.socialProfileUrl).startsWith("http")
        ? (context?.scrapedUrl ?? input.socialProfileUrl)
        : `https://${context?.scrapedUrl ?? input.socialProfileUrl}`,
    ).hostname;
    const slug = host.replace(/^www\./, "").split(".")[0];
    if (slug.length > 2) return slug.charAt(0).toUpperCase() + slug.slice(1);
  } catch {
    /* ignore */
  }
  return input.industryNiche.split(/[,/]/)[0]?.trim() || "this company";
}

export function mapAIJsonToReport(
  orderId: string,
  input: CreateOrderInput,
  reportId: string,
  ai: VCMemoJson,
  context?: ReportContext,
): ValidationReport {
  const validationScore = clampScore(ai.score);
  const demandLevel = normalizeLevel(ai.demand, validationScore);
  const competitionLevel = normalizeLevel(ai.competition, validationScore);
  const verdict = normalizeVerdict(ai.verdict, validationScore);
  const signals =
    context?.extractedSignals ??
    extractSignals(context?.rawContent, context?.scrapedUrl ?? input.socialProfileUrl);
  const synthesis =
    context?.signalSynthesis ?? synthesizeSignals(signals, signals.companyName);
  const signalIdSet = new Set(allSignals(signals).map((s) => s.id));
  const modelConfidence = normalizeConfidence(ai.confidence, validationScore);
  let confidence = capConfidenceByEvidence(modelConfidence, signals.evidenceTier);
  confidence = capConfidenceBySynthesis(confidence, synthesis);
  const company = companyLabel(ai, input, context);
  const evidenceBindings = parseEvidenceBindings(ai.evidenceBindings);

  if (
    synthesis.synthesisCount > 0 &&
    !memoReferencesSynthesis(ai as Record<string, unknown>, synthesis)
  ) {
    console.warn(
      "[SignalProof] Memo missing synthesis citations — prefer [SYN-*] ids for",
      company,
    );
  }

  if (
    signals.hasScrape &&
    signals.evidenceTier !== "none" &&
    !memoReferencesSynthesis(ai as Record<string, unknown>, synthesis) &&
    !memoReferencesSignals(ai as Record<string, unknown>, signalIdSet)
  ) {
    console.warn(
      "[SignalProof] Memo missing signal id citations — lowering confidence for",
      company,
    );
  }

  const genericCheck = isLikelyGenericMemo([
    ai.moatAnalysis ?? "",
    ai.whatThisCompanyActuallyIs ?? "",
    ai.nonObviousInsight ?? "",
  ]);
  if (genericCheck) {
    console.warn("[SignalProof] Memo may be generic — check OpenAI output for", company);
  }

  const coreContradiction = ensureString(
    ai.coreContradiction,
    `${company} sits in a structural tension between scaling its core wedge and the category economics implied by "${input.mainConcern}".`,
  );
  const strategicTension = ensureString(
    ai.strategicTension,
    `Management must choose between depth in one workflow and breadth that competes with horizontal platforms serving ${input.industryNiche}.`,
  );
  const hiddenRisk = ensureString(
    ai.hiddenRisk,
    `A non-obvious risk is that ${company}'s distribution or upstream dependencies are under-disclosed relative to the headline product promise.`,
  );
  const whyIncumbentsHaventWon = ensureString(
    ai.whyIncumbentsHaventWon,
    `Incumbents optimize for installed-base workflows and sales motions; ${company}'s wedge may be too narrow for them to prioritize until it shows pull in a specific ICP.`,
  );
  const nonObviousInsight = ensureString(
    ai.nonObviousInsight,
    `${company}'s real bet may be on distribution mechanics and habit formation, not the feature shown on the homepage.`,
  );
  const strategicParadox = ensureString(
    ai.strategicParadox,
    `${company} must move fast on product velocity while building retention mechanics that only compound slowly — speed and depth pull in opposite directions.`,
  );
  const hiddenMoatOrWeakness = ensureString(
    ai.hiddenMoatOrWeakness,
    `Hidden weakness: switching costs may be lower than the UI suggests if exports, APIs, or team habits are not embedded in daily operations.`,
  );

  const investmentVerdict = ensureString(
    ai.investmentVerdict,
    `Partners would underwrite ${company} only after evidence that "${input.mainConcern}" shows up in paid retention, not landing-page language.`,
  );
  const whatThisCompanyActuallyIs = ensureString(
    ai.whatThisCompanyActuallyIs,
    `${company} sells into ${input.industryNiche} with positioning shaped around "${input.mainConcern}" — product surface and buyer still need verification from customer calls.`,
  );
  const moatAnalysis = ensureString(
    ai.moatAnalysis,
    `${company}'s moat, if any, must be traced to a specific mechanism (data, distribution, workflow, brand) — not category tailwinds.`,
  );

  const whyThisMightFail = ensureStringArray(ai.whyThisMightFail, [
    `${company}: upstream platform shifts could compress differentiation faster than GTM can adapt.`,
    `${company}: the ICP that loves the demo may not be the budget holder for "${input.mainConcern}".`,
  ]);
  const founderQuestions = ensureStringArray(ai.founderQuestions, [
    `For ${company}: which line item on the customer's P&L funds this today — and who signs?`,
    `What did ${company} lose in the last five competitive deals — name the incumbent and the stated reason?`,
    `Where does ${company}'s retention curve inflect — week 1 habit or month 6 workflow?`,
    `Why has the category leader not shipped ${company}'s wedge as a feature bundle?`,
  ]);
  const websiteEvidence = ensureStringArray(
    ai.websiteEvidence,
    signals.hasScrape
      ? signalsToWebsiteEvidence(signals)
      : ["[positioning] No website scrape — memo grounded in submission and URL only."],
  );

  const finalConfidence =
    signals.evidenceTier === "none" || signals.evidenceTier === "weak"
      ? capConfidenceByEvidence(confidence, signals.evidenceTier)
      : synthesis.synthesisCount > 0 &&
          !memoReferencesSynthesis(ai as Record<string, unknown>, synthesis)
        ? capConfidenceBySynthesis(
            modelConfidence === "High" ? "Medium" : confidence,
            { ...synthesis, synthesisCount: 0 },
          )
        : !memoReferencesSignals(ai as Record<string, unknown>, signalIdSet) &&
            signals.hasScrape
          ? capConfidenceByEvidence(
              modelConfidence === "High" ? "Medium" : confidence,
              "weak",
            )
          : confidence;

  const marketAnalysis = extractAnalysis(
    ai.demand,
    `${company}: demand for the wedge behind "${input.mainConcern}" reads ${demandLevel.toLowerCase()} — validate with paid pilots, not category TAM narratives.`,
  );
  const competitionAnalysis = extractAnalysis(
    ai.competition,
    `${company} competes against workflow incumbents and fast-follow wrappers; substitution is ${competitionLevel.toLowerCase()} for this ICP.`,
  );
  const opportunities = ensureStringArray(ai.opportunities, [
    `${company}: a credible wedge exists only if positioning names a buyer and workflow incumbents underserve.`,
  ]);

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
    confidence: finalConfidence,
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
    source: "openai",
    rawContent: context?.rawContent,
    scrapedUrl: context?.scrapedUrl,
  };
}

export async function generateAIReport(
  orderId: string,
  input: CreateOrderInput,
  reportId: string,
  context?: ReportContext,
): Promise<ValidationReport> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.42,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input, context) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  const ai = parseVCMemoJson(content);
  return mapAIJsonToReport(orderId, input, reportId, ai, context);
}
