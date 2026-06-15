import type { LangContent } from "../types";
import { FlipCard } from "./FlipCard";

interface Props {
  c: LangContent;
  knownSet: Set<string>;
  onKnow: (key: string) => void;
}

export function ReviewDeck({ c, knownSet, onKnow }: Props) {
  const total = c.review.length;
  const knownCount = c.review.filter((card) => knownSet.has(`${c.id}:${card.id}`)).length;
  const due = total - knownCount;
  const pct = Math.round((knownCount / total) * 100);
  const cleared = due === 0;

  return (
    <>
      <h2 className="section-title">
        Review queue
        <span className="count">{c.romanSystem}</span>
      </h2>

      <div className="review-head">
        <span className="due-badge">{cleared ? "all caught up" : `${due} due today`}</span>
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

      <div className="cards">
        {c.review.map((card) => (
          <FlipCard
            key={card.id}
            card={card}
            lang={c}
            known={knownSet.has(`${c.id}:${card.id}`)}
            onKnow={() => onKnow(`${c.id}:${card.id}`)}
          />
        ))}
      </div>
    </>
  );
}
