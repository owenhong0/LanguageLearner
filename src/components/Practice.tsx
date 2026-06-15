import { useState } from "react";
import type { LangContent } from "../types";
import { speak } from "../speech";
import { SectionHead } from "./SectionHead";
import { GeneratePanel } from "./GeneratePanel";
import { PlayIcon, CheckIcon } from "./icons";

interface Props {
  c: LangContent;
  onAnswer: (correct: boolean) => void;
}

export function Practice({ c, onAnswer }: Props) {
  // ---- 田字格 trace: cycle through vocabulary characters ----
  const [traceIdx, setTraceIdx] = useState(0);
  const trace = c.vocabulary[traceIdx % c.vocabulary.length];

  // ---- quiz state ----
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const questions = c.practice.questions;
  const q = questions[qIdx];

  function choose(i: number) {
    if (picked !== null) return; // locked after first answer
    setPicked(i);
    const correct = q.options[i].correct;
    if (correct) setScore((s) => s + 1);
    onAnswer(correct);
  }
  function next() {
    if (qIdx + 1 >= questions.length) setDone(true);
    else { setQIdx((i) => i + 1); setPicked(null); }
  }
  function restart() {
    setQIdx(0); setPicked(null); setScore(0); setDone(false);
  }

  return (
    <>
      <SectionHead mark={c.marks.practice} title="Practice" sub="Trace a character, then test yourself" />

      <h3 className="block-title">Generate characters to practise</h3>
      <GeneratePanel section="practice" types={["vocab"]} deck="useful characters to practise" />

      {/* 田字格 trace — one cell per character */}
      <div className="trace panel">
        <div className="trace-cells" aria-hidden="true">
          {[...trace.glyph].map((ch, i) => (
            <div className="tian trace-cell" key={i}>
              <span className="ch trace-ghost">{ch}</span>
            </div>
          ))}
        </div>
        <div className="trace-meta">
          <div className="eyebrow">Trace · follow the strokes inside the grid</div>
          <div className="trace-roman">{trace.roman}</div>
          <div className="trace-meaning">{trace.meaning}</div>
          <div className="trace-actions">
            <button className="btn play" onClick={() => speak(trace.glyph, c.speechLang)}><PlayIcon /> Hear it</button>
            <button className="btn ghost" onClick={() => setTraceIdx((i) => i + 1)}>Next character →</button>
          </div>
        </div>
      </div>

      {/* quiz */}
      <h3 className="block-title">Quick quiz</h3>
      {!done ? (
        <div className="quiz panel">
          <div className="quiz-progress">
            <span>Question {qIdx + 1} / {questions.length}</span>
            <div className="mbar" aria-hidden="true"><i style={{ width: ((qIdx + (picked !== null ? 1 : 0)) / questions.length) * 100 + "%" }} /></div>
          </div>
          <p className="quiz-prompt">{q.prompt}</p>
          <div className="quiz-options">
            {q.options.map((opt, i) => {
              const isPicked = picked === i;
              let state = "";
              if (picked !== null) {
                if (opt.correct) state = " correct";
                else if (isPicked) state = " wrong";
                else state = " dim";
              }
              return (
                <button key={i} className={"quiz-opt" + state} onClick={() => choose(i)} disabled={picked !== null}>
                  <span className="qo-glyph">{opt.glyph}</span>
                  {picked !== null && opt.correct && <span className="qo-mark correct-mark"><CheckIcon /></span>}
                  {isPicked && !opt.correct && <span className="qo-mark wrong-mark">✕</span>}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="quiz-foot">
              <span className={"quiz-verdict " + (q.options[picked].correct ? "ok" : "no")}>
                {q.options[picked].correct ? "Correct" : "Not quite"}
              </span>
              <button className="btn" onClick={next}>{qIdx + 1 >= questions.length ? "See results" : "Next question"}</button>
            </div>
          )}
        </div>
      ) : (
        <div className="quiz-result panel">
          <div className="result-ring">{score}/{questions.length}</div>
          <div>
            <div className="result-title">{score === questions.length ? "Perfect round" : "Round complete"}</div>
            <p className="result-note">You got {score} of {questions.length} right. Your accuracy feeds the Progress tab.</p>
            <button className="btn" onClick={restart}>Practice again</button>
          </div>
        </div>
      )}
    </>
  );
}
