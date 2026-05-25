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
  /竞争激烈/,
  /市场很大/,
  /需求存在/,
  /巨大的市场/,
  /蓝海/,
  /红海/,
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
