import type { LangId } from "../types";
import { CONTENT, LANG_ORDER, TABS } from "../content";

interface Props {
  lang: LangId;
  onLang: (l: LangId) => void;
  tab: string;
  onTab: (t: string) => void;
}

export function TopBar({ lang, onLang, tab, onTab }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-in">
        <div className="brand">
          <span className="seal-mark" aria-hidden="true">墨</span>
          <span>
            Moshui<span className="sub"> /mò-shuǐ/ ink</span>
          </span>
        </div>

        <div className="pills" role="group" aria-label="Choose language">
          {LANG_ORDER.map((id) => {
            const c = CONTENT[id];
            const active = id === lang;
            return (
              <button
                key={id}
                className={"pill" + (active ? " active" : "")}
                aria-pressed={active}
                onClick={() => onLang(id)}
              >
                <span className="badge">{c.pill}</span>
                {c.name}
              </button>
            );
          })}
        </div>

        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t}
              className={"tab" + (t === tab ? " active" : "")}
              aria-current={t === tab ? "page" : undefined}
              onClick={() => onTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
