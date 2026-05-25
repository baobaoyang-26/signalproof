import type { OpportunityVerdict } from "@/lib/report-display";

const styles: Record<OpportunityVerdict, string> = {
  "Strong Opportunity": "border-success/40 bg-success/15 text-success",
  "Moderate Potential": "border-accent/40 bg-accent/15 text-accent",
  "High Risk": "border-danger/30 bg-danger/10 text-danger",
};

export function VerdictBadge({ verdict }: { verdict: OpportunityVerdict }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold tracking-tight ${styles[verdict]}`}
    >
      {verdict}
    </span>
  );
}
