import { useEffect, useMemo, useRef, useState } from "react";
import type { LangContent } from "../types";
import { ChatBubble, type ChatMsg } from "./ChatBubble";
import { GeneratePanel } from "./GeneratePanel";

interface Props {
  c: LangContent;
}

type Mode = "text" | "speak";

let msgSeq = 0;
const nextId = () => "m" + ++msgSeq;

export function Converse({ c }: Props) {
  const [mode, setMode] = useState<Mode>("text");
  const [scenarioId, setScenarioId] = useState(c.converse.scenarios[0].id);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [followIdx, setFollowIdx] = useState(0);
  const [listening, setListening] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);

  const scenario = useMemo(
    () => c.converse.scenarios.find((s) => s.id === scenarioId) ?? c.converse.scenarios[0],
    [c, scenarioId],
  );

  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Reset the thread whenever the scenario or language changes.
  useEffect(() => {
    setMessages([{ id: nextId(), role: "tutor", line: scenario.opener }]);
    setFollowIdx(0);
    setInput("");
  }, [scenario, c.id]);

  // Keep the newest message in view (without scrollIntoView, which breaks the preview).
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    const learner: ChatMsg = {
      id: nextId(),
      role: "learner",
      line: { glyph: t, roman: "", translation: "" },
    };
    const reply: ChatMsg = {
      id: nextId(),
      role: "tutor",
      line: c.converse.followups[followIdx % c.converse.followups.length],
    };
    setMessages((prev) => [...prev, learner, reply]);
    setFollowIdx((i) => i + 1);
    setInput("");
  }

  function startListening() {
    const Rec: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Rec) return;
    const rec = new Rec();
    rec.lang = c.speechLang; // zh-CN / zh-HK / ja-JP — recognize in the active language
    rec.continuous = false;
    rec.interimResults = true; // fill the box live as the learner speaks
    rec.maxAlternatives = 1;
    setListening(true);
    rec.onresult = (e: any) => {
      let transcript = "";
      for (let i = e.resultIndex ?? 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }

  return (
    <>
      <h2 className="section-title">
        Converse
        <span className="count">AI tutor · {c.name}</span>
      </h2>

      <div className="converse-bar">
        <div className="scenario-chips" role="group" aria-label="Choose a scenario">
          {c.converse.scenarios.map((s) => (
            <button
              key={s.id}
              className={"chip" + (s.id === scenarioId ? " active" : "")}
              aria-pressed={s.id === scenarioId}
              onClick={() => setScenarioId(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mode-toggle" role="group" aria-label="Conversation mode">
          <button className={"seg" + (mode === "text" ? " active" : "")}
                  aria-pressed={mode === "text"} onClick={() => setMode("text")}>
            Text
          </button>
          <button className={"seg" + (mode === "speak" ? " active" : "")}
                  aria-pressed={mode === "speak"} onClick={() => setMode("speak")}>
            Speak
          </button>
        </div>
      </div>

      <div className="chat panel">
        <div className="chat-thread" ref={threadRef}>
          {messages.map((m) => (
            <ChatBubble key={m.id} msg={m} lang={c} />
          ))}
        </div>

        <div className="suggestions" aria-label="Suggested replies">
          {c.converse.suggestions.map((s, i) => (
            <button key={i} className="sugg" onClick={() => send(s.glyph)} title={s.translation}>
              <span className="sugg-glyph">{s.glyph}</span>
              <span className="sugg-rom">{s.roman}</span>
            </button>
          ))}
        </div>

        <div className="composer">
          {mode === "speak" && (
            <button
              className={"mic" + (listening ? " on" : "")}
              onClick={startListening}
              disabled={!speechSupported}
              aria-label={speechSupported ? "Speak your reply" : "Speech input not supported"}
              title={speechSupported ? "Tap and speak" : "Your browser doesn't support speech input"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
          )}
          <input
            className="composer-input"
            placeholder={mode === "speak" ? "Tap the mic, or type here…" : "Type your reply…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
            aria-label="Your message"
          />
          <button className="btn" onClick={() => send(input)} disabled={!input.trim()}>
            Send
          </button>
        </div>
      </div>

      <h3 className="block-title">Generate practice phrases</h3>
      <GeneratePanel section="converse" types={["sentence"]} deck="everyday conversation" />

      <p className="footnote">
        Tutor replies are <strong>scripted</strong> in this prototype so it runs with no backend. In
        production the Converse tutor calls a live model through a server that holds the key — never the
        browser. {mode === "speak" && !speechSupported && "Speech input isn't available in this browser; type instead."}
      </p>
    </>
  );
}
