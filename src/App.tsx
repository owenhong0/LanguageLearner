import { useCallback, useEffect, useMemo, useState } from "react";
import type { LangId } from "./types";
import { CONTENT, GOAL_TARGET } from "./content";
import { TopBar } from "./components/TopBar";
import { Hero } from "./components/Hero";
import { CharacterOfDay } from "./components/CharacterOfDay";
import { ReviewDeck } from "./components/ReviewDeck";
import { ToneTrainer } from "./components/ToneTrainer";
import { Vocabulary } from "./components/Vocabulary";
import { Converse } from "./components/Converse";

// A representative glyph for each not-yet-built surface, framed in the 田字格.
const COMING_GLYPH: Record<string, string> = {
  Reading: "讀",
  Practice: "練",
  Progress: "印",
};

export default function App() {
  const [lang, setLang] = useState<LangId>("cmn");
  const [tab, setTab] = useState<string>("Home");
  const [known, setKnown] = useState<Set<string>>(() => new Set());
  const [vocabKnown, setVocabKnown] = useState<Set<string>>(() => new Set());
  const [bonus, setBonus] = useState(0);

  const c = CONTENT[lang];

  // Reflect the active section in the tab title.
  useEffect(() => {
    document.title = `墨 Moshui — ${tab}`;
  }, [tab]);

  // Minutes done = base + 2 per known card (this language) + practice bonus, capped at the target.
  const minutesDone = useMemo(() => {
    const knownHere = c.review.filter((card) => known.has(`${c.id}:${card.id}`)).length;
    return Math.min(GOAL_TARGET, 6 + knownHere * 2 + bonus);
  }, [c, known, bonus]);

  const toggleIn = (setter: typeof setKnown) => (key: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleKnow = useCallback(toggleIn(setKnown), []);
  const handleVocabKnow = useCallback(toggleIn(setVocabKnown), []);

  return (
    <>
      <TopBar lang={lang} onLang={setLang} tab={tab} onTab={setTab} />
      <main className="wrap">
        {tab === "Home" && (
          <>
            <Hero c={c} done={minutesDone} onPractice={() => setBonus((b) => b + 5)} />

            <h2 className="section-title">Character of the day</h2>
            <CharacterOfDay c={c} />

            <ReviewDeck c={c} knownSet={known} onKnow={handleKnow} />

            <ToneTrainer c={c} />

            <p className="footnote">
              Home dashboard for <strong>墨 Moshui</strong>. Switch 粵 / 普 / 日 in the top bar to re-theme
              every module. Pronunciation plays through your browser’s built-in speech synthesis
              (<code>speechSynthesis</code>) — voice quality depends on the languages your OS has
              installed; no audio files required to host.
            </p>
          </>
        )}

        {tab === "Converse" && <Converse c={c} />}

        {tab === "Vocabulary" && (
          <Vocabulary c={c} known={vocabKnown} onKnow={handleVocabKnow} />
        )}

        {tab !== "Home" && tab !== "Converse" && tab !== "Vocabulary" && (
          <div className="coming-soon panel anim-in">
            <div className="tian cs-glyph" aria-hidden="true">
              <span className="ch">{COMING_GLYPH[tab] ?? "未"}</span>
            </div>
            <div className="cs-body">
              <div className="eyebrow">In the studio</div>
              <h2 className="section-title" style={{ marginTop: 6 }}>{tab}</h2>
              <p>
                The <strong>{tab}</strong> surface isn’t built yet — <strong>Home</strong>,{" "}
                <strong>Converse</strong> and <strong>Vocabulary</strong> are live. Each tab ships as
                its own component set following the same 田字格 + cinnabar system.
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
