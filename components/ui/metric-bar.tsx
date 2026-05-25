type MetricBarProps = {
  label: string;
  value: number;
  hint?: string;
  color?: "accent" | "success" | "warn" | "danger";
};

const barColors = {
  accent: "bg-accent",
  success: "bg-success",
  warn: "bg-warn",
  danger: "bg-danger",
};

export function MetricBar({
  label,
  value,
  hint,
  color = "accent",
}: MetricBarProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white/90">{label}</span>
        <span className="font-mono text-sm tabular-nums text-muted">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all ${barColors[color]}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {hint ? <p className="mt-2 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}
