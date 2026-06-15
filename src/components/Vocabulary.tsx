import { useMemo, useState } from "react";
import type { LangContent, RomanPref, VocabItem } from "../types";
import { VOCAB_DECKS } from "../content";
import { VocabCard, type VocabStatus } from "./VocabCard";
import { RomanToggle } from "./RomanToggle";

interface Props {
  c: LangContent;
  known: Set<string>;
  onKnow: (key: string) => void;
  romanPref: RomanPref;
  onRomanPref: (pref: RomanPref) => void;
}

type StatusFilter = "all" | "new" | "learning" | "known";

function statusOf(item: VocabItem, key: string, known: Set<string>): VocabStatus {
  if (known.has(key)) return "known";
  if (item.srs >= 4) return "known";
  if (item.srs === 0) return "new";
  return "learning";
}

export function Vocabulary({ c, known, onKnow, romanPref, onRomanPref }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [deck, setDeck] = useState<string>("all");
  const [custom, setCustom] = useState<VocabItem[]>([]);
  const [draftGlyph, setDraftGlyph] = useState("");
  const [draftMeaning, setDraftMeaning] = useState("");

  const key = (item: VocabItem) => `${c.id}:${item.id}`;
  const all = useMemo(() => [...c.vocabulary, ...custom], [c.vocabulary, custom]);

  const counts = useMemo(() => {
    let knownN = 0;
    let dueN = 0;
    for (const item of all) {
      const st = statusOf(item, key(item), known);
      if (st === "known") knownN++;
      else dueN++;
    }
    return { total: all.length, known: knownN, due: dueN };
  }, [all, known, c.id]);

  const pct = counts.total ? Math.round((counts.known / counts.total) * 100) : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((item) => {
      if (deck !== "all" && item.deck !== deck) return false;
      const st = statusOf(item, key(item), known);
      if (status !== "all" && st !== status) return false;
      if (q) {
        const hay = (item.glyph + " " + item.roman + " " + item.meaning).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, query, status, deck, known, c.id]);

  function addWord() {
    const g = draftGlyph.trim();
    const m = draftMeaning.trim();
    if (!g || !m) return;
    setCustom((prev) => [
      {
        id: "custom-" + prev.length + "-" + g,
        glyph: g,
        roman: "—",
        meaning: m,
        deck: "Daily life",
        anchor: "📝",
        srs: 0,
        example: { glyph: g, roman: "—", gloss: m },
      },
      ...prev,
    ]);
    setDraftGlyph("");
    setDraftMeaning("");
  }

  const STATUS_FILTERS: StatusFilter[] = ["all", "new", "learning", "known"];

  return (
    <>
      <h2 className="section-title">
        Vocabulary
        <span className="count">{c.romanSystem}</span>
      </h2>

      <RomanToggle system={c.romanSystem} value={romanPref} onChange={onRomanPref} />

      {/* summary */}
      <div className="vocab-summary panel">
        <div className="vsum-stats">
          <div className="stat"><div className="n">{counts.total}</div><div className="k">words</div></div>
          <div className="stat"><div className="n">{counts.due}</div><div className="k">to review</div></div>
          <div className="stat"><div className="n">{counts.known}</div><div className="k">known</div></div>
        </div>
        <div className="vsum-bar">
          <div className="mbar" aria-hidden="true"><i style={{ width: pct + "%" }} /></div>
          <span className="vsum-pct">{pct}% mastered</span>
        </div>
      </div>

      {/* controls */}
      <div className="vocab-controls">
        <input
          className="vsearch"
          type="search"
          placeholder="Search characters, reading or meaning…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search vocabulary"
        />
        <div className="filter-pills" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={"fpill" + (status === s ? " active" : "")}
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="deck-chips" role="group" aria-label="Filter by deck">
        <button className={"chip" + (deck === "all" ? " active" : "")}
                aria-pressed={deck === "all"} onClick={() => setDeck("all")}>
          All decks
        </button>
        {VOCAB_DECKS.map((d) => (
          <button key={d} className={"chip" + (deck === d ? " active" : "")}
                  aria-pressed={deck === d} onClick={() => setDeck(d)}>
            {d}
          </button>
        ))}
      </div>

      {/* grid */}
      {filtered.length > 0 ? (
        <div className="vocab-grid">
          {filtered.map((item) => (
            <VocabCard
              key={item.id}
              item={item}
              lang={c}
              status={statusOf(item, key(item), known)}
              onKnow={() => onKnow(key(item))}
              showRoman={romanPref !== "off"}
            />
          ))}
        </div>
      ) : (
        <p className="empty">No words match those filters yet.</p>
      )}

      {/* add word */}
      <div className="add-word panel">
        <div className="aw-label">Add your own word</div>
        <div className="aw-row">
          <input
            className="aw-input"
            placeholder="Character / kana"
            value={draftGlyph}
            onChange={(e) => setDraftGlyph(e.target.value)}
            aria-label="New word characters"
            onKeyDown={(e) => { if (e.key === "Enter") addWord(); }}
          />
          <input
            className="aw-input"
            placeholder="Meaning"
            value={draftMeaning}
            onChange={(e) => setDraftMeaning(e.target.value)}
            aria-label="New word meaning"
            onKeyDown={(e) => { if (e.key === "Enter") addWord(); }}
          />
          <button className="btn small" onClick={addWord} disabled={!draftGlyph.trim() || !draftMeaning.trim()}>
            + Add to deck
          </button>
        </div>
      </div>
    </>
  );
}
