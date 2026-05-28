/**
 * All public-facing marketing & checkout copy (English only).
 * Pricing: $29 equivalent positioning; LemonSqueezy bills ¥199 CNY at checkout.
 */

export const SITE_NAME = "SignalProof";

export const PRIMARY_CTA = "Generate Startup Intelligence";

export const PRICING = {
  singleMemo: {
    displayPrice: "$29 equivalent",
    billingNote: "Billed as ¥199 CNY at checkout",
  },
  checkoutPaymentNotice:
    "You will be redirected to secure checkout. Payment is processed in CNY due to merchant account settings.",
} as const;

export const HERO = {
  eyebrow: "Explainable Startup Intelligence",
  title: "AI gives answers.",
  titleAccent: "We upgrade your startup thinking.",
  subtitle:
    "Learn why startups survive, fail, scale, or collapse through explainable market reasoning.",
  secondaryCta: "See how founders learn",
  closingLine: "AI gives answers. We upgrade your startup thinking.",
} as const;

export const LANDING = {
  metrics: [
    { value: "12k+", label: "Reasoning passes run" },
    { value: "180+", label: "Founder intelligence delivered" },
    { value: "24h", label: "Delivery SLA" },
  ],
  insights: {
    eyebrow: "Founder judgment",
    title: "What explainable startup intelligence looks like",
    subtitle:
      "Each read teaches survivability—why investors care, what founders miss, and how incumbents kill wedges. Not generic summaries.",
    sampleTag: "Sample reasoning line · SignalProof",
    companiesEyebrow: "Reasoned across",
    companiesSubtitle:
      "Judgment built from ideas, reference links, and public surfaces—when they exist.",
  },
  product: {
    eyebrow: "Intelligence preview",
    title: "Built like a VC reasoning system",
    subtitle:
      "Survivability thesis, replacement chains, workflow risk, and scenario read—in one shareable intelligence memo.",
    previewTag: "SP-STARTUP-INTELLIGENCE",
    verdictBadge: "Survivability read",
    previewFooter:
      "Workflow integration, replacement risk, distribution moat, pricing durability, and bull/bear scenarios—with the why behind each.",
  },
  process: {
    eyebrow: "How it works",
    title: "From idea to judgment",
    steps: [
      {
        step: "01",
        title: "Describe your startup",
        body: "Email plus your idea, market observation, or rough notes. Optional reference link—no website required.",
      },
      {
        step: "02",
        title: "Explainable reasoning pass",
        body: "We explain survivability through moat, GTM weakness, OpenAI threat, market saturation, and switching resistance.",
      },
      {
        step: "03",
        title: "Intelligence delivered",
        body: "Founder questions, historical patterns, and bull/bear scenarios you can use to think like a partner.",
      },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Available now: Startup Intelligence",
    subtitle:
      "One idea, one explainable survivability analysis. $29 equivalent—billed as ¥199 CNY at checkout. Judgment systems for founders, not generic output.",
    includesLabel: "You learn:",
    availableNow: "Available now",
    singleMemo: {
      planId: "single_memo" as const,
      name: "Startup Intelligence",
      tagline: "One explainable startup intelligence memo for your idea.",
      description:
        "Structured reasoning on why your startup survives or dies—workflow risk, replacement chains, pricing durability, and founder diligence questions.",
      outcomes: [
        "Why investors care (per dimension)",
        "Replacement & workflow integration risk",
        "OpenAI / incumbent platform threat",
        "Distribution vs. product moat",
        "GTM weakness & market saturation",
        "Bull vs. bear survivability scenarios",
      ],
    },
    advanced: {
      name: "Advanced Competitive Intelligence",
      badge: "Coming Soon",
      description:
        "Multi-startup comparison for funds stress-testing a shortlist with shared reasoning frameworks.",
      outcomes: [
        "Multi-startup comparison",
        "Market evolution scenarios",
        "Replacement chain analysis",
        "Workflow overlap mapping",
        "Competitive positioning shifts",
      ],
      cta: "Coming Soon",
    },
  },
  nav: [
    { href: "#product", label: "Product" },
    { href: "#insights", label: "Insights" },
    { href: "#process", label: "Process" },
    { href: "#pricing", label: "Pricing" },
  ],
} as const;

export const SAMPLE_INSIGHTS = [
  {
    company: "Midjourney",
    accent: "from-violet-500/20 to-fuchsia-500/10",
    lines: [
      "Midjourney's biggest risk is not image quality.",
      "It is distribution collapse when incumbents own the workflow.",
    ],
  },
  {
    company: "Cursor",
    accent: "from-blue-500/20 to-cyan-500/10",
    lines: [
      "Cursor's moat is not code generation.",
      "It is workflow ownership inside the IDE—where switching costs compound.",
    ],
  },
  {
    company: "Perplexity",
    accent: "from-amber-500/20 to-orange-500/10",
    lines: [
      "Perplexity is not competing with Google Search.",
      "It is competing for the AI answer layer—and distribution determines the margin.",
    ],
  },
] as const;

export const ANALYZED_COMPANIES = [
  "Cursor",
  "Midjourney",
  "Perplexity",
  "Runway",
  "Lovable",
  "Harvey",
  "ElevenLabs",
] as const;

export const PREVIEW_SCORES = [
  { label: "Survivability", value: 74 },
  { label: "Demand", value: 68 },
  { label: "Saturation", value: 52 },
] as const;

export const ORDER_PAGE = {
  eyebrow: "Explainable Startup Intelligence",
  title: "Generate Startup Intelligence",
  subtitle:
    "Two required fields. No website required—an idea, market insight, or rough notes are enough. Checkout first. Your intelligence memo will be generated after payment.",
  formHint: "Submit when email and idea are filled. Reference link is optional.",
  payOnlyLink: "Proceed to secure checkout",
  labels: {
    email: "Email",
    startupIdea: "Describe your startup idea",
    referenceLink: "Website or reference link",
  },
  placeholders: {
    email: "founder@company.com",
    startupIdea:
      "Paste your startup idea, market observation, business concept, or rough notes.",
    referenceLink: "Optional website, product, competitor, or reference",
  },
  submitPending: "Redirecting to secure checkout…",
  orderSingleMemoCta: "Generate Startup Intelligence",
} as const;

export const SUCCESS_PAGE = {
  paymentReceived: "Payment received",
  generatingTitle: "Building your startup intelligence",
  generatingBody:
    "We are running explainable market reasoning—survivability, replacement risk, and founder judgment. This usually takes one to three minutes. Please keep this tab open.",
  errorEyebrow: "Something went wrong",
  errorTitle: "Intelligence generation failed",
  tryAgain: "Try again",
  redirecting: "Redirecting to your intelligence memo…",
  missingOrder: "No pending order found.",
} as const;

export const FOOTER_TAGLINE =
  "Explainable Startup Intelligence — judgment systems for founders";

export const METADATA = {
  title: "SignalProof — Explainable Startup Intelligence",
  description:
    "AI gives answers. We upgrade your startup thinking. Learn why startups survive, fail, scale, or collapse through explainable market reasoning.",
  ogTitle: "SignalProof — Explainable Startup Intelligence",
  ogDescription:
    "Founder-native survivability reasoning: workflow risk, replacement chains, pricing durability, and VC-style judgment—not generic AI output.",
} as const;
