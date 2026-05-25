import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { allSignals, type ExtractedSignal, type ExtractedSignals } from "@/lib/extract-signals";
import type { ValidationReport } from "@/lib/reports";
import {
  allSynthesisItems,
  type SignalSynthesis,
  type SynthesisItem,
} from "@/lib/signal-synthesis";

export type MemoryConfidence = "Low" | "Medium" | "High";

export type CompanyMemoryRecord = {
  companyId: string;
  reportId: string;
  companyName: string;
  industryNiche: string;
  socialProfileUrl: string;
  extractedSignals: ExtractedSignals;
  synthesizedPatterns: SignalSynthesis;
  companyDNA: SynthesisItem | null;
  validationScore: number;
  categoryTags: string[];
  timestamp: string;
};

export type CompanyMemoryGraph = {
  companies: CompanyMemoryRecord[];
  lastUpdated: string;
};

export type ComparisonRefs = {
  companyId: string;
  companyName: string;
  dnaId?: string;
  synthesisIds: string[];
  signalIds: string[];
};

export type ComparisonDimension = {
  insight: string;
  companyA: ComparisonRefs;
  companyB: ComparisonRefs;
  confidence: MemoryConfidence;
};

export type CompanyComparison = {
  companyAId: string;
  companyBId: string;
  strategicDifference: ComparisonDimension;
  moatDifference: ComparisonDimension;
  distributionDifference: ComparisonDimension;
  workflowDifference: ComparisonDimension;
  monetizationDifference: ComparisonDimension;
  defensibilityDifference: ComparisonDimension;
};

export type CategoryPatternInsight = {
  category: string;
  companies: Array<{ companyId: string; companyName: string; dnaId?: string }>;
  strongestDistribution: { companyId: string; companyName: string; synthesisIds: string[]; signalIds: string[]; reason: string };
  mostDurableMoat: { companyId: string; companyName: string; synthesisIds: string[]; signalIds: string[]; reason: string };
  mostEffectiveOnboarding: { companyId: string; companyName: string; synthesisIds: string[]; signalIds: string[]; reason: string };
  confidence: MemoryConfidence;
};

export type EmergingArchetype = {
  archetype: string;
  description: string;
  members: Array<{
    companyId: string;
    companyName: string;
    dnaId?: string;
    synthesisIds: string[];
  }>;
  confidence: MemoryConfidence;
};

export type MarketPositionInference = {
  companyId: string;
  companyName: string;
  attacking: string;
  replacing: string;
  whyIncumbentsHaventFollowed: string;
  mostDangerousPath: string;
  dnaId?: string;
  synthesisIds: string[];
  signalIds: string[];
  confidence: MemoryConfidence;
};

const DATA_DIR = path.join(process.cwd(), "data");
const MEMORY_FILE = path.join(DATA_DIR, "company-memory.json");

const ARCHETYPE_RULES: Array<{
  id: string;
  label: string;
  description: string;
  match: (record: CompanyMemoryRecord) => { hit: boolean; synthesisIds: string[] };
}> = [
  {
    id: "ai-copilot-layer",
    label: "AI copilot layer",
    description: "AI assistant stacked on existing workflow primitives — intelligence inside habitual structure.",
    match: (r) => matchArchetype(r, /\bcopilot\b|\bassistant\b|\bai\b/i, ["aiClaims", "workflow"], ["SYN-BEHAVIOR", "SYN-PATTERN"]),
  },
  {
    id: "workflow-os",
    label: "Workflow OS",
    description: "Narrow workflow depth aiming to become team operating system — integrations + velocity UX.",
    match: (r) => matchArchetype(r, /\bworkflow|\bissue|\boperating\s+system|\bvelocity/i, ["workflow", "integrations"], ["SYN-OPT", "SYN-PATTERN"]),
  },
  {
    id: "creator-identity-network",
    label: "Creator identity network",
    description: "Community-native distribution optimizing creator identity density over API/developer surface.",
    match: (r) => matchArchetype(r, /\bdiscord|\bcreator|\baesthetic|\bcommunity/i, ["communitySignals", "distributionSurface"], ["SYN-OPT", "SYN-PATTERN"]),
  },
  {
    id: "ai-native-infra",
    label: "AI-native infra",
    description: "Developer/API-forward AI infrastructure — monetization tied to usage, seats, or enterprise tiers.",
    match: (r) => matchArchetype(r, /\bapi\b|\bdeveloper|\binfra|\bmodel/i, ["integrations", "docsSignals", "enterpriseSignals"], ["SYN-BEHAVIOR", "SYN-TRADEOFF"]),
  },
  {
    id: "adaptive-workspace",
    label: "Adaptive workspace OS",
    description: "Block/workspace paradigm + templates + optional AI — horizontal expansion play.",
    match: (r) => matchArchetype(r, /\bblock|\bworkspace|\btemplate|\bwiki/i, ["positioning", "communitySignals"], ["SYN-PATTERN", "SYN-DNA"]),
  },
];

async function ensureMemoryFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(MEMORY_FILE, "utf8");
  } catch {
    const empty: CompanyMemoryGraph = { companies: [], lastUpdated: new Date().toISOString() };
    await writeFile(MEMORY_FILE, `${JSON.stringify(empty, null, 2)}\n`, "utf8");
  }
}

export async function readMemoryGraph(): Promise<CompanyMemoryGraph> {
  await ensureMemoryFile();
  const raw = await readFile(MEMORY_FILE, "utf8");
  return JSON.parse(raw) as CompanyMemoryGraph;
}

async function writeMemoryGraph(graph: CompanyMemoryGraph): Promise<void> {
  await ensureMemoryFile();
  graph.lastUpdated = new Date().toISOString();
  await writeFile(MEMORY_FILE, `${JSON.stringify(graph, null, 2)}\n`, "utf8");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function deriveCompanyId(report: ValidationReport): string {
  const url = report.scrapedUrl ?? report.socialProfileUrl;
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    const slug = host.replace(/^www\./, "").split(".")[0];
    if (slug.length > 2) return slug;
  } catch {
    /* ignore */
  }
  return slugify(report.companyName ?? report.industryNiche) || report.id.slice(0, 8);
}

function inferCategoryTags(record: CompanyMemoryRecord): string[] {
  const tags = new Set<string>();
  const niche = record.industryNiche.toLowerCase();
  const name = record.companyName.toLowerCase();

  if (/ai|generative|image|media|creative|video/.test(niche + name)) tags.add("ai-creative");
  if (/developer|devtool|collaboration|issue|project/.test(niche + name)) tags.add("dev-productivity");
  if (/workspace|productivity|notion|doc/.test(niche + name)) tags.add("workspace");
  if (/search|research|answer/.test(niche + name)) tags.add("ai-search");
  if (record.extractedSignals.aiClaims.length) tags.add("ai-native");
  if (record.extractedSignals.communitySignals.length) tags.add("community-led");
  if (record.extractedSignals.enterpriseSignals.length) tags.add("enterprise");
  if (record.extractedSignals.pricingModel.length) tags.add("monetized");

  return [...tags];
}

function refsFromRecord(record: CompanyMemoryRecord, synthesisIds: string[], signalIds: string[]): ComparisonRefs {
  return {
    companyId: record.companyId,
    companyName: record.companyName,
    dnaId: record.companyDNA?.id,
    synthesisIds,
    signalIds,
  };
}

function topSynthesis(record: CompanyMemoryRecord, prefix?: string): SynthesisItem | undefined {
  const items = allSynthesisItems(record.synthesizedPatterns);
  if (prefix) return items.find((i) => i.id.startsWith(prefix));
  return record.companyDNA ?? items[0];
}

function signalsInCategories(record: CompanyMemoryRecord, categories: (keyof ExtractedSignals)[]): ExtractedSignal[] {
  const out: ExtractedSignal[] = [];
  for (const cat of categories) {
    const list = record.extractedSignals[cat];
    if (Array.isArray(list)) out.push(...(list as ExtractedSignal[]));
  }
  return out;
}

function signalIds(signals: ExtractedSignal[], max = 3): string[] {
  return signals.slice(0, max).map((s) => s.id);
}

function scoreDistribution(record: CompanyMemoryRecord): number {
  return (
    record.extractedSignals.communitySignals.length * 3 +
    record.extractedSignals.distributionSurface.length * 2 +
    record.extractedSignals.socialProof.length
  );
}

function scoreMoatDurability(record: CompanyMemoryRecord): number {
  let score = 0;
  score += record.extractedSignals.integrations.length * 2;
  score += record.extractedSignals.enterpriseSignals.length * 3;
  score += record.extractedSignals.workflow.length * 2;
  score += record.extractedSignals.docsSignals.length;
  score += record.extractedSignals.communitySignals.length;
  if (record.synthesizedPatterns.optimizationDirection.some((s) => /narrow|workflow|lock/i.test(s.insight))) {
    score += 2;
  }
  return score;
}

function scoreOnboarding(record: CompanyMemoryRecord): number {
  return (
    record.extractedSignals.onboardingCta.length * 3 +
    record.extractedSignals.pricingModel.length * 2 +
    (record.extractedSignals.pricingModel.some((s) => /\$|free|trial/i.test(s.text)) ? 2 : 0)
  );
}

function matchArchetype(
  record: CompanyMemoryRecord,
  textPattern: RegExp,
  signalCategories: (keyof ExtractedSignals)[],
  synthesisPrefixes: string[],
): { hit: boolean; synthesisIds: string[] } {
  const signals = signalsInCategories(record, signalCategories);
  const signalText = signals.map((s) => s.text).join(" ");
  const dnaText = record.companyDNA?.insight ?? "";
  const items = allSynthesisItems(record.synthesizedPatterns);
  const matchedSyn = items.filter(
    (i) => synthesisPrefixes.some((p) => i.id.startsWith(p)) || textPattern.test(i.insight),
  );
  const hit =
    (signals.length >= 1 && textPattern.test(signalText)) ||
    textPattern.test(dnaText) ||
    matchedSyn.length >= 1;
  return { hit, synthesisIds: matchedSyn.map((s) => s.id).slice(0, 3) };
}

function compareDimension(
  a: CompanyMemoryRecord,
  b: CompanyMemoryRecord,
  build: (a: CompanyMemoryRecord, b: CompanyMemoryRecord) => {
    insight: string;
    aSyn: string[];
    bSyn: string[];
    aSig: string[];
    bSig: string[];
    confidence: MemoryConfidence;
  },
): ComparisonDimension {
  const result = build(a, b);
  return {
    insight: result.insight,
    companyA: refsFromRecord(a, result.aSyn, result.aSig),
    companyB: refsFromRecord(b, result.bSyn, result.bSig),
    confidence: result.confidence,
  };
}

export async function getCompanyMemory(companyId: string): Promise<CompanyMemoryRecord | null> {
  const graph = await readMemoryGraph();
  return graph.companies.find((c) => c.companyId === companyId) ?? null;
}

export async function recordCompanyFromReport(report: ValidationReport): Promise<CompanyMemoryRecord> {
  if (!report.extractedSignals || !report.signalSynthesis) {
    throw new Error("Report missing signals/synthesis — cannot record in memory graph");
  }

  const companyId = deriveCompanyId(report);
  const record: CompanyMemoryRecord = {
    companyId,
    reportId: report.id,
    companyName: report.companyName ?? companyId,
    industryNiche: report.industryNiche,
    socialProfileUrl: report.socialProfileUrl,
    extractedSignals: report.extractedSignals,
    synthesizedPatterns: report.signalSynthesis,
    companyDNA: report.signalSynthesis.companyDNA,
    validationScore: report.validationScore,
    categoryTags: [],
    timestamp: report.createdAt,
  };
  record.categoryTags = inferCategoryTags(record);

  const graph = await readMemoryGraph();
  const existingIdx = graph.companies.findIndex((c) => c.companyId === companyId);
  if (existingIdx >= 0) {
    graph.companies[existingIdx] = record;
  } else {
    graph.companies.unshift(record);
  }
  await writeMemoryGraph(graph);
  return record;
}

export async function compareCompanies(
  companyAId: string,
  companyBId: string,
): Promise<CompanyComparison | null> {
  const graph = await readMemoryGraph();
  const a = graph.companies.find((c) => c.companyId === companyAId);
  const b = graph.companies.find((c) => c.companyId === companyBId);
  if (!a || !b) return null;

  const dnaA = a.companyDNA;
  const dnaB = b.companyDNA;
  const optA = a.synthesizedPatterns.optimizationDirection[0];
  const optB = b.synthesizedPatterns.optimizationDirection[0];
  const patA = a.synthesizedPatterns.strategicPatterns[0];
  const patB = b.synthesizedPatterns.strategicPatterns[0];

  const strategicDifference = compareDimension(a, b, () => {
    const aSyn = [dnaA?.id, patA?.id, optA?.id].filter(Boolean) as string[];
    const bSyn = [dnaB?.id, patB?.id, optB?.id].filter(Boolean) as string[];
    const insight =
      dnaA && dnaB
        ? `[${dnaA.id}] ${a.companyName} DNA (${dnaA.insight.slice(0, 120)}…) diverges from [${dnaB.id}] ${b.companyName} (${dnaB.insight.slice(0, 120)}…) — different optimization loops, not feature gaps.`
        : patA && patB
          ? `[${patA.id}] vs [${patB.id}]: ${a.companyName} strategic pattern (${patA.insight.slice(0, 100)}) ≠ ${b.companyName} (${patB.insight.slice(0, 100)}).`
          : `Insufficient DNA/synthesis for ${a.companyName} vs ${b.companyName} — expand signal scrape before strategic compare.`;
    return {
      insight,
      aSyn,
      bSyn,
      aSig: signalIds(signalsInCategories(a, ["positioning", "targetUser"])),
      bSig: signalIds(signalsInCategories(b, ["positioning", "targetUser"])),
      confidence: dnaA && dnaB ? "High" : patA && patB ? "Medium" : "Low",
    };
  });

  const moatDifference = compareDimension(a, b, () => {
    const moatA = a.synthesizedPatterns.hiddenTradeoffs[0] ?? optA;
    const moatB = b.synthesizedPatterns.hiddenTradeoffs[0] ?? optB;
    const durA = scoreMoatDurability(a);
    const durB = scoreMoatDurability(b);
    const stronger = durA >= durB ? a : b;
    const weaker = durA >= durB ? b : a;
    const strongSyn = (durA >= durB ? moatA : moatB)?.id;
    const weakSyn = (durA >= durB ? moatB : moatA)?.id;
    return {
      insight: strongSyn && weakSyn
        ? `[${strongSyn}] ${stronger.companyName} shows higher moat durability score (${Math.max(durA, durB)} vs ${Math.min(durA, durB)}) — ${moatA?.insight.slice(0, 80) ?? "workflow/integration depth"} vs [${weakSyn}] ${weaker.companyName}.`
        : `${a.companyName} moat signals (${durA}) vs ${b.companyName} (${durB}) — synthesis-backed durability differs.`,
      aSyn: [moatA?.id, optA?.id].filter(Boolean) as string[],
      bSyn: [moatB?.id, optB?.id].filter(Boolean) as string[],
      aSig: signalIds(signalsInCategories(a, ["integrations", "enterpriseSignals", "workflow"])),
      bSig: signalIds(signalsInCategories(b, ["integrations", "enterpriseSignals", "workflow"])),
      confidence: moatA && moatB ? "Medium" : "Low",
    };
  });

  const distA = signalsInCategories(a, ["communitySignals", "distributionSurface"]);
  const distB = signalsInCategories(b, ["communitySignals", "distributionSurface"]);
  const distributionDifference = compareDimension(a, b, () => {
    const scoreA = scoreDistribution(a);
    const scoreB = scoreDistribution(b);
    const synA = a.synthesizedPatterns.behaviorInference[0]?.id ?? patA?.id;
    const synB = b.synthesizedPatterns.behaviorInference[0]?.id ?? patB?.id;
    return {
      insight:
        scoreA !== scoreB
          ? `${a.companyName} [${synA ?? "signals"}] distribution surface (${distA.map((s) => s.text.slice(0, 40)).join("; ") || "sparse"}) vs ${b.companyName} [${synB ?? "signals"}] (${distB.map((s) => s.text.slice(0, 40)).join("; ") || "sparse"}) — score ${scoreA} vs ${scoreB}.`
          : `Both ${a.companyName} and ${b.companyName} show similar distribution signal density (${scoreA}) — differentiation is in synthesis loop, not channel count.`,
      aSyn: [synA].filter(Boolean) as string[],
      bSyn: [synB].filter(Boolean) as string[],
      aSig: signalIds(distA),
      bSig: signalIds(distB),
      confidence: distA.length >= 1 && distB.length >= 1 ? "Medium" : "Low",
    };
  });

  const wfA = a.extractedSignals.workflow;
  const wfB = b.extractedSignals.workflow;
  const workflowDifference = compareDimension(a, b, () => ({
    insight:
      wfA.length && wfB.length
        ? `[${optA?.id ?? "SYN"}] ${a.companyName} workflow (${wfA[0].text.slice(0, 80)}) vs [${optB?.id ?? "SYN"}] ${b.companyName} (${wfB[0].text.slice(0, 80)}) — embedding depth differs.`
        : `${a.companyName} workflow evidence (${wfA.length} signals) vs ${b.companyName} (${wfB.length}) — insufficient for strong workflow compare.`,
    aSyn: [optA?.id].filter(Boolean) as string[],
    bSyn: [optB?.id].filter(Boolean) as string[],
    aSig: signalIds(wfA),
    bSig: signalIds(wfB),
    confidence: wfA.length >= 1 && wfB.length >= 1 ? "Medium" : "Low",
  }));

  const priceA = a.extractedSignals.pricingModel;
  const priceB = b.extractedSignals.pricingModel;
  const monetizationDifference = compareDimension(a, b, () => ({
    insight:
      priceA.length && priceB.length
        ? `${a.companyName} monetization [${priceA[0].id}] "${priceA[0].text.slice(0, 70)}" vs ${b.companyName} [${priceB[0].id}] "${priceB[0].text.slice(0, 70)}" — packaging implies different ARPU motion.`
        : `${a.companyName} pricing signals (${priceA.length}) vs ${b.companyName} (${priceB.length}) — monetization compare limited.`,
    aSyn: [a.synthesizedPatterns.behaviorInference.find((s) => /PLG|pricing|self-serve/i.test(s.insight))?.id].filter(Boolean) as string[],
    bSyn: [b.synthesizedPatterns.behaviorInference.find((s) => /PLG|pricing|self-serve/i.test(s.insight))?.id].filter(Boolean) as string[],
    aSig: signalIds(priceA),
    bSig: signalIds(priceB),
    confidence: priceA.length >= 1 && priceB.length >= 1 ? "Medium" : "Low",
  }));

  const defensibilityDifference = compareDimension(a, b, () => {
    const tradeA = a.synthesizedPatterns.hiddenTradeoffs[0];
    const tradeB = b.synthesizedPatterns.hiddenTradeoffs[0];
    return {
      insight:
        dnaA && tradeB
          ? `[${dnaA.id}] ${a.companyName} defensibility: ${dnaA.contradictionRisk.slice(0, 100)} vs [${tradeB.id}] ${b.companyName}: ${tradeB.contradictionRisk.slice(0, 100)}.`
          : tradeA && tradeB
            ? `[${tradeA.id}] vs [${tradeB.id}] — ${a.companyName} and ${b.companyName} expose different contradiction risks under scale.`
            : `Defensibility compare between ${a.companyName} and ${b.companyName} requires richer synthesis tradeoffs.`,
      aSyn: [dnaA?.id, tradeA?.id].filter(Boolean) as string[],
      bSyn: [dnaB?.id, tradeB?.id].filter(Boolean) as string[],
      aSig: signalIds(allSignals(a.extractedSignals).slice(0, 3)),
      bSig: signalIds(allSignals(b.extractedSignals).slice(0, 3)),
      confidence: (dnaA || tradeA) && (dnaB || tradeB) ? "Medium" : "Low",
    };
  });

  return {
    companyAId: companyAId,
    companyBId: companyBId,
    strategicDifference,
    moatDifference,
    distributionDifference,
    workflowDifference,
    monetizationDifference,
    defensibilityDifference,
  };
}

export async function detectCategoryPatterns(): Promise<CategoryPatternInsight[]> {
  const graph = await readMemoryGraph();
  const byTag = new Map<string, CompanyMemoryRecord[]>();

  for (const company of graph.companies) {
    for (const tag of company.categoryTags) {
      const list = byTag.get(tag) ?? [];
      list.push(company);
      byTag.set(tag, list);
    }
  }

  const insights: CategoryPatternInsight[] = [];

  for (const [category, members] of byTag) {
    if (members.length < 2) continue;

    const distWinner = [...members].sort((x, y) => scoreDistribution(y) - scoreDistribution(x))[0];
    const moatWinner = [...members].sort((x, y) => scoreMoatDurability(y) - scoreMoatDurability(x))[0];
    const onboardWinner = [...members].sort((x, y) => scoreOnboarding(y) - scoreOnboarding(x))[0];

    const distSyn = topSynthesis(distWinner, "SYN-BEHAVIOR") ?? distWinner.companyDNA;
    const moatSyn = topSynthesis(moatWinner, "SYN-TRADEOFF") ?? moatWinner.companyDNA;
    const onboardSyn = topSynthesis(onboardWinner, "SYN-OPT") ?? onboardWinner.companyDNA;

    insights.push({
      category,
      companies: members.map((m) => ({
        companyId: m.companyId,
        companyName: m.companyName,
        dnaId: m.companyDNA?.id,
      })),
      strongestDistribution: {
        companyId: distWinner.companyId,
        companyName: distWinner.companyName,
        synthesisIds: [distSyn?.id].filter(Boolean) as string[],
        signalIds: signalIds(signalsInCategories(distWinner, ["communitySignals", "distributionSurface"])),
        reason: `[${distSyn?.id ?? "signals"}] Highest community/distribution signal density in ${category} cohort.`,
      },
      mostDurableMoat: {
        companyId: moatWinner.companyId,
        companyName: moatWinner.companyName,
        synthesisIds: [moatSyn?.id].filter(Boolean) as string[],
        signalIds: signalIds(signalsInCategories(moatWinner, ["integrations", "enterpriseSignals", "workflow"])),
        reason: `[${moatSyn?.id ?? "signals"}] Strongest integration/enterprise/workflow moat signals in ${category}.`,
      },
      mostEffectiveOnboarding: {
        companyId: onboardWinner.companyId,
        companyName: onboardWinner.companyName,
        synthesisIds: [onboardSyn?.id].filter(Boolean) as string[],
        signalIds: signalIds(signalsInCategories(onboardWinner, ["onboardingCta", "pricingModel"])),
        reason: `[${onboardSyn?.id ?? "signals"}] Clearest pricing + CTA pairing in ${category} set.`,
      },
      confidence: members.length >= 3 ? "Medium" : "Low",
    });
  }

  return insights.sort((a, b) => b.companies.length - a.companies.length);
}

export async function detectEmergingArchetypes(): Promise<EmergingArchetype[]> {
  const graph = await readMemoryGraph();
  const results: EmergingArchetype[] = [];

  for (const rule of ARCHETYPE_RULES) {
    const members: EmergingArchetype["members"] = [];
    for (const company of graph.companies) {
      const { hit, synthesisIds } = rule.match(company);
      if (!hit) continue;
      members.push({
        companyId: company.companyId,
        companyName: company.companyName,
        dnaId: company.companyDNA?.id,
        synthesisIds: synthesisIds.length ? synthesisIds : [company.companyDNA?.id].filter(Boolean) as string[],
      });
    }
    if (members.length === 0) continue;
    results.push({
      archetype: rule.label,
      description: rule.description,
      members,
      confidence: members.length >= 2 ? "Medium" : "Low",
    });
  }

  return results;
}

export async function inferMarketPosition(companyId: string): Promise<MarketPositionInference | null> {
  const record = await getCompanyMemory(companyId);
  if (!record) return null;

  const positioning = record.extractedSignals.positioning;
  const workflow = record.extractedSignals.workflow;
  const dna = record.companyDNA;
  const pattern = record.synthesizedPatterns.strategicPatterns[0];
  const tradeoff = record.synthesizedPatterns.hiddenTradeoffs[0];
  const synIds = [dna?.id, pattern?.id, tradeoff?.id].filter(Boolean) as string[];
  const sigIds = signalIds([...positioning, ...workflow, ...record.extractedSignals.integrations]);

  const posText = positioning.map((s) => s.text).join(" ");
  const replaceMatch = posText.match(/\b(?:replace|alternative to|vs\.?)\s+(\w+)/i);

  const attacking = pattern
    ? `[${pattern.id}] ${record.companyName} attacks ${replaceMatch?.[1] ?? "incumbent workflow bundles"} via: ${pattern.insight.slice(0, 140)}`
    : positioning[0]
      ? `[${positioning[0].id}] Positioning targets ${replaceMatch?.[1] ?? "adjacent incumbents"}: "${positioning[0].text.slice(0, 100)}"`
      : `Insufficient positioning synthesis to name attack vector for ${record.companyName}.`;

  const replacing = positioning[0]
    ? `[${positioning[0].id}] Substituting for: ${replaceMatch?.[0] ?? positioning[0].text.slice(0, 90)}`
    : workflow[0]
      ? `[${workflow[0].id}] Workflow substitution: ${workflow[0].text.slice(0, 90)}`
      : `Replacement target unclear — needs positioning signals.`;

  const whyIncumbents = tradeoff
    ? `[${tradeoff.id}] ${tradeoff.insight.slice(0, 120)} — incumbents face: ${tradeoff.contradictionRisk.slice(0, 120)}`
    : dna
      ? `[${dna.id}] ${dna.contradictionRisk}`
      : `Incumbent inertia inference blocked — no tradeoff synthesis.`;

  const mostDangerous = dna
    ? `[${dna.id}] ${dna.contradictionRisk}`
    : tradeoff
      ? `[${tradeoff.id}] ${tradeoff.contradictionRisk}`
      : pattern
        ? `[${pattern.id}] ${pattern.contradictionRisk}`
        : `Danger path unknown — expand evidence.`;

  return {
    companyId: record.companyId,
    companyName: record.companyName,
    attacking,
    replacing,
    whyIncumbentsHaventFollowed: whyIncumbents,
    mostDangerousPath: mostDangerous,
    dnaId: dna?.id,
    synthesisIds: synIds,
    signalIds: sigIds,
    confidence: dna && pattern ? "Medium" : "Low",
  };
}

/** Alias for inferMarketPosition — market structure read for one company. */
export const marketPositionInference = inferMarketPosition;

export async function getMemoryStats(): Promise<{
  companyCount: number;
  categoryCount: number;
  archetypeCount: number;
}> {
  const graph = await readMemoryGraph();
  const categories = await detectCategoryPatterns();
  const archetypes = await detectEmergingArchetypes();
  return {
    companyCount: graph.companies.length,
    categoryCount: categories.length,
    archetypeCount: archetypes.filter((a) => a.members.length >= 2).length,
  };
}
