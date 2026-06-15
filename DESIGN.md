# Moshui — DESIGN.md

> Design system for **墨 Moshui**, a web app for learning Cantonese, Mandarin, and Japanese (reading-first + speaking/texting). Drop this file into an Open Design project; the agent should treat it as the single source of truth for tokens, components, and aesthetic guardrails when generating or refining any screen.

---

## Brand essence

**One-line anchor:** *Ink on rice paper — CJK characters are the heroes, romanization is data, and a cinnabar seal marks mastery.*

Open, airy, calm. Generous whitespace. The personality comes from the writing system itself, not decoration. If a screen could belong to any generic SaaS product, it is wrong.

---

## Project context (for build/handoff)

- **Stack:** React (single-file prototype exists as `moshui.jsx`); export target React or Next.js. Styling is plain CSS variables — **no Tailwind dependency**; the tokens below are authoritative.
- **Screens / IA:** sticky top bar (brand · language pills `粵 普 日` · 6 tabs) → **Home, Converse (Speak/Text), Vocabulary, Reading (News/Story), Practice, Progress**. Language is a global toggle that re-themes content everywhere.
- **AI tutor** (Converse) calls a model live; production must proxy through a backend holding the key, never the frontend.
- **Definition of done for a screen:** uses only the tokens below; serif CJK for hero glyphs; mono for all romanization; passes the anti-slop checklist; responsive at 760px; visible focus; reduced-motion respected.

---

## Color tokens

```css
:root {
  --paper:  #F4F2EC; /* app background — warm rice-paper neutral */
  --card:   #FBFAF6; /* surfaces, cards */
  --ink:    #23201C; /* primary text, grid borders, active nav */
  --soft:   #6B645A; /* secondary text, captions */
  --line:   #DCD7CB; /* borders, dividers, dashed grid */
  --seal:   #C0392B; /* cinnabar — primary actions, seal mark, romanization, errors */
  --jade:   #2E7D6B; /* correct / positive / "known" / progress */
  --indigo: #2B4865; /* learner's own chat bubbles, focus ring */
}
```

**Rules:** Cinnabar is *functional* (primary buttons, the seal, romanization, error) — never a decorative background wash. Jade is reserved for positive/known/progress states. Indigo appears only on the learner's chat bubbles and focus rings.

---

## Typography

| Role | Family | Use |
|---|---|---|
| Display | **Schibsted Grotesk** 700–800, tracking -0.02→-0.03em | Headlines, brand, buttons, section titles |
| Body | `system-ui` stack | Paragraphs, options, UI text |
| Mono | **Space Mono** | Romanization (pinyin/jyutping/rōmaji), tone labels, counts, eyebrows |
| CJK | serif: `"Songti SC","Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK",serif` | **All hero/character glyphs — always serif** |

Scale: hero glyph 142 / h1 44 / section title 23 / card meaning 20 / body 15–17 / mono+caption 11–13 px.

---

## Shape, spacing, motion

- **Radius:** cards 14px · buttons & pills 10px · language pills 999px.
- **Borders:** 1px `--line` default; 2px `--ink` on the practice grid; jade ring on "known".
- **Motion:** 0.4s load fade · 0.5s card flip (rotateY) · subtle hover lift. Disable all under `prefers-reduced-motion`.

---

## Signature components (do not omit these — they *are* the brand)

**1. 田字格 practice grid.** A square with a 2px `--ink` border and a faint dashed cross (horizontal + vertical center lines, `rgba(35,32,28,.22)`). Frames every hero character and every vocabulary card front. The visual thesis.

```css
.tian{position:relative;background:var(--card);border:2px solid var(--ink);display:grid;place-items:center;overflow:hidden}
.tian::before{content:"";position:absolute;left:0;right:0;top:50%;border-top:1.5px dashed rgba(35,32,28,.22)}
.tian::after{content:"";position:absolute;top:0;bottom:0;left:50%;border-left:1.5px dashed rgba(35,32,28,.22)}
```

**2. 印 cinnabar seal.** The brand mark (`墨` in a rotated red square) and the *mastery reward* — earned per completed deck. Use sparingly; it should feel like a stamp, slightly rotated (-3 to -5deg).

**3. Mono romanization.** Pinyin/Jyutping/Rōmaji always set in Space Mono, in `--seal`. Treated as data beneath the character, never competing with it.

**4. Tone pitch-contour cards.** Small inline SVGs (viewBox `0 0 64 40`, lower y = higher pitch) drawing each tone's shape over two faint guide lines, with example character + syllable + gloss. Mandarin = 4 tones, Cantonese = 6, Japanese = pitch-accent pair. Tap to play audio.

---

## Component specs

- **Primary button / CTA:** `--seal` fill, white text, Schibsted Grotesk 700, radius 10, hover lift + slight brightness.
- **Language pill:** rounded-full, badge glyph (serif) + name; active = `--ink` fill, paper text.
- **Nav tab:** ghost; active = `--card` bg with 2px `--seal` underline (inset box-shadow).
- **Flip card:** front = 田字格 + glyph + mono romanization + emoji anchor; back = meaning + example + play/known buttons; "known" flips border to jade.
- **Chat bubble:** tutor left on `--paper`; learner right on `--indigo` (white text). Tutor feedback = jade left-border note below the bubble.
- **Reading line:** tap reveals romanization + translation (collapsible) and plays audio; dashed `--line` divider between lines.
- **Quiz option:** card-style button; correct → jade tint, wrong → seal tint, locked after answer.
- **Progress:** stat cards + SVG accuracy ring (jade arc) + per-deck mastery bar that stamps the seal at 100%.

---

## Voice & copy

Plain, active, encouraging — never gamified-cute. Buttons name the exact action ("Start a round", "I know this", "Start reading"). Feedback is specific and kind. Romanization and translations stay hidden until tapped; they support, never clutter.

---

## Accessibility floor

Visible `:focus-visible` (indigo ring) · `prefers-reduced-motion` honored · single 760px breakpoint (hero stacks, grids → 1 column, tabs wrap) · color never the sole signal (states pair color with position + copy) · labelled audio/mic controls.

---

## Anti-slop checklist (reject output that fails these)

- [ ] **Not** the generic "cream background + editorial serif headline + terracotta accent" look. Moshui pairs a geometric grotesk with mono; cinnabar is functional, not a mood. (Note: that default is literally the common LLM-design cliché — avoid it here.)
- [ ] CJK glyphs are **serif**, never the body sans.
- [ ] Romanization is **mono + `--seal`**, visually subordinate to the character.
- [ ] The 田字格 grid and 印 seal appear and are used with restraint — boldness spent only there.
- [ ] No numbered `01 / 02 / 03` markers unless the content is a real sequence.
- [ ] Whitespace is generous; nothing is dense or boxed-in for its own sake.
- [ ] Every color used maps to a token and its defined role.

---

## Open design questions (decide before scaling)

Stroke-order display (animation vs numbered guides in the grid) · intermediate/advanced reading tiers · tap-any-character pop-up dictionary (overlay vs side panel) · "paste your own text" auto-gloss mode · onboarding / level placement.

---

*Reference implementation: `moshui.jsx`. This DESIGN.md is the authoritative spec; where the prototype and this file disagree, follow this file.*
