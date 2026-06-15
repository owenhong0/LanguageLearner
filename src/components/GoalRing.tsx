interface Props {
  done: number;
  target: number;
}

export function GoalRing({ done, target }: Props) {
  const r = 64;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, done / target);
  const complete = done >= target;

  return (
    <div
      className="ring"
      role="img"
      aria-label={`${done} of ${target} minutes of today's goal done`}
    >
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r={r} fill="none" stroke="var(--line)" strokeWidth="11" />
        <circle
          cx="75"
          cy="75"
          r={r}
          fill="none"
          stroke="var(--jade)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="center">
        <div>
          <div className="big" style={{ color: complete ? "var(--jade)" : "var(--ink)" }}>
            {complete ? "Done" : `${done}/${target}`}
          </div>
          <div className="lbl">{complete ? "goal complete" : "minutes today"}</div>
        </div>
      </div>
    </div>
  );
}
