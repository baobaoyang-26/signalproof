type ScoreGaugeProps = {
  score: number;
  size?: "md" | "lg";
};

function scoreColor(score: number): string {
  if (score >= 72) return "#22c55e";
  if (score >= 48) return "#3b82f6";
  return "#71717a";
}

export function ScoreGauge({ score, size = "lg" }: ScoreGaugeProps) {
  const radius = size === "lg" ? 58 : 44;
  const stroke = size === "lg" ? 8 : 6;
  const dimension = size === "lg" ? 160 : 120;
  const center = dimension / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: `${color}22` }}
      />
      <svg
        aria-hidden
        className={size === "lg" ? "h-40 w-40" : "h-[120px] w-[120px]"}
        viewBox={`0 0 ${dimension} ${dimension}`}
      >
        <circle
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={stroke}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={
            size === "lg"
              ? "text-5xl font-semibold tabular-nums tracking-tight text-white"
              : "text-3xl font-semibold tabular-nums text-white"
          }
        >
          {score}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-subtle">
          Score
        </span>
      </div>
    </div>
  );
}
