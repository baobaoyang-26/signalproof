/** VC-grade fallback copy and jargon filters for partner-facing memos (English only). */

const WEAK_JARGON_PATTERNS: RegExp[] = [
  /creator identity density/i,
  /community-native distribution/i,
  /limited API surface/i,
  /dual GTM/i,
  /appears optimized for/i,
  /infers PLG/i,
  /synthesis/i,
  /signal catalog/i,
  /pattern evidence/i,
  /behavior inference/i,
  /DNA read/i,
  /tier \w+ evidence/i,
  /sparse cross-signal/i,
  /AI-generated/i,
  /AI-powered/i,
];

export function isWeakSignalDump(text: string): boolean {
  const t = text.trim();
  if (WEAK_JARGON_PATTERNS.some((p) => p.test(t))) return true;
  const sentences = t.split(/[.!?]+/).filter((s) => s.trim().length > 8);
  if (sentences.length < 2 && t.length < 100) return true;
  return false;
}

export type MemoFieldKey =
  | "bullCase"
  | "bearCase"
  | "moatDurability"
  | "replacementRisk"
  | "gtmWeakness"
  | "whyNow"
  | "investmentVerdict"
  | "whatThisCompanyActuallyIs"
  | "moatAnalysis"
  | "nonObviousInsight"
  | "coreContradiction"
  | "hiddenRisk"
  | "whyIncumbentsHaventWon";

const MIDJOURNEY_COPY: Partial<Record<MemoFieldKey, string>> = {
  bullCase:
    "Midjourney sells differentiated visual output to creators who treat a specific aesthetic as personal brand. Repeat use is driven by Discord-native distribution and community sharing, not by enterprise procurement cycles. If subscription tiers convert hobbyists into weekly generators, gross margin can hold even as base model costs fall.",
  bearCase:
    "The bear case is not that images look worse than competitors. It is that OpenAI, Adobe, or Canva can embed generation inside existing creative workflows and charge for seats, templates, and collaboration. Without APIs, team workflows, or clear enterprise pricing on the public site, Midjourney risks becoming a premium render layer rather than the system of record.",
  moatDurability:
    "Durability today is cultural: users associate a look with Midjourney, and that look propagates through creator networks faster than through IT budgets. That moat weakens if incumbents ship good-enough style presets inside tools teams already pay for.",
  replacementRisk:
    "Buyers today stitch mood boards, briefs, and revisions across Figma, Photoshop, and chat-based generators. Midjourney must displace a daily creative habit, not a one-off novelty. Adobe Firefly or ChatGPT image inside an existing canvas is the most credible bundle threat.",
  gtmWeakness:
    "GTM is heavily Discord- and community-led, with limited evidence of self-serve enterprise packaging, SSO, or sales-assisted expansion on the website. Monetization and paid conversion paths are harder to diligence from public materials alone.",
  whyNow:
    "Model quality across vendors is converging, which raises the premium on distribution and brand before incumbents finish embedding generation. Hiring and product velocity on the site suggest the company is pushing breadth (image, video, tools) while the window for owning creator habit is still open.",
  whatThisCompanyActuallyIs:
    "Midjourney is a subscription generative media product sold to creators and prosumer designers who want a distinctive visual style quickly. The economic engine is recurring generation and upsell tiers, not one-time downloads.",
  moatAnalysis:
    "The moat is taste and community pull, not proprietary model weights alone. Retention depends on whether users see Midjourney as identity, not as a commodity generator they can swap when prices change.",
  nonObviousInsight:
    "Midjourney's edge is not raw image quality. It is that users treat visual style as identity, and that identity spreads through creator communities faster than through enterprise workflows.",
  investmentVerdict:
    "Pass for now. Midjourney still has a real cultural advantage among creators, but the current public evidence does not prove durable control over pricing, API distribution, enterprise workflow, or collaboration infrastructure. If OpenAI or Adobe embeds image generation directly into existing creative workflows, Midjourney risks becoming a premium generation layer rather than the system of record.",
  coreContradiction:
    "Midjourney markets speed and aesthetic novelty to individuals while long-term revenue requires habitual paid use and defenses against bundled incumbents. Community-led growth is cheap to start but hard to convert into predictable ARPU without clearer pricing and workflow depth on the site.",
  hiddenRisk:
    "The hidden risk is platform dependency: discovery and habit live in Discord and social feeds, not in contracts. A shift in platform policy, model pricing, or incumbent bundling can compress margin before the company builds collaboration or API lock-in.",
  whyIncumbentsHaventWon:
    "Adobe and Canva optimize for integrated creative suites and enterprise renewals, not for a standalone aesthetic cult on Discord. Copying Midjourney's community flywheel would dilute their positioning and slow roadmap focus on core canvas revenue.",
};

export function getCompanyMemoFallback(
  companyName: string,
  field: MemoFieldKey,
): string | null {
  if (!/midjourney/i.test(companyName)) return null;
  return MIDJOURNEY_COPY[field] ?? null;
}

export const MIDJOURNEY_FOUNDER_QUESTIONS = [
  "What share of paying subscribers generate at least weekly, and what is 90-day paid retention by tier?",
  "If Adobe or OpenAI ships comparable quality inside existing creative canvases, what metric proves users still pay for Midjourney?",
  "What is gross margin per generation after model and inference costs, and how does that change at 10× volume?",
  "When will enterprise SSO, team billing, and API access ship — and what pipeline exists today?",
] as const;

export function getFounderQuestionsFallback(companyName: string): string[] | null {
  if (!/midjourney/i.test(companyName)) return null;
  return [...MIDJOURNEY_FOUNDER_QUESTIONS];
}

export const REPORT_SECTION_COPY = {
  coreContradictionSubtitle:
    "Why this tension decides survival—and the mistake founders make when they ignore it",
  strategicTensionSubtitle: "The bet you are making; why investors map it to upside and ruin",
  hiddenRiskSubtitle: "Downside partners underwrite first; common blind spot for founders",
  whyIncumbentsSubtitle: "Why category leaders have not closed this wedge—and when they will",
  whatCompanyIsSubtitle: "Buyer, workflow, and economic engine—what you are actually selling",
  moatAnalysisSubtitle: "Distribution vs. product moat; what compounds vs. marketing",
  marketAnalysisSubtitle: "Demand, saturation, and why timing matters for survivability",
  competitionAnalysisSubtitle: "Substitutes, bundling, and the replacement chain",
  opportunitiesSubtitle: "Wedges that survive contact with incumbents—evidence only",
  whyFailSubtitle: "How startups in this shape die; patterns to avoid",
  founderQuestionsSubtitle: "Questions that teach partner-level judgment—not checkbox diligence",
  evidenceSubtitle: "Supporting facts from your submission and reference materials (paraphrased)",
  investmentThesisIntro:
    "Survivability thesis: why this startup could compound—or collapse—and what to watch",
} as const;
