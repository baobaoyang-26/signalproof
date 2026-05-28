/** Phrases that indicate generic consultant copy — not company-specific memos. */
export const BANNED_GENERIC_PHRASES = [
  /competitive\s+landscape\s+is\s+(crowded|intense)/i,
  /market\s+is\s+(large|huge|massive|enormous)/i,
  /demand\s+(exists|is\s+strong|is\s+present)/i,
  /huge\s+market\s+opportunity/i,
  /leverage\s+ai/i,
  /game[- ]?changer/i,
  /disruptive/i,
  /it\s+is\s+important\s+to\s+note/i,
  /in\s+conclusion/i,
  /delve\s+into/i,
  /validate\s+your\s+idea/i,
  /talk\s+to\s+users/i,
  /build\s+an?\s+mvp/i,
  /customer\s+discovery/i,
  /iterate\s+quickly/i,
  /passionate\s+team/i,
  /defensibility\s+appears\s+thin/i,
  /no\s+durable\s+moat\s+is\s+visible/i,
  /distribution\s+likely\s+depends\s+on\s+founder[- ]led/i,
  /competitive\s+landscape/i,
  /strategic\s+landscape/i,
  /category\s+economics/i,
  /structural\s+tension/i,
  /validate\s+with\s+(?:paid\s+)?pilots/i,
  /landscape\s+is\s+crowded/i,
  /platform\s+play/i,
  /best[- ]in[- ]class/i,
  /cutting[- ]edge/i,
  /holistic\s+approach/i,
  /synerg(?:y|ies)/i,
  /robust\s+solution/i,
  /seamless(?:ly)?/i,
  /empower(?:s|ing)?/i,
  /unlock(?:s|ing)?\s+value/i,
  /end[- ]to[- ]end\s+solution/i,
  /transformative/i,
  /revolutionary/i,
  /revolutioniz/i,
  /unlock(?:s|ing)?\s+value/i,
  /\becosystem\b/i,
  /validate\s+with\s+users/i,
  /strong\s+potential/i,
  /ai[- ]powered\s+solution/i,
  /seamless\s+experience/i,
  /leveraging\s+ai/i,
  /market\s+is\s+growing/i,
  /competitive\s+market/i,
  /creator\s+identity\s+density/i,
  /community-native\s+distribution/i,
  /limited\s+API\s+surface/i,
  /dual\s+GTM/i,
  /appears\s+optimized\s+for/i,
];

export function containsBannedGenericPhrase(text: string): boolean {
  return BANNED_GENERIC_PHRASES.some((pattern) => pattern.test(text));
}

export function scrubGenericPhrases(text: string): string {
  let out = text;
  for (const pattern of BANNED_GENERIC_PHRASES) {
    out = out.replace(pattern, "").trim();
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

export function isLikelyGenericMemo(fields: string[]): boolean {
  const joined = fields.join(" ");
  const hits = BANNED_GENERIC_PHRASES.filter((p) => p.test(joined)).length;
  return hits >= 2;
}
