# CLAUDE.md

Project-wide guide for Claude Code. Read this and `DESIGN.md` before any task.

## What this is

**墨 Moshui** — a reading-first web app for learning **Cantonese, Mandarin, and Japanese**. Six tabs: Home, Converse (Speak/Text), Vocabulary, Reading (News/Story), Practice, Progress. Language is a global toggle (`粵 / 普 / 日`) that re-themes every screen. Deployed to GitHub Pages at `https://owenhong0.github.io/LanguageLearner/`.

## Stack & layout

- **Vite + React + TypeScript.** Plain CSS variables for styling — **no Tailwind, no CSS-in-JS, no UI framework.**
- Read the tree before editing; the shape is:
  ```
  src/App.tsx            – shell, top bar, language + tab state, renders the active view
  src/content.ts         – ALL learning content (vocab decks, reading, tones, scenarios)
  src/types.ts           – shared types
  src/styles.css         – design tokens (:root vars) + all component CSS
  src/components/         – one set per tab: Hero, Converse, FlipCard, Practice,
                            Progress, Reading, SectionHead, GoalRing, icons, etc.
  index.html, vite.config – build entry / config
  ```
- **Content rule:** new vocabulary, languages, or passages go in `src/content.ts` only — every view reads from it. Match existing shapes in `src/types.ts` exactly so no component changes are needed.

## Commands

Use the scripts in `package.json` (confirm names there first). Standard Vite:
```
npm run dev        # local dev server
npm run build      # production build — MUST pass before a task is done
npm run preview    # serve the build and sanity-check the real output
npx tsc --noEmit   # typecheck — MUST pass
```

## Design constraints (non-negotiable)

`DESIGN.md` is the source of truth. Specifically:
- **Use only the tokens** in `:root` (`--paper --card --ink --soft --line --seal --jade --indigo`). Do not introduce new raw color values.
- **CJK glyphs are serif; romanization is mono in `--seal`** and stays visually subordinate to the character.
- Preserve the signature elements: the **田字格 practice grid**, the **印 cinnabar seal** (used sparingly for brand + mastery), and the **tone pitch-contour cards**.
- Cinnabar is functional (primary actions, seal, errors), never a decorative background.
- Honor `prefers-reduced-motion` and keep visible `:focus-visible`.

## Banned patterns

- **No API keys or secrets in the frontend or the repo.** The tutor must reach Anthropic only through a server-side proxy read from an env var.
- No new heavy dependencies without saying why; prefer the standard library / existing deps.
- Don't hardcode colors, fonts, or spacing outside the token system.
- Don't rename or restructure files unless the task asks for it.
- Don't store anything sensitive in `localStorage`.

## Definition of done (every task)

1. `npm run build` and `npx tsc --noEmit` both pass; no new console errors.
2. Respects design tokens and the signature elements above.
3. Works at desktop, 760px, and 375px widths.
4. `:focus-visible` and reduced-motion behavior preserved.
5. Change is additive where possible — existing component props keep working.
6. A one-paragraph summary of what changed and anything left to verify.

## How work is tracked

Tasks live in `TASKS.md`, ordered by priority with acceptance criteria. Implement one task per branch/PR. If filed as GitHub issues, the issue body is the task; `@claude` picks it up.
