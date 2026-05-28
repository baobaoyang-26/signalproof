import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MemoCard } from "@/components/report/memo-card";
import { LevelBadge } from "@/components/report/level-badge";
import { ReportShareBar } from "@/components/report/report-share-bar";
import { ScoreGauge } from "@/components/report/score-gauge";
import { SectionCard } from "@/components/report/section-card";
import { TrendBar } from "@/components/report/trend-bar";
import { VerdictBadge } from "@/components/report/verdict-badge";
import { Card } from "@/components/ui/card";
import { getOrderByReportId } from "@/lib/orders";
import {
  EVIDENCE_LIMITED_MESSAGE,
  evidenceTierLabel,
  formatReportNumber,
  getOpportunityVerdict,
  isWeakEvidence,
  levelToPercent,
} from "@/lib/report-display";
import {
  prepareReportView,
  REPORT_INTRO,
  REPORT_LABELS,
  REPORT_SECTION_COPY,
  verdictHeadline,
} from "@/lib/report-view";
import { getReportById } from "@/lib/reports";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
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

  const order = await getOrderByReportId(id);
  const view = prepareReportView(report, order?.email);
  const verdict = getOpportunityVerdict(report.validationScore);
  return {
    title: `${view.companyTitle} — ${REPORT_LABELS.memoTitle}`,
    description: `Score ${report.validationScore}/100 · ${verdict}`,
    openGraph: {
      title: `SignalProof · ${view.companyTitle}`,
      description: `Survivability score ${report.validationScore}/100`,
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

  const order = await getOrderByReportId(id);
  const view = prepareReportView(report, order?.email);

  const reportNumber = formatReportNumber(report.id);
  const reportUrl = `${siteUrl()}/report/${report.id}`;
  const opportunityVerdict = getOpportunityVerdict(report.validationScore);
  const demandPercent = levelToPercent(report.demandLevel);
  const competitionPercent = levelToPercent(report.competitionLevel);
  const confidence = report.confidence ?? "Medium";
  const weakEvidence = isWeakEvidence(report);

  const verdictTitle = verdictHeadline(report.verdict);

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
            {REPORT_LABELS.confidential}
          </span>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="no-print mb-6">
          <Card className="p-5">
            <ReportShareBar reportNumber={reportNumber} reportUrl={reportUrl} />
          </Card>
        </div>

        <article
          className="report-document notranslate overflow-hidden rounded-2xl border border-white/[0.08] bg-surface/80 shadow-card backdrop-blur-sm"
          lang="en"
          translate="no"
        >
          <div className="border-b border-white/[0.06] bg-elevated/80 px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                  SignalProof · {REPORT_LABELS.memoTitle}
                </p>
                <p className="mt-3 font-mono text-sm text-muted">{reportNumber}</p>
                <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  {view.companyTitle}
                </h1>
                <p className="mt-2 text-sm text-muted">{report.industryNiche}</p>
                {report.mainConcern ? (
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-muted line-clamp-4">
                    {report.mainConcern}
                  </p>
                ) : null}
                <p className="mt-6 max-w-2xl text-sm leading-7 text-muted/90">{REPORT_INTRO}</p>
                <dl className="mt-8 grid gap-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-subtle">
                      {REPORT_LABELS.preparedFor}
                    </dt>
                    <dd className="mt-1.5 text-white">{view.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-subtle">
                      {REPORT_LABELS.created}
                    </dt>
                    <dd className="mt-1.5 text-white">{formatDate(report.createdAt)}</dd>
                  </div>
                  {(report.scrapedUrl ?? report.socialProfileUrl)?.trim() ? (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wider text-subtle">
                        {REPORT_LABELS.website}
                      </dt>
                      <dd className="mt-1.5 break-all">
                        <a
                          className="text-accent underline-offset-2 hover:underline"
                          href={report.scrapedUrl ?? report.socialProfileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {report.scrapedUrl ?? report.socialProfileUrl}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                <VerdictBadge verdict={opportunityVerdict} />
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${confidenceStyles(confidence)}`}
                >
                  {REPORT_LABELS.confidence} · {confidence}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted">
                  {REPORT_LABELS.evidenceStrength} · {evidenceTierLabel(report.evidenceTier)}
                </span>
              </div>
            </div>
          </div>

          {weakEvidence ? (
            <div className="border-b border-warn/20 bg-warn/5 px-6 py-4 sm:px-10">
              <p className="text-sm leading-7 text-muted">{EVIDENCE_LIMITED_MESSAGE}</p>
            </div>
          ) : null}

          <section className="border-b border-white/[0.06] px-6 py-10 sm:px-10 sm:py-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
              {REPORT_LABELS.executiveSummary}
            </p>
            <div className="mt-8 grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center">
              <div className="flex justify-center lg:justify-start">
                <ScoreGauge score={report.validationScore} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-subtle">
                    {REPORT_LABELS.demand}
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
                    {REPORT_LABELS.competition}
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
            {view.showCompanyInsightRow ? (
              <section className="rounded-xl border border-accent/20 bg-accent/5 p-6 sm:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                  {REPORT_LABELS.companyInsight}
                </p>
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  <MemoCard label={REPORT_LABELS.nonObviousInsight} text={view.nonObviousInsight} />
                  <MemoCard label={REPORT_LABELS.strategicParadox} text={view.strategicParadox} />
                  <MemoCard
                    label={REPORT_LABELS.hiddenMoatWeakness}
                    text={view.hiddenMoatOrWeakness}
                  />
                </div>
              </section>
            ) : null}

            {view.showThesisGrid ? (
              <section className="rounded-xl border border-white/[0.08] bg-elevated/40 p-6 sm:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                  {REPORT_LABELS.investmentThesis}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {REPORT_SECTION_COPY.investmentThesisIntro}
                </p>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <MemoCard
                    label={REPORT_LABELS.bullCase}
                    text={view.bullCase}
                    variant="bull"
                  />
                  <MemoCard
                    label={REPORT_LABELS.bearCase}
                    text={view.bearCase}
                    variant="bear"
                  />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MemoCard label={REPORT_LABELS.moatDurability} text={view.moatDurability} />
                  <MemoCard label={REPORT_LABELS.replacementRisk} text={view.replacementRisk} />
                  <MemoCard label={REPORT_LABELS.gtmWeakness} text={view.gtmWeakness} />
                  <MemoCard label={REPORT_LABELS.whyNow} text={view.whyNow} />
                </div>
              </section>
            ) : null}

            {view.showCoreGrid ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {view.coreContradiction ? (
                  <SectionCard
                    span="half"
                    subtitle={REPORT_SECTION_COPY.coreContradictionSubtitle}
                    title={REPORT_LABELS.coreContradiction}
                  >
                    <p className="text-sm leading-7 text-muted sm:text-base">
                      {view.coreContradiction}
                    </p>
                  </SectionCard>
                ) : null}
                {view.strategicTension ? (
                  <SectionCard
                    span="half"
                    subtitle={REPORT_SECTION_COPY.strategicTensionSubtitle}
                    title={REPORT_LABELS.strategicTension}
                  >
                    <p className="text-sm leading-7 text-muted sm:text-base">
                      {view.strategicTension}
                    </p>
                  </SectionCard>
                ) : null}
                {view.hiddenRisk ? (
                  <SectionCard
                    span="half"
                    subtitle={REPORT_SECTION_COPY.hiddenRiskSubtitle}
                    title={REPORT_LABELS.hiddenRisk}
                  >
                    <p className="text-sm leading-7 text-muted sm:text-base">{view.hiddenRisk}</p>
                  </SectionCard>
                ) : null}
                {view.whyIncumbentsHaventWon ? (
                  <SectionCard
                    span="half"
                    subtitle={REPORT_SECTION_COPY.whyIncumbentsSubtitle}
                    title={REPORT_LABELS.whyIncumbents}
                  >
                    <p className="text-sm leading-7 text-muted sm:text-base">
                      {view.whyIncumbentsHaventWon}
                    </p>
                  </SectionCard>
                ) : null}
              </div>
            ) : null}

            {view.websiteEvidence.length > 0 ? (
              <SectionCard
                subtitle={REPORT_SECTION_COPY.evidenceSubtitle}
                title={REPORT_LABELS.evidenceSummary}
              >
                <ul className="space-y-3">
                  {view.websiteEvidence.map((item) => (
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

            {view.whatThisCompanyActuallyIs || view.moatAnalysis ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {view.whatThisCompanyActuallyIs ? (
                  <SectionCard
                    span="half"
                    subtitle={REPORT_SECTION_COPY.whatCompanyIsSubtitle}
                    title={REPORT_LABELS.whatCompanyIs}
                  >
                    <p className="text-sm leading-7 text-muted sm:text-base">
                      {view.whatThisCompanyActuallyIs}
                    </p>
                  </SectionCard>
                ) : null}
                {view.moatAnalysis ? (
                  <SectionCard
                    span="half"
                    subtitle={REPORT_SECTION_COPY.moatAnalysisSubtitle}
                    title={REPORT_LABELS.moatAnalysis}
                  >
                    <p className="text-sm leading-7 text-muted sm:text-base">{view.moatAnalysis}</p>
                  </SectionCard>
                ) : null}
              </div>
            ) : null}

            {view.marketAnalysis ? (
              <SectionCard
                subtitle={REPORT_SECTION_COPY.marketAnalysisSubtitle}
                title={REPORT_LABELS.marketAnalysis}
              >
                <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                  {view.marketAnalysis}
                </p>
              </SectionCard>
            ) : null}

            {view.competitionAnalysis ? (
              <SectionCard
                subtitle={REPORT_SECTION_COPY.competitionAnalysisSubtitle}
                title={REPORT_LABELS.competitionAnalysis}
              >
                <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                  {view.competitionAnalysis}
                </p>
              </SectionCard>
            ) : null}

            {view.opportunities.length > 0 ? (
              <SectionCard
                subtitle={REPORT_SECTION_COPY.opportunitiesSubtitle}
                title={REPORT_LABELS.opportunities}
              >
                <ul className="grid gap-3 sm:grid-cols-2">
                  {view.opportunities.map((item) => (
                    <li
                      className="rounded-lg border border-white/[0.06] bg-canvas/40 p-4 text-sm leading-7 text-muted"
                      key={item}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}

            {view.whyFail.length > 0 ? (
              <SectionCard
                subtitle={REPORT_SECTION_COPY.whyFailSubtitle}
                title={REPORT_LABELS.whyFail}
              >
                <ul className="space-y-3">
                  {view.whyFail.map((item, index) => (
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
            ) : null}

            {view.founderQuestions.length > 0 ? (
              <SectionCard
                subtitle={REPORT_SECTION_COPY.founderQuestionsSubtitle}
                title={REPORT_LABELS.founderQuestions}
              >
                <ul className="space-y-3">
                  {view.founderQuestions.map((item) => (
                    <li
                      className="border-l-2 border-accent/60 pl-4 text-sm leading-7 text-muted sm:text-base"
                      key={item}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}
          </div>

          {view.investmentVerdict ? (
            <section className="relative overflow-hidden border-t border-white/[0.06] bg-gradient-to-br from-accent/20 via-canvas to-canvas px-6 py-12 sm:px-10 sm:py-16 print-surface">
              <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-40" />
              <div className="relative">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
                  {REPORT_LABELS.investmentVerdict}
                </p>
                <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {verdictTitle}
                    </h2>
                    <p className="mt-5 text-sm leading-8 text-muted sm:text-base">
                      {view.investmentVerdict}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end">
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                      <span className="text-subtle">{REPORT_LABELS.confidence} </span>
                      <span className="font-semibold text-white">{confidence}</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm tabular-nums">
                      <span className="text-subtle">{REPORT_LABELS.score} </span>
                      <span className="font-semibold text-white">
                        {report.validationScore}/100
                      </span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                      <span className="text-subtle">{REPORT_LABELS.verdict} </span>
                      <span className="font-semibold text-white">{report.verdict}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <footer className="border-t border-white/[0.06] bg-elevated/50 px-6 py-6 sm:px-10">
            <p className="text-xs leading-5 text-subtle">
              {reportNumber} · {formatDate(report.createdAt)} · {REPORT_LABELS.footer}
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
