import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveCompanyName } from "@/lib/company-name";
import type { EvidenceBinding, EvidenceTier, ExtractedSignals } from "@/lib/extract-signals";
import {
  deriveCompanyId,
  inferMarketPosition,
  recordCompanyFromReport,
  type MarketPositionInference,
} from "@/lib/company-memory";
import {
  getMarketContextForCompany,
  rebuildAndPersistMarketMap,
  type AttackVector,
  type FragileMoatAssessment,
  type MarketEdge,
  type MarketEvolutionInference,
  type MarketNode,
} from "@/lib/market-map";
import { generateMockReport } from "@/lib/generate-mock-report";
import {
  generateAIReport,
  refineMarketEvolutionWithAI,
  refineStrategicSimulationWithAI,
} from "@/lib/openai";
import { formatSignalsCatalog } from "@/lib/extract-signals";
import { getOrderByReportId, type CreateOrderInput } from "@/lib/orders";
import type { SignalSynthesis } from "@/lib/signal-synthesis";
import {
  runStrategicSimulationForCompany,
  type StrategicSimulationBundle,
} from "@/lib/strategic-simulation";

export type ValidationReport = {
  id: string;
  orderId: string;
  email: string;
  socialProfileUrl: string;
  industryNiche: string;
  mainConcern: string;
  additionalNotes: string;
  validationScore: number;
  demandLevel: "Low" | "Medium" | "High";
  competitionLevel: "Low" | "Medium" | "High";
  opportunities: string[];
  risks: string[];
  suggestedMvp: string;
  verdict: "Go" | "Caution" | "No-Go";
  marketAnalysis: string;
  competitionAnalysis?: string;
  recommendations: string[];
  investmentVerdict?: string;
  whatThisCompanyActuallyIs?: string;
  moatAnalysis?: string;
  whyThisMightFail?: string[];
  founderQuestions?: string[];
  confidence?: "Low" | "Medium" | "High";
  websiteEvidence?: string[];
  companyName?: string;
  coreContradiction?: string;
  strategicTension?: string;
  hiddenRisk?: string;
  whyIncumbentsHaventWon?: string;
  nonObviousInsight?: string;
  strategicParadox?: string;
  hiddenMoatOrWeakness?: string;
  bullCase?: string;
  bearCase?: string;
  moatDurability?: string;
  replacementRisk?: string;
  gtmWeakness?: string;
  whyNow?: string;
  extractedSignals?: ExtractedSignals;
  evidenceBindings?: EvidenceBinding[];
  evidenceTier?: EvidenceTier;
  evidenceScore?: number;
  signalSynthesis?: SignalSynthesis;
  memoryCompanyId?: string;
  marketPosition?: MarketPositionInference;
  marketNode?: MarketNode;
  marketEdges?: MarketEdge[];
  attackVector?: AttackVector;
  fragileMoats?: FragileMoatAssessment[];
  marketEvolution?: MarketEvolutionInference;
  strategicSimulation?: StrategicSimulationBundle;
  createdAt: string;
  source?: "openai" | "mock";
  rawContent?: string;
  scrapedUrl?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

async function ensureReportsFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(REPORTS_FILE, "utf8");
  } catch {
    await writeFile(REPORTS_FILE, "[]\n", "utf8");
  }
}

export async function readReports(): Promise<ValidationReport[]> {
  await ensureReportsFile();
  const raw = await readFile(REPORTS_FILE, "utf8");
  const reports = JSON.parse(raw) as ValidationReport[];
  return reports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getReportById(id: string): Promise<ValidationReport | null> {
  const reports = await readReports();
  const report = reports.find((r) => r.id === id) ?? null;
  if (!report) return null;

  const order = await getOrderByReportId(id);
  if (order?.email?.trim()) {
    return { ...report, email: order.email.trim() };
  }
  return report;
}

export async function saveReport(report: ValidationReport): Promise<void> {
  await ensureReportsFile();
  const reports = await readReports();
  reports.unshift(report);
  await writeFile(REPORTS_FILE, `${JSON.stringify(reports, null, 2)}\n`, "utf8");
}

export async function createReportForOrder(
  orderId: string,
  input: CreateOrderInput,
  reportId: string,
): Promise<ValidationReport> {
  const { prepareStartupReportContext } = await import("@/lib/startup-order");
  const { pipeline, context: reportContext } = await prepareStartupReportContext(input);
  const resolvedCompanyName =
    reportContext.extractedSignals?.companyName ??
    resolveCompanyName(reportContext.scrapedUrl ?? "", {
      markdown: reportContext.rawContent,
      pageTitle: reportContext.scrapedTitle,
      niche: pipeline.industryNiche,
    });

  let report: ValidationReport;

  try {
    report = await generateAIReport(orderId, pipeline, reportId, reportContext);
  } catch (error) {
    console.error("[SignalProof] OpenAI report failed, using mock fallback:", error);
    report = generateMockReport(orderId, pipeline, reportId, reportContext);
    report.source = "mock";
  }

  try {
    await recordCompanyFromReport(report);
    report.memoryCompanyId = deriveCompanyId(report);
    report.marketPosition =
      (await inferMarketPosition(report.memoryCompanyId)) ?? undefined;

    await rebuildAndPersistMarketMap();
    const marketContext = report.memoryCompanyId
      ? await getMarketContextForCompany(report.memoryCompanyId)
      : null;
    if (marketContext) {
      report.marketNode = marketContext.node ?? undefined;
      report.marketEdges = marketContext.edges;
      report.attackVector = marketContext.attackVector ?? undefined;
      report.fragileMoats = marketContext.fragileMoats;
      report.marketEvolution = await refineMarketEvolutionWithAI(marketContext.evolution, {
        companyName: resolvedCompanyName,
        industryNiche: pipeline.industryNiche,
        signalCatalog: formatSignalsCatalog(reportContext.extractedSignals!),
      });
    }

    if (report.memoryCompanyId) {
      const simulation =
        (await runStrategicSimulationForCompany(report.memoryCompanyId)) ?? undefined;
      report.strategicSimulation = simulation
        ? await refineStrategicSimulationWithAI(simulation, {
            companyName: resolvedCompanyName,
            industryNiche: pipeline.industryNiche,
            bullCase: report.bullCase,
            bearCase: report.bearCase,
          })
        : undefined;
    }
  } catch (error) {
    console.error("[SignalProof] Company memory / market map update failed:", error);
  }

  report.companyName = resolvedCompanyName;
  report.email = pipeline.email.trim();
  report.mainConcern = pipeline.startupIdea;
  report.additionalNotes = pipeline.additionalContext;
  report.industryNiche = pipeline.industryNiche;
  report.socialProfileUrl = reportContext.scrapedUrl ?? pipeline.socialProfileUrl;
  if (report.extractedSignals) {
    report.extractedSignals.companyName = resolvedCompanyName;
  }

  await saveReport(report);
  return report;
}
