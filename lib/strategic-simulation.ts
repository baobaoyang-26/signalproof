import { allSignals } from "@/lib/extract-signals";
import {
  readMemoryGraph,
  type CompanyMemoryRecord,
  type MemoryConfidence,
} from "@/lib/company-memory";
import {
  buildMarketMap,
  detectFragileMoats,
  detectPowerCenters,
  type MarketLayer,
  type MarketMap,
  type MarketNode,
} from "@/lib/market-map";
import { allSynthesisItems } from "@/lib/signal-synthesis";

export type ScenarioType =
  | "ai-agent-adoption"
  | "llm-commoditization"
  | "open-source-model-surge"
  | "api-cost-collapse"
  | "multimodal-native-workflow"
  | "search-layer-disruption"
  | "creator-economy-collapse"
  | "enterprise-ai-standardization";

export type SimulationEvidence = {
  dnaId?: string;
  synthesisIds: string[];
  signalIds: string[];
  marketNodeId?: string;
  confidence: MemoryConfidence;
  failureConditions: string[];
  contradictionRisks: string[];
};

export type ScenarioParticipant = {
  companyId: string;
  companyName: string;
  reason: string;
  evidence: SimulationEvidence;
};

export type MoatChange = {
  companyId: string;
  companyName: string;
  change: string;
  evidence: SimulationEvidence;
};

export type ScenarioSimulationInput = {
  scenario: ScenarioType;
  affectedLayers?: MarketLayer[];
  affectedCompanies?: string[];
};

export type ScenarioSimulationResult = {
  scenario: ScenarioType;
  scenarioLabel: string;
  affectedLayers: MarketLayer[];
  affectedCompanies: string[];
  winners: ScenarioParticipant[];
  losers: ScenarioParticipant[];
  moatChanges: MoatChange[];
  workflowCollapse: string[];
  distributionShift: string[];
  infraShift: string[];
  confidence: MemoryConfidence;
  failureConditions: string[];
  contradictionRisks: string[];
};

export type CompanyResponseSimulation = {
  companyId: string;
  companyName: string;
  scenario: string;
  likelyResponse: string;
  strategicConstraint: string;
  defensiveAdvantage: string;
  survivalProbability: MemoryConfidence;
  evidence: SimulationEvidence;
};

export type FutureFragilityType =
  | "workflow-abstraction"
  | "ai-replacement"
  | "distribution-dependency"
  | "infra-dependency";

export type FutureFragilityAssessment = {
  companyId: string;
  companyName: string;
  currentStrength: string;
  fragilityType: FutureFragilityType;
  futureRisk: string;
  evidence: SimulationEvidence;
};

export type LayerCollapseOutcome =
  | "disappear"
  | "merge"
  | "become-infrastructure"
  | "commoditize";

export type LayerCollapseSimulation = {
  layer: MarketLayer | string;
  outcome: LayerCollapseOutcome;
  timeline: "2-3y" | "3-5y";
  insight: string;
  evidence: SimulationEvidence;
};

export type PowerTransition = {
  from: string;
  to: string;
  insight: string;
  beneficiaries: string[];
  evidence: SimulationEvidence;
};

export type StrategicSimulationBundle = {
  primaryScenarios: ScenarioSimulationResult[];
  companyResponses: CompanyResponseSimulation[];
  futureFragility: FutureFragilityAssessment[];
  layerCollapse: LayerCollapseSimulation[];
  powerTransitions: PowerTransition[];
  generatedAt: string;
};

type ScenarioDefinition = {
  type: ScenarioType;
  label: string;
  defaultLayers: MarketLayer[];
  failureConditions: string[];
  contradictionRisks: string[];
  scoreCompany: (
    node: MarketNode,
    record: CompanyMemoryRecord | undefined,
  ) => number;
  workflowCollapse: string[];
  distributionShift: string[];
  infraShift: string[];
  moatChangeFor: (node: MarketNode, record: CompanyMemoryRecord | undefined, delta: "win" | "lose") => string;
};

const SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  {
    type: "ai-agent-adoption",
    label: "AI agent adoption",
    defaultLayers: ["application", "ai-native-replacement", "workflow"],
    failureConditions: [
      "Agents fail if citation/trust layer does not compound — thin wrappers revert to incumbents.",
      "Simulation breaks if enterprise procurement blocks autonomous agents.",
    ],
    contradictionRisks: [
      "Workflow OS companies may win agents while thin UI apps lose — unless agents bypass their surface.",
    ],
    scoreCompany: (node, record) => {
      let s = 0;
      if (node.marketLayer === "workflow") s += 3;
      if (node.marketLayer === "infrastructure") s += 2;
      if (node.marketLayer === "application") s -= 2;
      if (sig(record).aiClaims.length) s += 1;
      if (node.dependsOn.some((d) => d.includes("foundation-models"))) s -= 1;
      return s;
    },
    workflowCollapse: [
      "Manual tab-switching research loops collapse into agent-orchestrated task chains.",
    ],
    distributionShift: ["PLG landing pages lose to agent default installs and IDE/slack surfaces."],
    infraShift: ["Orchestration/memory APIs gain share vs. single-purpose SaaS endpoints."],
    moatChangeFor: (node, _, delta) =>
      delta === "win"
        ? `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: workflow embedding compounds under agents.`
        : `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: UI-only moat erodes when agents skip the app shell.`,
  },
  {
    type: "llm-commoditization",
    label: "LLM commoditization",
    defaultLayers: ["application", "ai-native-replacement", "distribution"],
    failureConditions: ["Commoditization simulation fails if brand/community loops retain pricing power."],
    contradictionRisks: ["Aesthetic moats may survive even when models commoditize — not all 'losers' collapse."],
    scoreCompany: (node, record) => {
      let s = 0;
      if (node.marketLayer === "infrastructure") s += 3;
      if (node.marketLayer === "workflow") s += 2;
      if (node.marketLayer === "distribution") s += 1;
      if (sig(record).communitySignals.length) s += 2;
      if (node.infrastructureDependency.includes("upstream model")) s -= 3;
      if (sig(record).integrations.some((x) => /\bapi\b/i.test(x.text))) s += 1;
      return s;
    },
    workflowCollapse: ["Prompt-only workflows commoditize; habit/workflow layers absorb intelligence."],
    distributionShift: ["Creator networks with identity density outperform generic gen-AI wrappers."],
    infraShift: ["Inference routing, eval, and memory become margin pools — not image UI shells."],
    moatChangeFor: (node, record, delta) =>
      delta === "win"
        ? `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: non-model moat (${record?.extractedSignals.communitySignals[0]?.id ?? "community"}) holds.`
        : `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: model-dependent margin compresses.`,
  },
  {
    type: "open-source-model-surge",
    label: "Open-source model surge",
    defaultLayers: ["infrastructure", "application", "ai-native-replacement"],
    failureConditions: ["OSS surge may not displace hosted UX — simulation assumes price/self-host pressure."],
    contradictionRisks: ["Enterprise compliance may keep closed models dominant in regulated buyers."],
    scoreCompany: (node, record) => {
      let s = 0;
      if (node.marketLayer === "infrastructure") s += 2;
      if (node.marketLayer === "workflow") s += 2;
      if (sig(record).enterpriseSignals.length) s += 2;
      if (node.marketLayer === "ai-native-replacement" && !sig(record).workflow.length) s -= 2;
      return s;
    },
    workflowCollapse: ["Thin hosted wrappers around open weights lose pricing power."],
    distributionShift: ["Self-host + OSS communities capture hacker/creator segments."],
    infraShift: ["Fine-tune/eval/deploy tooling becomes infrastructure layer."],
    moatChangeFor: (node, _, delta) =>
      delta === "win"
        ? `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: benefits from OSS stack + workflow depth.`
        : `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: hosted-only margin threatened.`,
  },
  {
    type: "api-cost-collapse",
    label: "API cost collapse",
    defaultLayers: ["application", "ai-native-replacement", "infrastructure"],
    failureConditions: ["If API costs stay high, high-volume apps remain capital constrained."],
    contradictionRisks: ["Cheaper inference may expand TAM — not all infra players win equally."],
    scoreCompany: (node, record) => {
      let s = 0;
      if (sig(record).aiClaims.length >= 2) s += 2;
      if (node.marketLayer === "application") s += 1;
      if (node.marketLayer === "infrastructure" && /api/i.test(node.infrastructureDependency)) s -= 1;
      if (sig(record).pricingModel.some((p) => /\$|usage|credit/i.test(p.text))) s += 1;
      return s;
    },
    workflowCollapse: ["Credit-metered micro-features merge into flat agent subscriptions."],
    distributionShift: ["Volume-heavy PLG apps gain CAC efficiency; API resellers compress."],
    infraShift: ["Inference marketplaces commoditize; differentiation moves to memory/orchestration."],
    moatChangeFor: (node, _, delta) =>
      delta === "win"
        ? `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: usage-heavy product benefits from lower COGS.`
        : `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: API resale margin collapses.`,
  },
  {
    type: "multimodal-native-workflow",
    label: "Multimodal-native workflow",
    defaultLayers: ["workflow", "application", "distribution"],
    failureConditions: ["Multimodal shift may remain niche if text agents dominate enterprise budgets."],
    contradictionRisks: ["Single-modal incumbents can bundle multimodal faster than startups scale."],
    scoreCompany: (node, record) => {
      const text = allSignals(sig(record)).map((s) => s.text).join(" ");
      let s = 0;
      if (/image|video|design|visual|multimodal|creative/i.test(text)) s += 3;
      if (node.marketLayer === "workflow") s += 1;
      if (node.marketLayer === "distribution") s += 1;
      return s;
    },
    workflowCollapse: ["Single-modal issue trackers lose to multimodal canvases."],
    distributionShift: ["Creator/visual communities become distribution for multimodal tools."],
    infraShift: ["Unified multimodal APIs replace separate image/text stacks."],
    moatChangeFor: (node, _, delta) =>
      delta === "win"
        ? `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: multimodal workflow surface aligns with scenario.`
        : `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: text-only workflow risks obsolescence.`,
  },
  {
    type: "search-layer-disruption",
    label: "Search layer disruption",
    defaultLayers: ["ai-native-replacement", "application"],
    failureConditions: ["Search incumbents may bundle answers — simulation assumes slow bundle response."],
    contradictionRisks: ["Citation trust failures could restore traditional search for enterprise."],
    scoreCompany: (node, record) => {
      let s = 0;
      if (node.marketLayer === "workflow") s += 2;
      if (node.marketLayer === "infrastructure") s += 2;
      if (node.marketLayer === "ai-native-replacement") s += 1;
      if (sig(record).docsSignals.length) s += 1;
      if (node.marketLayer === "ai-native-replacement" && !sig(record).workflow.length) s -= 1;
      return s;
    },
    workflowCollapse: ["Search → click → read loops collapse into agent answer panels."],
    distributionShift: ["Default browser/IDE agents capture query intent."],
    infraShift: ["Retrieval/index/memory layers absorb search margin."],
    moatChangeFor: (node, _, delta) =>
      delta === "win"
        ? `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: owns workflow/memory beyond search box.`
        : `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: thin answer UI without retention loses.`,
  },
  {
    type: "creator-economy-collapse",
    label: "Creator economy collapse",
    defaultLayers: ["distribution", "application"],
    failureConditions: ["Creator spend may shift rather than vanish — simulation assumes CAC spike on community GTM."],
    contradictionRisks: ["Enterprise pivot may save community-led companies — not instant loss."],
    scoreCompany: (node, record) => {
      let s = 0;
      if (node.marketLayer === "workflow") s += 2;
      if (sig(record).enterpriseSignals.length) s += 3;
      if (sig(record).communitySignals.length >= 2) s -= 3;
      if (node.marketLayer === "distribution") s -= 2;
      return s;
    },
    workflowCollapse: ["Creator-led template marketplaces shrink; enterprise templates rise."],
    distributionShift: ["Discord/community loops weaken; sales-led replaces viral creator GTM."],
    infraShift: ["Payment/compliance rails for creators consolidate to platforms."],
    moatChangeFor: (node, record, delta) =>
      delta === "win"
        ? `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: enterprise/workflow revenue diversifies away from creators.`
        : `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: community moat (${record?.extractedSignals.communitySignals[0]?.id ?? "community"}) exposed.`,
  },
  {
    type: "enterprise-ai-standardization",
    label: "Enterprise AI standardization",
    defaultLayers: ["workflow", "infrastructure", "application"],
    failureConditions: ["Standardization may stall if regulators fragment requirements."],
    contradictionRisks: ["PLG winners may upsell enterprise faster than simulation assumes."],
    scoreCompany: (node, record) => {
      let s = 0;
      if (sig(record).enterpriseSignals.length) s += 4;
      if (node.marketLayer === "infrastructure") s += 2;
      if (node.marketLayer === "workflow") s += 2;
      if (sig(record).onboardingCta.length && !sig(record).enterpriseSignals.length) s -= 2;
      return s;
    },
    workflowCollapse: ["Ad-hoc AI features merge into standardized enterprise copilot slots."],
    distributionShift: ["Procurement/consortium bundles replace individual team PLG buys."],
    infraShift: ["SSO/compliance/eval layers become mandatory infra — not optional."],
    moatChangeFor: (node, record, delta) =>
      delta === "win"
        ? `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: enterprise signals [${record?.extractedSignals.enterpriseSignals[0]?.id ?? "enterprise"}] align.`
        : `[${node.evidence.dnaId ?? "SYN"}] ${node.companyName}: PLG-only motion misses standardized procurement.`,
  },
];

function sig(record: CompanyMemoryRecord | undefined) {
  return record?.extractedSignals ?? emptySignals();
}

function emptySignals(): CompanyMemoryRecord["extractedSignals"] {
  return {
    hasScrape: false,
    pricingModel: [],
    workflow: [],
    targetUser: [],
    positioning: [],
    repeatedLanguage: [],
    integrations: [],
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
}

function decayConfidence(base: MemoryConfidence, tier: string): MemoryConfidence {
  if (tier === "none") return "Low";
  if (tier === "weak") return base === "High" ? "Medium" : "Low";
  if (tier === "moderate") return base === "High" ? "Medium" : base;
  return base;
}

function evidenceFromNode(
  node: MarketNode,
  record: CompanyMemoryRecord | undefined,
  failureConditions: string[],
  contradictionRisks: string[],
): SimulationEvidence {
  const syn = node.evidence.synthesisIds.length
    ? node.evidence.synthesisIds
    : record
      ? allSynthesisItems(record.synthesizedPatterns).slice(0, 3).map((s) => s.id)
      : [];

  return {
    dnaId: node.evidence.dnaId ?? record?.companyDNA?.id,
    synthesisIds: syn,
    signalIds: node.evidence.signalIds,
    marketNodeId: node.companyId,
    confidence: decayConfidence(
      node.evidence.confidence,
      record?.extractedSignals.evidenceTier ?? "none",
    ),
    failureConditions,
    contradictionRisks,
  };
}

function getDefinition(scenario: ScenarioType): ScenarioDefinition {
  const def = SCENARIO_DEFINITIONS.find((s) => s.type === scenario);
  if (!def) throw new Error(`Unknown scenario: ${scenario}`);
  return def;
}

async function loadContext(): Promise<{
  map: MarketMap;
  records: Map<string, CompanyMemoryRecord>;
}> {
  const map = await buildMarketMap();
  const graph = await readMemoryGraph();
  const records = new Map(graph.companies.map((c) => [c.companyId, c]));
  return { map, records };
}

function filterNodes(
  map: MarketMap,
  affectedLayers?: MarketLayer[],
  affectedCompanies?: string[],
): MarketNode[] {
  let nodes = map.nodes;
  if (affectedLayers?.length) {
    nodes = nodes.filter((n) => affectedLayers.includes(n.marketLayer));
  }
  if (affectedCompanies?.length) {
    const set = new Set(affectedCompanies);
    nodes = nodes.filter((n) => set.has(n.companyId));
  }
  return nodes;
}

export async function simulateScenario(
  input: ScenarioSimulationInput,
): Promise<ScenarioSimulationResult> {
  const def = getDefinition(input.scenario);
  const { map, records } = await loadContext();
  const nodes = filterNodes(map, input.affectedLayers ?? def.defaultLayers, input.affectedCompanies);

  const scored = nodes.map((node) => ({
    node,
    record: records.get(node.companyId),
    score: def.scoreCompany(node, records.get(node.companyId)),
  }));

  scored.sort((a, b) => b.score - a.score);

  const winners = scored
    .filter((s) => s.score > 0)
    .slice(0, 4)
    .map((s) => ({
      companyId: s.node.companyId,
      companyName: s.node.companyName,
      reason: def.moatChangeFor(s.node, s.record, "win"),
      evidence: evidenceFromNode(s.node, s.record, def.failureConditions, def.contradictionRisks),
    }));

  const losers = scored
    .filter((s) => s.score < 0)
    .slice(-4)
    .reverse()
    .map((s) => ({
      companyId: s.node.companyId,
      companyName: s.node.companyName,
      reason: def.moatChangeFor(s.node, s.record, "lose"),
      evidence: evidenceFromNode(s.node, s.record, def.failureConditions, def.contradictionRisks),
    }));

  const moatChanges: MoatChange[] = scored.slice(0, 6).map((s) => ({
    companyId: s.node.companyId,
    companyName: s.node.companyName,
    change: def.moatChangeFor(s.node, s.record, s.score >= 0 ? "win" : "lose"),
    evidence: evidenceFromNode(s.node, s.record, def.failureConditions, def.contradictionRisks),
  }));

  const tierList = nodes.map((n) => records.get(n.companyId)?.extractedSignals.evidenceTier ?? "none");
  const avgTier = tierList.filter((t) => t === "strong").length >= 2 ? "strong" : tierList.includes("moderate") ? "moderate" : "weak";
  const confidence = decayConfidence(nodes.length >= 2 ? "Medium" : "Low", avgTier);

  return {
    scenario: input.scenario,
    scenarioLabel: def.label,
    affectedLayers: input.affectedLayers ?? def.defaultLayers,
    affectedCompanies: input.affectedCompanies ?? nodes.map((n) => n.companyId),
    winners,
    losers,
    moatChanges,
    workflowCollapse: def.workflowCollapse,
    distributionShift: def.distributionShift,
    infraShift: def.infraShift,
    confidence,
    failureConditions: def.failureConditions,
    contradictionRisks: def.contradictionRisks,
  };
}

export async function simulateCompanyResponse(
  companyId: string,
  scenario: string,
): Promise<CompanyResponseSimulation | null> {
  const { map, records } = await loadContext();
  const node = map.nodes.find((n) => n.companyId === companyId);
  const record = records.get(companyId);
  if (!node || !record) return null;

  const dna = record.companyDNA;
  const fragile = (await detectFragileMoats()).filter((m) => m.companyId === companyId);
  const scenarioLower = scenario.toLowerCase();

  let likelyResponse = `[${dna?.id ?? "SYN-DNA"}] ${node.companyName} likely doubles down on ${node.marketLayer} loop: ${node.userBehaviorModel.slice(0, 120)}`;
  let constraint = `[${node.evidence.synthesisIds[0] ?? "SYN"}] Cannot abandon ${node.infrastructureDependency.slice(0, 100)} without breaking product.`;
  let defensive = `[${dna?.id ?? "SYN"}] ${node.distributionChannel.slice(0, 120)}`;
  let survival: MemoryConfidence = node.evidence.confidence;

  if (/openai|google|microsoft|incumbent|platform enter/i.test(scenarioLower)) {
    likelyResponse = `[${dna?.id ?? "SYN"}] ${node.companyName} narrows to non-commoditized wedge (${node.marketLayer}) — avoid head-on feature parity.`;
    constraint = `Upstream platform can bundle; ${node.companyName} constrained by ${node.dependsOn.join(", ") || "platform dependency"}.`;
    defensive = fragile[0]
      ? `[${fragile[0].evidence.dnaId ?? "SYN"}] ${fragile[0].moatType} moat: ${fragile[0].insight.slice(0, 100)}`
      : `[${node.evidence.dnaId ?? "SYN"}] Workflow/community depth vs. bundle.`;
    survival = node.marketLayer === "workflow" || record.extractedSignals.communitySignals.length >= 2 ? "Medium" : "Low";
  }

  if (/commodit|open.?source|model/i.test(scenarioLower)) {
    likelyResponse = `[${dna?.id ?? "SYN"}] Shift margin to brand, community, or workflow — de-emphasize model quality claims.`;
    survival = record.extractedSignals.communitySignals.length ? "Medium" : "Low";
  }

  return {
    companyId,
    companyName: node.companyName,
    scenario,
    likelyResponse,
    strategicConstraint: constraint,
    defensiveAdvantage: defensive,
    survivalProbability: decayConfidence(survival, record.extractedSignals.evidenceTier),
    evidence: evidenceFromNode(node, record, [
      "Response simulation fails if incumbent ships equivalent bundle in <12 months.",
    ], [
      dna?.contradictionRisk ?? "Company may pivot faster than evidence suggests.",
    ]),
  };
}

export async function detectFutureFragility(): Promise<FutureFragilityAssessment[]> {
  const { map, records } = await loadContext();
  const fragileMoats = await detectFragileMoats();
  const results: FutureFragilityAssessment[] = [];

  for (const node of map.nodes) {
    const record = records.get(node.companyId);
    if (!record) continue;

    const strength = `[${node.evidence.dnaId ?? "SYN"}] Current ${node.marketLayer} position + score ${record.validationScore} — strong today on evidenced signals.`;
    const evidence = evidenceFromNode(node, record, [
      "Future fragility overstates collapse if company executes enterprise pivot.",
    ], [
      record.companyDNA?.contradictionRisk ?? "Synthesis may underweight new distribution channels.",
    ]);

    if (node.marketLayer === "application" || node.marketLayer === "ai-native-replacement") {
      if (!record.extractedSignals.workflow.length) {
        results.push({
          companyId: node.companyId,
          companyName: node.companyName,
          currentStrength: strength,
          fragilityType: "workflow-abstraction",
          futureRisk: `[${node.evidence.synthesisIds[0] ?? "SYN"}] Agents/workflows may abstract away ${node.companyName}'s app shell.`,
          evidence,
        });
      }
      if (record.extractedSignals.aiClaims.length >= 1) {
        results.push({
          companyId: node.companyId,
          companyName: node.companyName,
          currentStrength: strength,
          fragilityType: "ai-replacement",
          futureRisk: `[${node.evidence.dnaId ?? "SYN"}] AI-native surface vulnerable to model/platform commoditization.`,
          evidence,
        });
      }
    }

    if (record.extractedSignals.communitySignals.length >= 2 && node.marketLayer === "distribution") {
      results.push({
        companyId: node.companyId,
        companyName: node.companyName,
        currentStrength: strength,
        fragilityType: "distribution-dependency",
        futureRisk: `[${record.extractedSignals.communitySignals[0].id}] Rents community channel — platform policy shifts break GTM.`,
        evidence,
      });
    }

    if (node.dependsOn.some((d) => d.includes("upstream") || d.includes("platform"))) {
      results.push({
        companyId: node.companyId,
        companyName: node.companyName,
        currentStrength: strength,
        fragilityType: "infra-dependency",
        futureRisk: `[${node.evidence.dnaId ?? "SYN"}] Depends on ${node.dependsOn.join(", ")} — upstream pricing/bundling risk.`,
        evidence,
      });
    }

    const topFragile = fragileMoats.find((m) => m.companyId === node.companyId && m.fragilityScore >= 65);
    if (topFragile && !results.some((r) => r.companyId === node.companyId)) {
      results.push({
        companyId: node.companyId,
        companyName: node.companyName,
        currentStrength: strength,
        fragilityType: "ai-replacement",
        futureRisk: `[${topFragile.evidence.dnaId ?? "SYN"}] ${topFragile.vulnerability}`,
        evidence,
      });
    }
  }

  return results;
}

export async function simulateLayerCollapse(): Promise<LayerCollapseSimulation[]> {
  const { map, records } = await loadContext();
  const results: LayerCollapseSimulation[] = [];

  const layerGroups = new Map<MarketLayer, MarketNode[]>();
  for (const node of map.nodes) {
    const list = layerGroups.get(node.marketLayer) ?? [];
    list.push(node);
    layerGroups.set(node.marketLayer, list);
  }

  for (const [layer, nodes] of layerGroups) {
    if (nodes.length === 0) continue;
    const rep = nodes[0];
    const record = records.get(rep.companyId);

    let outcome: LayerCollapseOutcome = "merge";
    let timeline: "2-3y" | "3-5y" = "2-3y";
    let insight = "";

    if (layer === "ai-native-replacement") {
      outcome = "commoditize";
      insight = `[${rep.evidence.dnaId ?? "SYN"}] Answer/search UI layer commoditizes into agent defaults — ${nodes.length} node(s) in graph.`;
    } else if (layer === "application") {
      outcome = "merge";
      timeline = "3-5y";
      insight = `[${rep.evidence.synthesisIds[0] ?? "SYN"}] Standalone apps merge into workflow suites or agent orchestration.`;
    } else if (layer === "workflow") {
      outcome = "become-infrastructure";
      timeline = "3-5y";
      insight = `[${rep.evidence.dnaId ?? "SYN"}] Winning workflows become infra primitives for agents — OS layer consolidates.`;
    } else if (layer === "distribution") {
      outcome = "disappear";
      insight = `[${rep.evidence.signalIds[0] ?? "SIG"}] Pure distribution layers get absorbed by platforms unless proprietary (evidence: ${rep.distributionChannel.slice(0, 80)}).`;
    } else if (layer === "infrastructure") {
      outcome = "become-infrastructure";
      timeline = "3-5y";
      insight = `[${rep.evidence.dnaId ?? "SYN"}] Infra layer consolidates — winners become default rails.`;
    }

    results.push({
      layer,
      outcome,
      timeline,
      insight,
      evidence: evidenceFromNode(rep, record, [
        "Collapse timing wrong if regulation slows agent adoption.",
      ], [
        record?.companyDNA?.contradictionRisk ?? "Layer may persist as niche premium segment.",
      ]),
    });
  }

  return results;
}

export async function marketPowerTransition(): Promise<PowerTransition[]> {
  const power = await detectPowerCenters();
  const { map, records } = await loadContext();

  const transitions: Array<Omit<PowerTransition, "evidence"> & { pickNode?: MarketNode }> = [
    {
      from: "search",
      to: "agents",
      insight: "Query UI yields to agent orchestration with memory — search becomes a tool call.",
      beneficiaries: map.nodes.filter((n) => n.marketLayer === "workflow").map((n) => n.companyId),
    },
    {
      from: "SaaS apps",
      to: "workflow AI",
      insight: "Feature apps collapse into AI-native workflow surfaces with embedded actions.",
      beneficiaries: map.nodes.filter((n) => n.marketLayer === "workflow").map((n) => n.companyId),
    },
    {
      from: "apps",
      to: "orchestration layer",
      insight: "Standalone SKUs lose to orchestration/memory layer that routes across tools.",
      beneficiaries: map.nodes.filter((n) => n.marketLayer === "infrastructure").map((n) => n.companyId),
    },
    {
      from: "prompts",
      to: "memory systems",
      insight: "Prompt libraries commoditize; persistent memory + eval becomes differentiation.",
      beneficiaries: map.nodes.filter((n) => n.marketLayer === "infrastructure" || n.marketLayer === "workflow").map((n) => n.companyId),
    },
  ];

  const distPower = power.find((p) => p.domain === "distribution");
  const wfPower = power.find((p) => p.domain === "workflow");

  return transitions.map((t) => {
    const beneficiaryId = t.beneficiaries[0] ?? wfPower?.holder.companyId ?? distPower?.holder.companyId;
    const node = map.nodes.find((n) => n.companyId === beneficiaryId) ?? map.nodes[0];
    const record = node ? records.get(node.companyId) : undefined;

    return {
      from: t.from,
      to: t.to,
      insight: node
        ? `[${node.evidence.dnaId ?? node.evidence.synthesisIds[0] ?? "SYN"}] ${t.insight}`
        : t.insight,
      beneficiaries: t.beneficiaries.slice(0, 4),
      evidence: node
        ? evidenceFromNode(node, record, [
            "Power transition stalls if incumbents bundle agents before startups scale.",
          ], [
            record?.companyDNA?.contradictionRisk ?? "Beneficiary may not capture value if orchestration stays platform-owned.",
          ])
        : {
            synthesisIds: [],
            signalIds: [],
            confidence: "Low" as MemoryConfidence,
            failureConditions: ["No market map nodes — transition speculative."],
            contradictionRisks: [],
          },
    };
  });
}

export async function runStrategicSimulationForCompany(
  companyId: string,
): Promise<StrategicSimulationBundle | null> {
  const { map } = await loadContext();
  const node = map.nodes.find((n) => n.companyId === companyId);
  if (!node) return null;

  const relevantScenarios: ScenarioType[] = [];
  if (node.marketLayer === "ai-native-replacement") {
    relevantScenarios.push("search-layer-disruption", "ai-agent-adoption");
  }
  if (node.marketLayer === "distribution") {
    relevantScenarios.push("creator-economy-collapse", "llm-commoditization");
  }
  if (node.marketLayer === "workflow") {
    relevantScenarios.push("ai-agent-adoption", "enterprise-ai-standardization");
  }
  if (node.marketLayer === "infrastructure") {
    relevantScenarios.push("api-cost-collapse", "open-source-model-surge");
  }
  if (relevantScenarios.length === 0) {
    relevantScenarios.push("ai-agent-adoption", "llm-commoditization");
  }

  const primaryScenarios = await Promise.all(
    relevantScenarios.slice(0, 3).map((scenario) =>
      simulateScenario({
        scenario,
        affectedCompanies: [companyId, ...map.nodes.filter((n) => n.companyId !== companyId).slice(0, 3).map((n) => n.companyId)],
      }),
    ),
  );

  const companyResponses = await Promise.all([
    simulateCompanyResponse(companyId, "OpenAI / platform incumbent enters this category"),
    simulateCompanyResponse(companyId, "LLM commoditization accelerates"),
  ]);

  const futureFragility = (await detectFutureFragility()).filter((f) => f.companyId === companyId);
  const layerCollapse = await simulateLayerCollapse();
  const powerTransitions = await marketPowerTransition();

  return {
    primaryScenarios,
    companyResponses: companyResponses.filter(Boolean) as CompanyResponseSimulation[],
    futureFragility,
    layerCollapse,
    powerTransitions,
    generatedAt: new Date().toISOString(),
  };
}

export const SCENARIO_TYPES: ScenarioType[] = SCENARIO_DEFINITIONS.map((s) => s.type);

export function scenarioLabel(type: ScenarioType): string {
  return getDefinition(type).label;
}
