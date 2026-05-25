import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  span?: "full" | "half";
};

export function SectionCard({
  title,
  subtitle,
  children,
  className = "",
  span = "full",
}: SectionCardProps) {
  return (
    <section
      className={`rounded-xl border border-white/[0.08] bg-surface/60 p-6 shadow-card backdrop-blur-sm sm:p-8 print-surface ${
        span === "half" ? "" : ""
      } ${className}`}
    >
      <div className="mb-6 border-b border-white/[0.06] pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
          Memo
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
