import { useEffect, useMemo, useRef, useState } from "react";
import type { LangContent } from "../types";
import { ChatBubble, type ChatMsg } from "./ChatBubble";
import { askTutor, isLiveTutorConfigured, type TutorTurn } from "../tutor";

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
  const [pending, setPending] = useState(false);
  const [liveFailed, setLiveFailed] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);

  // Whether a live tutor proxy (VITE_TUTOR_PROXY_URL) is configured (T1).
  const live = isLiveTutorConfigured();

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
    setLiveFailed(false);
    setPending(false);
  }, [scenario, c.id]);

  // Keep the newest message in view (without scrollIntoView, which breaks the preview).
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // The built-in scripted reply — used in demo mode and as the live fallback.
  function scriptedReply(): ChatMsg {
    setFollowIdx((i) => i + 1);
    return {
      id: nextId(),
      role: "tutor",
      line: c.converse.followups[followIdx % c.converse.followups.length],
    };
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || pending) return;
    const learner: ChatMsg = {
      id: nextId(),
      role: "learner",
      line: { glyph: t, roman: "", translation: "" },
    };
    const history: TutorTurn[] = [...messages, learner].map((m) => ({ role: m.role, text: m.line.glyph }));
    setMessages((prev) => [...prev, learner]);
    setInput("");

    if (live) {
      setPending(true);
      const reply = await askTutor(c, scenario.label, history);
      setPending(false);
      if (reply) {
        setMessages((prev) => [...prev, { id: nextId(), role: "tutor", line: reply }]);
        return;
      }
      // Proxy unreachable / bad response — note it and drop to the scripted reply.
      setLiveFailed(true);
    }
    setMessages((prev) => [...prev, scriptedReply()]);
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

      {(!live || liveFailed) && (
        <div className="tutor-mode-note" role="status">
          {!live
            ? "Live tutor needs a backend — running in scripted demo mode. Set VITE_TUTOR_PROXY_URL to connect one (see README)."
            : "Live tutor unavailable right now — showing scripted replies."}
        </div>
      )}

      <div className="chat panel">
        <div className="chat-thread" ref={threadRef}>
          {messages.map((m) => (
            <ChatBubble key={m.id} msg={m} lang={c} />
          ))}
          {pending && (
            <div className="chat-row tutor" aria-live="polite">
              <div className="bubble tutor typing">Tutor is typing…</div>
            </div>
          )}
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
            disabled={pending}
          />
          <button className="btn" onClick={() => send(input)} disabled={!input.trim() || pending}>
            Send
          </button>
        </div>
      </div>

      <p className="footnote">
        {live ? (
          <>The Converse tutor calls a live model through <strong>VITE_TUTOR_PROXY_URL</strong>, a
          server-side proxy that holds the API key — never the browser. If a request fails it falls
          back to a scripted reply.</>
        ) : (
          <>Tutor replies are <strong>scripted</strong> so the app runs with no backend and no API key.
          To enable a live tutor, point <strong>VITE_TUTOR_PROXY_URL</strong> at a server-side proxy
          that holds the key (see README) — never put a key in the frontend.</>
        )}{" "}
        {mode === "speak" && !speechSupported && "Speech input isn't available in this browser; type instead."}
      </p>
    </>
  );
}
