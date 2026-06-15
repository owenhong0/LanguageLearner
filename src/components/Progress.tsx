import { useState } from "react";
import type { LangContent } from "../types";
import { VOCAB_DECKS } from "../content";
import { SectionHead } from "./SectionHead";
import { GeneratePanel } from "./GeneratePanel";

interface Props {
  c: LangContent;
  vocabKnown: Set<string>;
  practice: { answered: number; correct: number };
  /** Clears all persisted progress (T2). */
  onReset: () => void;
}

export function Progress({ c, vocabKnown, practice, onReset }: Props) {
  const [confirming, setConfirming] = useState(false);
  const isKnown = (id: string, srs: number) => vocabKnown.has(`${c.id}:${id}`) || srs >= 4;

  const decks = VOCAB_DECKS.map((name) => {
    const items = c.vocabulary.filter((v) => v.deck === name);
    const known = items.filter((v) => isKnown(v.id, v.srs)).length;
    const pct = items.length ? Math.round((known / items.length) * 100) : 0;
    return { name, known, total: items.length, pct, sealed: pct === 100 };
  });

  const wordsKnown = decks.reduce((n, d) => n + d.known, 0);
  const sealedCount = decks.filter((d) => d.sealed).length;
  const accuracy = practice.answered ? Math.round((practice.correct / practice.answered) * 100) : null;

  // accuracy ring geometry
  const r = 56, circ = 2 * Math.PI * r;
  const pct = accuracy ?? 0;

  return (
    <>
      <SectionHead mark={c.marks.progress} title="Progress" sub={`Your ${c.name} so far`} />

      <h3 className="block-title">Generate words to focus on</h3>
      <GeneratePanel section="progress" types={["vocab"]} deck="words worth focusing on next" />

      <div className="prog-top">
        <div className="panel acc-card">
          <div className="ring" style={{ width: 134, height: 134 }} role="img"
               aria-label={accuracy === null ? "No quiz attempts yet" : `Quiz accuracy ${accuracy} percent`}>
            <svg width="134" height="134" viewBox="0 0 134 134">
              <circle cx="67" cy="67" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
              <circle cx="67" cy="67" r={r} fill="none" stroke="var(--jade)" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} />
            </svg>
            <div className="center">
              <div>
                <div className="big" style={{ fontSize: 26, color: accuracy === null ? "var(--soft)" : "var(--jade)" }}>
                  {accuracy === null ? "—" : accuracy + "%"}
                </div>
                <div className="lbl">quiz accuracy</div>
              </div>
            </div>
          </div>
          <p className="acc-note">{accuracy === null ? "Take a round in Practice to start tracking accuracy." : `From ${practice.answered} question${practice.answered === 1 ? "" : "s"} answered this session.`}</p>
        </div>

        <div className="prog-stats">
          <div className="panel pstat"><div className="n">{wordsKnown}</div><div className="k">words known</div></div>
          <div className="panel pstat"><div className="n">{c.vocabulary.length}</div><div className="k">characters seen</div></div>
          <div className="panel pstat"><div className="n">{sealedCount}</div><div className="k">decks sealed</div></div>
          <div className="panel pstat"><div className="n">{c.tone.items.length}</div><div className="k">tones explored</div></div>
        </div>
      </div>

      <h3 className="block-title">Deck mastery</h3>
      <div className="mastery-list">
        {decks.map((d) => (
          <div key={d.name} className="mastery-row panel">
            <div className="mr-name">{d.name}<span className="mr-count">{d.known}/{d.total}</span></div>
            <div className="mbar" aria-hidden="true"><i style={{ width: d.pct + "%" }} /></div>
            <span className={"seal-reward" + (d.sealed ? " show" : "")} title={d.sealed ? "Deck sealed" : ""} aria-hidden="true">通</span>
          </div>
        ))}
      </div>

      <h3 className="block-title">Seal collection</h3>
      <div className="seal-wall">
        {decks.map((d) => (
          d.sealed ? (
            <div key={d.name} className="seal-slot earned" title={d.name + " — mastered"}>
              <span className="seal-glyph">{c.pill}</span>
              <span className="seal-cap">{d.name}</span>
            </div>
          ) : (
            <div key={d.name} className="seal-slot empty">
              <span className="seal-glyph">{d.pct}%</span>
              <span className="seal-cap">{d.name}</span>
            </div>
          )
        ))}
      </div>
      <p className="footnote">Every number here is computed from what you've actually marked known and the quiz rounds you've played — nothing is pre-filled. Seal a whole deck (100%) to stamp its 印. Your progress is saved in this browser and survives a reload.</p>

      <div className="prog-reset">
        {!confirming ? (
          <button className="btn ghost small" onClick={() => setConfirming(true)}>Reset progress</button>
        ) : (
          <div className="reset-confirm" role="alertdialog" aria-label="Confirm reset progress">
            <span>Clear everything you've marked known and your quiz history? This can't be undone.</span>
            <div className="reset-actions">
              <button className="btn small" onClick={() => { onReset(); setConfirming(false); }}>Reset everything</button>
              <button className="btn ghost small" onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
