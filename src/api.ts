import { API_BASE_URL } from "./config";

/** Backend client for the Moshui Render server (/server). */

export type CardStatus = "known" | "learning" | "new";
export type GenerateType = "vocab" | "sentence" | "reading";

export interface ProgressSummary {
  /** Per-deck counts: { "Greetings": { known, learning, new } }. */
  decks: Record<string, Record<CardStatus, number>>;
  totals: Record<CardStatus, number>;
  cards: number;
}

export interface GeneratedItem {
  glyph: string;
  roman: string;
  gloss: string;
}

export interface GenerateResult {
  type: GenerateType;
  deck: string;
  difficulty: string;
  items: GeneratedItem[];
}

/** Record one card's state on the server. Best-effort; callers may ignore failures. */
export async function postProgress(deck: string, card: string, status: CardStatus): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/progress`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ deck, card, status }),
  });
  if (!res.ok) throw new Error(`Progress update failed (${res.status})`);
}

/** Fetch the aggregated progress summary (counts per status per deck). */
export async function fetchProgress(): Promise<ProgressSummary> {
  const res = await fetch(`${API_BASE_URL}/progress`);
  if (!res.ok) throw new Error(`Could not reach the server (${res.status})`);
  return res.json();
}

/** Ask the server to generate vocab / sentence / reading content via Anthropic. */
export async function generateContent(
  type: GenerateType,
  deck: string,
  difficulty: string,
): Promise<GenerateResult> {
  const res = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type, deck, difficulty }),
  });
  if (!res.ok) {
    let msg = `Generation failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(msg);
  }
  return res.json();
}
