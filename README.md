# 墨 Moshui

A reading-first web app for learning **Cantonese · Mandarin · Japanese**.
Built with **Vite + React + TypeScript** — every component is a `.tsx` file.
Switch 粵 / 普 / 日 in the top bar to re-theme the whole app.

**Live:** https://owenhong0.github.io/LanguageLearningApp/

Three surfaces are live today — **Home**, **Converse** and **Vocabulary**. The
remaining tabs (Reading, Practice, Progress) are scaffolded in the nav.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build & host

```bash
npm run build    # outputs a static bundle to dist/
npm run preview  # preview that production build locally
```

`dist/` is a static bundle (`base: "./"` in `vite.config.ts` keeps asset paths
relative), so it drops onto **GitHub Pages, Netlify, Vercel, Cloudflare Pages,
S3** — any static host. No server or API keys required.

### Deploy to GitHub Pages

This repo publishes the built `dist/` to the `gh-pages` branch:

```bash
npm run deploy   # runs the build, then pushes dist/ to the gh-pages branch
```

In the repo's **Settings → Pages**, the source is **Deploy from a branch →
`gh-pages` / root**.

## How it's wired

```
.
├─ index.html              # Vite entry → /src/main.tsx (favicon + meta live here)
├─ vite.config.ts          # base: "./" for relative asset paths
└─ src/
   ├─ main.tsx             # React root
   ├─ App.tsx              # state: active language, known cards, daily-goal minutes, active tab
   ├─ types.ts             # LangContent / Card / Tone / VocabItem / Converse interfaces
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
      ├─ Vocabulary.tsx    # searchable/filterable deck with add-your-own-word
      ├─ VocabCard.tsx     # vocab entry with reveal + known toggle
      ├─ Converse.tsx      # scripted Text/Speak tutor chat
      ├─ ChatBubble.tsx    # tutor/learner bubbles with reveal + audio
      └─ icons.tsx         # monoline SVG icons
```

## Notes

- **Pronunciation** uses the browser's built-in `speechSynthesis`. Voice quality
  depends on the CJK voices your OS has installed (macOS and Windows both ship
  zh-CN / zh-HK / ja-JP voices). Nothing to host, no API key.
- **Converse** replies are *scripted* in this prototype so it runs with no
  backend. In production the tutor would call a live model through a server that
  holds the key — never the browser.
- Design follows the project's `DESIGN.md` (墨 Moshui): rice-paper canvas, serif
  CJK glyphs as heroes, mono romanization in cinnabar, the 田字格 grid, and the
  cinnabar 印 mastery seal. Cinnabar stays *functional* — actions, the seal,
  romanization — never a decorative wash.
- Adding vocabulary or a language = edit `src/content.ts`; every module picks it
  up automatically.

There's also a self-contained `standalone-preview.html` — a single-file snapshot
of the design with no build step, handy for quick sharing.
