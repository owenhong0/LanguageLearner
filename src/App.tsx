import { useCallback, useEffect, useMemo, useState } from "react";
import type { LangId, RomanPref } from "./types";
import { CONTENT, GOAL_TARGET } from "./content";
import { loadProgress, saveProgress, clearProgress, boxLevel, promoteBox, demoteBox, BOX_MAX } from "./store";
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
import { GenerationProvider } from "./generation";

export default function App() {
  const [lang, setLang] = useState<LangId>("cmn");
  const [tab, setTab] = useState<string>("Home");

  // Hydrate progress from localStorage once on mount (T2). loadProgress()
  // returns empty progress on first visit or if the stored data is corrupt.
  const initial = useMemo(loadProgress, []);
  const [known, setKnown] = useState<Set<string>>(() => new Set(initial.known));
  const [vocabKnown, setVocabKnown] = useState<Set<string>>(() => new Set(initial.vocabKnown));
  const [bonus, setBonus] = useState(initial.bonus);
  const [practice, setPractice] = useState(initial.practice);
  const [boxes, setBoxes] = useState<Record<string, number>>(initial.boxes);
  const [romanPref, setRomanPref] = useState<RomanPref>(initial.romanPref);

  // Persist whenever any tracked slice changes.
  useEffect(() => {
    saveProgress({ known: [...known], vocabKnown: [...vocabKnown], bonus, practice, boxes, romanPref });
  }, [known, vocabKnown, bonus, practice, boxes, romanPref]);

  const c = CONTENT[lang];

  // Minutes done = base + 2 per known card (this language) + practice bonus, capped at the target.
  const minutesDone = useMemo(() => {
    const knownHere = c.review.filter((card) => known.has(`${c.id}:${card.id}`)).length;
    return Math.min(GOAL_TARGET, 6 + knownHere * 2 + bonus);
  }, [c, known, bonus]);

  // Leitner grading for a review card (T3): a correct recall promotes the box,
  // forgetting drops it to box 1. A card counts as "known" (mastered) once it
  // reaches the top box — that's what feeds the review % and goal minutes.
  const gradeCard = useCallback((key: string, knewIt: boolean) => {
    setBoxes((prev) => {
      const next = knewIt ? promoteBox(boxLevel(prev, key)) : demoteBox();
      setKnown((k) => {
        const n = new Set(k);
        next >= BOX_MAX ? n.add(key) : n.delete(key);
        return n;
      });
      return { ...prev, [key]: next };
    });
  }, []);
  const handleVocabKnow = useCallback((key: string) => {
    setVocabKnown((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);
  const recordAnswer = useCallback((correct: boolean) => {
    setPractice((p) => ({ answered: p.answered + 1, correct: p.correct + (correct ? 1 : 0) }));
  }, []);
  const resetProgress = useCallback(() => {
    clearProgress();
    setKnown(new Set());
    setVocabKnown(new Set());
    setBonus(0);
    setPractice({ answered: 0, correct: 0 });
    setBoxes({});
    setRomanPref("reveal");
  }, []);

  return (
    <>
      <TopBar lang={lang} onLang={setLang} tab={tab} onTab={setTab} />
      <GenerationProvider lang={lang} romanPref={romanPref}>
      <main className="wrap">
        {tab === "Home" && (
          <>
            <Hero c={c} done={minutesDone} onPractice={() => setBonus((b) => b + 5)} />
            <h2 className="section-title">Character of the day</h2>
            <CharacterOfDay c={c} />
            <ReviewDeck c={c} knownSet={known} boxes={boxes} onGrade={gradeCard} />
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
        {tab === "Vocabulary" && <Vocabulary c={c} known={vocabKnown} onKnow={handleVocabKnow} romanPref={romanPref} onRomanPref={setRomanPref} />}
        {tab === "Reading" && <Reading c={c} romanPref={romanPref} onRomanPref={setRomanPref} />}
        {tab === "Practice" && <Practice c={c} onAnswer={recordAnswer} />}
        {tab === "Progress" && <Progress c={c} vocabKnown={vocabKnown} practice={practice} onReset={resetProgress} />}
      </main>
      </GenerationProvider>
    </>
  );
}
