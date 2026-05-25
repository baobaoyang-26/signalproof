import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  glow?: boolean;
};

export function Card({ children, className = "", glow = false }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-surface/80 shadow-card backdrop-blur-sm ${
        glow ? "shadow-glow" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
