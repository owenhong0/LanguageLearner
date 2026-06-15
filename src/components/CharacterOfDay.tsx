import type { LangContent } from "../types";
import { speak } from "../speech";
import { PlayIcon } from "./icons";

interface Props {
  c: LangContent;
}

export function CharacterOfDay({ c }: Props) {
  const h = c.hero;
  return (
    <div className="panel cod anim-in">
      <div className="tian">
        <span className="ch">{h.glyph}</span>
      </div>
      <div>
        <div className="roman">
          {h.roman} · {c.romanSystem}
        </div>
        <h3>{h.meaning}</h3>
        <div className="example">
          <span className="ex-ch">{h.example.glyph}</span>
          <span className="ex-rom">{h.example.roman}</span>
          <span className="ex-gloss">“{h.example.gloss}”</span>
        </div>
        <div className="actions">
          <button className="btn play" onClick={() => speak(h.glyph, c.speechLang)}>
            <PlayIcon /> Hear it
          </button>
          <button className="btn ghost" onClick={() => speak(h.example.glyph, c.speechLang)}>
            Play the phrase
          </button>
        </div>
      </div>
    </div>
  );
}
