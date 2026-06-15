import { useCallback, useState } from "react";
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

export function FlipCard({ card, lang, box, known, onGrade }: Props) {
  const [flipped, setFlipped] = useState(false);
  const toggle = useCallback(() => setFlipped((f) => !f), []);

  // Grade, then flip back to the front so the learner moves to the next card.
  const grade = (knewIt: boolean) => {
    onGrade(knewIt);
    setFlipped(false);
  };

  return (
    <div
      className={"flip" + (flipped ? " is-flipped" : "") + (known ? " known" : "")}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`Card: ${card.glyph}. Press to flip.`}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <div className="flip-inner">
        <div className="face front">
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
        </div>

        <div className="face back">
          <div>
            <div className="meaning">{card.meaning}</div>
            <div className="ex">
              <span className="ex-ch">{card.example.glyph}</span>{" "}
              <span className="ex-rom">{card.example.roman}</span>
              <br />“{card.example.gloss}”
            </div>
          </div>

          <div className="sr">
            <div className="box-pips" role="img" aria-label={`Leitner box ${box} of ${BOX_MAX}`}>
              {Array.from({ length: BOX_MAX }, (_, i) => (
                <i key={i} className={i < box ? "on" : ""} />
              ))}
            </div>
            <div className="row">
              <button
                className="sr-hear"
                aria-label={`Hear ${card.glyph}`}
                onClick={(e) => {
                  e.stopPropagation();
                  speak(card.glyph, lang.speechLang);
                }}
              >
                <PlayIcon />
              </button>
              <button
                className="btn small ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  grade(false);
                }}
              >
                Forgot
              </button>
              <button
                className="btn small"
                onClick={(e) => {
                  e.stopPropagation();
                  grade(true);
                }}
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
