import { resolveCompanyName } from "@/lib/company-name";

/** Structured evidence extracted from website markdown before LLM analysis. */

export type SignalCategory =
  | "pricingModel"
  | "workflow"
  | "targetUser"
  | "positioning"
  | "repeatedLanguage"
  | "integrations"
  | "apiSignals"
  | "hiringSignals"
  | "socialProof"
  | "aiClaims"
  | "enterpriseSignals"
  | "communitySignals"
  | "onboardingCta"
  | "distributionSurface"
  | "docsSignals";

export type EvidenceTier = "strong" | "moderate" | "weak" | "none";

export type ExtractedSignal = {
  id: string;
  category: SignalCategory;
  text: string;
  priority: number;
};

export type ExtractedSignals = {
  companyName?: string;
  scrapedUrl?: string;
  hasScrape: boolean;
  pricingModel: ExtractedSignal[];
  workflow: ExtractedSignal[];
  targetUser: ExtractedSignal[];
  positioning: ExtractedSignal[];
  repeatedLanguage: ExtractedSignal[];
  integrations: ExtractedSignal[];
  apiSignals: ExtractedSignal[];
  hiringSignals: ExtractedSignal[];
  socialProof: ExtractedSignal[];
  aiClaims: ExtractedSignal[];
  enterpriseSignals: ExtractedSignal[];
  communitySignals: ExtractedSignal[];
  onboardingCta: ExtractedSignal[];
  distributionSurface: ExtractedSignal[];
  docsSignals: ExtractedSignal[];
  evidenceScore: number;
  evidenceTier: EvidenceTier;
  gaps: string[];
  signalCount: number;
};

export type EvidenceBinding = {
  field: string;
  claim: string;
  signalIds: string[];
};

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "your", "our", "you", "are", "that", "this",
  "from", "have", "will", "can", "all", "more", "into", "about", "what",
]);

const CATEGORY_PRIORITY: Record<SignalCategory, number> = {
  pricingModel: 100,
  integrations: 95,
  apiSignals: 92,
  hiringSignals: 88,
  workflow: 82,
  docsSignals: 78,
  onboardingCta: 72,
  communitySignals: 58,
  positioning: 52,
  targetUser: 48,
  distributionSurface: 44,
  aiClaims: 38,
  enterpriseSignals: 32,
  socialProof: 26,
  repeatedLanguage: 18,
};

const PATTERNS: Record<SignalCategory, RegExp> = {
  pricingModel:
    /\$[\d,.]+(?:\s*\/\s*(?:mo|month|yr|year|user|seat))?|\bfree\b.*\bplan\b|\bpricing\b|\bper\s+seat\b|\bper\s+user\b|\benterprise\s+plan\b|\btrial\b|\bannual\b|\bbilled\b|\bupgrade\b/i,
  workflow:
    /\bworkflow\b|\bautomate\b|\bissue\s+track|\bsprint\b|\broadmap\b|\bpipeline\b|\btriage\b|\bbacklog\b|\bkanban\b|\bproject\s+management\b|\bvelocity\b|\bdeveloper\s+tools\b/i,
  targetUser:
    /\bfor\s+(?:teams|developers|engineers|creators|founders|startups|enterprises|designers|product\s+teams)\b|\bbuilt\s+for\b|\bdesigned\s+for\b|\bICP\b|\bideal\s+for\b/i,
  positioning:
    /\breplace\b|\balternative\s+to\b|\bvs\.?\s+\w+|\bfastest\b|\bmodern\b|\boperating\s+system\b|\bdefault\b|\bnext[- ]gen\b|\breimagin|\bunlike\b|\bbetter\s+than\b/i,
  repeatedLanguage: /^.+$/,
  integrations:
    /\bintegrat(?:e|ion|ed|ions)\b|\bconnect(?:s|ed)?\s+with\b|\bworks\s+with\b|\bwebhook\b|\bslack\b|\bgithub\b|\bjira\b|\bfigma\b|\bnotion\b|\bzapier\b|\boauth\b|\bplugin\b|\bextension\b|\bpartner(?:s|ship)?\b|\becosystem\b/i,
  apiSignals:
    /\brest\s+api\b|\bgraphql\b|\bsdk\b|\bapi\s+key\b|\bapi\s+reference\b|\bdeveloper\s+api\b|\brate\s+limit\b|\bendpoint\b|\bauthentication\b|\bbearer\s+token\b|\bwebhooks?\b|\bopenapi\b|\bswagger\b/i,
  hiringSignals:
    /\bwe(?:'re|\s+are)\s+hiring\b|\bopen\s+(?:roles?|positions?)\b|\bjoin\s+our\s+team\b|\bcareers?\b|\bjob\s+openings?\b|\bapply\s+now\b|\bwork\s+with\s+us\b|\bengineering\s+roles?\b|\bopenings?\s+at\b/i,
  socialProof:
    /\btrusted\s+by\b|\bcustomers?\b|\b\d+[kKm+]+\s+(?:users|teams|customers)\b|\breviews?\b|\brated\b|\blogos?\b|\bused\s+by\b|\bjoin\s+\d+/i,
  aiClaims:
    /\bai[- ]powered\b|\bartificial\s+intelligence\b|\bgpt\b|\bcopilot\b|\bassistant\b|\bgenerative\b|\bmachine\s+learning\b|\bllm\b|\bauto[- ]draft\b|\bimage\s+and\s+video\b|\bimage\s+generation\b|\bvideo\s+model\b|\bbeautiful\s+ai\b|\bresearch\s+lab\b/i,
  enterpriseSignals:
    /\benterprise\b|\bSOC\s*2\b|\bSSO\b|\bSAML\b|\bcompliance\b|\bsecurity\b|\badmin\b|\baudit\b|\bHIPAA\b|\bGDPR\b|\brole[- ]based\b/i,
  communitySignals:
    /\bdiscord\b|\bcommunity\b|\bforum\b|\btemplate\s+(?:gallery|marketplace)\b|\bmarketplace\b|\bcreator\s+ecosystem\b|\bshare\s+template\b|\bresearch\s+lab\b|\bcommunity-funded\b/i,
  onboardingCta:
    /\bget\s+started\b|\bstart\s+free\b|\bsign\s+up\b|\btry\s+(?:for\s+)?free\b|\bbook\s+a\s+demo\b|\brequest\s+demo\b|\bjoin\s+(?:now|waitlist)\b|\bcreate\s+(?:an\s+)?account\b/i,
  distributionSurface:
    /\bdiscord\b|\bapp\s+store\b|\bchrome\s+extension\b|\bmarketplace\b|\bplugin\b|\bslack\s+app\b|\bfigma\s+community\b|\bdownload\b/i,
  docsSignals:
    /\bdocumentation\b|\bdocs\b|\bdeveloper\s+(?:docs|documentation|guide)\b|\bhelp\s+center\b|\bknowledge\s+base\b|\bgetting\s+started\b|\bquick\s*start\b|\bchangelog\b|\brelease\s+notes\b|\broadmap\b/i,
};

function cleanLine(line: string): string {
  return line
    .replace(/^#+\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function takeMatchingLines(
  lines: string[],
  pattern: RegExp,
  category: SignalCategory,
  max: number,
  existing: Set<string>,
): ExtractedSignal[] {
  const out: ExtractedSignal[] = [];
  let index = 1;
  for (const raw of lines) {
    const text = cleanLine(raw);
    if (text.length < 10 || text.length > 300) continue;
    if (!pattern.test(text)) continue;
    const key = text.toLowerCase();
    if (existing.has(key)) continue;
    existing.add(key);
    out.push({
      id: `${category}-${index}`,
      category,
      text,
      priority: CATEGORY_PRIORITY[category],
    });
    index += 1;
    if (out.length >= max) break;
  }
  return out;
}

function extractRepeatedLanguage(lines: string[], existing: Set<string>): ExtractedSignal[] {
  const phraseCounts = new Map<string, { count: number; sample: string }>();

  for (const raw of lines) {
    const text = cleanLine(raw);
    if (text.length < 20 || text.length > 200) continue;
  const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    for (let i = 0; i < words.length - 1; i += 1) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      const entry = phraseCounts.get(bigram) ?? { count: 0, sample: text };
      entry.count += 1;
      phraseCounts.set(bigram, entry);
    }
  }

  const repeated = [...phraseCounts.entries()]
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const out: ExtractedSignal[] = [];
  let index = 1;
  for (const [phrase, meta] of repeated) {
    const text = `Repeated phrase "${phrase}" (${meta.count}×) — e.g. "${meta.sample.slice(0, 120)}"`;
    const key = phrase;
    if (existing.has(key)) continue;
    existing.add(key);
    out.push({
      id: `repeatedLanguage-${index}`,
      category: "repeatedLanguage",
      text,
      priority: CATEGORY_PRIORITY.repeatedLanguage,
    });
    index += 1;
  }
  return out;
}

function resolveSignalsCompanyName(
  markdown: string | undefined,
  url?: string,
): string | undefined {
  if (!url) return undefined;
  return resolveCompanyName(url, { markdown: markdown ?? "" });
}

function computeEvidenceScore(signals: ExtractedSignals): number {
  let score = 0;
  if (signals.pricingModel.length) score += 28;
  if (signals.integrations.length) score += 22;
  if (signals.apiSignals.length) score += 20;
  if (signals.hiringSignals.length) score += 16;
  if (signals.workflow.length) score += 14;
  if (signals.docsSignals.length) score += 12;
  if (signals.onboardingCta.length) score += 8;
  if (signals.communitySignals.length) score += 6;
  if (signals.positioning.length) score += 4;
  if (signals.targetUser.length) score += 4;
  return Math.min(100, score);
}

function computeEvidenceTier(
  hasScrape: boolean,
  score: number,
  signals: Pick<
    ExtractedSignals,
    | "pricingModel"
    | "integrations"
    | "apiSignals"
    | "hiringSignals"
    | "workflow"
    | "onboardingCta"
    | "docsSignals"
    | "communitySignals"
  >,
): EvidenceTier {
  if (!hasScrape) return "none";
  const hasPriority =
    signals.pricingModel.length > 0 ||
    signals.integrations.length > 0 ||
    signals.apiSignals.length > 0 ||
    signals.hiringSignals.length > 0 ||
    signals.workflow.length > 0 ||
    signals.onboardingCta.length > 0 ||
    signals.docsSignals.length > 0 ||
    signals.communitySignals.length > 0;

  const hasMonetizationOrPlatform =
    signals.pricingModel.length > 0 ||
    signals.integrations.length > 0 ||
    signals.apiSignals.length > 0;

  if (score >= 55 && hasMonetizationOrPlatform) {
    return "strong";
  }
  if (score >= 30 && hasPriority) return "moderate";
  if (score >= 10) return "weak";
  return "none";
}

function computeGaps(signals: ExtractedSignals): string[] {
  const gaps: string[] = [];
  if (!signals.hasScrape) {
    gaps.push("No website scrape — memo must not invent on-page facts.");
    return gaps;
  }
  if (!signals.pricingModel.length) gaps.push("pricingModel: not found on page");
  if (!signals.workflow.length) gaps.push("workflow: not found on page");
  if (!signals.onboardingCta.length) gaps.push("onboardingCta: not found on page");
  if (!signals.docsSignals.length) gaps.push("docsSignals: not found on page");
  if (!signals.communitySignals.length) gaps.push("communitySignals: not found on page");
  if (!signals.integrations.length) gaps.push("integrations: not found — note absence if relevant");
  if (!signals.apiSignals.length) gaps.push("apiSignals: not found — platform/API motion unclear");
  if (!signals.hiringSignals.length) gaps.push("hiringSignals: not found — growth/hiring signal absent");
  if (!signals.aiClaims.length) gaps.push("aiClaims: none detected");
  return gaps;
}

function countSignals(s: ExtractedSignals): number {
  return (
    s.pricingModel.length +
    s.workflow.length +
    s.targetUser.length +
    s.positioning.length +
    s.repeatedLanguage.length +
    s.integrations.length +
    s.apiSignals.length +
    s.hiringSignals.length +
    s.socialProof.length +
    s.aiClaims.length +
    s.enterpriseSignals.length +
    s.communitySignals.length +
    s.onboardingCta.length +
    s.distributionSurface.length +
    s.docsSignals.length
  );
}

export function extractSignals(
  markdown: string | undefined,
  url?: string,
): ExtractedSignals {
  const empty: ExtractedSignals = {
    hasScrape: false,
    scrapedUrl: url,
    pricingModel: [],
    workflow: [],
    targetUser: [],
    positioning: [],
    repeatedLanguage: [],
    integrations: [],
    apiSignals: [],
    hiringSignals: [],
    socialProof: [],
    aiClaims: [],
    enterpriseSignals: [],
    communitySignals: [],
    onboardingCta: [],
    distributionSurface: [],
    docsSignals: [],
    evidenceScore: 0,
    evidenceTier: "none",
    gaps: [],
    signalCount: 0,
  };

  if (!markdown?.trim()) {
    empty.companyName = resolveSignalsCompanyName("", url);
    empty.gaps = computeGaps(empty);
    return empty;
  }

  const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();

  const pricingModel = takeMatchingLines(lines, PATTERNS.pricingModel, "pricingModel", 6, seen);
  const workflow = takeMatchingLines(lines, PATTERNS.workflow, "workflow", 6, seen);
  const onboardingCta = takeMatchingLines(lines, PATTERNS.onboardingCta, "onboardingCta", 4, seen);
  const docsSignals = takeMatchingLines(lines, PATTERNS.docsSignals, "docsSignals", 4, seen);
  const communitySignals = takeMatchingLines(lines, PATTERNS.communitySignals, "communitySignals", 4, seen);
  const targetUser = takeMatchingLines(lines, PATTERNS.targetUser, "targetUser", 4, seen);
  const positioning = takeMatchingLines(lines, PATTERNS.positioning, "positioning", 5, seen);
  const integrations = takeMatchingLines(lines, PATTERNS.integrations, "integrations", 6, seen);
  const apiSignals = takeMatchingLines(lines, PATTERNS.apiSignals, "apiSignals", 5, seen);
  const hiringSignals = takeMatchingLines(lines, PATTERNS.hiringSignals, "hiringSignals", 5, seen);
  const socialProof = takeMatchingLines(lines, PATTERNS.socialProof, "socialProof", 4, seen);
  const aiClaims = takeMatchingLines(lines, PATTERNS.aiClaims, "aiClaims", 4, seen);
  const enterpriseSignals = takeMatchingLines(lines, PATTERNS.enterpriseSignals, "enterpriseSignals", 4, seen);
  const distributionSurface = takeMatchingLines(lines, PATTERNS.distributionSurface, "distributionSurface", 4, seen);
  const repeatedLanguage = extractRepeatedLanguage(lines, seen);

  const signals: ExtractedSignals = {
    companyName: resolveSignalsCompanyName(markdown, url),
    scrapedUrl: url,
    hasScrape: true,
    pricingModel,
    workflow,
    targetUser,
    positioning,
    repeatedLanguage,
    integrations,
    apiSignals,
    hiringSignals,
    socialProof,
    aiClaims,
    enterpriseSignals,
    communitySignals,
    onboardingCta,
    distributionSurface,
    docsSignals,
    evidenceScore: 0,
    evidenceTier: "none",
    gaps: [],
    signalCount: 0,
  };

  signals.evidenceScore = computeEvidenceScore(signals);
  signals.evidenceTier = computeEvidenceTier(signals.hasScrape, signals.evidenceScore, signals);
  signals.gaps = computeGaps(signals);
  signals.signalCount = countSignals(signals);

  return signals;
}

export function allSignals(signals: ExtractedSignals): ExtractedSignal[] {
  return [
    ...signals.pricingModel,
    ...signals.integrations,
    ...signals.apiSignals,
    ...signals.hiringSignals,
    ...signals.workflow,
    ...signals.onboardingCta,
    ...signals.docsSignals,
    ...signals.communitySignals,
    ...signals.positioning,
    ...signals.targetUser,
    ...signals.distributionSurface,
    ...signals.aiClaims,
    ...signals.enterpriseSignals,
    ...signals.socialProof,
    ...signals.repeatedLanguage,
  ].sort((a, b) => b.priority - a.priority);
}

export function formatSignalsCatalog(signals: ExtractedSignals): string {
  const items = allSignals(signals);
  if (!items.length) {
    return signals.hasScrape
      ? "No structured signals extracted — treat confidence as Low; do not infer pricing or workflow."
      : "No scrape available — analyze URL and submission only.";
  }

  const lines = items.map((s) => `[${s.id}] (${s.category}) ${s.text}`);
  const header = [
    `Evidence tier: ${signals.evidenceTier} (score ${signals.evidenceScore}/100, ${signals.signalCount} signals)`,
    `Company: ${signals.companyName ?? "unknown"}`,
    "",
    "Evidence priority: pricingModel > integrations > apiSignals > hiringSignals > workflow > docsSignals > onboardingCta",
    "",
    "SIGNAL CATALOG (cite by id in every analytical claim):",
    ...lines,
  ];

  if (signals.gaps.length) {
    header.push("", "GAPS (acknowledge in memo; lower confidence):", ...signals.gaps.map((g) => `- ${g}`));
  }

  return header.join("\n");
}

export function signalsToWebsiteEvidence(signals: ExtractedSignals): string[] {
  const tagMap: Partial<Record<SignalCategory, string>> = {
    pricingModel: "pricing",
    workflow: "workflow",
    onboardingCta: "onboarding",
    docsSignals: "docs",
    communitySignals: "community",
    positioning: "positioning",
    targetUser: "product",
    integrations: "workflow",
    apiSignals: "workflow",
    hiringSignals: "product",
    distributionSurface: "community",
    aiClaims: "product",
    enterpriseSignals: "product",
    socialProof: "positioning",
    repeatedLanguage: "positioning",
  };

  return allSignals(signals)
    .slice(0, 10)
    .map((s) => `[${tagMap[s.category] ?? "product"}] (${s.id}) ${s.text}`);
}

export function capConfidenceByEvidence(
  modelConfidence: "Low" | "Medium" | "High",
  tier: EvidenceTier,
): "Low" | "Medium" | "High" {
  if (tier === "none") return "Low";
  if (tier === "weak") {
    if (modelConfidence === "High") return "Medium";
    return modelConfidence === "Medium" ? "Medium" : "Low";
  }
  if (tier === "moderate") {
    if (modelConfidence === "High") return "Medium";
    return modelConfidence;
  }
  return modelConfidence;
}

const CORE_FIELDS = [
  "coreContradiction",
  "strategicTension",
  "hiddenRisk",
  "whyIncumbentsHaventWon",
  "nonObviousInsight",
  "strategicParadox",
  "hiddenMoatOrWeakness",
  "investmentVerdict",
  "whatThisCompanyActuallyIs",
  "moatAnalysis",
] as const;

export function memoReferencesSignals(
  ai: Record<string, unknown>,
  signalIds: Set<string>,
): boolean {
  const texts: string[] = [];
  for (const field of CORE_FIELDS) {
    const v = ai[field];
    if (typeof v === "string") texts.push(v);
  }
  if (Array.isArray(ai.whyThisMightFail)) texts.push(...(ai.whyThisMightFail as string[]));
  if (Array.isArray(ai.opportunities)) texts.push(...(ai.opportunities as string[]));

  const joined = texts.join(" ");
  for (const id of signalIds) {
    if (joined.includes(id)) return true;
  }
  return false;
}

export function parseEvidenceBindings(value: unknown): EvidenceBinding[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { field?: string; claim?: string; signalIds?: unknown };
      const field = typeof row.field === "string" ? row.field.trim() : "";
      const claim = typeof row.claim === "string" ? row.claim.trim() : "";
      const signalIds = Array.isArray(row.signalIds)
        ? row.signalIds.filter((id): id is string => typeof id === "string")
        : [];
      if (!field || !claim || signalIds.length === 0) return null;
      return { field, claim, signalIds };
    })
    .filter((b): b is EvidenceBinding => b !== null);
}
