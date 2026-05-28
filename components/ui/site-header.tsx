import Link from "next/link";
import { PRIMARY_CTA } from "@/lib/site-copy";

type NavItem = { href: string; label: string };

type SiteHeaderProps = {
  nav?: NavItem[];
  cta?: { href: string; label: string };
  variant?: "marketing" | "app";
};

export function SiteHeader({
  nav = [],
  cta = { href: "/order", label: PRIMARY_CTA },
  variant = "marketing",
}: SiteHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/[0.06] bg-canvas/80 backdrop-blur-xl no-print ${
        variant === "app" ? "" : ""
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-bold text-white">
            S
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">
            SignalProof
          </span>
        </Link>
        {nav.length > 0 ? (
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            {nav.map((item) => (
              <a
                className="transition hover:text-white"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
        <Link
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-canvas transition hover:bg-white/90"
          href={cta.href}
        >
          {cta.label}
        </Link>
      </div>
    </header>
  );
}
