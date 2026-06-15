import { useId, useState } from "react";
import type { Card, LangContent } from "../types";
import { speak } from "../speech";
import { BOX_MAX } from "../store";
import { PlayIcon, CheckIcon } from "./icons";

interface Props {
  card: Card;
  lang: LangContent;
  /** Leitner box level 1..5 (T3). */
  box: number;
  /** True once the card has reached the top box (mastered). */
  known: boolean;
  /** Grade a recall: true = remembered (promote), false = forgot (back to box 1). */
  onGrade: (knewIt: boolean) => void;
}

/**
 * A flip card built from real <button>s (T4): the front face flips to the back,
 * the back's text flips back, and the grading controls are siblings (never
 * nested inside another button). The face that is turned away is removed from
 * the accessibility tree (aria-hidden) and from the tab order (tabIndex -1).
 */
export function FlipCard({ card, lang, box, known, onGrade }: Props) {
  const [flipped, setFlipped] = useState(false);
  const backId = useId();

  // Grade, then flip back to the front so the learner moves to the next card.
  const grade = (knewIt: boolean) => {
    onGrade(knewIt);
    setFlipped(false);
  };

  return (
    <div className={"flip" + (flipped ? " is-flipped" : "") + (known ? " known" : "")}>
      <div className="flip-inner">
        <button
          type="button"
          className="face front"
          aria-expanded={flipped}
          aria-controls={backId}
          aria-hidden={flipped || undefined}
          tabIndex={flipped ? -1 : 0}
          aria-label={`Flashcard ${card.glyph}. Show meaning.`}
          onClick={() => setFlipped(true)}
        >
          {known && (
            <span className="known-tag">
              <CheckIcon /> known
            </span>
          )}
          <div className="tian">
            <span className="ch">{card.glyph}</span>
          </div>
          <div className="roman">{card.roman}</div>
          <div className="anchor" aria-hidden="true">
            {card.anchor}
          </div>
        </button>

        <div className="face back" id={backId} aria-hidden={flipped ? undefined : true}>
          <button
            type="button"
            className="back-flip"
            aria-expanded={flipped}
            tabIndex={flipped ? 0 : -1}
            aria-label={`${card.meaning}. Show character.`}
            onClick={() => setFlipped(false)}
          >
            <div className="meaning">{card.meaning}</div>
            <div className="ex">
              <span className="ex-ch">{card.example.glyph}</span>{" "}
              <span className="ex-rom">{card.example.roman}</span>
              <br />“{card.example.gloss}”
            </div>
          </button>

          <div className="sr">
            <div className="box-pips" role="img" aria-label={`Leitner box ${box} of ${BOX_MAX}`}>
              {Array.from({ length: BOX_MAX }, (_, i) => (
                <i key={i} className={i < box ? "on" : ""} />
              ))}
            </div>
            <div className="row">
              <button
                type="button"
                className="sr-hear"
                tabIndex={flipped ? 0 : -1}
                aria-label={`Hear ${card.glyph}`}
                onClick={() => speak(card.glyph, lang.speechLang)}
              >
                <PlayIcon />
              </button>
              <button
                type="button"
                className="btn small ghost"
                tabIndex={flipped ? 0 : -1}
                aria-label={`Forgot ${card.glyph} — reset to box 1`}
                onClick={() => grade(false)}
              >
                Forgot
              </button>
              <button
                type="button"
                className="btn small"
                tabIndex={flipped ? 0 : -1}
                aria-label={known ? `Keep ${card.glyph} mastered` : `Got ${card.glyph} — promote`}
                onClick={() => grade(true)}
              >
                {known ? "Keep ✓" : "Got it"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
