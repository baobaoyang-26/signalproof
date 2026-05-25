"use client";

import { useCallback, useState } from "react";

type ReportShareBarProps = {
  reportUrl: string;
  reportNumber: string;
};

export function ReportShareBar({ reportUrl, reportNumber }: ReportShareBarProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [reportUrl]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
          Shareable report
        </p>
        <p className="mt-1 font-mono text-xs text-muted truncate">{reportNumber}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white transition hover:border-white/20"
          onClick={() => window.print()}
          type="button"
        >
          Export PDF
        </button>
        <button
          className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-canvas transition hover:bg-white/90"
          onClick={copyLink}
          type="button"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
