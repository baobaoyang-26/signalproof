type Level = "Low" | "Medium" | "High";

const styles: Record<Level, string> = {
  High: "border-success/30 bg-success/10 text-success",
  Medium: "border-accent/30 bg-accent/10 text-accent",
  Low: "border-white/10 bg-white/[0.04] text-muted",
};

export function LevelBadge({ level }: { level: Level }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${styles[level]}`}
    >
      {level}
    </span>
  );
}
