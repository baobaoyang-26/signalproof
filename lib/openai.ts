import OpenAI from "openai";
import { isBlockedCompanyName, resolveCompanyName } from "@/lib/company-name";
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
import type { PipelineInput } from "@/lib/startup-order";
import type { ValidationReport } from "@/lib/reports";
import type { MarketEvolutionInference } from "@/lib/market-map";
import {
  capConfidenceBySynthesis,
  formatSynthesisForPrompt,
  memoReferencesSynthesis,
  synthesizeSignals,
  type SignalSynthesis,
} from "@/lib/signal-synthesis";
import { scrubUserFacingText } from "@/lib/report-view";
import type { StrategicSimulationBundle } from "@/lib/strategic-simulation";

function scrubMemoField(value: unknown, fallback: string): string {
  const raw = typeof value === "string" && value.trim() ? value.trim() : fallback;
  return scrubUserFacingText(raw) || fallback;
}

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
  bullCase: string;
  bearCase: string;
  moatDurability: string;
  replacementRisk: string;
  gtmWeakness: string;
  whyNow: string;
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

/** Task → model routing. Cheap by default; reasoning tasks use GPT-5 (override via env). */
export type OpenAITask =
  | "signal_extraction"
  | "structured_evidence"
  | "investment_thesis"
  | "strategic_simulation"
  | "market_evolution";

const REASONING_TASKS: ReadonlySet<OpenAITask> = new Set([
  "investment_thesis",
  "strategic_simulation",
  "market_evolution",
]);

const DEFAULT_CHEAP_MODEL = "gpt-4o-mini";
const DEFAULT_REASONING_MODEL = "gpt-5";

export function resolveModelForTask(task: OpenAITask): string {
  if (REASONING_TASKS.has(task)) {
    return process.env.OPENAI_MODEL_REASONING?.trim() || DEFAULT_REASONING_MODEL;
  }
  return process.env.OPENAI_MODEL_CHEAP?.trim() || DEFAULT_CHEAP_MODEL;
}

function logOpenAIModel(task: OpenAITask, model: string): void {
  console.info(`[SignalProof] OpenAI task=${task} model=${model}`);
}

const MEMO_STYLE_RULES = `
## Voice (founder education + U.S. VC partner reasoning)
- English only. Teach HOW to think—not generic AI summaries.
- Each string field: **3–5 complete sentences** (never one-line fragments).
- Every major field must include: (1) WHY this matters for survival/scale, (2) WHY investors weight it in diligence, (3) one COMMON FOUNDER MISTAKE on this dimension, (4) a HISTORICAL PATTERN or named precedent when useful (bundling, workflow collapse, race-to-zero pricing, etc.).
- Name real substitutes when plausible (OpenAI, Adobe, Figma, Canva, Google, etc.).
- Explain WHY startups in this shape survive or die—not just what the product does.

## Depth required (explicit reasoning)
workflow integration risk, replacement risk, OpenAI/incumbent platform threat, distribution moat vs. product moat,
GTM weakness, market saturation, pricing durability / survivability, founder dependency, switching resistance.

## Never sound like
ChatGPT summary, AI report generator, startup blog, innovation/disruption buzzwords, or stitched signal dump.

## Banned phrases (never use)
transformative, cutting-edge, revolutionary, AI-powered, AI-generated report, unlocks value, ecosystem, landscape,
disruption, innovation at scale, validate with users, strong potential, seamless experience, leveraging AI,
market is growing, competitive market, creator identity density, community-native distribution, limited API surface, dual GTM.

## Never output in user-visible strings
SYN-* ids, signal ids, synthesis, unmapped, coverage, fallback memo, internal diagnostic jargon.

Reason from synthesis/signals internally only.`;

const STARTUP_IDEA_RULES = `
## Explainable Startup Intelligence (founder submission)
Input may be an idea, market observation, rough notes, or optional reference link—not necessarily a live website.
Deliver teachable survivability analysis: moat hypothesis, replacement risk, likely competitors, GTM weakness, pricing durability,
incumbent/OpenAI threat, workflow ownership & integration risk, why now, founder diligence questions (that teach judgment), bull/bear scenarios.
Use scraped links only as supporting evidence. Do not invent revenue, customers, or traction not implied by the submission.
founderQuestions must be questions that teach the founder what partners probe—not checkbox diligence.`;

const SYSTEM_STRUCTURED_PROMPT = `You draft the structured section of an explainable startup intelligence memo that teaches founders how investors think.
${MEMO_STYLE_RULES}
${STARTUP_IDEA_RULES}

## This pass only
score, confidence, coreContradiction, strategicTension, hiddenRisk, whyIncumbentsHaventWon, nonObviousInsight,
strategicParadox, hiddenMoatOrWeakness, demand, competition, opportunities, verdict, whyThisMightFail,
founderQuestions, websiteEvidence (plain English bullets, no ids).

Do NOT write bullCase, bearCase, moatDurability, replacementRisk, gtmWeakness, whyNow, investmentVerdict — thesis pass handles those.

Output strict JSON only.`;

const SYSTEM_THESIS_PROMPT = `You draft the survivability thesis section of an explainable startup intelligence memo—educational, VC-native, founder-first.
${MEMO_STYLE_RULES}
${STARTUP_IDEA_RULES}

## Required fields
bullCase, bearCase, moatDurability, replacementRisk, gtmWeakness, whyNow (each 2–4 sentences),
investmentVerdict (specific pass/hold/explore with named risks — e.g. OpenAI or Adobe bundling),
whatThisCompanyActuallyIs, moatAnalysis.

investmentVerdict example tone:
"Pass for now. [Company] has X, but public evidence does not prove Y. If [incumbent] embeds [capability] in existing workflows, [company] risks becoming Z."

Output strict JSON only.`;

const SYSTEM_MARKET_EVOLUTION_PROMPT = `You refine market evolution insights for a VC memo. Keep the exact JSON schema. Improve specificity: name layers, companies, and substitution paths. Preserve evidence id fields. No generic AI summary tone. Output strict JSON only.`;

const SYSTEM_STRATEGIC_SIMULATION_PROMPT = `You refine strategic simulation outputs for a VC memo. Keep the exact JSON schema. Improve winner/loser/response prose with named competitors and workflow chains. Preserve ids and numeric fields. Output strict JSON only.`;

type Level = ValidationReport["demandLevel"];
type Verdict = ValidationReport["verdict"];
type Confidence = NonNullable<ValidationReport["confidence"]>;

export type ReportContext = {
  rawContent?: string;
  scrapedUrl?: string;
  ideaMode?: boolean;
  founderSubmission?: string;
  supportingUrls?: string[];
  scrapedTitle?: string;
  signalCatalog?: string;
  extractedSignals?: ExtractedSignals;
  signalSynthesis?: SignalSynthesis;
};

export type StructuredMemoJson = Pick<
  VCMemoJson,
  | "companyName"
  | "score"
  | "confidence"
  | "coreContradiction"
  | "strategicTension"
  | "hiddenRisk"
  | "whyIncumbentsHaventWon"
  | "nonObviousInsight"
  | "strategicParadox"
  | "hiddenMoatOrWeakness"
  | "demand"
  | "competition"
  | "opportunities"
  | "verdict"
  | "whyThisMightFail"
  | "founderQuestions"
  | "websiteEvidence"
  | "evidenceBindings"
>;

export type InvestmentThesisJson = Pick<
  VCMemoJson,
  | "bullCase"
  | "bearCase"
  | "moatDurability"
  | "replacementRisk"
  | "gtmWeakness"
  | "whyNow"
  | "investmentVerdict"
  | "whatThisCompanyActuallyIs"
  | "moatAnalysis"
>;

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
  const raw = scrubMemoField(value, fallback);
  if (containsBannedGenericPhrase(raw)) {
    return scrubUserFacingText(fallback);
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

function parseJsonContent<T>(content: string): T {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const json = fenced ? fenced[1].trim() : trimmed;
  const parsed = JSON.parse(json) as T;
  if (parsed === null || typeof parsed !== "object") {
    throw new Error("OpenAI returned invalid JSON");
  }
  return parsed;
}

export async function completeJsonForTask<T>(
  task: OpenAITask,
  system: string,
  user: string,
  temperature = 0.42,
): Promise<T> {
  const model = resolveModelForTask(task);
  logOpenAIModel(task, model);
  const client = getClient();
  const completion = await client.chat.completions.create({
    model,
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error(`OpenAI empty response (task=${task}, model=${model})`);
  }
  return parseJsonContent<T>(content);
}

function buildEvidenceBlock(input: PipelineInput, context?: ReportContext): string {
  const profileUrl = context?.scrapedUrl ?? input.socialProfileUrl;
  const resolvedName = resolveCompanyName(profileUrl, {
    markdown: context?.rawContent,
    pageTitle: context?.scrapedTitle,
    niche: input.industryNiche,
  });
  const signals =
    context?.extractedSignals ?? extractSignals(context?.rawContent, profileUrl);
  const synthesis =
    context?.signalSynthesis ?? synthesizeSignals(signals, resolvedName);
  const synthesisBlock = formatSynthesisForPrompt(synthesis);
  const signalCatalog = formatSignalsCatalog(signals);

  if (context?.founderSubmission) {
    const scrapeNote = signals.hasScrape
      ? `Supporting URLs scraped: ${context.supportingUrls?.join(", ") || profileUrl || "see below"}`
      : "No website scrape — idea-analysis from founder submission only.";
    return `## Founder submission (PRIMARY)
${context.founderSubmission}

${scrapeNote}

## Signal synthesis
${synthesisBlock}

## Signal catalog
${signalCatalog}`;
  }

  if (signals.hasScrape) {
    return `## Signal synthesis (PRIMARY)
${synthesisBlock}

## Raw signal catalog (SECONDARY)
URL: ${profileUrl}
${context?.scrapedTitle ? `Page title: ${context.scrapedTitle}\n` : ""}
${signalCatalog}`;
  }
  return `## Signal synthesis
${synthesisBlock}

## Raw signals
No scrape. Ground analysis in founder submission only.`;
}

function buildStructuredUserPrompt(input: PipelineInput, context?: ReportContext): string {
  const profileUrl = context?.scrapedUrl ?? input.socialProfileUrl;
  const resolvedName = resolveCompanyName(profileUrl, {
    markdown: context?.rawContent,
    pageTitle: context?.scrapedTitle,
    niche: input.industryNiche,
  });
  const evidenceBlock = buildEvidenceBlock(input, context);

  return `Write the structured evidence section of a partner memo (not the investment thesis).

Return JSON:

{
  "companyName": "${resolvedName}",
  "score": <integer 0-100>,
  "confidence": "Low" | "Medium" | "High",
  "coreContradiction": "<cite [SYN-*] ids>",
  "strategicTension": "<cite [SYN-*] ids>",
  "hiddenRisk": "<cite [SYN-*] ids>",
  "whyIncumbentsHaventWon": "<cite [SYN-*] ids>",
  "nonObviousInsight": "<cite [SYN-*] ids>",
  "strategicParadox": "<cite [SYN-*] ids>",
  "hiddenMoatOrWeakness": "<cite [SYN-*] ids>",
  "whyThisMightFail": ["<cite [SYN-*]>", "..."],
  "founderQuestions": ["<question tied to synthesized behavior>", "..."],
  "websiteEvidence": ["[tag] (signal-id) fact from catalog", "..."],
  "evidenceBindings": [
    { "field": "coreContradiction", "claim": "<one sentence>", "synthesisIds": ["SYN-PATTERN-1"], "signalIds": ["pricingModel-1"] }
  ],
  "demand": { "level": "Low"|"Medium"|"High", "analysis": "<[SYN-*] citations>" },
  "competition": { "level": "Low"|"Medium"|"High", "analysis": "<[SYN-*] citations>" },
  "opportunities": ["<[SYN-*] grounded wedge>", "..."],
  "verdict": "Go" | "Caution" | "No-Go"
}

${evidenceBlock}

## Company identity (mandatory)
- Use companyName exactly: ${resolvedName}

## Submission
- Category: ${input.industryNiche}
- Startup idea: ${input.mainConcern}
- Additional context: ${input.additionalNotes || "(none)"}
${input.socialProfileUrl ? `- Primary link (if any): ${input.socialProfileUrl}` : "- No primary URL (idea-only analysis)"}

Return JSON only.`;
}

function buildThesisUserPrompt(
  input: PipelineInput,
  context: ReportContext | undefined,
  structured: StructuredMemoJson,
): string {
  const profileUrl = context?.scrapedUrl ?? input.socialProfileUrl;
  const resolvedName = resolveCompanyName(profileUrl, {
    markdown: context?.rawContent,
    pageTitle: context?.scrapedTitle,
    niche: input.industryNiche,
  });
  const evidenceBlock = buildEvidenceBlock(input, context);

  return `Write the investment thesis section. Align with the structured pass below.

Return JSON:

{
  "bullCase": "<monetization + distribution + compounding; cite [SYN-*]>",
  "bearCase": "<concrete failure path; cite [SYN-*]>",
  "moatDurability": "<what compounds vs marketing>",
  "replacementRisk": "<workflow replacement chain + incumbent bundle>",
  "gtmWeakness": "<weakest GTM link; name channel>",
  "whyNow": "<timing catalyst from evidence>",
  "investmentVerdict": "<partner pass/hold/explore>",
  "whatThisCompanyActuallyIs": "<buyer + job-to-be-done>",
  "moatAnalysis": "<mechanism-level moat>"
}

## Structured pass (ground truth)
${JSON.stringify(structured, null, 2)}

${evidenceBlock}

## Company: ${resolvedName}
- Niche: ${input.industryNiche}
- Founder concern: ${input.mainConcern}

Return JSON only.`;
}

function companyLabel(ai: VCMemoJson, input: PipelineInput, context?: ReportContext): string {
  const profileUrl = context?.scrapedUrl ?? input.socialProfileUrl;
  const fromAi = ai.companyName?.trim();
  if (
    fromAi &&
    fromAi.length > 1 &&
    !/niche|industry|offer/i.test(fromAi) &&
    !isBlockedCompanyName(fromAi)
  ) {
    return fromAi;
  }
  return resolveCompanyName(profileUrl, {
    markdown: context?.rawContent,
    niche: input.industryNiche,
    aiName: fromAi && !isBlockedCompanyName(fromAi) ? fromAi : undefined,
  });
}

export function mapAIJsonToReport(
  orderId: string,
  input: PipelineInput,
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
    ai.bullCase ?? "",
    ai.bearCase ?? "",
    ai.gtmWeakness ?? "",
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

  const pricingHint = signals.pricingModel[0]?.text.slice(0, 90);
  const integrationHint = signals.integrations[0]?.text.slice(0, 90);
  const apiHint = signals.apiSignals[0]?.text.slice(0, 90);
  const hiringHint = signals.hiringSignals[0]?.text.slice(0, 90);
  const distHint = signals.distributionSurface[0]?.text.slice(0, 90) ?? signals.communitySignals[0]?.text.slice(0, 90);

  const bullCase = ensureString(
    ai.bullCase,
    pricingHint
      ? `${company} can win if ${pricingHint} converts repeat workflow into paid seats and ${distHint ? `distribution (${distHint})` : "distribution"} scales without paid CAC blowout.`
      : `${company} upside requires proving paid conversion on "${input.mainConcern}" with visible monetization on the site.`,
  );
  const bearCase = ensureString(
    ai.bearCase,
    integrationHint || apiHint
      ? `Bear: incumbents bundle similar capability; ${company}'s embed surface (${integrationHint ?? apiHint}) may not survive platform pricing or roadmap shifts.`
      : `Bear: buyers substitute with incumbent suites; ${company} lacks disclosed API/integrations to create switching costs.`,
  );
  const moatDurability = ensureString(
    ai.moatDurability,
    apiHint
      ? `Durability depends on API/workflow embed depth (${apiHint}) — not homepage positioning.`
      : `Durability unproven without API, integration, or pricing evidence on the public site.`,
  );
  const replacementRisk = ensureString(
    ai.replacementRisk,
    `Replacement chain: buyer currently solves "${input.mainConcern}" with adjacent tools; ${company} must displace a daily habit, not a one-off task.`,
  );
  const gtmWeakness = ensureString(
    ai.gtmWeakness,
    distHint
      ? `GTM risk: reliance on ${distHint} — conversion to paid and enterprise motion not evidenced.`
      : `GTM risk: no clear primary acquisition channel or enterprise sales path on the public site.`,
  );
  const whyNow = ensureString(
    ai.whyNow,
    hiringHint
      ? `Timing: hiring motion (${hiringHint}) suggests product push — category window may close as incumbents ship fast-follow bundles.`
      : `Timing: category moving quickly; ${company} must show pull before model/API parity erodes differentiation.`,
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
      : ["[submission] Idea-analysis only — memo grounded in founder submission, not a live site scrape."],
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
    `${company}: demand for the wedge behind "${input.mainConcern}" reads ${demandLevel.toLowerCase()} — underwrite with paid cohort retention, not category TAM narratives.`,
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
    source: "openai",
    rawContent: context?.rawContent,
    scrapedUrl: context?.scrapedUrl,
  };
}

export async function generateAIReport(
  orderId: string,
  input: PipelineInput,
  reportId: string,
  context?: ReportContext,
): Promise<ValidationReport> {
  const structured = await completeJsonForTask<StructuredMemoJson>(
    "structured_evidence",
    SYSTEM_STRUCTURED_PROMPT,
    buildStructuredUserPrompt(input, context),
  );

  const thesis = await completeJsonForTask<InvestmentThesisJson>(
    "investment_thesis",
    SYSTEM_THESIS_PROMPT,
    buildThesisUserPrompt(input, context, structured),
    0.35,
  );

  const ai: VCMemoJson = { ...structured, ...thesis };
  return mapAIJsonToReport(orderId, input, reportId, ai, context);
}

export type MarketEvolutionRefineContext = {
  companyName: string;
  industryNiche: string;
  signalCatalog: string;
};

export async function refineMarketEvolutionWithAI(
  evolution: MarketEvolutionInference,
  ctx: MarketEvolutionRefineContext,
): Promise<MarketEvolutionInference> {
  try {
    return await completeJsonForTask<MarketEvolutionInference>(
      "market_evolution",
      SYSTEM_MARKET_EVOLUTION_PROMPT,
      `Refine market evolution for ${ctx.companyName} (${ctx.industryNiche}).

${ctx.signalCatalog}

Input JSON:
${JSON.stringify(evolution)}`,
      0.3,
    );
  } catch (error) {
    console.warn("[SignalProof] market_evolution AI refine failed:", error);
    return evolution;
  }
}

export type StrategicSimulationRefineContext = {
  companyName: string;
  industryNiche: string;
  bullCase?: string;
  bearCase?: string;
};

export async function refineStrategicSimulationWithAI(
  bundle: StrategicSimulationBundle,
  ctx: StrategicSimulationRefineContext,
): Promise<StrategicSimulationBundle> {
  try {
    return await completeJsonForTask<StrategicSimulationBundle>(
      "strategic_simulation",
      SYSTEM_STRATEGIC_SIMULATION_PROMPT,
      `Refine strategic simulation for ${ctx.companyName} (${ctx.industryNiche}).
${ctx.bullCase ? `Bull: ${ctx.bullCase}\n` : ""}${ctx.bearCase ? `Bear: ${ctx.bearCase}\n` : ""}
Input JSON:
${JSON.stringify(bundle)}`,
      0.3,
    );
  } catch (error) {
    console.warn("[SignalProof] strategic_simulation AI refine failed:", error);
    return bundle;
  }
}
