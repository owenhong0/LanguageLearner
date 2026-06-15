import { useState } from "react";
import type { LangContent, VocabItem } from "../types";
import { speak } from "../speech";
import { PlayIcon, CheckIcon } from "./icons";

export type VocabStatus = "new" | "learning" | "known";

const STATUS_LABEL: Record<VocabStatus, string> = {
  new: "new",
  learning: "learning",
  known: "known",
};

interface Props {
  item: VocabItem;
  lang: LangContent;
  status: VocabStatus;
  onKnow: () => void;
  /** Hide the romanization line when the app-wide preference is "off" (T6). */
  showRoman: boolean;
}

export function VocabCard({ item, lang, status, onKnow, showRoman }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={"vcard status-" + status}>
      <div className="vcard-top">
        <span className={"status-pill s-" + status}>{STATUS_LABEL[status]}</span>
        <span className="vdeck">{item.deck}</span>
      </div>

      <div className="vcard-main">
        <div className="tian sm">
          <span className="ch">{item.glyph}</span>
        </div>
        <div className="vmeta">
          {showRoman && <div className="roman">{item.roman}</div>}
          {revealed ? (
            <>
              <div className="vmeaning">{item.meaning}</div>
              <div className="vex">
                <span className="ex-ch">{item.example.glyph}</span>{" "}
                {showRoman && <span className="ex-rom">{item.example.roman}</span>}
                <br />“{item.example.gloss}”
              </div>
            </>
          ) : (
            <button className="reveal" onClick={() => setRevealed(true)}>
              Tap to reveal meaning
            </button>
          )}
        </div>
      </div>

      <div className="vcard-actions">
        <button
          className="btn small play"
          onClick={() => speak(item.glyph, lang.speechLang)}
          aria-label={"Hear " + item.glyph}
        >
          <PlayIcon /> Hear
        </button>
        <button className="btn small ghost" onClick={onKnow}>
          {status === "known" ? (
            <span className="with-check">
              <CheckIcon /> Known
            </span>
          ) : (
            "I know this"
          )}
        </button>
      </div>
    </div>
  );
}
