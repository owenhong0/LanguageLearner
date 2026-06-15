import { useState } from "react";
import type { BuildItem, LangContent, VocabItem } from "../types";
import { SectionHead } from "./SectionHead";
import { VocabCard } from "./VocabCard";
import { GeneratePanel } from "./GeneratePanel";
import { useGeneration } from "../generation";

interface Props {
  c: LangContent;
  vocabKnown: Set<string>;
}

type Tab = "structure" | "verbs" | "phrases" | "builder";

const TABS: { id: Tab; label: string }[] = [
  { id: "structure", label: "Structure" },
  { id: "verbs", label: "Verbs" },
  { id: "phrases", label: "Phrases" },
  { id: "builder", label: "Builder" },
];

/**
 * Build — ties vocabulary into usable language. Four sub-views (grammar
 * patterns / verbs / phrases / sentence builder). Each shows curated,
 * language-specific content for instant value and a "Generate" control that
 * reuses the shared flow (language + difficulty single source of truth, results
 * persisted client-side, rendered through the existing VocabCard). Generation
 * prioritizes words the learner already knows.
 */
export function Build({ c, vocabKnown }: Props) {
  const gen = useGeneration();
  const [tab, setTab] = useState<Tab>("structure");

  // Words the learner already knows or has started — fed into every generate call.
  const knownWords = c.vocabulary
    .filter((v) => vocabKnown.has(`${c.id}:${v.id}`) || v.srs >= 1)
    .map((v) => v.glyph)
    .slice(0, 24);

  const toItem = (b: BuildItem, i: number, deck: string): VocabItem => ({
    id: `build-${deck}-${i}`,
    glyph: b.glyph,
    roman: b.roman,
    meaning: b.meaning,
    deck,
    anchor: "🧩",
    example: b.example ?? { glyph: b.glyph, roman: b.roman, gloss: b.meaning },
    srs: 0,
  });

  // Curated build items render through VocabCard; "known" persists via the
  // generation provider (same store as generated cards).
  const renderCards = (items: BuildItem[], deckLabel: string) => (
    <div className="vocab-grid">
      {items.map((b, i) => {
        const cardKey = `${deckLabel}:${c.id}:${b.glyph}`;
        return (
          <VocabCard
            key={cardKey}
            item={toItem(b, i, deckLabel)}
            lang={c}
            status={gen.isKnown(cardKey) ? "known" : "new"}
            onKnow={() => gen.toggleKnown(cardKey)}
            showRoman={gen.romanPref !== "off"}
          />
        );
      })}
    </div>
  );

  return (
    <>
      <SectionHead mark="造" title="Build" sub={`Turn your ${c.name} vocab into sentences`} />

      <div className="mode-toggle build-tabs" role="group" aria-label="Build view">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={"seg" + (tab === t.id ? " active" : "")}
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "structure" && (
        <>
          <p className="build-intro">Word-order and grammar patterns for {c.name} — each as a template with slots plus an example.</p>
          <div className="pattern-list">
            {c.build.patterns.map((p, i) => (
              <div key={i} className="panel pattern-card">
                <div className="pattern-name">{p.name}</div>
                <div className="pattern-template">{p.template}</div>
                <div className="pattern-ex">
                  <span className="pattern-glyph">{p.example.glyph}</span>
                  {gen.romanPref !== "off" && <span className="pattern-rom">{p.example.roman}</span>}
                  <span className="pattern-gloss">“{p.example.gloss}”</span>
                </div>
              </div>
            ))}
          </div>
          <h3 className="block-title">Generate more patterns</h3>
          <GeneratePanel section="build-structure" types={["structure"]} deck="common sentence patterns" vocab={knownWords} />
        </>
      )}

      {tab === "verbs" && (
        <>
          <p className="build-intro">Verbs from your studies, shown in context (aspect/forms as the language uses them).</p>
          {renderCards(c.build.verbs, "Verbs")}
          <h3 className="block-title">Generate more verbs</h3>
          <GeneratePanel section="build-verbs" types={["verbs"]} deck="common everyday verbs" vocab={knownWords} />
        </>
      )}

      {tab === "phrases" && (
        <>
          <p className="build-intro">Useful multi-word chunks and set expressions.</p>
          {renderCards(c.build.phrases, "Phrases")}
          <h3 className="block-title">Generate more phrases</h3>
          <GeneratePanel section="build-phrases" types={["phrases"]} deck="common set phrases" vocab={knownWords} />
        </>
      )}

      {tab === "builder" && (
        <>
          <p className="build-intro">
            {knownWords.length > 0
              ? `Assemble complete sentences from the ${knownWords.length} word${knownWords.length === 1 ? "" : "s"} you've been studying.`
              : "Mark some words “known” in Vocabulary (or review a few cards), then build sentences from them here."}
          </p>
          {knownWords.length > 0 && (
            <div className="word-chips" aria-label="Words you know">
              {knownWords.slice(0, 16).map((w, i) => (
                <span key={i} className="word-chip">{w}</span>
              ))}
            </div>
          )}
          <GeneratePanel
            section="build-builder"
            types={["sentence"]}
            deck="natural sentences using the learner's known words"
            vocab={knownWords}
          />
        </>
      )}

      <p className="footnote">
        Everything here follows your selected language (<strong>{c.name}</strong>) and difficulty. Generated
        content comes back in {c.name} only, prioritizes words you already know, and is saved in your browser.
      </p>
    </>
  );
}
