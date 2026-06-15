# 墨 Moshui

A web app for learning **Cantonese · Mandarin · Japanese**, reading-first.
This is the **Home dashboard** built with **Vite + React + TypeScript** — every
component is a `.tsx` file. Switch 粵 / 普 / 日 in the top bar to re-theme the
whole dashboard.

## Run it locally

```bash
cd app
npm install
npm run dev      # http://localhost:5173
```

## Build & host

```bash
npm run build    # outputs to app/dist
npm run preview  # preview the production build locally
```

`dist/` is a static bundle (`base: "./"` keeps asset paths relative), so you can
drop it on **GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3** — any static
host. No server or API keys required.

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
