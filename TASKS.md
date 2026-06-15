# TASKS.md — Moshui work queue for Claude Code

Derived from the usability review. Each task is self-contained: read `CLAUDE.md` and `DESIGN.md` first, then implement **one task per branch/PR**. Acceptance criteria are the bar for "done." Follow the order — T0 → T1 → T2 are the highest leverage.

**How to hand off:**
- *In the terminal:* run `claude` in the repo and paste a task's body.
- *Via GitHub:* file each task as an issue (titles below) and comment `@claude implement this`. A `gh` script to create them all is at the bottom.

---

## T0 — Diagnose the GitHub Pages deploy `[priority: critical] [type: bug]`

**Context:** Vite SPA deployed to a project page at `/LanguageLearner/`. Need to confirm it renders and assets resolve.

**Scope:** `vite.config`, build output only.

**Do:**
- Confirm `base` is `'/LanguageLearner/'`; if not, set it and explain the effect on built asset URLs.
- Run `npm run build && npm run preview`; report whether the app renders or shows a blank page / 404s on assets.
- Report whether refreshing on a non-home tab or opening a direct link loses state.

**Acceptance:** A findings report; the only change permitted is fixing `base` if wrong. No styling changes.

---

## T1 — Tutor: graceful fallback + optional proxy `[priority: critical] [type: feature]`

**Context:** `Converse` calls `api.anthropic.com` directly from the browser with no key. It fails on a static host, and a client-side key would be unsafe.

**Scope:** `src/components/Converse.tsx`, a new proxy doc in `README.md`, env config.

**Do:**
- **Fallback:** when the request fails or no proxy is configured, show a clear "Live tutor needs a backend — running in scripted demo mode" state and fall back to a small built-in scripted exchange per scenario, so the feature is never a dead end.
- **Proxy path:** read `VITE_TUTOR_PROXY_URL` from env; when set, call it instead of Anthropic directly. Document a minimal serverless proxy (Cloudflare Worker or Netlify function) that holds the key server-side and forwards to Anthropic.

**Acceptance:** No key in the repo or frontend. Reply shape `{ native, roman, en, feedback }` and all chat styling preserved. Demo mode works with the proxy unset; real mode works when it's set.

---

## T2 — Persist progress across reloads `[priority: high] [type: feature]`

**Context:** Known words, quiz accuracy, and deck mastery reset on reload, defeating the Progress tab.

**Scope:** new `src/store.ts`, `src/App.tsx`, `Progress.tsx`, `GoalRing.tsx`.

**Do:**
- Create a store reading/writing `localStorage` under versioned key `moshui.v1`.
- Persist: known-word set (`language:char`), quiz totals/correct, session counters.
- Hydrate on mount; write on change; handle first-visit and corrupt-JSON safely.
- Add a "Reset progress" control on Progress with a confirm step.

**Acceptance:** State survives reload; existing props keep working; additive; no visual change; no secrets stored.

---

## T3 — Spaced repetition for vocabulary `[priority: high] [type: feature]` *(depends on T2)*

**Context:** "Known" is a one-way binary; nothing schedules review.

**Scope:** `src/components/FlipCard.tsx`, the vocab view, the T2 store.

**Do:**
- Leitner boxes 1–5 per word: correct recall promotes, "didn't know" demotes to box 1.
- A "Review" mode surfaces due cards (lower boxes more often) instead of full-deck order.
- Persist box levels; show a small box indicator on the card back; comment the scheduling rule.

**Acceptance:** Flip interaction, 田字格 front, and styling unchanged; scheduling + Review entry point added; box state persists.

---

## T4 — Accessibility pass to WCAG AA `[priority: high] [type: a11y]`

**Context:** Icon-only controls and clickable `<div>`s aren't keyboard/SR friendly; some contrast needs checking.

**Scope:** `Reading.tsx`, `FlipCard.tsx`, icon controls; report on `styles.css` tokens.

**Do:**
- Convert clickable divs (reading lines, flip cards) to real buttons with keyboard support and `aria-expanded` where content reveals/flips.
- Add `aria-label`s to icon-only controls naming the action + target (e.g. "Play 你好").
- Ensure flipped-away card backs leave the accessibility tree.
- Audit contrast for `--soft` on `--paper` and 11px mono vs WCAG AA; if anything fails, propose the smallest token nudge that passes with before/after ratios — **flag, don't auto-apply.**

**Acceptance:** Keyboard-operable; labeled controls; contrast results reported; no visual redesign.

---

## T5 — Mobile & tap-target polish `[priority: medium] [type: ui]`

**Scope:** `src/styles.css` (and markup only if needed for hit areas).

**Do:**
- Audit at 375px and 320px: six-tab nav row, hero glyph/h1 sizing, Converse composer (mic + input + send).
- All interactive controls ≥ 44×44px tap target (grow hit area via padding/min-height, not visible text).
- Confirm the single 760px breakpoint suffices or add one; show which widths each change fixes.

**Acceptance:** Desktop look and tokens unchanged; documented per-width fixes.

---

## T6 — Expand reading + romanization preference `[priority: medium] [type: content]`

**Scope:** `src/content.ts`, `src/components/Reading.tsx`, T2 store.

**Do:**
- Romanization-display preference — "tap to reveal" / "always on" / "always off" — stored via the T2 store and applied in Reading and Vocabulary.
- Add 3 more graded passages per language (news + story, slightly harder), each with a comprehension question in the existing `{ ask, opts, a }` shape. Original content only (no copyrighted text); match existing structures exactly.

**Acceptance:** Toggle works app-wide; new passages render with no structural component changes; build/typecheck pass.

---

## Optional: create all issues at once

From the repo, with the GitHub CLI authenticated (`gh auth login`):

```bash
gh issue create -t "T0 — Diagnose the GitHub Pages deploy" -l "critical,bug" -b "See TASKS.md → T0. Read CLAUDE.md and DESIGN.md first. @claude"
gh issue create -t "T1 — Tutor: graceful fallback + optional proxy" -l "critical,feature" -b "See TASKS.md → T1. Read CLAUDE.md and DESIGN.md first. @claude"
gh issue create -t "T2 — Persist progress across reloads" -l "feature" -b "See TASKS.md → T2. Read CLAUDE.md and DESIGN.md first. @claude"
gh issue create -t "T3 — Spaced repetition for vocabulary" -l "feature" -b "See TASKS.md → T3 (depends on T2). Read CLAUDE.md and DESIGN.md first. @claude"
gh issue create -t "T4 — Accessibility pass to WCAG AA" -l "a11y" -b "See TASKS.md → T4. Read CLAUDE.md and DESIGN.md first. @claude"
gh issue create -t "T5 — Mobile & tap-target polish" -l "ui" -b "See TASKS.md → T5. Read CLAUDE.md and DESIGN.md first. @claude"
gh issue create -t "T6 — Expand reading + romanization preference" -l "content" -b "See TASKS.md → T6. Read CLAUDE.md and DESIGN.md first. @claude"
```

*(Pasting the full task body into each issue works better than the `See TASKS.md` reference if the files aren't committed yet.)*
