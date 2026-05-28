import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createOrderWithReport } from "../lib/orders";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  try {
    const raw = readFileSync(path.join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn("[SignalProof] No .env.local loaded — ensure OPENAI_API_KEY is set");
  }
}

loadEnvLocal();

const email = process.argv[2];
const urlOrIdea = process.argv[3];

if (!email?.includes("@")) {
  console.error(
    "Usage: npx tsx scripts/regenerate-report.ts <email> [optional-url-or-extra-context]",
  );
  process.exit(1);
}

async function main() {
  const isUrl = urlOrIdea?.startsWith("http");
  const { reportId, order } = await createOrderWithReport({
    email,
    startupIdea: isUrl
      ? "AI creative tools startup — distribution and model commoditization risk."
      : (urlOrIdea ??
        "A founder tool that turns rough startup ideas into institutional-grade survivability memos."),
    additionalContext: isUrl ? urlOrIdea! : "",
  });

  console.info("[SignalProof] Report regenerated");
  console.info("  email:", order.email);
  console.info("  reportId:", reportId);
  console.info("  open: http://localhost:3000/report/" + reportId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
