import {
  allSignals,
  type ExtractedSignal,
  type ExtractedSignals,
  type SignalCategory,
} from "@/lib/extract-signals";

export type SynthesisConfidence = "Low" | "Medium" | "High";

export type SynthesisItem = {
  id: string;
  insight: string;
  supportingSignals: string[];
  confidence: SynthesisConfidence;
  contradictionRisk: string;
};

export type SignalSynthesis = {
  strategicPatterns: SynthesisItem[];
  hiddenTradeoffs: SynthesisItem[];
  optimizationDirection: SynthesisItem[];
  behaviorInference: SynthesisItem[];
  companyDNA: SynthesisItem | null;
  synthesisCount: number;
};

type SynthesisBucket =
  | "strategicPatterns"
  | "hiddenTradeoffs"
  | "optimizationDirection"
  | "behaviorInference";

type RuleMatch = {
  bucket: SynthesisBucket;
  insight: string;
  signalIds: string[];
  confidence: SynthesisConfidence;
  contradictionRisk: string;
};

type SignalContext = {
  signals: ExtractedSignals;
  catalog: ExtractedSignal[];
  company: string;
};

const API_PATTERN = /\bapi\b|\bwebhook\b|\bsdk\b|\bdeveloper\s+api/i;
const DISCORD_PATTERN = /\bdiscord\b/i;
const AESTHETIC_PATTERN = /\baesthetic|\bcreator|\bart|\bdesign|\bvisual|\bidentity/i;
const KEYBOARD_PATTERN = /\bkeyboard|\bshortcut|\bvelocity|\bfast|\bspeed/i;
const GITHUB_PATTERN = /\bgithub\b/i;
const JIRA_PATTERN = /\bjira\b|\breplace\b|\balternative\b|\bissue\s+track/i;
const BLOCK_PATTERN = /\bblock|\bworkspace|\bdocument|\bwiki/i;
const TEMPLATE_PATTERN = /\btemplate|\bgallery|\bmarketplace|\becosystem/i;
const ENTERPRISE_PATTERN = /\benterprise|\bSOC|\bSSO|\bcompliance/i;
const BROAD_PM_PATTERN = /\broadmap|\bportfolio|\bprogram\s+management|\bOKR|\bresource\s+planning/i;

function pick(
  ctx: SignalContext,
  categories: SignalCategory[],
  max = 2,
): ExtractedSignal[] {
  const out: ExtractedSignal[] = [];
  const seen = new Set<string>();
  for (const cat of categories) {
    const list = ctx.signals[cat] as ExtractedSignal[];
    for (const signal of list) {
      if (seen.has(signal.id)) continue;
      seen.add(signal.id);
      out.push(signal);
      if (out.length >= max) break;
    }
    if (out.length >= max) break;
  }
  return out;
}

function textMatches(signals: ExtractedSignal[], pattern: RegExp): ExtractedSignal[] {
  return signals.filter((s) => pattern.test(s.text));
}

function categoryHasText(ctx: SignalContext, categories: SignalCategory[], pattern: RegExp): ExtractedSignal[] {
  const hits: ExtractedSignal[] = [];
  for (const cat of categories) {
    hits.push(...textMatches(ctx.signals[cat] as ExtractedSignal[], pattern));
  }
  return hits;
}

function lacksApiEmphasis(ctx: SignalContext): boolean {
  const integrationHits = categoryHasText(
    ctx,
    ["integrations", "apiSignals", "docsSignals", "workflow"],
    API_PATTERN,
  );
  return integrationHits.length === 0;
}

function lacksEnterprise(ctx: SignalContext): boolean {
  return ctx.signals.enterpriseSignals.length === 0;
}

function lacksBroadPm(ctx: SignalContext): boolean {
  const hits = categoryHasText(
    ctx,
    ["workflow", "positioning", "targetUser"],
    BROAD_PM_PATTERN,
  );
  return hits.length === 0;
}

function ids(signals: ExtractedSignal[]): string[] {
  return signals.map((s) => s.id);
}

function uniqueSignals(signals: ExtractedSignal[]): ExtractedSignal[] {
  const seen = new Set<string>();
  return signals.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

function minTwo(signals: ExtractedSignal[]): ExtractedSignal[] | null {
  const unique = uniqueSignals(signals);
  return unique.length >= 2 ? unique.slice(0, 4) : null;
}

function confidenceFromSignals(
  matched: ExtractedSignal[],
  ctx: SignalContext,
): SynthesisConfidence {
  if (matched.length >= 3 && ctx.signals.evidenceTier === "strong") return "High";
  if (matched.length >= 2 && ctx.signals.evidenceTier !== "none") return "Medium";
  return "Low";
}

function makeItem(
  prefix: string,
  index: number,
  bucket: SynthesisBucket,
  match: Omit<RuleMatch, "bucket">,
): SynthesisItem {
  return {
    id: `${prefix}-${index}`,
    insight: match.insight,
    supportingSignals: match.signalIds,
    confidence: match.confidence,
    contradictionRisk: match.contradictionRisk,
  };
}

function runRules(ctx: SignalContext): RuleMatch[] {
  const rules: RuleMatch[] = [];
  const company = ctx.company;

  const discord = categoryHasText(ctx, ["communitySignals", "distributionSurface"], DISCORD_PATTERN);
  const community = pick(ctx, ["communitySignals", "distributionSurface"], 2);
  const onboarding = pick(ctx, ["onboardingCta"], 1);
  const aesthetic = categoryHasText(
    ctx,
    ["targetUser", "positioning", "repeatedLanguage", "workflow"],
    AESTHETIC_PATTERN,
  );

  const creatorCluster = minTwo([...discord, ...community, ...aesthetic, ...onboarding]);
  if (creatorCluster && lacksApiEmphasis(ctx)) {
    rules.push({
      bucket: "optimizationDirection",
      insight: `${company} appears optimized for creator identity density — community-native distribution with aesthetic/creator language and limited API surface.`,
      signalIds: ids(creatorCluster),
      confidence: confidenceFromSignals(creatorCluster, ctx),
      contradictionRisk:
        "If enterprise or API buyers arrive, Discord/community GTM may not convert; platform policy shifts on upstream models could break the loop.",
    });
    rules.push({
      bucket: "strategicPatterns",
      insight: `${company} stacks community distribution + aesthetic positioning without API emphasis — a consumer-creator loop rather than developer infrastructure.`,
      signalIds: ids(creatorCluster),
      confidence: confidenceFromSignals(creatorCluster, ctx),
      contradictionRisk:
        "Competing on model quality alone collapses if foundation models commoditize image/text generation.",
    });
  }

  const github = categoryHasText(ctx, ["integrations"], GITHUB_PATTERN);
  const keyboard = categoryHasText(ctx, ["workflow", "repeatedLanguage", "positioning"], KEYBOARD_PATTERN);
  const jira = categoryHasText(ctx, ["positioning", "workflow", "targetUser"], JIRA_PATTERN);
  const workflow = pick(ctx, ["workflow"], 2);

  const devVelocityCluster = minTwo([...github, ...keyboard, ...jira, ...workflow]);
  if (devVelocityCluster && lacksBroadPm(ctx)) {
    rules.push({
      bucket: "optimizationDirection",
      insight: `${company} is intentionally narrow — keyboard/velocity UX plus dev integrations (e.g. GitHub) without a broad PM suite signals workflow depth over platform breadth.`,
      signalIds: ids(devVelocityCluster),
      confidence: confidenceFromSignals(devVelocityCluster, ctx),
      contradictionRisk:
        "Jira/Atlassian bundling and procurement inertia may block expansion beyond eng teams; narrow wedge caps TAM narrative.",
    });
    rules.push({
      bucket: "hiddenTradeoffs",
      insight: `${company} trades suite completeness for speed — issue-tracking focus + dev toolchain hooks vs. portfolio/roadmap features incumbents ship.`,
      signalIds: ids(devVelocityCluster),
      confidence: confidenceFromSignals(devVelocityCluster, ctx),
      contradictionRisk:
        `If buyers demand OKRs, resourcing, or enterprise program management, ${company} must bolt on scope and lose velocity story.`,
    });
  }

  const blocks = categoryHasText(ctx, ["repeatedLanguage", "positioning", "targetUser", "workflow"], BLOCK_PATTERN);
  const templates = categoryHasText(ctx, ["communitySignals", "positioning"], TEMPLATE_PATTERN);
  const ai = pick(ctx, ["aiClaims"], 2);

  const workspaceCluster = minTwo([...blocks, ...templates, ...ai]);
  if (workspaceCluster) {
    rules.push({
      bucket: "strategicPatterns",
      insight: `${company} combines block/workspace paradigm with template ecosystem${ai.length ? " and an AI assistant layer" : ""} — pushing toward an adaptive workspace OS, not a single-purpose tool.`,
      signalIds: ids(workspaceCluster),
      confidence: confidenceFromSignals(workspaceCluster, ctx),
      contradictionRisk:
        "Horizontal expansion dilutes focus; AI features may erode block paradigm differentiation if every competitor adds copilots.",
    });
    if (ai.length > 0) {
      rules.push({
        bucket: "behaviorInference",
        insight: `${company} behavior: ship AI on top of existing workspace primitives rather than replacing the core block model — upsell intelligence inside habitual structure.`,
        signalIds: ids(minTwo([...blocks, ...ai]) ?? workspaceCluster),
        confidence: confidenceFromSignals(workspaceCluster, ctx),
        contradictionRisk:
          "If AI becomes the primary interface, block-based moat may weaken; users could migrate to chat-native tools.",
      });
    }
  }

  const pricing = pick(ctx, ["pricingModel"], 1);
  const enterprise = categoryHasText(ctx, ["enterpriseSignals", "pricingModel"], ENTERPRISE_PATTERN);
  const selfServe = pick(ctx, ["onboardingCta", "pricingModel"], 1);

  const plgCluster = minTwo([...pricing, ...selfServe, ...workflow]);
  if (plgCluster && lacksEnterprise(ctx)) {
    rules.push({
      bucket: "behaviorInference",
      insight: `${company} infers PLG/self-serve motion — visible pricing/onboarding CTAs without enterprise/compliance signals on the page.`,
      signalIds: ids(plgCluster),
      confidence: confidenceFromSignals(plgCluster, ctx),
      contradictionRisk:
        "Upmarket deals may stall without SSO/compliance story; sales-assisted expansion could contradict self-serve DNA.",
    });
  }

  if (enterprise.length >= 1 && pricing.length >= 1) {
    const entCluster = minTwo([...enterprise, ...pricing]);
    if (entCluster) {
      rules.push({
        bucket: "hiddenTradeoffs",
        insight: `${company} signals enterprise readiness (compliance/SSO/pricing tiers) while homepage may still read product-led — dual GTM creates messaging tension.`,
        signalIds: ids(entCluster),
        confidence: confidenceFromSignals(entCluster, ctx),
        contradictionRisk:
          "Split motion slows product velocity; enterprise procurement cycles conflict with velocity/PLG positioning.",
      });
    }
  }

  const positioning = pick(ctx, ["positioning"], 1);
  const target = pick(ctx, ["targetUser"], 1);
  const icpCluster = minTwo([...positioning, ...target, ...workflow]);
  if (icpCluster) {
    rules.push({
      bucket: "strategicPatterns",
      insight: `${company} ICP wedge: ${target[0]?.text ?? "target user signals"} positioned as ${positioning[0]?.text ?? "category alternative"} — multi-surface positioning, not a single hero feature.`,
      signalIds: ids(icpCluster),
      confidence: confidenceFromSignals(icpCluster, ctx),
      contradictionRisk:
        "If ICP language is aspirational (targets multiple personas), GTM may lack focus and CAC rises.",
    });
  }

  const social = pick(ctx, ["socialProof"], 1);
  const proofCluster = minTwo([...social, ...target, ...pricing]);
  if (proofCluster) {
    rules.push({
      bucket: "behaviorInference",
      insight: `${company} uses social proof + ICP/pricing framing to compress evaluation — buyer behavior inferred as comparison-shopping within a defined segment.`,
      signalIds: ids(proofCluster),
      confidence: confidenceFromSignals(proofCluster, ctx),
      contradictionRisk:
        "Social proof on marketing pages often over-indexs logos; churn may diverge from headline trust signals.",
    });
  }

  return rules;
}

function fallbackPairings(ctx: SignalContext): RuleMatch[] {
  const fallbacks: RuleMatch[] = [];
  const company = ctx.company;
  const priorityCategories: SignalCategory[] = [
    "pricingModel",
    "integrations",
    "apiSignals",
    "hiringSignals",
    "workflow",
    "docsSignals",
    "onboardingCta",
    "communitySignals",
    "positioning",
    "targetUser",
  ];

  const byCategory = priorityCategories
    .map((cat) => ({ cat, signal: (ctx.signals[cat] as ExtractedSignal[])[0] }))
    .filter((entry): entry is { cat: SignalCategory; signal: ExtractedSignal } => Boolean(entry.signal));

  for (let i = 0; i < byCategory.length - 1; i += 1) {
    for (let j = i + 1; j < byCategory.length; j += 1) {
      const a = byCategory[i].signal;
      const b = byCategory[j].signal;
      if (a.id === b.id) continue;

      fallbacks.push({
        bucket: "hiddenTradeoffs",
        insight: `${company} couples ${a.category} ("${a.text.slice(0, 80)}") with ${b.category} ("${b.text.slice(0, 80)}") — behavior suggests tradeoff between ${a.category} depth and ${b.category} expansion.`,
        signalIds: [a.id, b.id],
        confidence: "Low",
        contradictionRisk:
          "Sparse cross-signal evidence — inference may break if either surface is marketing-only.",
      });

      if (fallbacks.length >= 2) return fallbacks;
    }
  }

  return fallbacks;
}

function buildCompanyDNA(
  ctx: SignalContext,
  patterns: SynthesisItem[],
  optimizations: SynthesisItem[],
): SynthesisItem | null {
  const primary =
    optimizations.find((o) => o.confidence !== "Low") ??
    patterns.find((p) => p.confidence !== "Low") ??
    optimizations[0] ??
    patterns[0];

  if (!primary) return null;

  const secondary = patterns.find((p) => p.id !== primary.id) ?? optimizations.find((o) => o.id !== primary.id);
  const signalIds = [
    ...new Set([
      ...primary.supportingSignals,
      ...(secondary?.supportingSignals ?? []),
    ]),
  ].slice(0, 5);

  if (signalIds.length < 2) return null;

  const dnaInsight = secondary
    ? `${ctx.company} DNA: ${primary.insight} Combined with ${secondary.insight.split(" — ")[0].toLowerCase()}, the company behaves like it is optimizing one loop, not selling a feature list.`
    : `${ctx.company} DNA: ${primary.insight}`;

  const risks = [primary.contradictionRisk, secondary?.contradictionRisk].filter(Boolean).join(" ");

  return {
    id: "SYN-DNA-1",
    insight: dnaInsight,
    supportingSignals: signalIds,
    confidence:
      primary.confidence === "High" || secondary?.confidence === "High"
        ? "High"
        : primary.confidence === "Medium" || secondary?.confidence === "Medium"
          ? "Medium"
          : "Low",
    contradictionRisk: risks || "Insufficient synthesis depth — DNA read is provisional.",
  };
}

export function synthesizeSignals(
  signals: ExtractedSignals,
  companyName?: string,
): SignalSynthesis {
  const catalog = allSignals(signals);
  const company = companyName ?? signals.companyName ?? "This company";
  const ctx: SignalContext = { signals, catalog, company };

  const empty: SignalSynthesis = {
    strategicPatterns: [],
    hiddenTradeoffs: [],
    optimizationDirection: [],
    behaviorInference: [],
    companyDNA: null,
    synthesisCount: 0,
  };

  if (catalog.length < 2) {
    return empty;
  }

  let ruleMatches = runRules(ctx);
  if (ruleMatches.length === 0) {
    ruleMatches = fallbackPairings(ctx);
  }

  const buckets: Record<SynthesisBucket, SynthesisItem[]> = {
    strategicPatterns: [],
    hiddenTradeoffs: [],
    optimizationDirection: [],
    behaviorInference: [],
  };

  const counters: Record<SynthesisBucket, number> = {
    strategicPatterns: 0,
    hiddenTradeoffs: 0,
    optimizationDirection: 0,
    behaviorInference: 0,
  };

  const seenInsights = new Set<string>();

  for (const match of ruleMatches) {
    if (match.signalIds.length < 2) continue;
    const key = `${match.bucket}:${match.insight.slice(0, 60)}`;
    if (seenInsights.has(key)) continue;
    seenInsights.add(key);

    counters[match.bucket] += 1;
    const prefix =
      match.bucket === "strategicPatterns"
        ? "SYN-PATTERN"
        : match.bucket === "hiddenTradeoffs"
          ? "SYN-TRADEOFF"
          : match.bucket === "optimizationDirection"
            ? "SYN-OPT"
            : "SYN-BEHAVIOR";

    buckets[match.bucket].push(
      makeItem(prefix, counters[match.bucket], match.bucket, match),
    );
  }

  const companyDNA = buildCompanyDNA(ctx, buckets.strategicPatterns, buckets.optimizationDirection);

  const synthesisCount =
    buckets.strategicPatterns.length +
    buckets.hiddenTradeoffs.length +
    buckets.optimizationDirection.length +
    buckets.behaviorInference.length +
    (companyDNA ? 1 : 0);

  return {
    strategicPatterns: buckets.strategicPatterns.slice(0, 3),
    hiddenTradeoffs: buckets.hiddenTradeoffs.slice(0, 3),
    optimizationDirection: buckets.optimizationDirection.slice(0, 2),
    behaviorInference: buckets.behaviorInference.slice(0, 2),
    companyDNA,
    synthesisCount,
  };
}

export function allSynthesisItems(synthesis: SignalSynthesis): SynthesisItem[] {
  return [
    ...synthesis.strategicPatterns,
    ...synthesis.hiddenTradeoffs,
    ...synthesis.optimizationDirection,
    ...synthesis.behaviorInference,
    ...(synthesis.companyDNA ? [synthesis.companyDNA] : []),
  ];
}

export function formatSynthesisForPrompt(synthesis: SignalSynthesis): string {
  const items = allSynthesisItems(synthesis);
  if (!items.length) {
    return "No multi-signal synthesis available (need ≥2 extracted signals). Memo must stay Low confidence and avoid behavioral claims.";
  }

  const lines = items.map((item) => {
    const support = item.supportingSignals.join(", ");
    return `[${item.id}] (${item.confidence} confidence)
  Insight: ${item.insight}
  Supporting signals: ${support}
  Contradiction risk: ${item.contradictionRisk}`;
  });

  return [
    `Synthesis count: ${synthesis.synthesisCount}`,
    "",
    "SYNTHESIS CATALOG (cite these ids FIRST in memo — e.g. [SYN-PATTERN-1]. Each bundles multiple signals; do not reason from a single signal alone):",
    ...lines,
    "",
    "Rules: Prefer [SYN-*] citations over raw signal ids. Every core claim must map to a synthesis entry or explicitly state insufficient synthesis.",
  ].join("\n");
}

export function memoReferencesSynthesis(
  ai: Record<string, unknown>,
  synthesis: SignalSynthesis,
): boolean {
  const ids = new Set(allSynthesisItems(synthesis).map((s) => s.id));
  if (ids.size === 0) return false;

  const texts: string[] = [];
  for (const value of Object.values(ai)) {
    if (typeof value === "string") texts.push(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") texts.push(item);
      }
    }
  }

  const joined = texts.join(" ");
  for (const id of ids) {
    if (joined.includes(id)) return true;
  }
  return false;
}

export function capConfidenceBySynthesis(
  confidence: "Low" | "Medium" | "High",
  synthesis: SignalSynthesis,
): "Low" | "Medium" | "High" {
  if (synthesis.synthesisCount === 0) {
    return confidence === "High" ? "Medium" : confidence;
  }
  const hasMediumPlus = allSynthesisItems(synthesis).some((s) => s.confidence !== "Low");
  if (!hasMediumPlus && confidence === "High") return "Medium";
  return confidence;
}
