import { useState } from "react";
import type { VocabItem } from "../types";
import { useGeneration, type GenSection } from "../generation";
import type { GenerateType } from "../api";
import { VocabCard } from "./VocabCard";

const TYPE_LABEL: Record<GenerateType, string> = {
  vocab: "Vocab",
  sentence: "Sentence",
  reading: "Reading",
};

const DEFAULT_DECK: Record<GenerateType, string> = {
  vocab: "essential everyday vocabulary",
  sentence: "everyday conversation",
  reading: "a short beginner passage",
};

interface Props {
  section: GenSection;
  /** Content types this section can generate (first is the default). */
  types: GenerateType[];
  /** Optional topic passed to the model; falls back to a per-type default. */
  deck?: string;
}

/**
 * Reusable "Generate new content" control + results, wired to the shared
 * GenerationProvider. Results render through the existing VocabCard so generated
 * items get the 田字格 box, romanization reveal, Hear / I-know-this, and status
 * states — the same component as the real vocabulary cards. Used in every section.
 */
export function GeneratePanel({ section, types, deck }: Props) {
  const gen = useGeneration();
  const [type, setType] = useState<GenerateType>(types[0]);

  const items = gen.itemsFor(section);
  const { busy, error } = gen.statusFor(section);

  const onGenerate = () => gen.generate(section, type, deck ?? DEFAULT_DECK[type]);

  return (
    <div className="gen-panel">
      <div className="gen-controls" role="group" aria-label="Generate content">
        {types.length > 1 && (
          <div className="mode-toggle" role="group" aria-label="Content type">
            {types.map((t) => (
              <button
                key={t}
                className={"seg" + (type === t ? " active" : "")}
                aria-pressed={type === t}
                onClick={() => setType(t)}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        )}
        <select
          className="vsearch gen-difficulty"
          value={gen.difficulty}
          onChange={(e) => gen.setDifficulty(e.target.value)}
          aria-label="Difficulty"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button className="btn small" onClick={onGenerate} disabled={busy}>
          {busy ? "Generating…" : `Generate ${gen.c.name} content`}
        </button>
      </div>

      {error && <p className="bp-msg err">{error}</p>}

      {items.length > 0 && (
        <div className="vocab-grid gen-cards">
          {items.map((it, i) => {
            const cardKey = `${section}:${gen.c.id}:${i}:${it.glyph}`;
            const item: VocabItem = {
              id: `gen-${section}-${i}`,
              glyph: it.glyph,
              roman: it.roman,
              meaning: it.gloss,
              deck: "Generated",
              anchor: "✨",
              example: { glyph: it.glyph, roman: it.roman, gloss: it.gloss },
              srs: 0,
            };
            return (
              <VocabCard
                key={cardKey}
                item={item}
                lang={gen.c}
                status={gen.isKnown(cardKey) ? "known" : "new"}
                onKnow={() => gen.toggleKnown(cardKey)}
                showRoman={gen.romanPref !== "off"}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
