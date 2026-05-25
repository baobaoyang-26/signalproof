import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LevelBadge } from "@/components/report/level-badge";
import { ReportShareBar } from "@/components/report/report-share-bar";
import { ScoreGauge } from "@/components/report/score-gauge";
import { SectionCard } from "@/components/report/section-card";
import { TrendBar } from "@/components/report/trend-bar";
import { VerdictBadge } from "@/components/report/verdict-badge";
import { Card } from "@/components/ui/card";
import {
  formatReportNumber,
  getCompetitionAnalysis,
  getOpportunityVerdict,
  levelToPercent,
} from "@/lib/report-display";
import { getReportById } from "@/lib/reports";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

function memoParagraph(text: string | undefined, fallback: string) {
  return text?.trim() || fallback;
}

function confidenceStyles(level: string) {
  if (level === "High") return "border-success/40 bg-success/15 text-success";
  if (level === "Medium") return "border-accent/40 bg-accent/15 text-accent";
  return "border-white/10 bg-white/[0.04] text-muted";
}

function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw}`.replace(/\/$/, "");
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const report = await getReportById(id);
  if (!report) return { title: "Report not found" };

  const verdict = getOpportunityVerdict(report.validationScore);
  const titleName = report.companyName ?? report.industryNiche;
  return {
    title: `${titleName} — Validation Memo`,
    description: `Score ${report.validationScore}/100 · ${verdict} · ${report.verdict}`,
    openGraph: {
      title: `SignalProof · ${titleName}`,
      description: `Validation score ${report.validationScore} — ${verdict}`,
      type: "article",
    },
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) {
    notFound();
  }

  const reportNumber = formatReportNumber(report.id);
  const reportUrl = `${siteUrl()}/report/${report.id}`;
  const opportunityVerdict = getOpportunityVerdict(report.validationScore);
  const competitionAnalysis = getCompetitionAnalysis(report);
  const demandPercent = levelToPercent(report.demandLevel);
  const competitionPercent = levelToPercent(report.competitionLevel);
  const confidence = report.confidence ?? "Medium";
  const websiteEvidence = report.websiteEvidence ?? [];
  const whyFail = report.whyThisMightFail ?? report.risks;
  const founderQuestions = report.founderQuestions ?? report.recommendations;

  const verdictHeadline =
    report.verdict === "Go"
      ? "Go — conditional"
      : report.verdict === "Caution"
        ? "Hold — further diligence"
        : "No-Go — pass at this time";

  return (
    <div className="min-h-screen bg-canvas bg-grid">
      <div className="pointer-events-none fixed inset-0 bg-hero-glow opacity-50" />

      <header className="no-print sticky top-0 z-50 border-b border-white/[0.06] bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-bold">
              S
            </span>
            <span className="text-sm font-semibold">SignalProof</span>
          </Link>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-subtle sm:inline">
            Confidential · Partner Memo
          </span>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="no-print mb-6">
          <Card className="p-5">
            <ReportShareBar reportNumber={reportNumber} reportUrl={reportUrl} />
          </Card>
        </div>

        <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-surface/80 shadow-card backdrop-blur-sm">
          <div className="border-b border-white/[0.06] bg-elevated/80 px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                  SignalProof · Investment Validation Memo
                </p>
                <p className="mt-3 font-mono text-sm text-muted">{reportNumber}</p>
                <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  {report.companyName ?? report.industryNiche}
                </h1>
                {report.companyName ? (
                  <p className="mt-2 text-sm text-muted">{report.industryNiche}</p>
                ) : null}
                <dl className="mt-8 grid gap-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-subtle">
                      Prepared for
                    </dt>
                    <dd className="mt-1.5 text-white">{report.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-subtle">
                      Created
                    </dt>
                    <dd className="mt-1.5 text-white">{formatDate(report.createdAt)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wider text-subtle">
                      Website / profile
                    </dt>
                    <dd className="mt-1.5 break-all">
                      <a
                        className="text-accent underline-offset-2 hover:underline"
                        href={report.socialProfileUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {report.scrapedUrl ?? report.socialProfileUrl}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                <VerdictBadge verdict={opportunityVerdict} />
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${confidenceStyles(confidence)}`}
                >
                  Confidence · {confidence}
                </span>
                {report.marketNode ? (
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent capitalize">
                    Layer · {report.marketNode.marketLayer.replace(/-/g, " ")}
                  </span>
                ) : null}
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted">
                  Evidence · {report.evidenceTier ?? "unknown"}
                  {report.evidenceScore != null ? ` (${report.evidenceScore})` : ""}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted">
                  {report.source === "openai" ? "AI memo" : "Fallback memo"}
                </span>
              </div>
            </div>
          </div>

          <section className="border-b border-white/[0.06] px-6 py-10 sm:px-10 sm:py-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
              Executive summary
            </p>
            <div className="mt-8 grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center">
              <div className="flex justify-center lg:justify-start">
                <ScoreGauge score={report.validationScore} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-subtle">
                    Demand
                  </p>
                  <div className="mt-3">
                    <LevelBadge level={report.demandLevel} />
                  </div>
                  <div className="mt-5">
                    <TrendBar label="Demand signal" value={demandPercent} />
                  </div>
                </Card>
                <Card className="p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-subtle">
                    Competition
                  </p>
                  <div className="mt-3">
                    <LevelBadge level={report.competitionLevel} />
                  </div>
                  <div className="mt-5">
                    <TrendBar label="Competitive pressure" value={competitionPercent} />
                  </div>
                </Card>
              </div>
            </div>
          </section>

          <div className="space-y-6 px-6 py-8 sm:px-10 sm:py-10">
            <section className="rounded-xl border border-accent/20 bg-accent/5 p-6 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                Company-specific insight
              </p>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <Card className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-subtle">
                    Non-obvious insight
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {report.nonObviousInsight ?? "—"}
                  </p>
                </Card>
                <Card className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-subtle">
                    Strategic paradox
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {report.strategicParadox ?? "—"}
                  </p>
                </Card>
                <Card className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-subtle">
                    Hidden moat / weakness
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {report.hiddenMoatOrWeakness ?? "—"}
                  </p>
                </Card>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard
                span="half"
                subtitle="The central tension this business cannot escape."
                title="Core Contradiction"
              >
                <p className="text-sm leading-7 text-muted sm:text-base">
                  {report.coreContradiction ?? "—"}
                </p>
              </SectionCard>
              <SectionCard
                span="half"
                subtitle="The implicit bet management is making."
                title="Strategic Tension"
              >
                <p className="text-sm leading-7 text-muted sm:text-base">
                  {report.strategicTension ?? "—"}
                </p>
              </SectionCard>
              <SectionCard
                span="half"
                subtitle="Downside not visible in hero positioning."
                title="Hidden Risk"
              >
                <p className="text-sm leading-7 text-muted sm:text-base">
                  {report.hiddenRisk ?? "—"}
                </p>
              </SectionCard>
              <SectionCard
                span="half"
                subtitle="Why category leaders have not already closed this wedge."
                title="Why Incumbents Haven't Won"
              >
                <p className="text-sm leading-7 text-muted sm:text-base">
                  {report.whyIncumbentsHaventWon ?? "—"}
                </p>
              </SectionCard>
            </div>

            {report.signalSynthesis && report.signalSynthesis.synthesisCount > 0 ? (
              <SectionCard
                subtitle={`${report.signalSynthesis.synthesisCount} multi-signal inferences · memo cites [SYN-*] ids first`}
                title="Signal Synthesis"
              >
                {report.signalSynthesis.companyDNA ? (
                  <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-5">
                    <p className="text-xs font-medium uppercase tracking-wider text-accent">
                      Company DNA · [{report.signalSynthesis.companyDNA.id}]
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white">
                      {report.signalSynthesis.companyDNA.insight}
                    </p>
                    <p className="mt-3 text-xs text-subtle">
                      Confidence: {report.signalSynthesis.companyDNA.confidence} · Signals:{" "}
                      {report.signalSynthesis.companyDNA.supportingSignals.join(", ")}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      Contradiction risk: {report.signalSynthesis.companyDNA.contradictionRisk}
                    </p>
                  </div>
                ) : null}
                <div className="grid gap-4 lg:grid-cols-2">
                  {[
                    { label: "Strategic patterns", items: report.signalSynthesis.strategicPatterns },
                    { label: "Hidden tradeoffs", items: report.signalSynthesis.hiddenTradeoffs },
                    { label: "Optimization direction", items: report.signalSynthesis.optimizationDirection },
                    { label: "Behavior inference", items: report.signalSynthesis.behaviorInference },
                  ].map(
                    (group) =>
                      group.items.length > 0 ? (
                        <Card className="p-5" key={group.label}>
                          <p className="text-xs font-medium uppercase tracking-wider text-subtle">
                            {group.label}
                          </p>
                          <ul className="mt-4 space-y-4">
                            {group.items.map((item) => (
                              <li className="text-sm leading-7 text-muted" key={item.id}>
                                <span className="font-mono text-xs text-accent">[{item.id}]</span>{" "}
                                {item.insight}
                                <p className="mt-2 text-xs text-subtle">
                                  {item.confidence} · {item.supportingSignals.join(", ")}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </Card>
                      ) : null,
                  )}
                </div>
              </SectionCard>
            ) : null}

            {report.marketPosition ? (
              <SectionCard
                subtitle={`Memory id: ${report.memoryCompanyId ?? report.marketPosition.companyId} · cites ${report.marketPosition.synthesisIds.join(", ") || "synthesis pending"}`}
                title="Market Position"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-wider text-subtle">Attacking</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {report.marketPosition.attacking}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-wider text-subtle">Replacing</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {report.marketPosition.replacing}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-wider text-subtle">
                      Why incumbents haven&apos;t followed
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {report.marketPosition.whyIncumbentsHaventFollowed}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-wider text-subtle">Most dangerous path</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {report.marketPosition.mostDangerousPath}
                    </p>
                  </Card>
                </div>
              </SectionCard>
            ) : null}

            {report.marketNode ? (
              <SectionCard
                subtitle={`Market map · ${report.marketEdges?.length ?? 0} edges · cites ${report.marketNode.evidence.synthesisIds.slice(0, 2).join(", ") || "SYN"}`}
                title="Market Map"
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-wider text-subtle">User behavior model</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {report.marketNode.userBehaviorModel}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-wider text-subtle">Distribution channel</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {report.marketNode.distributionChannel}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-wider text-subtle">Infrastructure dependency</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {report.marketNode.infrastructureDependency}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-wider text-subtle">Depends on</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {report.marketNode.dependsOn.length
                        ? report.marketNode.dependsOn.join(" · ")
                        : "—"}
                    </p>
                  </Card>
                </div>
                {report.attackVector ? (
                  <div className="mt-6 rounded-lg border border-white/[0.06] bg-canvas/40 p-4">
                    <p className="text-xs uppercase tracking-wider text-subtle">Attack vector</p>
                    <p className="mt-2 text-sm text-muted">
                      {report.attackVector.target}: {report.attackVector.attackSurface}
                    </p>
                    <p className="mt-2 text-xs text-subtle">
                      Friction: {report.attackVector.adoptionFriction} · Difficulty:{" "}
                      {report.attackVector.replacementDifficulty}
                    </p>
                  </div>
                ) : null}
                {report.fragileMoats && report.fragileMoats.length > 0 ? (
                  <ul className="mt-6 space-y-3">
                    {report.fragileMoats.map((moat) => (
                      <li
                        className="rounded-lg border border-warn/20 bg-warn/5 px-4 py-3 text-sm text-muted"
                        key={`${moat.moatType}-${moat.companyId}`}
                      >
                        <span className="font-medium text-warn capitalize">{moat.moatType}</span>{" "}
                        (fragility {moat.fragilityScore}) — {moat.vulnerability}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {report.marketEvolution ? (
                  <div className="mt-6 border-t border-white/[0.06] pt-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-accent">
                      Market evolution ({report.marketEvolution.horizon}) ·{" "}
                      {report.marketEvolution.overallConfidence} confidence
                    </p>
                    {report.marketEvolution.collapsingLayers[0] ? (
                      <p className="mt-3 text-sm leading-7 text-muted">
                        {report.marketEvolution.collapsingLayers[0].insight}
                      </p>
                    ) : null}
                    {report.marketEvolution.agentReplaceableLayers[0] ? (
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {report.marketEvolution.agentReplaceableLayers[0].insight}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </SectionCard>
            ) : null}

            {report.strategicSimulation ? (
              <SectionCard
                subtitle={`${report.strategicSimulation.primaryScenarios.length} scenarios · power transitions · future fragility`}
                title="Strategic Simulation"
              >
                {report.strategicSimulation.primaryScenarios[0] ? (
                  <div className="rounded-lg border border-white/[0.06] bg-canvas/40 p-4">
                    <p className="text-xs uppercase tracking-wider text-accent">
                      {report.strategicSimulation.primaryScenarios[0].scenarioLabel} ·{" "}
                      {report.strategicSimulation.primaryScenarios[0].confidence} confidence
                    </p>
                    {report.strategicSimulation.primaryScenarios[0].winners[0] ? (
                      <p className="mt-2 text-sm text-muted">
                        Winner: {report.strategicSimulation.primaryScenarios[0].winners[0].reason}
                      </p>
                    ) : null}
                    {report.strategicSimulation.primaryScenarios[0].losers[0] ? (
                      <p className="mt-2 text-sm text-muted">
                        Loser: {report.strategicSimulation.primaryScenarios[0].losers[0].reason}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {report.strategicSimulation.companyResponses[0] ? (
                  <Card className="mt-4 p-4">
                    <p className="text-xs uppercase tracking-wider text-subtle">Company response</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {report.strategicSimulation.companyResponses[0].likelyResponse}
                    </p>
                    <p className="mt-2 text-xs text-subtle">
                      Survival: {report.strategicSimulation.companyResponses[0].survivalProbability} ·{" "}
                      {report.strategicSimulation.companyResponses[0].defensiveAdvantage.slice(0, 120)}
                    </p>
                  </Card>
                ) : null}
                {report.strategicSimulation.futureFragility[0] ? (
                  <p className="mt-4 text-sm leading-7 text-muted">
                    <span className="text-warn">Future fragility:</span>{" "}
                    {report.strategicSimulation.futureFragility[0].futureRisk}
                  </p>
                ) : null}
                {report.strategicSimulation.powerTransitions[0] ? (
                  <p className="mt-3 text-sm leading-7 text-muted">
                    <span className="text-accent">Power shift:</span>{" "}
                    {report.strategicSimulation.powerTransitions[0].from} →{" "}
                    {report.strategicSimulation.powerTransitions[0].to} —{" "}
                    {report.strategicSimulation.powerTransitions[0].insight.slice(0, 160)}
                  </p>
                ) : null}
              </SectionCard>
            ) : null}

            {report.extractedSignals && report.extractedSignals.signalCount > 0 ? (
              <SectionCard
                subtitle={`Tier ${report.extractedSignals.evidenceTier} · ${report.extractedSignals.signalCount} signals · priority: pricing → workflow → onboarding → docs → community`}
                title="Structured Evidence"
              >
                {report.extractedSignals.gaps.length > 0 ? (
                  <p className="mb-4 text-xs text-subtle">
                    Gaps: {report.extractedSignals.gaps.join(" · ")}
                  </p>
                ) : null}
                <ul className="space-y-2 font-mono text-xs text-muted">
                  {[
                    ...report.extractedSignals.pricingModel,
                    ...report.extractedSignals.workflow,
                    ...report.extractedSignals.onboardingCta,
                    ...report.extractedSignals.docsSignals,
                    ...report.extractedSignals.communitySignals,
                    ...report.extractedSignals.positioning,
                    ...report.extractedSignals.integrations,
                    ...report.extractedSignals.aiClaims,
                  ].map((signal) => (
                    <li
                      className="rounded border border-white/[0.06] bg-canvas/40 px-3 py-2"
                      key={signal.id}
                    >
                      <span className="text-accent">[{signal.id}]</span>{" "}
                      <span className="text-subtle">({signal.category})</span> {signal.text}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}

            {websiteEvidence.length > 0 ? (
              <SectionCard
                subtitle="Facts pulled from the scraped page — cited in the memo below."
                title="Website Evidence"
              >
                <ul className="space-y-3">
                  {websiteEvidence.map((item) => (
                    <li
                      className="rounded-lg border border-white/[0.06] bg-canvas/60 px-4 py-3 text-sm leading-7 text-muted sm:text-base"
                      key={item}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard
                span="half"
                subtitle="Plain-language read of the business — not the pitch deck version."
                title="What This Company Actually Is"
              >
                <p className="text-sm leading-7 text-muted sm:text-base">
                  {memoParagraph(
                    report.whatThisCompanyActuallyIs,
                    report.suggestedMvp,
                  )}
                </p>
              </SectionCard>

              <SectionCard
                span="half"
                subtitle="What, if anything, compounds over time."
                title="Moat Analysis"
              >
                <p className="text-sm leading-7 text-muted sm:text-base">
                  {memoParagraph(
                    report.moatAnalysis,
                    "Moat not evidenced from available materials.",
                  )}
                </p>
              </SectionCard>
            </div>

            <SectionCard
              subtitle="Market pull and category dynamics."
              title="Market Analysis"
            >
              <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                {report.marketAnalysis}
              </p>
            </SectionCard>

            <SectionCard
              subtitle="Substitutes, incumbents, and positioning pressure."
              title="Competition Analysis"
            >
              <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                {competitionAnalysis}
              </p>
            </SectionCard>

            <SectionCard
              subtitle="Evidence-based wedges — not a founder to-do list."
              title="Opportunities"
            >
              <ul className="grid gap-3 sm:grid-cols-2">
                {report.opportunities.map((item) => (
                  <li
                    className="rounded-lg border border-white/[0.06] bg-canvas/40 p-4 text-sm leading-7 text-muted"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              subtitle="Downside cases the partnership would underwrite against."
              title="Why This Might Fail"
            >
              <ul className="space-y-3">
                {whyFail.map((item, index) => (
                  <li
                    className="flex gap-4 rounded-lg border border-white/[0.06] bg-canvas/40 p-4 sm:p-5"
                    key={item}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] font-mono text-xs font-semibold text-subtle">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm leading-7 text-muted sm:text-base">{item}</p>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              subtitle="Diligence questions for the next partner meeting."
              title="Founder Questions"
            >
              <ul className="space-y-3">
                {founderQuestions.map((item) => (
                  <li
                    className="border-l-2 border-accent/60 pl-4 text-sm leading-7 text-muted sm:text-base"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          <section className="relative overflow-hidden border-t border-white/[0.06] bg-gradient-to-br from-accent/20 via-canvas to-canvas px-6 py-12 sm:px-10 sm:py-16 print-surface">
            <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-40" />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
                Investment Verdict
              </p>
              <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {verdictHeadline}
                  </h2>
                  <p className="mt-5 text-sm leading-8 text-muted sm:text-base">
                    {memoParagraph(
                      report.investmentVerdict,
                      `Score ${report.validationScore}/100. ${opportunityVerdict}.`,
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end">
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                    <span className="text-subtle">Confidence </span>
                    <span className="font-semibold text-white">{confidence}</span>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm tabular-nums">
                    <span className="text-subtle">Score </span>
                    <span className="font-semibold text-white">
                      {report.validationScore}/100
                    </span>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                    <span className="text-subtle">Verdict </span>
                    <span className="font-semibold text-white">{report.verdict}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="border-t border-white/[0.06] bg-elevated/50 px-6 py-6 sm:px-10">
            <p className="text-xs leading-5 text-subtle">
              {reportNumber} · {formatDate(report.createdAt)} · Shareable partner memo ·
              SignalProof
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
