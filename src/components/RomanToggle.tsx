import type { RomanPref } from "../types";

interface Props {
  /** Romanization system name for the label (Pinyin / Jyutping / Rōmaji). */
  system: string;
  value: RomanPref;
  onChange: (pref: RomanPref) => void;
}

const OPTIONS: { value: RomanPref; label: string }[] = [
  { value: "reveal", label: "Tap to reveal" },
  { value: "always", label: "Always on" },
  { value: "off", label: "Off" },
];

/** App-wide romanization display preference control (T6). */
export function RomanToggle({ system, value, onChange }: Props) {
  return (
    <div className="roman-pref">
      <span className="roman-pref-label">{system}</span>
      <div className="mode-toggle" role="group" aria-label={`${system} display`}>
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            className={"seg" + (value === o.value ? " active" : "")}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
