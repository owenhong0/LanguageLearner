import { useCallback, useState } from "react";
import type { Card, LangContent } from "../types";
import { speak } from "../speech";
import { PlayIcon, CheckIcon } from "./icons";

interface Props {
  card: Card;
  lang: LangContent;
  known: boolean;
  onKnow: () => void;
}

export function FlipCard({ card, lang, known, onKnow }: Props) {
  const [flipped, setFlipped] = useState(false);
  const toggle = useCallback(() => setFlipped((f) => !f), []);

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
          <div className="row">
            <button
              className="btn small play"
              onClick={(e) => {
                e.stopPropagation();
                speak(card.glyph, lang.speechLang);
              }}
            >
              <PlayIcon /> Hear
            </button>
            <button
              className="btn small ghost"
              onClick={(e) => {
                e.stopPropagation();
                onKnow();
              }}
            >
              {known ? "Reviewed ✓" : "I know this"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
