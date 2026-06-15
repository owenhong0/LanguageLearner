import type { ChatLine, LangContent } from "./types";

/**
 * Live tutor client (T1). When `VITE_TUTOR_PROXY_URL` is set, the Converse tutor
 * POSTs the conversation to that proxy, which calls Anthropic server-side (the
 * API key lives only on the proxy) and returns a `{ native, roman, en, feedback }`
 * reply. When it's unset — or any request fails — Converse falls back to its
 * built-in scripted exchange, so the feature is never a dead end and no key is
 * ever needed in the frontend.
 */

// Read at call time so the value reflects the current env (and is stubbable in tests).
const proxyUrl = (): string | undefined => import.meta.env.VITE_TUTOR_PROXY_URL;

export const isLiveTutorConfigured = (): boolean => !!proxyUrl();

export interface TutorTurn {
  role: "tutor" | "learner";
  text: string;
}

interface TutorReply {
  native: string;
  roman: string;
  en: string;
  feedback?: string;
}

function isTutorReply(v: unknown): v is TutorReply {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return typeof r.native === "string" && typeof r.roman === "string" && typeof r.en === "string";
}

/**
 * Ask the live tutor for a reply. Returns a ChatLine on success, or null when no
 * proxy is configured, the request fails, or the response isn't the expected
 * shape — callers treat null as "fall back to the scripted reply".
 */
export async function askTutor(
  c: LangContent,
  scenario: string,
  history: TutorTurn[],
): Promise<ChatLine | null> {
  const url = proxyUrl();
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        langId: c.id,
        language: c.name,
        romanSystem: c.romanSystem,
        scenario,
        messages: history,
      }),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!isTutorReply(data)) return null;
    return { glyph: data.native, roman: data.roman, translation: data.en, feedback: data.feedback };
  } catch {
    // Network error / invalid JSON / unreachable proxy — fall back to scripted.
    return null;
  }
}
