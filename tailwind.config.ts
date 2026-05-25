import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#09090b",
        surface: "#111113",
        elevated: "#18181b",
        border: "rgba(255, 255, 255, 0.08)",
        muted: "#a1a1aa",
        subtle: "#71717a",
        accent: "#3b82f6",
        "accent-dim": "#1d4ed8",
        success: "#22c55e",
        warn: "#eab308",
        danger: "#ef4444",
      },
      boxShadow: {
        glow: "0 0 80px -20px rgba(59, 130, 246, 0.35)",
        card: "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.25), transparent)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
