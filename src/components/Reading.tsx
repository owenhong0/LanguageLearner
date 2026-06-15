import { useMemo, useState } from "react";
import type { LangContent, PassageQuestion, ReadingLine, RomanPref } from "../types";
import { speak } from "../speech";
import { SectionHead } from "./SectionHead";
import { RomanToggle } from "./RomanToggle";
import { GeneratePanel } from "./GeneratePanel";
import { PlayIcon } from "./icons";

interface Props {
  c: LangContent;
  romanPref: RomanPref;
  onRomanPref: (pref: RomanPref) => void;
}

function Line({ line, lang, pref }: { line: ReadingLine; lang: LangContent; pref: RomanPref }) {
  const [open, setOpen] = useState(false);
  // Romanization follows the app-wide preference; translation reveals on tap.
  const showRoman = pref === "always" || (pref === "reveal" && open);
  const revealsReading = pref === "reveal";
  return (
    <div className="read-line">
      <div className="read-main">
        <button
          className="read-glyph"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${line.glyph} — ${open ? "hide" : "show"} ${revealsReading ? "reading and translation" : "translation"}`}
        >
          {line.glyph}
        </button>
        <button className="line-play" onClick={() => speak(line.glyph, lang.speechLang)} aria-label={`Play line: ${line.glyph}`}>
          <PlayIcon />
        </button>
      </div>
      {(showRoman || open) && (
        <div className="read-reveal">
          {showRoman && <span className="read-rom">{line.roman}</span>}
          {open && <span className="read-trans">“{line.translation}”</span>}
        </div>
      )}
    </div>
  );
}

function PassageQ({ q }: { q: PassageQuestion }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="read-q">
      <div className="read-q-ask">{q.ask}</div>
      <div className="read-q-opts">
        {q.opts.map((opt, i) => {
          let state = "";
          if (picked !== null) {
            if (i === q.a) state = " correct";
            else if (i === picked) state = " wrong";
            else state = " dim";
          }
          return (
            <button
              key={i}
              className={"read-q-opt" + state}
              disabled={picked !== null}
              aria-pressed={picked === i}
              onClick={() => setPicked(i)}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={"read-q-verdict " + (picked === q.a ? "ok" : "no")}>
          {picked === q.a ? "Correct" : "Not quite — the answer is highlighted."}
        </div>
      )}
    </div>
  );
}

export function Reading({ c, romanPref, onRomanPref }: Props) {
  const [passageId, setPassageId] = useState(c.reading.passages[0].id);
  const passage = useMemo(
    () => c.reading.passages.find((p) => p.id === passageId) ?? c.reading.passages[0],
    [c, passageId],
  );

  return (
    <>
      <SectionHead mark={c.marks.reading} title="Reading" sub={`Tap a line to reveal ${c.romanSystem} + translation`} />

      <RomanToggle system={c.romanSystem} value={romanPref} onChange={onRomanPref} />

      <h3 className="block-title">Generate a new passage</h3>
      <GeneratePanel section="reading" types={["reading"]} deck="a short reading passage" />

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
          {romanPref !== "off" && <div className="reader-rom">{passage.title.roman}</div>}
          <div className="reader-trans">“{passage.title.translation}”</div>
        </header>
        <div className="reader-body">
          {passage.lines.map((line, i) => (
            <Line key={i} line={line} lang={c} pref={romanPref} />
          ))}
        </div>
        <button className="btn ghost reader-playall" onClick={() => speak(passage.lines.map((l) => l.glyph).join(" "), c.speechLang)}>
          <span className="play"><PlayIcon /> Read the whole passage</span>
        </button>

        {passage.question && <PassageQ q={passage.question} />}
      </article>
    </>
  );
}
