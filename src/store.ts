/**
 * localStorage-backed persistence for learner progress (T2).
 *
 * Versioned under `moshui.v1` so the shape can evolve without colliding with
 * older data. Nothing sensitive is stored — only which characters you've marked
 * known and your quiz tally. All reads are validated, so first-visit (no data)
 * and corrupt/garbage JSON both fall back to empty progress rather than throwing.
 */

const STORAGE_KEY = "moshui.v1";

export interface Progress {
  /** Home review-deck "known" keys, namespaced "lang:cardId". */
  known: string[];
  /** Vocabulary "known" keys, namespaced "lang:itemId". */
  vocabKnown: string[];
  /** Extra practice minutes earned this session (the "+ Practice 5 min" button). */
  bonus: number;
  /** Quiz tally feeding the Progress accuracy ring. */
  practice: { answered: number; correct: number };
}

const EMPTY: Progress = { known: [], vocabKnown: [], bonus: 0, practice: { answered: 0, correct: 0 } };

function emptyProgress(): Progress {
  return { known: [], vocabKnown: [], bonus: 0, practice: { answered: 0, correct: 0 } };
}

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    // Accessing localStorage can throw (e.g. sandboxed iframes, disabled storage).
    return false;
  }
}

// --- validation: coerce anything off disk into a safe, well-typed Progress ---

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function nonNegInt(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
}

function normalize(v: unknown): Progress {
  const o = (v ?? {}) as Record<string, unknown>;
  const p = (o.practice ?? {}) as Record<string, unknown>;
  const answered = nonNegInt(p.answered);
  // `correct` can never exceed `answered`.
  const correct = Math.min(answered, nonNegInt(p.correct));
  return {
    known: strArray(o.known),
    vocabKnown: strArray(o.vocabKnown),
    bonus: nonNegInt(o.bonus),
    practice: { answered, correct },
  };
}

/** Read + validate persisted progress. Returns empty progress on first visit or corrupt data. */
export function loadProgress(): Progress {
  if (!hasStorage()) return emptyProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    return normalize(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

/** Persist progress. Failures (private mode, quota, disabled storage) are swallowed. */
export function saveProgress(p: Progress): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* quota exceeded or storage disabled — non-fatal */
  }
}

/** Remove all persisted progress. */
export function clearProgress(): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export { EMPTY as EMPTY_PROGRESS };
