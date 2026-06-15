import { useMemo, useState } from "react";
import type { LangContent, ReadingLine } from "../types";
import { speak } from "../speech";
import { SectionHead } from "./SectionHead";
import { PlayIcon } from "./icons";

interface Props {
  c: LangContent;
}

function Line({ line, lang }: { line: ReadingLine; lang: LangContent }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="read-line">
      <div className="read-main">
        <button
          className="read-glyph"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${line.glyph} — ${open ? "hide" : "show"} reading and translation`}
        >
          {line.glyph}
        </button>
        <button className="line-play" onClick={() => speak(line.glyph, lang.speechLang)} aria-label={`Play line: ${line.glyph}`}>
          <PlayIcon />
        </button>
      </div>
      {open && (
        <div className="read-reveal">
          <span className="read-rom">{line.roman}</span>
          <span className="read-trans">“{line.translation}”</span>
        </div>
      )}
    </div>
  );
}

export function Reading({ c }: Props) {
  const [passageId, setPassageId] = useState(c.reading.passages[0].id);
  const passage = useMemo(
    () => c.reading.passages.find((p) => p.id === passageId) ?? c.reading.passages[0],
    [c, passageId],
  );

  return (
    <>
      <SectionHead mark={c.marks.reading} title="Reading" sub={`Tap a line to reveal ${c.romanSystem} + translation`} />

      <div className="read-tabs" role="group" aria-label="Choose a passage">
        {c.reading.passages.map((p) => (
          <button
            key={p.id}
            className={"chip" + (p.id === passageId ? " active" : "")}
            aria-pressed={p.id === passageId}
            onClick={() => setPassageId(p.id)}
          >
            {p.kind} · {p.title.translation}
          </button>
        ))}
      </div>

      <article className="reader panel" key={passage.id}>
        <header className="reader-head">
          <span className="reader-kind">{passage.kind}</span>
          <h3 className="reader-title">{passage.title.glyph}</h3>
          <div className="reader-rom">{passage.title.roman}</div>
          <div className="reader-trans">“{passage.title.translation}”</div>
        </header>
        <div className="reader-body">
          {passage.lines.map((line, i) => (
            <Line key={i} line={line} lang={c} />
          ))}
        </div>
        <button className="btn ghost reader-playall" onClick={() => speak(passage.lines.map((l) => l.glyph).join(" "), c.speechLang)}>
          <span className="play"><PlayIcon /> Read the whole passage</span>
        </button>
      </article>
    </>
  );
}
