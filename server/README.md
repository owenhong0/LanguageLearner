# Moshui server

A tiny **Express** backend for Moshui: in-memory progress tracking and
Anthropic-powered content generation. No database, no auth.

## Endpoints

| Method | Path         | Body / result |
|--------|--------------|----------------|
| `GET`  | `/health`    | `{ ok: true }` |
| `POST` | `/progress`  | `{ deck, card, status }` where `status` ∈ `known\|learning\|new` → `{ ok, entry }` |
| `GET`  | `/progress`  | `{ decks: { [deck]: { known, learning, new } }, totals, cards }` |
| `POST` | `/generate`  | `{ type, deck, difficulty, language, langId }` where `type` ∈ `vocab\|sentence\|reading` and `language` is the target language name (e.g. `"Mandarin"`) → `{ type, deck, difficulty, language, langId, items: [{ glyph, roman, gloss }] }` |

Progress is an in-memory `Map` keyed by `deck::card`; it resets when the process
restarts. `/generate` requires a `language` (400 otherwise), calls the Anthropic
Messages API (`claude-sonnet-4-6`) with a system prompt that **hard-constrains
output to that language only**, prompts for **JSON only**, parses defensively
(tolerates code fences), and **validates the script** of the result — if it
isn't in the target language's script it regenerates (up to 3 attempts) before
returning `502`. This is what prevents "asked for Mandarin, got Spanish".

## Run locally

```bash
cd server
npm install
cp .env.example .env        # then put your key in ANTHROPIC_API_KEY
npm start                   # http://localhost:8787
```

`ANTHROPIC_API_KEY` is read from `process.env` and is never hardcoded.
`server/.env` is gitignored.

Quick checks:

```bash
curl localhost:8787/health
curl -X POST localhost:8787/progress -H 'content-type: application/json' \
  -d '{"deck":"Greetings","card":"v-nihao","status":"known"}'
curl localhost:8787/progress
curl -X POST localhost:8787/generate -H 'content-type: application/json' \
  -d '{"type":"vocab","deck":"Food & drink","difficulty":"beginner"}'
```

## Deploy to Render

Two options:

1. **Blueprint (recommended):** the repo root has [`render.yaml`](../render.yaml).
   In Render → **New → Blueprint**, point at this repo. It provisions a Node web
   service with `rootDir: server`, `npm install`, and `npm start`.
2. **Manual Web Service:** New → Web Service → this repo, then set
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`

For either option, add the environment variable in the Render dashboard:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | your Anthropic key (kept server-side only) |

Render injects `PORT` automatically; the server reads it. After deploy, copy the
service URL (e.g. `https://moshui-server.onrender.com`) into the frontend's
`src/config.ts` (`API_BASE_URL`) so the Vocabulary page can reach it.

> CORS is restricted to `https://owenhong0.github.io` (plus localhost for dev).
> Update `ALLOWED_ORIGINS` in `server.js` if your frontend is hosted elsewhere.
