import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LangContent, LangId, RomanPref } from "./types";
import { CONTENT } from "./content";
import { generateContent, type GenerateType, type GeneratedItem } from "./api";

/** Sections that can generate content on demand. */
export type GenSection =
  | "vocab"
  | "converse"
  | "reading"
  | "practice"
  | "progress"
  | "build-structure"
  | "build-verbs"
  | "build-phrases"
  | "build-builder";

interface SectionStatus {
  busy: boolean;
  error: string | null;
}

interface GenerationValue {
  lang: LangId;
  c: LangContent;
  romanPref: RomanPref;
  /** Shared difficulty — single source of truth, passed on every generate call. */
  difficulty: string;
  setDifficulty: (d: string) => void;
  /** Generated items for a section in the *current* language. */
  itemsFor: (section: GenSection) => GeneratedItem[];
  statusFor: (section: GenSection) => SectionStatus;
  /** Run a generation for a section + type; language + difficulty come from here.
   *  Optional `vocab` (known/learning words) is prioritized by the model. */
  generate: (section: GenSection, type: GenerateType, deck: string, vocab?: string[]) => Promise<void>;
  clear: (section: GenSection) => void;
  /** Generated-card "known" state (separate from real-content progress). */
  isKnown: (cardKey: string) => boolean;
  toggleKnown: (cardKey: string) => void;
}

const Ctx = createContext<GenerationValue | null>(null);

const STORAGE_KEY = "moshui.gen.v1";

// NOTE: this is client-side (localStorage) persistence — it survives reloads on
// this device only. The backend store is in-memory and resets on Render restart.
// For true cross-device/permanent persistence, this is where a database would
// hook in (e.g. Render Postgres): replace the localStorage read/write below with
// fetches to a `/generated` API backed by the DB, keyed by user + section + lang.
interface Persisted {
  difficulty: string;
  results: Record<string, GeneratedItem[]>; // key: `${section}:${langId}`
  known: string[];
}

function load(): Persisted {
  const empty: Persisted = { difficulty: "beginner", results: {}, known: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const p = JSON.parse(raw) as Partial<Persisted>;
    return {
      difficulty: typeof p.difficulty === "string" ? p.difficulty : "beginner",
      results: p.results && typeof p.results === "object" ? (p.results as Persisted["results"]) : {},
      known: Array.isArray(p.known) ? p.known.filter((k): k is string => typeof k === "string") : [],
    };
  } catch {
    return empty;
  }
}

export function GenerationProvider({
  lang,
  romanPref,
  children,
}: {
  lang: LangId;
  romanPref: RomanPref;
  children: ReactNode;
}) {
  const initial = useMemo(load, []);
  const [difficulty, setDifficulty] = useState(initial.difficulty);
  const [results, setResults] = useState<Record<string, GeneratedItem[]>>(initial.results);
  const [known, setKnown] = useState<Set<string>>(() => new Set(initial.known));
  const [status, setStatus] = useState<Record<string, SectionStatus>>({});

  // Persist (client-side) whenever the durable slices change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ difficulty, results, known: [...known] }));
    } catch {
      /* storage full / disabled — non-fatal */
    }
  }, [difficulty, results, known]);

  const c = CONTENT[lang];
  const resultKey = (section: GenSection, langId: LangId) => `${section}:${langId}`;

  const generate = useCallback(
    async (section: GenSection, type: GenerateType, deck: string, vocab?: string[]) => {
      const target = CONTENT[lang]; // read current language at call time (source of truth)
      setStatus((s) => ({ ...s, [section]: { busy: true, error: null } }));
      try {
        const res = await generateContent({
          type,
          langId: target.id,
          language: target.name,
          deck,
          difficulty,
          vocab,
        });
        setResults((r) => ({ ...r, [resultKey(section, target.id)]: res.items }));
        setStatus((s) => ({ ...s, [section]: { busy: false, error: null } }));
      } catch (e) {
        setStatus((s) => ({
          ...s,
          [section]: { busy: false, error: e instanceof Error ? e.message : "Generation failed" },
        }));
      }
    },
    [lang, difficulty],
  );

  const value: GenerationValue = {
    lang,
    c,
    romanPref,
    difficulty,
    setDifficulty,
    itemsFor: (section) => results[resultKey(section, lang)] ?? [],
    statusFor: (section) => status[section] ?? { busy: false, error: null },
    generate,
    clear: (section) =>
      setResults((r) => {
        const next = { ...r };
        delete next[resultKey(section, lang)];
        return next;
      }),
    isKnown: (cardKey) => known.has(cardKey),
    toggleKnown: (cardKey) =>
      setKnown((prev) => {
        const n = new Set(prev);
        n.has(cardKey) ? n.delete(cardKey) : n.add(cardKey);
        return n;
      }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGeneration(): GenerationValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGeneration must be used within a GenerationProvider");
  return v;
}
