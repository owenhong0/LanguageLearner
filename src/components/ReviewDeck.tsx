import { useMemo, useState } from "react";
import type { LangContent } from "../types";
import { boxLevel, isDue, BOX_MAX } from "../store";
import { FlipCard } from "./FlipCard";

interface Props {
  c: LangContent;
  knownSet: Set<string>;
  boxes: Record<string, number>;
  onGrade: (key: string, knewIt: boolean) => void;
}

type Mode = "all" | "due";

export function ReviewDeck({ c, knownSet, boxes, onGrade }: Props) {
  const [mode, setMode] = useState<Mode>("all");
  const key = (id: string) => `${c.id}:${id}`;

  const total = c.review.length;
  const knownCount = c.review.filter((card) => knownSet.has(key(card.id))).length;
  const pct = Math.round((knownCount / total) * 100);
  const cleared = knownCount === total;

  // Cards still due for review (not yet in the top box), most-due (lowest box) first.
  const dueCards = useMemo(
    () =>
      c.review
        .filter((card) => isDue(boxLevel(boxes, key(card.id))))
        .sort((a, b) => boxLevel(boxes, key(a.id)) - boxLevel(boxes, key(b.id))),
    [c, boxes],
  );

  const shown = mode === "due" ? dueCards : c.review;

  return (
    <>
      <h2 className="section-title">
        Review queue
        <span className="count">{c.romanSystem}</span>
      </h2>

      <div className="review-head">
        <span className="due-badge">{dueCards.length === 0 ? "all caught up" : `${dueCards.length} due`}</span>

        <div className="mode-toggle" role="group" aria-label="Review mode">
          <button className={"seg" + (mode === "all" ? " active" : "")}
                  aria-pressed={mode === "all"} onClick={() => setMode("all")}>
            All cards
          </button>
          <button className={"seg" + (mode === "due" ? " active" : "")}
                  aria-pressed={mode === "due"} onClick={() => setMode("due")}>
            Due for review
          </button>
        </div>

        <div className="mastery">
          <div className="mbar" aria-hidden="true">
            <i style={{ width: `${pct}%` }} />
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--soft)" }}>
            {pct}%
          </span>
          <span
            className={"seal-reward" + (cleared ? " show" : "")}
            title="Deck sealed — mastery"
            aria-hidden="true"
          >
            通
          </span>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="empty">All caught up — every card has reached the top box. Switch to “All cards” to keep practising.</p>
      ) : (
        <div className="cards">
          {shown.map((card) => (
            <FlipCard
              key={card.id}
              card={card}
              lang={c}
              box={boxLevel(boxes, key(card.id))}
              known={boxLevel(boxes, key(card.id)) >= BOX_MAX}
              onGrade={(knewIt) => onGrade(key(card.id), knewIt)}
            />
          ))}
        </div>
      )}
    </>
  );
}
