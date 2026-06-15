import type { LangContent } from "../types";
import { speak } from "../speech";

interface Props {
  c: LangContent;
}

export function ToneTrainer({ c }: Props) {
  return (
    <>
      <h2 className="section-title">
        Tone trainer
        <span className="count">{c.tone.items.length} contours</span>
      </h2>

      <div className="tone-cards">
        {c.tone.items.map((t, i) => (
          <div
            key={i}
            className="tone-card"
            role="button"
            tabIndex={0}
            aria-label={`Play ${t.glyph} ${t.roman}`}
            onClick={() => speak(t.glyph, c.speechLang)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                speak(t.glyph, c.speechLang);
              }
            }}
          >
            <div className="label">{t.label}</div>
            <svg className="contour" viewBox="0 0 64 40" preserveAspectRatio="none" aria-hidden="true">
              <line x1="2" y1="12" x2="62" y2="12" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="2" y1="28" x2="62" y2="28" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" />
              <polyline
                points={t.points}
                fill="none"
                stroke="var(--seal)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="glyph">{t.glyph}</div>
            <div className="roman">{t.roman}</div>
            <div className="gloss">“{t.gloss}”</div>
          </div>
        ))}
      </div>
    </>
  );
}
