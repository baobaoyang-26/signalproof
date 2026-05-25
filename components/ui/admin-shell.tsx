import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/order", label: "New order" },
  { href: "/", label: "Site" },
];

type AdminShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AdminShell({ title, description, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-canvas bg-grid">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-bold">
              S
            </span>
            <div>
              <p className="text-sm font-semibold">SignalProof</p>
              <p className="text-[10px] uppercase tracking-widest text-subtle">
                Partner dashboard
              </p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-muted sm:gap-6">
            {links.map((link) => (
              <Link className="transition hover:text-white" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Internal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-muted">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
