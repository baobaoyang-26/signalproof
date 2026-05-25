import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const ordersFile = path.join(dataDir, "orders.json");
const reportsFile = path.join(dataDir, "reports.json");

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickLevel(score) {
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function pickVerdict(score) {
  if (score >= 72) return "Go";
  if (score >= 48) return "Caution";
  return "No-Go";
}

function buildReport(order, reportId) {
  const seed = hashString(
    `${order.email}|${order.industryNiche}|${order.mainConcern}|${order.socialProfileUrl}`,
  );
  const validationScore = 38 + (seed % 54);
  const demandScore = 30 + ((seed >> 3) % 60);
  const competitionScore = 25 + ((seed >> 6) % 65);

  return {
    id: reportId,
    orderId: order.id,
    email: order.email,
    socialProfileUrl: order.socialProfileUrl,
    industryNiche: order.industryNiche,
    mainConcern: order.mainConcern,
    additionalNotes: order.additionalNotes ?? "",
    validationScore,
    demandLevel: pickLevel(demandScore),
    competitionLevel: pickLevel(competitionScore),
    opportunities: [
      `Founders in ${order.industryNiche} want faster validation before building.`,
      "Done-for-you briefs outperform generic AI idea generators in willingness to pay.",
      `Pain around "${order.mainConcern}" shows up in repeated public discussions.`,
    ],
    risks: [
      "Demand signals may over-index vocal early adopters.",
      "Competitors can add automated summaries and compress pricing.",
      `Urgency for "${order.mainConcern}" still needs payment proof.`,
    ],
    suggestedMvp: `A 24-hour validation brief for ${order.industryNiche} with one clear outcome tied to "${order.mainConcern}".`,
    verdict: pickVerdict(validationScore),
    marketAnalysis: `Mock analysis for ${order.industryNiche}: moderate signal strength around "${order.mainConcern}" with profile context from the submitted URL.`,
    recommendations: [
      "Run 8–12 targeted founder interviews.",
      "Test a pre-sell landing page before building product.",
      "Document three competitor gaps with user quotes.",
    ],
    createdAt: order.createdAt ?? new Date().toISOString(),
  };
}

await mkdir(dataDir, { recursive: true });

const orders = JSON.parse(await readFile(ordersFile, "utf8"));
let reports = [];
try {
  reports = JSON.parse(await readFile(reportsFile, "utf8"));
} catch {
  reports = [];
}

const reportIds = new Set(reports.map((report) => report.id));

for (const order of orders) {
  const reportId = order.reportId ?? randomUUID();
  order.reportId = reportId;

  if (!reportIds.has(reportId)) {
    reports.unshift(buildReport(order, reportId));
    reportIds.add(reportId);
  }
}

await writeFile(ordersFile, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
await writeFile(reportsFile, `${JSON.stringify(reports, null, 2)}\n`, "utf8");

console.log(`Seeded ${reports.length} report(s).`);
