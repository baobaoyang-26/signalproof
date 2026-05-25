import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { allSignals, type ExtractedSignal } from "@/lib/extract-signals";
import {
  readMemoryGraph,
  type CompanyMemoryRecord,
  type MarketPositionInference,
  type MemoryConfidence,
} from "@/lib/company-memory";
import { allSynthesisItems } from "@/lib/signal-synthesis";

export type MarketLayer =
  | "infrastructure"
  | "workflow"
  | "distribution"
  | "application"
  | "ai-native-replacement";

export type MarketEdgeType =
  | "attacks"
  | "replaces"
  | "depends-on"
  | "upstream"
  | "downstream";

export type EvidenceRefs = {
  dnaId?: string;
  synthesisIds: string[];
  signalIds: string[];
  confidence: MemoryConfidence;
};

export type MarketNode = {
  companyId: string;
  companyName: string;
  marketLayer: MarketLayer;
  replaces: string[];
  attacks: string[];
  dependsOn: string[];
  distributionChannel: string;
  infrastructureDependency: string;
  userBehaviorModel: string;
  evidence: EvidenceRefs;
};

export type MarketEdge = {
  id: string;
  from: string;
  to: string;
  edgeType: MarketEdgeType;
  insight: string;
  evidence: EvidenceRefs;
};

export type MarketMap = {
  nodes: MarketNode[];
  edges: MarketEdge[];
  builtAt: string;
  companyCount: number;
};

export type PowerCenter = {
  domain: "distribution" | "workflow" | "creator-identity" | "ecosystem";
  holder: { companyId: string; companyName: string };
  insight: string;
  evidence: EvidenceRefs;
};

export type MoatType =
  | "aesthetic"
  | "api"
  | "workflow-lock-in"
  | "community"
  | "data"
  | "infra";

export type FragileMoatAssessment = {
  companyId: string;
  companyName: string;
  moatType: MoatType;
  insight: string;
  vulnerability: string;
  fragilityScore: number;
  evidence: EvidenceRefs;
};

export type AttackVector = {
  attackerId: string;
  attackerName: string;
  target: string;
  attackSurface: string;
  incumbentWeakness: string;
  adoptionFriction: string;
  replacementDifficulty: MemoryConfidence;
  evidence: EvidenceRefs;
};

export type MarketEvolutionInference = {
  collapsingLayers: Array<{ layer: MarketLayer | string; insight: string; evidence: EvidenceRefs }>;
  agentReplaceableLayers: Array<{ layer: string; insight: string; evidence: EvidenceRefs }>;
  disappearingWorkflows: Array<{ workflow: string; insight: string; evidence: EvidenceRefs }>;
  infrastructureCandidates: Array<{ companyId: string; companyName: string; insight: string; evidence: EvidenceRefs }>;
  horizon: "2-3y";
  overallConfidence: MemoryConfidence;
};

const DATA_DIR = path.join(process.cwd(), "data");
const MARKET_MAP_FILE = path.join(DATA_DIR, "market-map.json");

const LAYER_ORDER: MarketLayer[] = [
  "infrastructure",
  "workflow",
  "distribution",
  "application",
  "ai-native-replacement",
];

function confidenceFromTier(tier: string, synthesisCount: number): MemoryConfidence {
  if (tier === "strong" && synthesisCount >= 2) return "High";
  if (tier === "moderate" || synthesisCount >= 1) return "Medium";
  return "Low";
}

function evidenceFromRecord(
  record: CompanyMemoryRecord,
  position?: MarketPositionInference | null,
  extraSyn: string[] = [],
  extraSig: ExtractedSignal[] = [],
): EvidenceRefs {
  const synSet = new Set<string>([
    record.companyDNA?.id,
    ...allSynthesisItems(record.synthesizedPatterns).slice(0, 4).map((s) => s.id),
    ...(position?.synthesisIds ?? []),
    ...extraSyn,
  ].filter(Boolean) as string[]);

  const sigSet = new Set<string>([
    ...allSignals(record.extractedSignals).slice(0, 5).map((s) => s.id),
    ...(position?.signalIds ?? []),
    ...extraSig.map((s) => s.id),
  ]);

  return {
    dnaId: record.companyDNA?.id,
    synthesisIds: [...synSet],
    signalIds: [...sigSet],
    confidence: confidenceFromTier(
      record.extractedSignals.evidenceTier,
      record.synthesizedPatterns.synthesisCount,
    ),
  };
}

function signalsText(record: CompanyMemoryRecord): string {
  return allSignals(record.extractedSignals)
    .map((s) => s.text)
    .join(" ")
    .toLowerCase();
}

function inferMarketLayer(record: CompanyMemoryRecord): MarketLayer {
  const text = signalsText(record);
  const dna = record.companyDNA?.insight.toLowerCase() ?? "";

  if (
    record.extractedSignals.aiClaims.length >= 1 &&
    /replace|alternative|vs\.|search|google|jira|wiki/i.test(text)
  ) {
    return "ai-native-replacement";
  }
  if (
    record.extractedSignals.integrations.length >= 2 &&
    (record.extractedSignals.docsSignals.length >= 1 ||
      record.extractedSignals.enterpriseSignals.length >= 1 ||
      /\bapi\b|\binfra|\bplatform|\bdeveloper/i.test(text))
  ) {
    return "infrastructure";
  }
  if (
    record.extractedSignals.communitySignals.length >= 1 ||
    record.extractedSignals.distributionSurface.length >= 1 ||
    /\bdiscord|\bmarketplace|\btemplate\s+gallery/i.test(text)
  ) {
    if (record.extractedSignals.workflow.length >= 2) return "workflow";
    return "distribution";
  }
  if (
    record.extractedSignals.workflow.length >= 1 ||
    /workflow|issue|sprint|velocity|keyboard/i.test(text + dna)
  ) {
    return "workflow";
  }
  return "application";
}

function parseIncumbentTargets(record: CompanyMemoryRecord): string[] {
  const targets = new Set<string>();
  for (const signal of record.extractedSignals.positioning) {
    const m = signal.text.match(/\b(?:replace|alternative to|vs\.?|instead of)\s+([A-Za-z][A-Za-z0-9]*)/gi);
    if (m) {
      for (const hit of m) {
        const name = hit.replace(/^(replace|alternative to|vs\.?|instead of)\s+/i, "").trim();
        if (name.length > 2) targets.add(name);
      }
    }
  }
  return [...targets];
}

function inferDependsOn(record: CompanyMemoryRecord): string[] {
  const deps = new Set<string>();
  const text = signalsText(record);

  if (/\bopenai\b|\bgpt\b|\bfoundation\s+model|\bmodel\s+provider/i.test(text)) {
    deps.add("upstream:foundation-models");
  }
  if (/\baws\b|\bazure\b|\bgcp\b|\bcloud\b/i.test(text)) {
    deps.add("upstream:cloud-hosting");
  }
  if (record.extractedSignals.integrations.some((s) => /github|slack|figma|jira/i.test(s.text))) {
    for (const s of record.extractedSignals.integrations) {
      const m = s.text.match(/\b(GitHub|Slack|Figma|Jira|Notion|Google)/i);
      if (m) deps.add(`platform:${m[1].toLowerCase()}`);
    }
  }
  if (deps.size === 0 && record.extractedSignals.aiClaims.length) {
    deps.add("upstream:ai-inference");
  }
  return [...deps];
}

function inferDistributionChannel(record: CompanyMemoryRecord): string {
  const community = record.extractedSignals.communitySignals[0];
  const surface = record.extractedSignals.distributionSurface[0];
  if (community) return `[${community.id}] ${community.text.slice(0, 120)}`;
  if (surface) return `[${surface.id}] ${surface.text.slice(0, 120)}`;
  const cta = record.extractedSignals.onboardingCta[0];
  if (cta) return `[${cta.id}] PLG/onboarding-led: ${cta.text.slice(0, 80)}`;
  return "No distribution channel signals — GTM unverified.";
}

function inferInfrastructureDependency(record: CompanyMemoryRecord): string {
  const api = record.extractedSignals.integrations.find((s) => /\bapi\b/i.test(s.text));
  const docs = record.extractedSignals.docsSignals[0];
  const enterprise = record.extractedSignals.enterpriseSignals[0];

  if (api && enterprise) {
    return `[${api.id}] API surface + [${enterprise.id}] enterprise stack — infra-dependent motion.`;
  }
  if (api) return `[${api.id}] ${api.text.slice(0, 100)}`;
  if (docs) return `[${docs.id}] Docs/developer surface: ${docs.text.slice(0, 80)}`;
  if (record.extractedSignals.aiClaims.length && !api) {
    return "No API emphasis — likely depends on upstream model providers (inference layer).";
  }
  return "Infrastructure dependency not evidenced on page.";
}

function inferUserBehaviorModel(record: CompanyMemoryRecord): string {
  const dna = record.companyDNA;
  const behavior = record.synthesizedPatterns.behaviorInference[0];
  const opt = record.synthesizedPatterns.optimizationDirection[0];

  if (dna) return `[${dna.id}] ${dna.insight.slice(0, 200)}`;
  if (behavior) return `[${behavior.id}] ${behavior.insight.slice(0, 200)}`;
  if (opt) return `[${opt.id}] ${opt.insight.slice(0, 200)}`;
  return "User behavior model not synthesized — insufficient multi-signal inference.";
}

function resolveCompanyTargetId(name: string, companies: CompanyMemoryRecord[]): string | null {
  const lower = name.toLowerCase();
  const hit = companies.find(
    (c) =>
      c.companyId === lower ||
      c.companyName.toLowerCase().includes(lower) ||
      lower.includes(c.companyId),
  );
  return hit?.companyId ?? null;
}

export function buildNodeFromRecord(
  record: CompanyMemoryRecord,
  position?: MarketPositionInference | null,
): MarketNode {
  const targets = parseIncumbentTargets(record);
  const attacks = position?.attacking
    ? [position.attacking.slice(0, 160)]
    : targets.map((t) => `Positioning attacks ${t}`);
  const replaces = position?.replacing
    ? [position.replacing.slice(0, 160)]
    : targets.map((t) => `Substitutes for ${t} workflow/bundle`);

  return {
    companyId: record.companyId,
    companyName: record.companyName,
    marketLayer: inferMarketLayer(record),
    replaces,
    attacks,
    dependsOn: inferDependsOn(record),
    distributionChannel: inferDistributionChannel(record),
    infrastructureDependency: inferInfrastructureDependency(record),
    userBehaviorModel: inferUserBehaviorModel(record),
    evidence: evidenceFromRecord(record, position),
  };
}

function buildEdges(
  nodes: MarketNode[],
  companies: CompanyMemoryRecord[],
  positions: Map<string, MarketPositionInference>,
): MarketEdge[] {
  const edges: MarketEdge[] = [];
  let edgeIdx = 1;

  const addEdge = (
    from: string,
    to: string,
    edgeType: MarketEdgeType,
    insight: string,
    evidence: EvidenceRefs,
  ) => {
    edges.push({
      id: `edge-${edgeIdx++}`,
      from,
      to,
      edgeType,
      insight,
      evidence,
    });
  };

  for (const record of companies) {
    const node = nodes.find((n) => n.companyId === record.companyId);
    if (!node) continue;
    const position = positions.get(record.companyId);
    const evidence = evidenceFromRecord(record, position);

    for (const targetName of parseIncumbentTargets(record)) {
      const targetId = resolveCompanyTargetId(targetName, companies) ?? `incumbent:${targetName.toLowerCase()}`;
      addEdge(
        record.companyId,
        targetId,
        "attacks",
        `[${evidence.dnaId ?? "SYN"}] ${record.companyName} attacks ${targetName} — ${node.attacks[0]?.slice(0, 100) ?? "positioning signal"}`,
        evidence,
      );
      addEdge(
        record.companyId,
        targetId,
        "replaces",
        `[${evidence.synthesisIds[0] ?? "SYN"}] Replacement surface vs ${targetName}`,
        evidence,
      );
    }

    for (const dep of node.dependsOn) {
      addEdge(record.companyId, dep, "depends-on", `[${evidence.dnaId ?? "DNA"}] ${record.companyName} depends on ${dep}`, evidence);
    }
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const layerA = LAYER_ORDER.indexOf(a.marketLayer);
      const layerB = LAYER_ORDER.indexOf(b.marketLayer);
      if (layerA === layerB) continue;

      const upstream = layerA < layerB ? a : b;
      const downstream = layerA < layerB ? b : a;
      const rec = companies.find((c) => c.companyId === upstream.companyId);
      if (!rec) continue;

      addEdge(
        upstream.companyId,
        downstream.companyId,
        "upstream",
        `[${upstream.evidence.dnaId ?? "SYN"}] ${upstream.companyName} (${upstream.marketLayer}) sits upstream of ${downstream.companyName} (${downstream.marketLayer})`,
        upstream.evidence,
      );
      addEdge(
        downstream.companyId,
        upstream.companyId,
        "downstream",
        `[${downstream.evidence.dnaId ?? "SYN"}] ${downstream.companyName} consumes ${upstream.marketLayer} from ${upstream.companyName}`,
        downstream.evidence,
      );
    }
  }

  return edges;
}

async function loadPositions(
  companies: CompanyMemoryRecord[],
): Promise<Map<string, MarketPositionInference>> {
  const { inferMarketPosition } = await import("@/lib/company-memory");
  const map = new Map<string, MarketPositionInference>();
  for (const c of companies) {
    const pos = await inferMarketPosition(c.companyId);
    if (pos) map.set(c.companyId, pos);
  }
  return map;
}

export async function buildMarketMap(): Promise<MarketMap> {
  const graph = await readMemoryGraph();
  const positions = await loadPositions(graph.companies);

  const nodes = graph.companies.map((record) =>
    buildNodeFromRecord(record, positions.get(record.companyId)),
  );
  const edges = buildEdges(nodes, graph.companies, positions);

  return {
    nodes,
    edges,
    builtAt: new Date().toISOString(),
    companyCount: nodes.length,
  };
}

export async function saveMarketMap(map: MarketMap): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(MARKET_MAP_FILE, `${JSON.stringify(map, null, 2)}\n`, "utf8");
}

export async function readMarketMap(): Promise<MarketMap | null> {
  try {
    const raw = await readFile(MARKET_MAP_FILE, "utf8");
    return JSON.parse(raw) as MarketMap;
  } catch {
    return null;
  }
}

export async function rebuildAndPersistMarketMap(): Promise<MarketMap> {
  const map = await buildMarketMap();
  await saveMarketMap(map);
  return map;
}

export function getMarketNode(map: MarketMap, companyId: string): MarketNode | null {
  return map.nodes.find((n) => n.companyId === companyId) ?? null;
}

function scoreDistribution(record: CompanyMemoryRecord): number {
  return (
    record.extractedSignals.communitySignals.length * 3 +
    record.extractedSignals.distributionSurface.length * 2
  );
}

function scoreWorkflow(record: CompanyMemoryRecord): number {
  return record.extractedSignals.workflow.length * 2 + record.extractedSignals.integrations.length;
}

function scoreCreatorIdentity(record: CompanyMemoryRecord): number {
  const text = signalsText(record);
  let score = 0;
  if (/discord|creator|aesthetic|identity|community/i.test(text)) score += 3;
  score += record.extractedSignals.communitySignals.length * 2;
  if (record.companyDNA && /creator|identity|aesthetic/i.test(record.companyDNA.insight)) score += 2;
  return score;
}

function scoreEcosystem(record: CompanyMemoryRecord): number {
  return (
    record.extractedSignals.communitySignals.length +
    (/\btemplate|\bmarketplace|\becosystem|\bgallery/i.test(signalsText(record)) ? 3 : 0)
  );
}

export async function detectPowerCenters(): Promise<PowerCenter[]> {
  const graph = await readMemoryGraph();
  if (graph.companies.length === 0) return [];

  const domains: Array<{
    domain: PowerCenter["domain"];
    score: (r: CompanyMemoryRecord) => number;
    label: string;
  }> = [
    { domain: "distribution", score: scoreDistribution, label: "distribution surface" },
    { domain: "workflow", score: scoreWorkflow, label: "workflow embedding" },
    { domain: "creator-identity", score: scoreCreatorIdentity, label: "creator identity density" },
    { domain: "ecosystem", score: scoreEcosystem, label: "template/ecosystem" },
  ];

  return domains.map(({ domain, score, label }) => {
    const sorted = [...graph.companies].sort((a, b) => score(b) - score(a));
    const holder = sorted[0];
    const topScore = score(holder);
    const syn = holder.synthesizedPatterns.optimizationDirection[0] ?? holder.companyDNA;
    return {
      domain,
      holder: { companyId: holder.companyId, companyName: holder.companyName },
      insight:
        topScore > 0
          ? `[${syn?.id ?? holder.companyDNA?.id ?? "SYN"}] ${holder.companyName} leads ${label} in memory graph (score ${topScore}).`
          : `No company in graph shows strong ${label} signals yet.`,
      evidence: evidenceFromRecord(holder),
    };
  });
}

function classifyMoat(record: CompanyMemoryRecord): FragileMoatAssessment[] {
  const results: FragileMoatAssessment[] = [];
  const text = signalsText(record);
  const base = evidenceFromRecord(record);

  const rules: Array<{
    type: MoatType;
    test: boolean;
    insight: string;
    vulnerability: string;
    fragility: number;
  }> = [
    {
      type: "aesthetic",
      test: /aesthetic|creator|visual|brand|identity|art/i.test(text + (record.companyDNA?.insight ?? "")),
      insight: `[${base.dnaId ?? "SYN"}] Aesthetic/creator brand loop cited in DNA or community signals.`,
      vulnerability: "Foundation-model commoditization erodes visual differentiation.",
      fragility: 78,
    },
    {
      type: "api",
      test: record.extractedSignals.integrations.some((s) => /\bapi\b/i.test(s.text)),
      insight: "API/integration signals present — developer surface moat.",
      vulnerability: "Platform policy or pricing changes on upstream APIs.",
      fragility: 45,
    },
    {
      type: "workflow-lock-in",
      test: record.extractedSignals.workflow.length >= 2,
      insight: "Multiple workflow signals — habit/workflow embedding claimed.",
      vulnerability: "Incumbent bundle adds 'good enough' feature parity.",
      fragility: 52,
    },
    {
      type: "community",
      test: record.extractedSignals.communitySignals.length >= 1,
      insight: "Community/template distribution signals on page.",
      vulnerability: "Community is rented if on Discord/Slack — not proprietary.",
      fragility: 65,
    },
    {
      type: "data",
      test: /data|proprietary|training|corpus|index/i.test(text),
      insight: "Data/proprietary corpus language detected.",
      vulnerability: "Data moats erode when models train on public web scale.",
      fragility: 58,
    },
    {
      type: "infra",
      test: inferMarketLayer(record) === "infrastructure",
      insight: "Classified infrastructure layer — infra moat candidate.",
      vulnerability: "Hyperscaler and open-source stack commoditization.",
      fragility: 40,
    },
  ];

  for (const rule of rules) {
    if (!rule.test) continue;
    results.push({
      companyId: record.companyId,
      companyName: record.companyName,
      moatType: rule.type,
      insight: rule.insight,
      vulnerability: rule.vulnerability,
      fragilityScore: rule.fragility,
      evidence: base,
    });
  }

  return results.sort((a, b) => b.fragilityScore - a.fragilityScore);
}

export async function detectFragileMoats(): Promise<FragileMoatAssessment[]> {
  const graph = await readMemoryGraph();
  return graph.companies.flatMap(classifyMoat).sort((a, b) => b.fragilityScore - a.fragilityScore);
}

export async function detectAttackVectors(): Promise<AttackVector[]> {
  const graph = await readMemoryGraph();
  const { inferMarketPosition } = await import("@/lib/company-memory");
  const vectors: AttackVector[] = [];

  for (const record of graph.companies) {
    const position = await inferMarketPosition(record.companyId);
    if (!position) continue;

    const targets = parseIncumbentTargets(record);
    const target = targets[0] ?? "category-incumbent";
    const positioning = record.extractedSignals.positioning[0];
    const friction =
      record.extractedSignals.onboardingCta.length >= 1
        ? `[${record.extractedSignals.onboardingCta[0].id}] Low friction PLG/onboarding path evidenced.`
        : "Onboarding friction unverified — enterprise procurement may dominate.";

    const difficulty: MemoryConfidence =
      record.extractedSignals.enterpriseSignals.length > 0
        ? "Medium"
        : record.extractedSignals.evidenceTier === "strong"
          ? "Medium"
          : "Low";

    vectors.push({
      attackerId: record.companyId,
      attackerName: record.companyName,
      target,
      attackSurface: positioning
        ? `[${positioning.id}] ${positioning.text.slice(0, 120)}`
        : position.attacking.slice(0, 120),
      incumbentWeakness: position.whyIncumbentsHaventFollowed.slice(0, 160),
      adoptionFriction: friction,
      replacementDifficulty: difficulty,
      evidence: evidenceFromRecord(record, position, [position.dnaId].filter(Boolean) as string[]),
    });
  }

  return vectors;
}

export async function marketEvolutionInference(): Promise<MarketEvolutionInference> {
  const graph = await readMemoryGraph();
  const map = await buildMarketMap();
  const fragile = await detectFragileMoats();
  const power = await detectPowerCenters();

  const collapsingLayers: MarketEvolutionInference["collapsingLayers"] = [];
  const agentReplaceable: MarketEvolutionInference["agentReplaceableLayers"] = [];
  const disappearing: MarketEvolutionInference["disappearingWorkflows"] = [];
  const infraCandidates: MarketEvolutionInference["infrastructureCandidates"] = [];

  const aiReplacementNodes = map.nodes.filter((n) => n.marketLayer === "ai-native-replacement");
  for (const node of aiReplacementNodes) {
    collapsingLayers.push({
      layer: "search/answer UI layer",
      insight: `[${node.evidence.dnaId ?? node.evidence.synthesisIds[0]}] ${node.companyName} (${node.marketLayer}) pressures thin UI wrappers over models — ${node.replaces[0]?.slice(0, 80) ?? "incumbent search"}.`,
      evidence: node.evidence,
    });
    agentReplaceable.push({
      layer: "retrieval + summary workflow",
      insight: `[${node.evidence.synthesisIds[0] ?? "SYN"}] ${node.companyName}: agent can replace manual search tabs if citation trust holds.`,
      evidence: node.evidence,
    });
  }

  const aestheticMoats = fragile.filter((m) => m.moatType === "aesthetic" && m.fragilityScore >= 70);
  for (const m of aestheticMoats) {
    collapsingLayers.push({
      layer: "aesthetic-only SaaS UI",
      insight: `[${m.evidence.dnaId ?? "SYN"}] ${m.companyName}: ${m.vulnerability}`,
      evidence: m.evidence,
    });
  }

  const workflowNodes = map.nodes.filter((n) => n.marketLayer === "workflow");
  for (const node of workflowNodes) {
    if (node.evidence.confidence === "Low") continue;
    disappearing.push({
      workflow: node.companyName,
      insight: `[${node.evidence.dnaId ?? "SYN"}] Standalone ${node.marketLayer} tools without OS depth may collapse into suites — ${node.attacks[0]?.slice(0, 80) ?? "bundled by incumbents"}.`,
      evidence: node.evidence,
    });
  }

  const infraNodes = map.nodes.filter((n) => n.marketLayer === "infrastructure");
  for (const node of infraNodes) {
    infraCandidates.push({
      companyId: node.companyId,
      companyName: node.companyName,
      insight: `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName} shows infra signals — ${node.infrastructureDependency.slice(0, 100)}`,
      evidence: node.evidence,
    });
  }

  const distPower = power.find((p) => p.domain === "distribution");
  if (distPower && distPower.holder.companyId) {
    agentReplaceable.push({
      layer: "manual GTM/community ops",
      insight: `[${distPower.evidence.dnaId ?? "SYN"}] Distribution held by ${distPower.holder.companyName} — agents may automate outreach but not proprietary community loops.`,
      evidence: distPower.evidence,
    });
  }

  const tierScores = graph.companies.map((c) => c.extractedSignals.evidenceTier);
  const overallConfidence: MemoryConfidence =
    tierScores.filter((t) => t === "strong").length >= 2
      ? "Medium"
      : graph.companies.length >= 3
        ? "Low"
        : "Low";

  return {
    collapsingLayers: collapsingLayers.slice(0, 4),
    agentReplaceableLayers: agentReplaceable.slice(0, 4),
    disappearingWorkflows: disappearing.slice(0, 4),
    infrastructureCandidates: infraCandidates.slice(0, 4),
    horizon: "2-3y",
    overallConfidence,
  };
}

export async function getMarketContextForCompany(companyId: string): Promise<{
  node: MarketNode | null;
  edges: MarketEdge[];
  attackVector: AttackVector | null;
  fragileMoats: FragileMoatAssessment[];
  evolution: MarketEvolutionInference;
} | null> {
  const map = await buildMarketMap();
  const node = getMarketNode(map, companyId);
  if (!node) return null;

  const edges = map.edges.filter((e) => e.from === companyId || e.to === companyId);
  const vectors = await detectAttackVectors();
  const attackVector = vectors.find((v) => v.attackerId === companyId) ?? null;
  const fragileMoats = (await detectFragileMoats()).filter((m) => m.companyId === companyId);
  const evolution = await marketEvolutionInference();

  return { node, edges, attackVector, fragileMoats, evolution };
}
