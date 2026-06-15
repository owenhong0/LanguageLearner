import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const PORT = process.env.PORT || 8787;

// CORS — allow the deployed GitHub Pages origin plus local dev servers.
const ALLOWED_ORIGINS = [
  "https://owenhong0.github.io",
  "http://localhost:5173", // Vite dev
  "http://localhost:4173", // Vite preview
];

const app = express();
app.use(express.json({ limit: "256kb" }));
app.use(cors({ origin: ALLOWED_ORIGINS }));

// ---------------------------------------------------------------------------
// In-memory progress store (no DB, no auth). Keyed by `${deck}::${card}`.
// Resets whenever the process restarts — fine for a demo/free Render service.
// ---------------------------------------------------------------------------
const STATUSES = new Set(["known", "learning", "new"]);
/** @type {Map<string, { deck: string, card: string, status: string }>} */
const progress = new Map();

app.get("/health", (_req, res) => res.json({ ok: true }));

// POST /progress — accept and update one card's state.
app.post("/progress", (req, res) => {
  const { deck, card, status } = req.body ?? {};
  if (typeof deck !== "string" || typeof card !== "string" || !STATUSES.has(status)) {
    return res.status(400).json({
      error: "Body must be { deck: string, card: string, status: 'known' | 'learning' | 'new' }",
    });
  }
  progress.set(`${deck}::${card}`, { deck, card, status });
  res.json({ ok: true, entry: { deck, card, status } });
});

// GET /progress — summary: counts per status per deck, plus totals.
app.get("/progress", (_req, res) => {
  const decks = {};
  const totals = { known: 0, learning: 0, new: 0 };
  for (const { deck, status } of progress.values()) {
    decks[deck] ??= { known: 0, learning: 0, new: 0 };
    decks[deck][status] += 1;
    totals[status] += 1;
  }
  res.json({ decks, totals, cards: progress.size });
});

// ---------------------------------------------------------------------------
// Content generation via the Anthropic Messages API.
// ---------------------------------------------------------------------------
const TYPES = new Set(["vocab", "sentence", "reading"]);

/** Pull a JSON object out of a model response, tolerating code fences / stray prose. */
function parseJsonSafely(text) {
  if (typeof text !== "string") return null;
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return null;
  }
}

function buildPrompt(type, deck, difficulty) {
  const base =
    `Generate language-learning content as STRICT JSON only — no markdown, no code fences, no commentary. ` +
    `Difficulty: ${difficulty}. Topic / deck: "${deck}". ` +
    `Output exactly this shape: ` +
    `{"items":[{"glyph":"<target-language text>","roman":"<romanization>","gloss":"<English meaning or translation>"}]}.`;
  if (type === "vocab") {
    return `${base} Produce 6 useful vocabulary entries for this deck (glyph = word, gloss = meaning).`;
  }
  if (type === "sentence") {
    return `${base} Produce 5 short, natural example sentences for this deck (roman = full-sentence romanization, gloss = English translation).`;
  }
  // reading
  return `${base} Produce one short reading passage of 4 lines at this difficulty; each line is one item (gloss = English translation of that line).`;
}

// POST /generate — { type, deck, difficulty } → { type, deck, difficulty, items }.
app.post("/generate", async (req, res) => {
  const { type, deck = "General", difficulty = "beginner" } = req.body ?? {};
  if (!TYPES.has(type)) {
    return res.status(400).json({ error: "type must be 'vocab', 'sentence', or 'reading'" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "Server is not configured: ANTHROPIC_API_KEY is missing" });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: "You return only valid, minified JSON matching the requested shape. Never include markdown, code fences, or explanations.",
      messages: [{ role: "user", content: buildPrompt(type, String(deck), String(difficulty)) }],
    });

    const text = message.content.find((b) => b.type === "text")?.text ?? "";
    const parsed = parseJsonSafely(text);
    if (!parsed || !Array.isArray(parsed.items)) {
      return res
        .status(502)
        .json({ error: "Model did not return the expected JSON shape", raw: text.slice(0, 500) });
    }

    // Normalize + drop malformed entries.
    const items = parsed.items
      .filter((it) => it && typeof it.glyph === "string" && it.glyph.trim())
      .map((it) => ({
        glyph: String(it.glyph),
        roman: typeof it.roman === "string" ? it.roman : "",
        gloss: typeof it.gloss === "string" ? it.gloss : "",
      }));

    res.json({ type, deck, difficulty, items });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[/generate] failed:", detail);
    res.status(502).json({ error: "Generation failed", detail });
  }
});

app.listen(PORT, () => console.log(`Moshui server listening on :${PORT}`));
