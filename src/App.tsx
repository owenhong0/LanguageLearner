import { useCallback, useMemo, useState } from "react";
import type { LangId } from "./types";
import { CONTENT, GOAL_TARGET } from "./content";
import { TopBar } from "./components/TopBar";
import { Hero } from "./components/Hero";
import { CharacterOfDay } from "./components/CharacterOfDay";
import { ReviewDeck } from "./components/ReviewDeck";
import { ToneTrainer } from "./components/ToneTrainer";
import { Vocabulary } from "./components/Vocabulary";
import { Converse } from "./components/Converse";
import { Reading } from "./components/Reading";
import { Practice } from "./components/Practice";
import { Progress } from "./components/Progress";

export default function App() {
  const [lang, setLang] = useState<LangId>("cmn");
  const [tab, setTab] = useState<string>("Home");
  const [known, setKnown] = useState<Set<string>>(() => new Set());
  const [vocabKnown, setVocabKnown] = useState<Set<string>>(() => new Set());
  const [bonus, setBonus] = useState(0);
  const [practice, setPractice] = useState({ answered: 0, correct: 0 });

  const c = CONTENT[lang];

  // Minutes done = base + 2 per known card (this language) + practice bonus, capped at the target.
  const minutesDone = useMemo(() => {
    const knownHere = c.review.filter((card) => known.has(`${c.id}:${card.id}`)).length;
    return Math.min(GOAL_TARGET, 6 + knownHere * 2 + bonus);
  }, [c, known, bonus]);

  const handleKnow = useCallback((key: string) => {
    setKnown((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);
  const handleVocabKnow = useCallback((key: string) => {
    setVocabKnown((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);
  const recordAnswer = useCallback((correct: boolean) => {
    setPractice((p) => ({ answered: p.answered + 1, correct: p.correct + (correct ? 1 : 0) }));
  }, []);

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
        {tab === "Vocabulary" && <Vocabulary c={c} known={vocabKnown} onKnow={handleVocabKnow} />}
        {tab === "Reading" && <Reading c={c} />}
        {tab === "Practice" && <Practice c={c} onAnswer={recordAnswer} />}
        {tab === "Progress" && <Progress c={c} vocabKnown={vocabKnown} practice={practice} />}
      </main>
    </>
  );
}
