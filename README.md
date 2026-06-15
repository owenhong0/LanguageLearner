# 墨 Moshui

A web app for learning **Cantonese · Mandarin · Japanese**, reading-first.
This is the **Home dashboard** built with **Vite + React + TypeScript** — every
component is a `.tsx` file. Switch 粵 / 普 / 日 in the top bar to re-theme the
whole dashboard.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # run the test suite (Vitest)
```

## Build & host

```bash
npm run build    # outputs to app/dist
npm run preview  # preview the production build locally
```

`dist/` is a static bundle (`base: "./"` keeps asset paths relative), so you can
drop it on **GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3** — any static
host. No server or API keys required (the Converse tutor runs in scripted demo
mode unless you wire up the optional proxy below).

## Live tutor (optional proxy)

By default the **Converse** tab uses a small built-in **scripted** exchange, so
the app runs with no backend and **no API key**. To make the tutor call a real
model, point the app at a server-side proxy that holds the Anthropic key:

```bash
cp .env.example .env          # then set VITE_TUTOR_PROXY_URL=https://your-proxy.example.com
npm run build
```

When `VITE_TUTOR_PROXY_URL` is set, Converse POSTs the conversation to that URL
and renders the reply; if the request fails it falls back to the scripted reply
and shows a notice. **Never put an API key in the frontend** — anything prefixed
`VITE_` is bundled into the public client.

### Request / response contract

The frontend `POST`s JSON:

```json
{
  "langId": "cmn",
  "language": "Mandarin",
  "romanSystem": "Pinyin",
  "scenario": "Order tea",
  "messages": [
    { "role": "tutor",   "text": "欢迎！你想喝什么？" },
    { "role": "learner", "text": "我想喝茶。" }
  ]
}
```

The proxy must reply with:

```json
{ "native": "好的，要哪种茶？", "roman": "hǎo de, yào nǎ zhǒng chá?", "en": "Sure, which kind of tea?", "feedback": "Nicely phrased!" }
```

### Minimal Cloudflare Worker proxy

The key lives only here, as a Worker **secret** (`wrangler secret put ANTHROPIC_API_KEY`).
It never reaches the browser. Uses the official SDK and structured outputs to
guarantee the reply shape.

```ts
// worker.ts — `npm i @anthropic-ai/sdk`, deploy with `wrangler deploy`
import Anthropic from "@anthropic-ai/sdk";

const REPLY_SCHEMA = {
  type: "object",
  properties: {
    native: { type: "string" },
    roman: { type: "string" },
    en: { type: "string" },
    feedback: { type: "string" },
  },
  required: ["native", "roman", "en", "feedback"],
  additionalProperties: false,
} as const;

const cors = (origin: string) => ({
  "access-control-allow-origin": origin,        // tighten to your site's origin in production
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
});

export default {
  async fetch(req: Request, env: { ANTHROPIC_API_KEY: string }): Promise<Response> {
    const origin = req.headers.get("origin") ?? "*";
    if (req.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const { language, romanSystem, scenario, messages } = await req.json();
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system:
        `You are a friendly ${language} tutor in a "${scenario}" role-play. Reply with ONE short, ` +
        `natural ${language} turn that continues the conversation. Provide its ${romanSystem} ` +
        `romanization, an English translation, and one brief, kind piece of feedback on the ` +
        `learner's last message (empty string if nothing to correct).`,
      messages: messages.map((m: { role: string; text: string }) => ({
        role: m.role === "learner" ? "user" : "assistant",
        content: m.text,
      })),
      output_config: { format: { type: "json_schema", schema: REPLY_SCHEMA } },
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
    return new Response(text, {
      headers: { "content-type": "application/json", ...cors(origin) },
    });
  },
};
```

A Netlify/Vercel function is the same idea: read `ANTHROPIC_API_KEY` from the
function's environment, call the SDK server-side, return the JSON. The frontend
never sees the key.

## How it's wired

```
app/
├─ index.html              # Vite entry → /src/main.tsx
└─ src/
   ├─ main.tsx             # React root
   ├─ App.tsx              # state: active language, known cards, daily-goal minutes
   ├─ types.ts             # LangContent / Card / Tone interfaces
   ├─ content.ts           # all three languages' content (the single data source)
   ├─ speech.ts            # browser speechSynthesis wrapper
   ├─ styles.css           # the Moshui design tokens + component styles
   └─ components/
      ├─ TopBar.tsx        # brand + 粵普日 language pills + nav tabs
      ├─ Hero.tsx          # greeting + daily-goal ring + streak
      ├─ GoalRing.tsx      # SVG jade progress ring
      ├─ CharacterOfDay.tsx# big 田字格 hero character + example
      ├─ ReviewDeck.tsx    # due count, mastery bar, the 印 seal reward
      ├─ FlipCard.tsx      # flip-to-reveal card; border turns jade when "known"
      ├─ ToneTrainer.tsx   # pitch-contour cards (Cantonese 6 / Mandarin 4 / Japanese pitch-accent)
      └─ icons.tsx         # monoline SVG icons
```

## Notes

- **Pronunciation** uses the browser's built-in `speechSynthesis`. Voice quality
  depends on the CJK voices your OS has installed (macOS and Windows both ship
  zh-CN / zh-HK / ja-JP voices). Nothing to host, no API key.
- Design follows the project's `DESIGN.md` (墨 Moshui): rice-paper canvas, serif
  CJK glyphs as heroes, mono romanization in cinnabar, the 田字格 grid, and the
  cinnabar 印 mastery seal. Cinnabar stays *functional* — actions, the seal,
  romanization — never a decorative wash.
- Adding vocabulary or a language = edit `src/content.ts`; every module picks it
  up automatically.

All six tabs are built — **Home, Converse, Vocabulary, Reading, Practice, Progress** —
each as its own component set under `src/components/`. Switching 粵 / 普 / 日 re-themes
every surface, including the per-script section marks (讀/读/読 · 練/练 · 進/进). Quiz
accuracy in Practice feeds the Progress tab live; sealing a deck (100%) stamps its 印.
