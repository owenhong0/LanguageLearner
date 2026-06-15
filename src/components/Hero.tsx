import type { LangContent } from "../types";
import { GOAL_TARGET } from "../content";
import { speak } from "../speech";
import { GoalRing } from "./GoalRing";

interface Props {
  c: LangContent;
  done: number;
  onPractice: () => void;
}

export function Hero({ c, done, onPractice }: Props) {
  return (
    <div className="hero">
      <div className="panel greet anim-in">
        <div className="eyebrow">Today · learning {c.name}</div>
        <h1>Welcome back.</h1>
        <p className="note">
          A little every day. Tap any character to hear it, flip a card to test yourself, and trace
          the strokes inside the 田字格.
        </p>
        <div className="greet-glyph">
          <button
            className="g"
            onClick={() => speak(c.greeting.glyph, c.speechLang)}
            style={{ background: "none", border: 0, cursor: "pointer" }}
            aria-label={`Play ${c.greeting.glyph}`}
          >
            {c.greeting.glyph}
          </button>
          <div className="meta">
            <div className="roman">{c.greeting.roman}</div>
            <div className="gloss">“{c.greeting.meaning}”</div>
          </div>
        </div>
      </div>

      <div className="panel goal anim-in">
        <GoalRing done={done} target={GOAL_TARGET} />
        <div className="goal-row">
          <div className="stat">
            <div className="n">12</div>
            <div className="k">day streak</div>
          </div>
          <div className="stat">
            <div className="n">3</div>
            <div className="k">decks sealed</div>
          </div>
        </div>
        <button className="btn small" style={{ marginTop: 12 }} onClick={onPractice}>
          + Practice 5 min
        </button>
      </div>
    </div>
  );
}
