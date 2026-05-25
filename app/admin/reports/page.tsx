import Link from "next/link";
import { AdminShell } from "@/components/ui/admin-shell";
import { Card } from "@/components/ui/card";
import { MetricBar } from "@/components/ui/metric-bar";
import { VerdictBadge } from "@/components/report/verdict-badge";
import {
  formatReportNumber,
  getOpportunityVerdict,
} from "@/lib/report-display";
import { readReports } from "@/lib/reports";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function verdictColor(verdict: string): string {
  if (verdict === "Go") return "text-success";
  if (verdict === "Caution") return "text-warn";
  return "text-danger";
}

export default async function AdminReportsPage() {
  const reports = await readReports();
  const avgScore =
    reports.length > 0
      ? Math.round(
          reports.reduce((sum, r) => sum + r.validationScore, 0) / reports.length,
        )
      : 0;
  const goCount = reports.filter((r) => r.verdict === "Go").length;
  const cautionCount = reports.filter((r) => r.verdict === "Caution").length;
  const noGoCount = reports.filter((r) => r.verdict === "No-Go").length;
  const openAiCount = reports.filter((r) => r.source === "openai").length;

  const buckets = [
    { label: "72–100", min: 72, max: 100 },
    { label: "48–71", min: 48, max: 71 },
    { label: "0–47", min: 0, max: 47 },
  ].map((b) => ({
    ...b,
    count: reports.filter(
      (r) => r.validationScore >= b.min && r.validationScore <= b.max,
    ).length,
  }));
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <AdminShell
      description={`${reports.length} validation memo${reports.length === 1 ? "" : "s"} in data/reports.json — partner dashboard view.`}
      title="Validation reports"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-subtle">Total memos</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{reports.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-subtle">Avg score</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-accent">
            {avgScore || "—"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-subtle">Verdict mix</p>
          <p className="mt-2 text-sm text-muted">
            <span className="text-success">{goCount} Go</span>
            {" · "}
            <span className="text-warn">{cautionCount} Hold</span>
            {" · "}
            <span className="text-danger">{noGoCount} Pass</span>
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-subtle">AI source</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {openAiCount}
            <span className="text-lg text-muted">/{reports.length}</span>
          </p>
        </Card>
      </div>

      {reports.length > 0 ? (
        <Card className="mt-8 p-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
            Score distribution
          </p>
          <div className="mt-6 space-y-4">
            {buckets.map((b) => (
              <div key={b.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted">{b.label}</span>
                  <span className="tabular-nums text-subtle">{b.count}</span>
                </div>
                <MetricBar
                  label=""
                  value={Math.round((b.count / maxBucket) * 100)}
                />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {reports.length === 0 ? (
        <Card className="mt-10 p-10 text-center">
          <p className="text-muted">No reports generated yet.</p>
          <Link
            className="mt-6 inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-canvas hover:bg-white/90"
            href="/order"
          >
            Submit a test order
          </Link>
        </Card>
      ) : (
        <>
          <div className="mt-10 grid gap-4 md:hidden">
            {reports.map((report) => {
              const opportunity = getOpportunityVerdict(report.validationScore);
              return (
                <Card className="p-5" key={report.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-subtle">
                        {formatReportNumber(report.id)}
                      </p>
                      <p className="mt-2 font-medium">{report.email}</p>
                      <p className="mt-1 text-sm text-muted line-clamp-2">
                        {report.industryNiche}
                      </p>
                    </div>
                    <span className="text-2xl font-semibold tabular-nums text-accent">
                      {report.validationScore}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <VerdictBadge verdict={opportunity} />
                    <span className={`text-xs font-medium ${verdictColor(report.verdict)}`}>
                      {report.verdict}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-subtle">{formatDate(report.createdAt)}</p>
                  <Link
                    className="mt-4 inline-flex text-sm font-medium text-accent hover:underline"
                    href={`/report/${report.id}`}
                  >
                    Open report →
                  </Link>
                </Card>
              );
            })}
          </div>

          <Card className="mt-10 hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-5 py-4 font-medium text-subtle">Report</th>
                    <th className="px-5 py-4 font-medium text-subtle">Founder</th>
                    <th className="px-5 py-4 font-medium text-subtle">Niche</th>
                    <th className="px-5 py-4 font-medium text-subtle">Score</th>
                    <th className="px-5 py-4 font-medium text-subtle">Signal</th>
                    <th className="px-5 py-4 font-medium text-subtle">Verdict</th>
                    <th className="px-5 py-4 font-medium text-subtle">Created</th>
                    <th className="px-5 py-4 font-medium text-subtle" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {reports.map((report) => {
                    const opportunity = getOpportunityVerdict(report.validationScore);
                    return (
                      <tr className="align-middle transition hover:bg-white/[0.02]" key={report.id}>
                        <td className="px-5 py-4 font-mono text-xs text-muted">
                          {formatReportNumber(report.id)}
                        </td>
                        <td className="px-5 py-4 font-medium">{report.email}</td>
                        <td className="max-w-[14rem] px-5 py-4 text-muted truncate">
                          {report.industryNiche}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex min-w-[3rem] justify-center rounded-lg border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-semibold tabular-nums text-accent">
                            {report.validationScore}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <VerdictBadge verdict={opportunity} />
                        </td>
                        <td className={`px-5 py-4 font-medium ${verdictColor(report.verdict)}`}>
                          {report.verdict}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-muted">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            className="font-medium text-accent hover:underline"
                            href={`/report/${report.id}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </AdminShell>
  );
}
