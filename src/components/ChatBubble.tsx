import { useState } from "react";
import type { ChatLine, LangContent } from "../types";
import { speak } from "../speech";
import { PlayIcon } from "./icons";

export interface ChatMsg {
  id: string;
  role: "tutor" | "learner";
  line: ChatLine;
}

interface Props {
  msg: ChatMsg;
  lang: LangContent;
}

export function ChatBubble({ msg, lang }: Props) {
  const [revealed, setRevealed] = useState(false);
  const { role, line } = msg;
  const isTutor = role === "tutor";

  return (
    <div className={"chat-row " + role}>
      <div className={"bubble " + role}>
        <div className="b-glyph">{line.glyph}</div>

        {isTutor &&
          (revealed ? (
            <div className="b-reveal">
              <span className="b-roman">{line.roman}</span>
              <span className="b-trans">“{line.translation}”</span>
            </div>
          ) : (
            <button className="b-reveal-btn" onClick={() => setRevealed(true)}>
              Show reading &amp; translation
            </button>
          ))}

        {isTutor && (
          <button
            className="b-play"
            onClick={() => speak(line.glyph, lang.speechLang)}
            aria-label={`Play: ${line.glyph}`}
          >
            <PlayIcon />
          </button>
        )}
      </div>

      {isTutor && line.feedback && (
        <div className="feedback-note" role="note">
          {line.feedback}
        </div>
      )}
    </div>
  );
}
