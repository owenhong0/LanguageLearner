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
  language?: string;
  langId?: string;
  items: GeneratedItem[];
}

export interface GenerateParams {
  type: GenerateType;
  /** Target language id ("cmn" | "yue" | "jpn"). */
  langId: string;
  /** Human language name the prompt hard-constrains to ("Mandarin" / "Cantonese" / "Japanese"). */
  language: string;
  deck: string;
  difficulty: string;
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

/**
 * Ask the server to generate vocab / sentence / reading content via Anthropic,
 * constrained to the given target language. The language + difficulty come from
 * the app's single source of truth (the GenerationProvider).
 */
export async function generateContent(params: GenerateParams): Promise<GenerateResult> {
  const { type, langId, language, deck, difficulty } = params;
  const res = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type, langId, language, deck, difficulty }),
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
