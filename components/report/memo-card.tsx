import { Card } from "@/components/ui/card";

type MemoCardProps = {
  label: string;
  text: string | null;
  variant?: "default" | "bull" | "bear";
  className?: string;
};

export function MemoCard({ label, text, variant = "default", className = "" }: MemoCardProps) {
  if (!text) return null;

  const border =
    variant === "bull"
      ? "border-success/20 bg-success/5"
      : variant === "bear"
        ? "border-danger/20 bg-danger/5"
        : "border-white/[0.08] bg-surface/40";

  const labelColor =
    variant === "bull" ? "text-success" : variant === "bear" ? "text-danger" : "text-subtle";

  return (
    <Card className={`p-4 sm:p-5 ${border} ${className}`}>
      <p className={`text-xs font-medium uppercase tracking-wider ${labelColor}`}>{label}</p>
      <p className="report-prose mt-3 text-sm leading-7 text-muted sm:text-base">{text}</p>
    </Card>
  );
}
